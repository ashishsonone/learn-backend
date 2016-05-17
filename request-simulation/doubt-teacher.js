if(process.argv.length < 4){
  console.log("usage : node <teacher.js> <username> <token>");
  console.log("e.g node teacher.js ashish ashish_wp8");
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
  console.log("myDoubtQueue = " + myDoubtQueue);
});

var stdin = process.openStdin();
function stdinListener(d){
  // note:  d is an object, and when converted to a string it will
  // end with a linefeed.  so we (rather crudely) account for that  
  // with toString() and then trim()
  var m = d.toString().trim();
  
  if(m === "status"){
    console.log("status=" + myStatus + ", myDoubtQueue=" + myDoubtQueue);
  }
  else{
    console.log("unknown command `" + m + "`");
  }
}

stdin.addListener("data", stdinListener);

function callEndApi(requestId){
  var body = {
    username : username,
    requestId : requestId,
    role : "teacher"
  };

  var options = {
    method : 'POST',
    uri : API_SERVER_URL + "/v1/live/requests/end",
    body : body,
    headers : {
      "Content-Type": "application/json",
    },
    json : true
  };

  console.log("callEndApi calling with body=%j", body);
  request(options, function(err, res, body){
    if(!err && res.statusCode == 200){
      console.log("callEndApi : success %j", body);
      stopInput();
    }
    else{
      console.log("callEndApi : error. Session continues.... %j", err);
    }
  });
}

function callUpdateApi(requestId, sessionDuration){
  var body = {
    username : username,
    requestId : requestId,
    role : "teacher",
    sessionDuration : sessionDuration
  };

  var options = {
    method : 'POST',
    uri : API_SERVER_URL + "/v1/live/requests/update",
    body : body,
    headers : {
      "Content-Type": "application/json",
    },
    json : true
  };

  //console.log("callUpdateApi calling with body=%j", body);
  request(options, function(err, res, body){
    if(!err && res.statusCode == 200){
      console.log("callUpdateApi : success updated sessionDuration=" + body.sessionDuration + ", status=" + body.status);
    }
    else{
      console.log("callUpdateApi : error. Session continues.... %j", err);
    }
  });
}

function callGetRequestApi(requestId, callback){
  var options = {
    method : 'GET',
    uri : API_SERVER_URL + "/v1/live/requests/" + requestId,
    headers : {
      "Content-Type": "application/json",
    },
    json : true
  };

  //console.log("callUpdateApi calling with body=%j", body);
  request(options, function(err, res, body){
    if(!err && res.statusCode == 200){
      console.log("callGetRequestApi : success with body %j", body);
      callback(null, body);
    }
    else{
      console.log("callGetRequestApi : error. Session continues.... %j", err);
      callback(err);
    }
  });
}