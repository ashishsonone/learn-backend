//Since we're using redis as cache, disble disk persistence for redis server, for faster performance
//Run redis-server  --save ""
// --maxmemory 100mb
// --maxmemory-policy volatile-ttl //remove the key with the nearest expire time (minor TTL)
var express = require('express');
var Redis = require('ioredis');
var redis = new Redis({
    port : 6379,
    db : 1, //databases are identified by integer numbers, default is 0
    //showFriendlyErrorStack: true //for show stacktraces with where in our code it occured, You shouldn't use this feature in a production environment.
});

Redis.Promise.onPossiblyUnhandledRejection(function (error) {
    console.log(error);
    // to produce error use redis.set('foo')
    // you can log the error here.
    // error.command.name is the command name, here is 'set'
    // error.command.args is the command arguments, here is ['foo']
});

var Promise = require('bluebird');

var app = express();

var users = {
    'a' : 'ashish',
    'd' : 'dhanesh',
    'h' : 'hardik',
    'p' : 'poonia'
};

var books = {
    'a' : 'ali baba aur chalis chor',
    'b' : 'batman',
    'c' : 'charlies angels',
    'd' : 'dockyard'
};

function getBook(id){
    return new Promise(function(resolve, reject){
        setTimeout(function(){
            resolve(books[id]);
        }, 50);
    });
}

app.get('/push/:id', function(req, res){
    var id = req.params.id;
    var name = req.query.name;
    users[id] = name;
    res.json(true);
});

//simple type
app.get('/users/:id', function(req, res){
    var id = req.params.id;
    var redisKey = '/users/' + id; 
    redis.get(redisKey, function(err, result){
        console.log(id + " " + err + " " + result);
        if(result){
            res.json(result);
        }
        else{
            var user = users[id];
            if(user){
                redis.set(redisKey, user);
                redis.expire(redisKey, 10 , function(err, result){
                    console.log("expire : " + redisKey +  " " + err + " " + result);
                }); //will expire in 10 sec, argument takes in # SECONDS (not milliseconds)
                res.json(user);
            }
            else{
                res.json({"result" : "404 NOT FOUND"});
            }
        }
    });
});

function fetchAndSendBook(id, res){
    console.log("inside fetchAndSendBook");
    return getBook(id).then(function(result){
        console.log("getBook over " + result);
        if(result){
            console.log("db reponse " + result + " & put in cache with expiry 20s");
            //put in cache and set expiry all with one command
            redis.set('/books/' + id, result, 'ex', 20, function(err, result){
                console.log("redis.set " + id + " : " + err + " " + result);
            });
            return res.json(result);
        }
        else{
            console.log("db not found throw error");
            throw "404 NOT FOUND";
        }
    });
}

//setting key-value and ttl in one command | using promises (ioredis uses bluebird)
//if redis.status == 'ready' only then use it, otherwise if its 'reconnecting' or something, directly use DB
app.get('/books/:id', function(req, res){
    var id = req.params.id;
    var redisKey = '/books/' + id;
    console.log("redis.status " + redis.status);
    var p = Promise.resolve(null); //default if redis not connected
    if(redis.status === 'ready'){
        p = redis.get(redisKey);
    }
    p = p.then(function(result){
        if(result){
            console.log("redis response " + result)
            return res.json(result);
        }
        else{
            console.log("calling fetchAndSendBook");
            return fetchAndSendBook(id, res);
        }
    });
    p.catch(function(err){
        res.json(err);
    });
});

app.listen(8121);
