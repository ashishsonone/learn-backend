if(process.argv.length < 4){
  console.log("usage : ENV=<ENV> node <teacher.js> <username>");
  console.log("e.g ENV=local node teacher.js 1626002601 fJraVF3c");
  process.exit(0);
}

var Firebase = require('firebase');
var request = require('request');
var config = require('./config');
var teacherUtils = require('./teacher_utils');

//override console.log
console.log = teacherUtils.myLog;

var FIREBASE_BASE_URL = config.firebaseConfig.baseUrl;
var API_SERVER_URL = config.apiServerConfig.method + "://" + 
  config.apiServerConfig.host + ":" + config.apiServerConfig.port;

console.log("api server url : " + API_SERVER_URL);
console.log("firebase base url : " + FIREBASE_BASE_URL);

var sessionStartTime = null;

var myStatus = null;
var myDoubtQueue = null;

var username = process.argv[2];
var token = process.argv[3];

var connectionRef = new Firebase(FIREBASE_BASE_URL + "/.info/connected");
var presenceRef = new Firebase(FIREBASE_BASE_URL + "/teacher-presence/").child(token);
var myChannelRef = new Firebase(FIREBASE_BASE_URL + "/teacher-channels/" + username);
var myStatusChannelRef = new Firebase(FIREBASE_BASE_URL + "/teachers/" + username + "/status");
var myDoubtQueueRef = new Firebase(FIREBASE_BASE_URL + "/teachers/" + username + "/doubtQueue");

myStatusChannelRef.on("value", function(snap){
  myStatus = snap.val();
  console.log("my status snap.val()=" + myStatus);  
});

connectionRef.on('value', function(snapshot){
  var connected = snapshot.val();
  console.log("connection state = " + connected);
  var ts = new Date().getTime();

  if(connected){
    console.log("presence setting");
    presenceRef.onDisconnect().set({
      ts : ts,
      username : username,
      online : false,
      processed : false
    });

    presenceRef.set({
      ts : ts,
      username : username,
      online: true,
      processed : false
    });
  }
});

myDoubtQueueRef.on('value', function(snap){
  myDoubtQueue = snap.val();
  console.log("myDoubtQueue = %j", myDoubtQueue);
});

var stdin = process.openStdin();
function stdinListener(d){
  // note:  d is an object, and when converted to a string it will
  // end with a linefeed.  so we (rather crudely) account for that  
  // with toString() and then trim()
  var m = d.toString().trim();
  
  var parts = m.split(' ');
  var command = parts[0];

  if(command === "status"){
    console.log("status=" + myStatus + ", myDoubtQueue=%j", myDoubtQueue);
  }
  else if(command === "solve" || command === "unsolve"){
    var doubtId = parts[1];
    if(!doubtId){
      console.log("command format is : |" + command + " <doubtId>| OR |" + command + " next|");
      return;
    }

    if(doubtId === "next"){
      if(myDoubtQueue && myDoubtQueue.length > 0){
        doubtId = myDoubtQueue[0];
        console.log("picked next doubt " + doubtId);
      }
      else{
        console.log("no doubts in your doubtQueue");
        return;
      }
    }

    //doubtId set
    console.log("handling " + command + " with " + doubtId );
    handleDoubt(command === "solve", doubtId);
  }
  else if(command === "go"){
    var newStatus = parts[1];
    if(["active", "away"].indexOf(newStatus) < 0){
      console.log("command format is : |" + command + " active| OR |" + command + " away|");
      return;
    }

    callChangeStatusApi(newStatus);
  }
  else{
    console.log("unknown command `" + m + "`");
  }
}

//Add command line listener
stdin.addListener("data", stdinListener);

function handleDoubt(solved, doubtId){
  callGetDoubtApi(doubtId, function(err, doubtEntity){
    if(err){
      console.log("Error retriving the doubtEntity");
      return;
    }

    console.log("Retrieved doubt details %j", doubtEntity);
    var status;
    var response;
    if(solved){
      status = "solved";
      response = {
        description : "Look at image #1 for solution",
        images : ["<solution-image-url-1>"]
      };
    }
    else{
      status = "unsolved";
      response = {
        description : "Unable to solve as it is out of syllabus. Please ask someone else",
        images : []
      };
    }
    console.log("ending " + doubtId + " with status=" + status);
    callEndApi(doubtId, status, response);
  });
}

function callChangeStatusApi(newStatus){
  var body = {
    status : newStatus
  };

  var options = {
    method : 'PUT',
    uri : API_SERVER_URL + "/v1/live/teachers/me",
    body : body,
    headers : {
      "Content-Type": "application/json",
      "x-live-token": token
    },
    json : true
  };

  console.log("callChangeStatusApi calling with body=%j", body);
  request(options, function(err, res, body){
    if(!err && res.statusCode == 200){
      console.log("callChangeStatusApi : success %j", body);
    }
    else{
      console.log("callChangeStatusApi : error. Try again. err=%j, body=%j", err, body);
    }
  });
}

function callEndApi(doubtId, status, response){
  var body = {
    username : username,
    doubtId : doubtId,
    status : status,
    description : response.description,
    images : response.images
  };

  var options = {
    method : 'POST',
    uri : API_SERVER_URL + "/v1/live/doubts/end",
    body : body,
    headers : {
      "Content-Type": "application/json",
      "x-live-token": token,
    },
    json : true
  };

  console.log("callEndApi calling with body=%j", body);
  request(options, function(err, res, body){
    if(!err && res.statusCode == 200){
      console.log("callEndApi : success %j", body);
    }
    else{
      console.log("callEndApi : error. Try again. err=%j, body=%j", err, body);
    }
  });
}

function callGetDoubtApi(doubtId, callback){
  var options = {
    method : 'GET',
    uri : API_SERVER_URL + "/v1/live/doubts/" + doubtId,
    headers : {
      "Content-Type": "application/json",
    },
    json : true
  };

  //console.log("callUpdateApi calling with body=%j", body);
  request(options, function(err, res, body){
    if(!err && res.statusCode == 200){
      //console.log("callGetDoubtApi : success with body %j", body);
      callback(null, body);
    }
    else{
      //console.log("callGetDoubtApi : err=%j, body=%j", err, body);
      callback(err);
    }
  });
}