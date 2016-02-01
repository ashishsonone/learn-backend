var RSVP = require('rsvp');
var count = 0;

function dieToss() {
      return Math.floor(Math.random() * 6) + 1;
}

function tossASix(){
    count = count + 1;
    return new RSVP.Promise(function(fulfill, reject) {
        var n = dieToss();
        var to = setTimeout(function(){
            console.log('tossed #' + count);
            if (n === 6) {
                fulfill(n);
            } else {
                reject(n);
            }
        }, 1000);
        console.log('called #' + count);
    });
}

function logAndTossAgain(toss){
    console.log("Tossed a " + toss + ", roll again");
    return tossASix();
}

function logSuccess(toss){
    console.log("Hurray, managed to toss a " + toss);
}

function logFailure(toss){
    console.log("Tossed a " + toss + ", the Force is not with you");
}

console.log('1');

tossASix()
    .then(null, logAndTossAgain)
    .then(null, logAndTossAgain)
    .then(logSuccess, logFailure);
console.log('3');
