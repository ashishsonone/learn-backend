const cluster = require('cluster');
const numCPUs = 2;
const timeout = 120000; //seconds to wait after disconnect before killing the worker
                    //i.e time for worker to complete pending requests

var workersToStop = [];

cluster.setupMaster(
    {
        exec : 'server.js'
    }
);

var exitPending = {}; // we have called worker.disconnect()
                      // but 'exit' event for that worker not yet received by master
                      // { <worker.id> : true } mapping

cluster.on('listening', (worker, address) => {
    console.log("#M : worker #" + worker.id + " listening. stop/upgrade any pending workers");
    stopNextWorker();
});

cluster.on('message', (message) => {
    console.log("#M : received message : " + message.sender + " | " + message.msg);
});

cluster.on('disconnect', (worker) => {
    console.log("#M worker #" + worker.id + " disconnected");
});

cluster.on('exit', (worker, code, signal) => {
  // set timeout of 1 sec so that if some error occurs,
  // it doesnot hog the cpu due to very frequent exit and fork events
  setTimeout(function(){
    if(worker.suicide == true){
      console.log("#M suidice by #" + worker.id + ", code=" + code + ", signal=" + signal + ". spawning upgraded worker");
      console.log("#M : for #" + worker.id + " exitPending=" + exitPending[worker.id]);
      delete exitPending[worker.id];
      cluster.fork();
    }
    else{
      console.log("#M murder of #" + worker.id + ", code=" + code + ", signal=" + signal);
      console.log("#M spawning another worker");
      cluster.fork();
    }
  },
  1000);
});

function forkNew(){
    for(var i=0; i<numCPUs; i++){
        cluster.fork();
    }
}

function stopWorker(worker){
    console.log("#M stopWorker : stoppping worker #" + worker.id);
    worker.disconnect();
    exitPending[worker.id] = true;

    killTimer = setTimeout(
        function(){
            if(exitPending[worker.id]){
                console.log("#M stopWorker : killing worker #" + worker.id + " as it didnot exit in " + timeout + " s");
                worker.kill();
            }
        },
        timeout
    );
}

function stopNextWorker(){
    var i = workersToStop.pop();
    var worker = cluster.workers[i];
    if(worker){
        console.log("#M stopNextWorker : stopping #" + worker.id);
        stopWorker(worker);
    }
    else{
        console.log("#M stopNextWorker : nothing to stop");
    }
}

process.on('SIGHUP', function(){
    workersToStop = Object.keys(cluster.workers);
    console.log("#M SIGHUP received workersToStop=" + workersToStop);
    stopNextWorker();
});

console.log("#M pid=" + process.pid);
forkNew();
