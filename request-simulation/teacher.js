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

var OFFSET = 0;
var sessionStartTime = null;
var currentRequestId = null;
var currentRequestStatus = null;
var stopWatch = new teacherUtils.StopWatch();

var username = process.argv[2];
var token = process.argv[3];

var presenceRef = new Firebase(FIREBASE_BASE_URL + "/.info/connected");
var sessionBaseRef = new Firebase(FIREBASE_BASE_URL + "/sessions/");
var myChannelRef = new Firebase(FIREBASE_BASE_URL + "/teacher-channels/" + username);
var myStatusChannelRef = new Firebase(FIREBASE_BASE_URL + "/teachers/" + username + "/status");
var teachingChannleRef = new Firebase(FIREBASE_BASE_URL + "/teaching/");

myStatusChannelRef.on("value", function(snap){
  var requestId = snap.val();
  console.log("my status snap.val()=" + requestId + "| currentRequestId=" + currentRequestId);
  if(!requestId || requestId === ""){
    console.log("Hurray I am a free soul");
    if(currentRequestId != null){
      console.log("Terminated globally, must terminate locally");
      //already terminated globally, so terminate here locally
      stopInput();
    }
  }
  else if(requestId === currentRequestId){
    console.log("Hurray I already attending " + currentRequestId);
  }
  else{
    console.log("Hurray I must resume " + requestId + "| attaching a request status listener");
    stopInput();
    currentRequestId = requestId;
    teachingChannleRef.child(requestId).child('status').on('value', requestStatusListener);
  }
});

var sessionRef = sessionBaseRef.child(token);

var offsetRef = new Firebase(FIREBASE_BASE_URL + ".info/serverTimeOffset");

offsetRef.once("value", function(snap) {
  OFFSET = snap.val();
  console.log("OFFSET=" + OFFSET);
  if(sessionStartTime == null){
    sessionStartTime = new Date().getTime() + OFFSET - 60*1000; //listen for messages from 60 secs before
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
    console.log("new request id=" + msg.id + ", details=%j", msg.details);
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
    startInput(msg.id, "assigned"); //directly start the session
    
    //currentRequestId set
    teachingChannleRef.child(currentRequestId).child('status').on('value', requestStatusListener);
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
  if(currentRequestStatus === "assigned" && m === 'start'){
    console.log("starting the session");
    callStartApi(currentRequestId);
  }
  else if(currentRequestStatus === "started" && m === 'end'){
    console.log("terminating the session, stop listening to stdin");
    callEndApi(currentRequestId);
  }
  else{
    console.log("unknown command `" + m + "`");
  }
}

function callStartApi(requestId){
  var body = {
    username : username,
    requestId : requestId,
    role : "teacher"
  };

  var options = {
    method : 'POST',
    uri : API_SERVER_URL + "/v1/live/requests/start",
    body : body,
    headers : {
      "Content-Type": "application/json",
    },
    json : true
  };

  console.log("callStartApi calling with body=%j", body);
  request(options, function(err, res, body){
    if(!err && res.statusCode == 200){
      console.log("callStartApi : success %j changing currentRequestStatus to assigned", body);
      //must already be at the prompt. Just change the prompt value from 'assigned' to 'started'
      currentRequestStatus = "started";
    }
    else{
      console.log("callStartApi : error. Session continues.... %j", err);
    }
  });
}

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

var sessionPromptTimer = null;
function sessionPrompt(){
  var prompt = currentRequestId + "|" + currentRequestStatus;
  if(currentRequestStatus === "assigned"){
    prompt += " Type 'start' to begin the session";
  }
  else if(currentRequestStatus === "started"){
    prompt += " Type 'end' to terminate the session";
  }
  else{
    prompt += " Unknown state";
  }
  console.log(prompt);
  
  if(currentRequestStatus === "started"){
    callUpdateApi(currentRequestId, stopWatch.getElapsedTime());
  }
}

function startInput(requestId, requestStatus){
  callGetRequestApi(requestId, function(err, reqEntity){
    if(!err){
      currentRequestId = requestId;
      currentRequestStatus = requestStatus;

      stdin.addListener("data", stdinListener);
      clearInterval(sessionPromptTimer);
      sessionPromptTimer = setInterval(sessionPrompt, 10000);

      var initDuration = reqEntity.sessionDuration || 0;
      stopWatch.reset(initDuration);
      stopWatch.resume();
    }
    else{
      console.log("startInput error %j", err);
    }
  });
}

function stopInput(){
  if(currentRequestId){
    console.log("stopInput : stop listening for status of " + currentRequestId);
    teachingChannleRef.child(currentRequestId).child('status').off('value', requestStatusListener);
  }
  
  currentRequestId = null;
  currentRequestStatus = null;
  
  stdin.removeListener("data", stdinListener);
  console.log("Teaching Session over : waiting for further requests");
  clearInterval(sessionPromptTimer);
  sessionPromptTimer = null;
}

function requestStatusListener(snapshot){
  //currentRequestId null means that this listener is not active
  //currentRequestId won't be null here
  
  var requestStatus = snapshot.val();
  console.log("requestStatusListener : requestStatus=" + requestStatus + "| currentRequestStatus=" + currentRequestStatus);
  //also requestStatus will be non-null as listener attached when 'assigned' the request
  if(currentRequestId && requestStatus){
    if(requestStatus === currentRequestStatus){
      console.log("requestStatusListener : same status=" + currentRequestStatus);
    }
    else if(requestStatus === "ended"){
      //terminate
      console.log("requestStatusListener : " + currentRequestId + "| terminated , must terminate locally");
      //already terminated globally, so terminate here locally
      stopInput();
    }
    else if(requestStatus === "assigned"){//newly assigned or resuming a 'assigned' request on restart
      console.log("requestStatusListener : newly assigned or resuming a 'assigned' request on restart");
      startInput(currentRequestId, requestStatus);
    }
    else if(requestStatus === "started" && currentRequestStatus === "assigned"){//current is 'assigned'(stdin listener active) and then session started
      console.log("requestStatusListener : current 'assigned' (listner already acvtive); Now session has 'started'; just change the prompt");
      currentRequestStatus = "started"; //just change the prompt
    }
    else if(requestStatus === "started"){ //currentRequestStatus is null
      console.log("requestStatusListener : currentRequestStatus is null and session has 'started'; start the prompt");
      startInput(currentRequestId, requestStatus);
    }
  }
  else{
    console.log("requestStatusListener : SHOULD NOT HAPPEN");
  }
}