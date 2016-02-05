var express = require('express');
var cluster = require('cluster');

var app = express();

var received = 0;
var served = 0;

function log(){
    console.log("#" + cluster.worker.id + ": " + received + "|" + served);
}

app.get('/', function(req, res){
    received++;
    log();
    setTimeout(
        function(){
            res.json({msg : "hi"});
            served++;
            log();
        },
        10000
    );
});

cluster.worker.on('message', function(message){
    console.log("#" + cluster.worker.id + ": message=" + message);
});

cluster.worker.on('disconnect', function(message){
    console.log("#" + cluster.worker.id + ": disconnect");
});

/*
cluster.worker.on('exit', function(code, signal){
    console.log("#" + cluster.worker.id + ": exit");
});
*/

var PORT = 8003;
app.listen(PORT);
console.log("#" + cluster.worker.id + ": pid=" + process.pid);
