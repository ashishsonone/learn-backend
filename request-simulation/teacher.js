if(process.argv.length < 4){
  console.log("usage : node <teacher.js> <username> <token>");
  console.log("e.g node teacher.js ashish ashish_wp8");
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
var currentRequestId = null;

var username = process.argv[2];
var token = process.argv[3];

var presenceRef = new Firebase(FIREBASE_BASE_URL + "/.info/connected");
var sessionBaseRef = new Firebase(FIREBASE_BASE_URL + "/sessions/");
var myChannelRef = new Firebase(FIREBASE_BASE_URL + "/teacher-channels/" + username);
var myStatusChannelRef = new Firebase(FIREBASE_BASE_URL + "/teachers/" + username + "/status");

myStatusChannelRef.on("value", function(snap){
  var requestId = snap.val();
  console.log("my status snap.val()=" + requestId + "| currentRequestId=" + currentRequestId);
  if(!requestId || requestId === ""){
    console.log("Hurray I am a free soul");
  }
  else if(requestId === currentRequestId){
    console.log("Hurray I already attending " + currentRequestId);
  }
  else{
    console.log("Hurray I must resume " + requestId);
    stopInput();
    startInput(requestId);
  }
});

var sessionRef = sessionBaseRef.child(token);

var offsetRef = new Firebase(FIREBASE_BASE_URL + ".info/serverTimeOffset");

//callTerminateApi(); //terminate any old sessions

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
      online : false,
      processed : false
    });

    sessionRef.set({
      ts : ts,
      username : username,
      online: true,
      processed : false
    });
  }
});

function listenToChannel(){
  console.log("listenToChannel entered start ts=" + sessionStartTime + "|" + FIREBASE_BASE_URL + "/channels/" + username);
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
  msg.id = msg.requestId;
  if(msg.type === "request"){
    console.log("new request id=" + msg.id + ", topic=" + msg.details.topic);
    if(currentRequestId){
      console.log("I AM BUSY with " + currentRequestId + " | ignoring request id=" + msg.id);
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
    callTerminateApi();
  }
  else{
    console.log("unknown command `" + m + "`");
  }
}

function callTerminateApi(){
  var body = {
    username : username
  };

  var options = {
    method : 'POST',
    uri : API_SERVER_URL + "/v1/live/requests/terminate",
    body : body,
    headers : {
      "Content-Type": "application/json",
    },
    json : true
  };

  console.log("callTerminateApi calling with options=%j", options);
  request(options, function(err, res, body){
    if(!err && res.statusCode == 200){
      console.log("callTerminateApi : success %j", body);
      stopInput();
    }
    else{
      console.log("callTerminateApi : error. Session continues.... %j", err);
    }
  });
}

var sessionPromptTimer = null;
function sessionPrompt(){
  console.log("ongoing session.... Type stop to terminate");
}

function startInput(requestId){
  currentRequestId = requestId;
  console.log("type 'stop' and enter to terminate the session id=" + currentRequestId);
  stdin.addListener("data", stdinListener);
  clearInterval(sessionPromptTimer);
  sessionPromptTimer = setInterval(sessionPrompt, 2000);
}

function stopInput(){
  currentRequestId = null;
  stdin.removeListener("data", stdinListener);
  console.log("Teaching Session over : waiting for further requests");
  clearInterval(sessionPromptTimer);
  sessionPromptTimer = null;
}