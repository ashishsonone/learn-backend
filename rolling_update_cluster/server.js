var express = require('express');
var cluster = require('cluster');
var app = express();

var mongooseR = require('./mongoose_robust');
var mongoose = require('mongoose');
mongooseR.connectWithRetry("mongodb://localhost:27017/test", 10);

var Firebase = require('firebase');

//========= cluster =====
var clusterWorkerId = "S";
var requestLocation = parseInt(new Date().getTime() / 60000) + "";
console.log("#" + clusterWorkerId + ": requestLocation=" + requestLocation);

if(cluster.isWorker){
  clusterWorkerId = cluster.worker.id;
  cluster.worker.on('message', function(message){
    console.log("#" + clusterWorkerId + ": message=" + message);
  });

  cluster.worker.on('disconnect', function(message){
    console.log("#" + clusterWorkerId + ": disconnect message received");
    mongooseR.suicide = true;
  });
  /*cluster.worker.on('exit', function(code, signal){
    console.log("#" + clusterWorkerId + ": exit");
  });
  */
}

//=======================
var received = 0;
var responded = 0;
var completed = 0;

function log(){
  console.log("#" + clusterWorkerId + ": " + received + "|" + responded + "|" + completed);
}

app.get('/', function(req, res){
  received++;
  log();
  var promise = findItem();
  promise.then(function(result){
    res.json(result);
    responded++;
    log();
    backgroundWork();
  });
});

//==========WORK =========
var ItemSchema = mongoose.Schema({
  name : String,
  price : Number
});

var ItemModel = mongoose.model('Item', ItemSchema, 'items');

function findItem(){
  return ItemModel.findOne({name : "chess"}).exec();
}

function backgroundWork(){

  var sessionName = clusterWorkerId + "-" + received;
  var reqFire = new Firebase("https://keil9ad7awn.firebaseio-demo.com/" + requestLocation + "/" + sessionName);

  console.log("#" + clusterWorkerId + "|" + sessionName + "|" +  + ": backgroundWork started");
  var responses = [];

  var responseListener = function(snapshot){
    responses.push(snapshot.val());
    console.log("#" + clusterWorkerId + "|" + sessionName + "|" + "snapshot=" + snapshot.val() + "|responses.length=" + responses.length);
  };

  reqFire.child('responses').on('child_added', responseListener);

  var countSlow = 0;
  var responseMimicTimerSlow = setInterval(function(){
    countSlow++;
    if(countSlow > 20){
      console.log("#" + clusterWorkerId + "|" + sessionName + "|"  + "clearing responseMimicTimerSlow");
      clearInterval(responseMimicTimerSlow);
      return;
    }

    var teacherId = "slow-" + countSlow;
    console.log("#" + clusterWorkerId + "|" + sessionName + "|"  + "teacher responding #" + teacherId);
    reqFire.child('responses').push(teacherId);
  },
  3000);

  var countFast = 0;
  var responseMimicTimerFast = setInterval(function(){
    countFast++;
    if(countFast > 15){
      console.log("#" + clusterWorkerId + "|" + sessionName + "|"  + "clearing responseMimicTimerFast");
      clearInterval(responseMimicTimerFast);
      return;
    }
    var teacherId = "fast-" + countFast;
    console.log("#" + clusterWorkerId + "|" + sessionName + "|"  + "teacher responding #" + teacherId);
    reqFire.child('responses').push(teacherId);
  },
  1500);

  //window of 30 seconds to receive all responses from teachers
  var windowTimer = setTimeout(function(){
    console.log("#" + clusterWorkerId + "|" + sessionName + "|"  + "selecting teachers out of " + responses.length + " teachers");
    reqFire.child('responses').off('child_added', responseListener);
    console.log("#" + clusterWorkerId + "|" + sessionName + "|"  + "stopped accepting any more responses == window closed");
    //after 10 secs of processing select a random teacher from responses
    setTimeout(function(){
      var i = Math.floor(Math.random()*responses.length);
      reqFire.child('selected').set(responses[i]);
      console.log("#" + clusterWorkerId + "|" + sessionName + "|" + "selected teacher #" + responses[i]);
      completed++;
      log();
    },
    10000);
  },
  30000);

}
//===================
var PORT = 8003;
app.listen(PORT);
console.log("#" + clusterWorkerId + ": pid=" + process.pid);
