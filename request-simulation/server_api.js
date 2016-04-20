var express = require('express');
var mongoose = require('mongoose');
var Firebase = require('firebase');
var FirebaseTokenGenerator = require("firebase-token-generator");

var bodyParser = require('body-parser');

var models = require('./models');
var config = require('./config');
var FIREBASE_BASE_URL = config.firebaseConfig.baseUrl;
var MONGODB_URL = config.mongoConfig.dbUrl;
var FIREBASE_SECRET = config.firebaseConfig.secret;

var tokenGenerator = new FirebaseTokenGenerator(FIREBASE_SECRET);

mongoose.connect(MONGODB_URL);

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

var port = 8002;
var ipAddress = getMyIpOSX();
app.listen(port);

console.log("waiting for teaching api requests @ '" + ipAddress + ":" + port + "/requests' REST endpoint");

var TeacherModel = models.TeacherModel;

var rootChannelRef = new Firebase(FIREBASE_BASE_URL + "/channels/");
var rootRequestRef = new Firebase(FIREBASE_BASE_URL + "/requests/");
var rootTeachingRef = new Firebase(FIREBASE_BASE_URL + "/teaching/");

app.post('/requests', function(req, res){
  var studentUsername = req.body.username;
  var topic = req.body.topic;
  
  var date = new Date().toISOString().slice(0, 10);
  var requestId = date + "/" + studentUsername + "_" + parseInt(new Date().getTime()/1000);

  if(!(topic && studentUsername)){
    res.json({error : 401, message : "required fields : [username, topic]"});
    return;
  }

  var token = tokenGenerator.createToken({uid: studentUsername, role : 'student'});

  res.json({
    requestId : requestId,
    token : token
  });

  var request = {
    type : "request",
    ts : Firebase.ServerValue.TIMESTAMP,
    id : requestId,
    details : "help on " + topic + " requested by " + studentUsername
  }

  console.log(requestId + "|" + "request received. Finding teachers...");

  //look for online teachers
  var promise = TeacherModel.find({
    online : {$ne : []},
    status : "free"
  }).exec();

  promise.then(function(teacherList){
    console.log(requestId + "|" + "online teachers " + teacherList.length);
    for(var i = 0; i < teacherList.length; i++){
      var teacher = teacherList[i];
      console.log(requestId + "|" + "sending request to " + teacher.username);
      rootChannelRef.child(teacher.username).push(request);
    }

    console.log(requestId + "|" + "waiting for responses");

    var responseList = [];
    var responseReceiver = function(snapshot){
      var response = snapshot.val();
      console.log(requestId + "|" + "response received username=" + response.username + ", action=" + response.action);
      if(response.action === "accept"){
        responseList.push(response.username);
      }
    }

    //listen on request channel
    rootRequestRef.child(requestId).on('child_added', responseReceiver);

    var selectAppropriateTeacher = function(){
      rootRequestRef.child(requestId).off('child_added', responseReceiver); //stop listening for responses

      console.log(requestId + "|" + " selecting out of " + responseList.length);

      if(responseList.length === 0){
        return notifyUsers(null);
      }

      var promise = setTeacherBusy(responseList[0], requestId);
      console.log(requestId + "|" + " trying out teacher [0] " + responseList[0]);
      promise = promise.then(function(teacher){
        if(teacher === null && responseList[1]){
          console.log(requestId + "|" + " trying out teacher [1] " + responseList[1]);
          return setTeacherBusy(responseList[1], requestId);
        }
        else{
          return teacher;
        }
      });

      promise = promise.then(function(teacher){
        if(teacher === null && responseList[2]){
          console.log(requestId + "|" + " trying out teacher [2] " + responseList[2]);
          return setTeacherBusy(responseList[2], requestId);
        }
        else{
          return teacher;
        }
      });

      promise = promise.then(function(teacher){
        if(teacher === null){
          console.log(requestId + "|" + " tried all teachers - all busy");
          notifyUsers(null);
        }
        else{
          notifyUsers(teacher.username);
        }
      });

      promise = promise.catch(function(err){
        console.log(requestId + "|" + "error %j", err);
        notifyUsers(null);
      });
    }

    function notifyUsers(selectedTeacher){
      if(selectedTeacher){
        console.log(requestId + "|" + "selected teacher " + selectedTeacher + " out of " + responseList.length + " ready teachers");

        //send reject msg to all teachers except selected teacher
        for(var i = 0; i < teacherList.length; i++){
          var teacher = teacherList[i];
          if(teacher.username !== selectedTeacher){
            console.log(requestId + "|" + "sending deny to teacher " + teacher.username);
            request.type = "deny";
            rootChannelRef.child(teacher.username).push(request);
          }
        }

        //send assign msg to student and selected teacher
        request.type = "assign";
        request.teacher = selectedTeacher;
        request.student = studentUsername;

        console.log(requestId + "|" + "sending assign to teacher " + selectedTeacher);
        rootChannelRef.child(selectedTeacher).push(request);
        console.log(requestId + "|" + "sending assign to student " + studentUsername);
        rootChannelRef.child(studentUsername).push(request);

        //set current teaching session status to 'running'
        rootTeachingRef.child(requestId).child('status').set('running');
      }
      else{
        //send deny to all teachers as well the requesting student
        request.type = "deny";
        for(var i = 0; i < teacherList.length; i++){
          var teacher = teacherList[i];
          console.log(requestId + "|" + "sending deny to teacher " + teacher.username);
          rootChannelRef.child(teacher.username).push(request);
        }
        console.log(requestId + "|" + "sending deny to student " + studentUsername);
        rootChannelRef.child(studentUsername).push(request);
      }
    }

    setTimeout(selectAppropriateTeacher, 30000); //30 seconds
  });
});

/*
  params:
    requestId
    username
*/
app.post('/terminate', function(req, res){
  console.log("terminate api request for %j", req.body);

  var requestId = req.body.requestId;
  var username = req.body.username;

  if(!(requestId && username)){
    res.status(400);
    res.json({message : "params required [requestId, username]"});
    return;
  }

  var onComplete = function(err) {
    if (err) {
      console.log('Firebase Termination failed');
      res.status(500);
      res.json(err);
    }
    else {
      console.log('Firebase Termination success');
      var promise = setTeacherFree(username, requestId);

      promise = promise.then(function(teacher){
        if(!teacher){
          throw {
            message : username + " not busy with request id " + requestId
          };
        }
        else{
          res.json(teacher);
        }
      });

      promise = promise.catch(function(err){
        res.status(500);
        res.json(err);
      });
    }
  };

  rootTeachingRef.child(requestId).child('status').set('terminated', onComplete);
});

function setTeacherBusy(username, requestId){
  var promise = TeacherModel.findOneAndUpdate({
    username : username,
    status : "free"
  },
  {
    '$set' : {status : requestId}
  },
  {
    new : true
  })
  .exec();
  return promise;
}

function setTeacherFree(username, requestId){
  var promise = TeacherModel.findOneAndUpdate({
    username : username,
    status : requestId
  },
  {
    '$set' : {status : "free"}
  },
  {
    new : true
  })
  .exec();
  return promise;
}

function getMyIpOSX(){
  var os = require('os');
  var networkInterfaces = os.networkInterfaces();
  var addressList = networkInterfaces['en0'];
  var ipv4Address = null;
  for(var i = 0; i < addressList.length; i++){
    if(addressList[i].family.toLowerCase() === "ipv4"){
      ipv4Address = addressList[i].address;
    }
  }
  return ipv4Address;
}