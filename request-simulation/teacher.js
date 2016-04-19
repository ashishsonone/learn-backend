if(process.argv.length < 5){
  console.log("usage : node <teacher.js> <username> <devicename> <token>");
  console.log("e.g node teacher.js ashish windowsphone8 ashish_wp8");
  process.exit(0);
}

var Firebase = require('firebase');
var request = require('request');
var config = require('./config');

var FIREBASE_BASE_URL = config.firebaseConfig.baseUrl;
var API_SERVER_URL = config.apiServerConfig.method + "://" + 
  config.apiServerConfig.host + ":" + config.apiServerConfig.port;

console.log("api server url : " + API_SERVER_URL);

var OFFSET = 0;
var sessionStartTime = null;
var iAmBusy = false;
var currentRequestId = null;

var username = process.argv[2];
var device = process.argv[3];
var token = process.argv[4];

var presenceRef = new Firebase(FIREBASE_BASE_URL + "/.info/connected");
var sessionBaseRef = new Firebase(FIREBASE_BASE_URL + "/sessions/");
var myChannelRef = new Firebase(FIREBASE_BASE_URL + "/channels/" + username);

var sessionRef = sessionBaseRef.child(token);

var offsetRef = new Firebase(FIREBASE_BASE_URL + ".info/serverTimeOffset");

offsetRef.once("value", function(snap) {
  OFFSET = snap.val();
  console.log("OFFSET=" + OFFSET);
  if(sessionStartTime == null){
    sessionStartTime = new Date().getTime() - 60*1000; //listen for messages from 60 secs before
    console.log("sessionStartTime=" + sessionStartTime);
    listenToChannel();
  }
});

presenceRef.on('value', function(snapshot){
  console.log("presence value = " + snapshot.val());
  var ts = sessionStartTime;
  if(ts == null){
    ts = new Date().getTime();
  }

  if(snapshot.val()){
    sessionRef.onDisconnect().set({
      ts : ts,
      username : username,
      device : device,
      online : false,
      processed : false
    });

    sessionRef.set({
      ts : ts,
      username : username,
      device : device,
      online: true,
      processed : false
    });
  }
});

function listenToChannel(){
  console.log("listenToChannel entered start time=" + new Date(sessionStartTime));
  myChannelRef.orderByChild("ts").startAt(sessionStartTime).on('child_added', function(snapshot){
    var msg = snapshot.val();
    var s = {
      type : msg.type,
      ts : msg.ts
    };

    console.log("message received %j", s);
    handleMessage(msg);
  });
}

function handleMessage(msg){
  if(msg.type === "request"){
    console.log("new request id=" + msg.id + ", details=" + msg.details);
    if(iAmBusy){
      console.log("I AM BUSY : ignoring request id=" + msg.id);
      return;
    }
    var wait = 10 + Math.floor(Math.random() * 10); //wait for 10-20 seconds
    console.log("waiting for " + wait + " seconds before replying");

    wait = wait * 1000; //in milliseconds

    setTimeout(function(){
      acceptOrReject(msg);
    },
    wait);
  }
  else if(msg.type === "deny"){
    console.log("deny response received for request id=" + msg.id);
  }
  else if(msg.type === "assign"){
    console.log("assign response for request id=" + msg.id + ", student=" + msg.student);
    console.log("getting ready to take the session now !!");
    startInput(msg.id);
  }
  else{
    console.log("unknown message type=" + msg.type);
  }
}

function acceptOrReject(msg){
  var accept = Math.random() * 10;
  accept = accept > 2; //20 % rejection
  if(accept){
    console.log("accepted request id=" + msg.id);
    var requestRef = new Firebase(FIREBASE_BASE_URL + "/requests/" + msg.id);
    requestRef.push({
      username : username,
      action : "accept"
    });
  }
  else{
    console.log("rejected request id=" + msg.id);
    var requestRef = new Firebase(FIREBASE_BASE_URL + "/requests/" + msg.id);
    requestRef.push({
      username : username,
      action : "reject"
    });
  }
}

var stdin = process.openStdin();
function stdinListener(d){
  // note:  d is an object, and when converted to a string it will
  // end with a linefeed.  so we (rather crudely) account for that  
  // with toString() and then trim()
  var m = d.toString().trim();
  if(m === 'stop'){
    console.log("terminating the session, stop listening to stdin");
    callTerminateApi(currentRequestId);
  }
  else{
    console.log("unknown command. Session continues...");
  }
}

function callTerminateApi(requestId){
  var body = {
    username : username,
    requestId : requestId
  };

  var options = {
    method : 'POST',
    uri : API_SERVER_URL + "/terminate/",
    body : body,
    headers : {
      "Content-Type": "application/json",
    },
    json : true
  };

  console.log("callTerminateApi calling with options=%j", options);
  request(options, function(err, res, body){
    if(err){
      console.log("callTerminateApi : error. Session continues.... %j", err);
    }
    else {
      console.log("callTerminateApi : success %j", body);
      stopInput();
    }
  });
}

function startInput(requestId){
  currentRequestId = requestId;
  iAmBusy = true;
  console.log("type 'stop' and enter to terminate the session id=" + currentRequestId);
  stdin.addListener("data", stdinListener);
}

function stopInput(){
  iAmBusy = false;
  currentRequestId = null;
  stdin.removeListener("data", stdinListener);
  console.log("Teaching Session over : waiting for further requests");
}