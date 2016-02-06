const cluster = require('cluster');
const numCPUs = 2;
const timeout = 20000; //seconds to wait after disconnect before killing the worker
                    //i.e time for worker to complete pending requests

var workersToStop = [];

cluster.setupMaster(
    {
        exec : 'server.js'
    }
);

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
    if(worker.suicide == true){
        console.log("#M suidice by #" + worker.id + ", code=" + code + ", signal=" + signal + ". spawning upgraded worker");
        cluster.fork();
    }
    else{
        console.log("#M murder of #" + worker.id + ", code=" + code + ", signal=" + signal);
        console.log("#M spawning another worker");
        cluster.fork();
    }
});

function forkNew(){
    for(var i=0; i<numCPUs; i++){
        cluster.fork();
    }
}

function stopWorker(worker){
    console.log("#M stopWorker : stoppping worker #" + worker.id);
    worker.disconnect();
    killTimer = setTimeout(
        function(){
            var x = cluster.workers[worker.id];
            console.log("#M stopWorker timeout : worker #" + worker.id + " already exited");
            if(x != null){
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
