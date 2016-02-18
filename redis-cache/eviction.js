//Testing eviction policy. Run with
// --save ""
// --maxmemory 1024*1024
// --maxmemory-policy volatile-ttl //remove the key with the nearest expire time (minor TTL)

var Redis = require('ioredis');
var redis = new Redis({
    port : 6379,
    db : 1, //databases are identified by integer numbers, default is 0
    //showFriendlyErrorStack: true //for show stacktraces with where in our code it occured, You shouldn't use this feature in a production environment.
});

var word = "abcdefghijklmnop"; //16 bytes
var value = "";
for(var i=0; i< 1024; i++){ //16 kilobyte, per value stored in redis
    value += word;
}

var NUMKEYS = 100; //number of keys to test with

//start putting values with expiry = 20 sec
//insert 100 values

var setCount = 0;
function insert(){
    for(var i=0; i < NUMKEYS; i++){
        var key = 'k' + i;
        setRedis(key, value);
    }
}

function setRedis(key, value){
    redis.set(key, value, 'ex', 20, function(){
        setCount++;
        console.log("set " + key);
    });
}

var hitCount = 0;
var missCount = 0;

function getRedis(key){
    redis.get(key, function(err, result){
        if(result){
            hitCount++;
            console.log("success " + key);
        }
        else{
            missCount++;
            console.log("evicted " + key);
        }
    });
}

function test(){
    for(var i=0; i< NUMKEYS; i++){
        var key = 'k' + i;
        getRedis(key);
    }
}

insert();
setTimeout(function(){
    test();
}, 1000);

setTimeout(function(){
    console.log("stats " + hitCount +"|" + missCount);
}, 2000);
