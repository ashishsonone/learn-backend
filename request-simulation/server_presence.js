var Firebase = require('firebase');
var mongoose = require('mongoose');

var models = require('./models');
var config = require('./config');

var FIREBASE_BASE_URL = config.firebaseConfig.baseUrl;
var MONGODB_URL = config.mongoConfig.dbUrl;

var sessionBaseRef = new Firebase(FIREBASE_BASE_URL + "/sessions/");
mongoose.connect(MONGODB_URL);

console.log("listening to presence events @ '" + FIREBASE_BASE_URL + "/sessions/' FIREBASE endpoint");

var TeacherModel = models.TeacherModel;

function handleSessionEvent(snapshot){
  var session = snapshot.val();
  var token = snapshot.key();
  var ts = session.ts;

  console.log("handleSessionEvent | session | username=" + session.username + ", online=" + session.online + ", key=" + token);
  if(session.online === false){//if goes offline remove the entry
    console.log("handleSessionEvent | deleting session | key " + token + " | ts " + ts);
    sessionBaseRef.child(snapshot.key()).remove();

    var promise = TeacherModel
      .findOneAndUpdate({
        username : session.username
      },
      {
        '$pull' : {online : {token : token}}
      },
      {new : true})
      .exec();

    promise.then(function(t){
      console.log("%j", t);
    }, function(e){
      console.log("%j", e);
    });
  }
  else{
    console.log("handleSessionEvent | processing session | key " + token + " | ts " + ts);
    sessionBaseRef.child(snapshot.key()).child('processed').set(true);

    var promise = TeacherModel
      .findOneAndUpdate({
        username : session.username,
        'online.token' : token
      },
      {
        '$set' : { 'online.$.ts' : ts}
      },
      {new : true, upsert : true}
      )
      .select({name : true, online : true, _id : false})
      .exec();

    promise = promise.then(null, 
    function(e){
      if(e.code === 16836){//positional operator cannot upsert
        console.log("creating new");
        var p = TeacherModel
        .findOneAndUpdate({
          username : session.username
        },
        {
          '$addToSet' : {online : {ts : ts, token : token}},
          '$setOnInsert': {status : "free"}
        },
        {
          new : true,
          upsert : true,
        }
        )
        .exec();

        return p;
      }
      else{
        return e;
      }
    });

    promise.then(function(t){
      console.log("success %j", t);
    }, function(e){
      console.log("error %j", e);
    });
  }
}

var unprocessedSessionsRef = sessionBaseRef.orderByChild('processed').equalTo(false);

unprocessedSessionsRef.on('child_added', handleSessionEvent);
unprocessedSessionsRef.on('child_changed', handleSessionEvent);