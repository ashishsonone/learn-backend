var cluster = require('cluster');
var http = require('http');
var express = require('express');

console.log("spawning with " + cluster.isMaster);
if(cluster.isMaster){
    numCPUs = require('os').cpus().length;
    console.log("#M : pid = " + process.pid + ", numCPUs=" + numCPUs);
    for(var i=0; i < numCPUs; i++){
        cluster.fork();
    }

    cluster.on('fork', (worker) => {
        console.log("#M : fork msg : #" + worker.id + " " + (worker==cluster.workers[worker.id]));
    });

    cluster.on('online', (worker) => {
        console.log("#M : online msg : #" + worker.id);
    });

    cluster.on('listening', (worker, address) => {
        console.log("#M : listening msg : #" + worker.id);
        worker.send('bow before thy master');
    });

    cluster.on('message', (message) => {
        console.log("#M : received message : " + message.sender + " | " + message.msg);
    });

    cluster.on('exit', (worker, code, signal) => {
        if(worker.suicide == true){
            console.log("#M : suidice attempt of #" + worker.id + ", code=" + code + ", signal=" + signal);
        }
        else{
            console.log("#M : murder of #" + worker.id + ", code=" + code + ", signal=" + signal);
            console.log("#M : spawning another worker");
            cluster.fork();
        }
    });
}
else{
    app = express();
    console.log("#" + cluster.worker.id + ": starting " + process.pid);
    app.get('/do/:command', (req, res) => {
        var command = req.params['command'];
        res.status(200).send("#" + cluster.worker.id + ": received command " + command + "\n");
        if(command == 'selfdestroy'){
            cluster.worker.kill();
        }
    });

    app.listen(8010);
    /*
    http.createServer(function(req, res){
        res.status(200).send("response from " + cluster.worker.id);
    }).listen(8002);
    */

    cluster.worker.on('message', (message) => {
        console.log("#" + cluster.worker.id + ": received : " + message);
    });

    cluster.worker.send({sender : cluster.worker.id, msg : 'hello'});
}
