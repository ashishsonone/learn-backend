var mongoose = require('mongoose');

function connect(){
    attempting = true;
    console.log("db connecting");
    mongoose.connect("mongodb://localhost:27018/bug", {
        server : {
            auto_reconnect : false,
            poolSize: 10
        }
    }, function(err){
        console.log("db error %j", err);
        if(err){
            setTimeout(function(){
                connect();
            }, 5000);
        }
    });
}

var stopping = false;
var stopped = true;

var connected = true;
var attempting = false;
mongoose.connection.on('disconnected', function(){
    connected = false;
    if(stopping){
        console.log('----> already pending stop or already ');
    }
    else if(stopped){
        console.log('----> server already stopped');
    }

    else if(!stopping && !stopped){
        console.log('----> setTimeout stop request');
        stopping = true;
        setTimeout(function(){
            if(!connected){
                console.log('----> stop request');
                server.close(function(err, res){
                    stopping = false;
                    stopped = true;
                    console.log('----> stop callback %j, %j', err, res);
                });
            }
            else{
                stopping = false;
            }
            //stop listening after waiting for few allowable 'seconds' 
            //because if there is a temporary network disruption, 
            //during that time we can allow commands to buffer
            //so that requests won't fail
        }, 10000);
    }
    if(!attempting){
        connect();
    }
});

mongoose.connection.on('connected', function(){
    connected = true;
    stopping = false;
    console.log('----> start request listening');
    server.listen(8999, function(err, result){
        if(!err){
            stopped = false;
            console.log('----> start callback listening');
        }
    });
    attempting = false;
});

var http = require('http');
var server = http.createServer(function(req, res){
    console.log("received request");
    find()
    .then(function(items){
        console.log("success : %j", items);
        res.end('success');
    })
    .then(null, function(err){
        console.log("error : %j", err);
        res.end('error');
    });
});

var NewsSchema = mongoose.Schema({
    status : String,
    content : String
}
,{ read: 'primary', bufferCommands : false} 
);

var NewsModel = mongoose.model('news', NewsSchema, 'news');

function find(){
    try{
        return NewsModel.find({}).exec();
    }
    catch(e){
        console.log("$$$$$$$$$$$$$$$$$$");
        return mongoose.Promise.resolve("ERROR");
    }
}

//actual
connect();
