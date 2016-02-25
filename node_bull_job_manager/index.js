var cluster = require('cluster');
var Q = require('bull');
var bulkSmsQueue = Q('bulkSms');

if(cluster.isMaster){
    var express = require('express');
    var app = express();

    for(i=0; i<2; i++){
        cluster.fork();
    }

    app.get('/add/:id', function(req, res){
        bulkSmsQueue.add({id : req.params.id});
        res.json({message : "Job submitted!"});
    });

    app.get('/status', function(req, res){
        bulkSmsQueue.count().then(function(c){
            res.json(c);
        });
    });

    app.get('/empty', function(req, res){
        res.json(bulkSmsQueue.count());
    });

    app.listen(9231);
}
else{
    bulkSmsQueue.process(function(job, done){
        var id = job.data.id;
        console.log("%j", job.data);
        console.log(id + "=work start");
        for(i=0; i<10000; i++){
            for(j=0; j<1000; j++){
                for(k=0; k<1000; k++){
                }
            }
            console.log(id + "=" + i + "...");
        }

        console.log(id + "=waiting");
        //setTimeout(function(){
        //    console.log(id + "=work over");
        //    done();
        //}, 10000);
        console.log(id + "=work over");
        done();
    });
}

