"use strict"
var fs = require('fs');
var RSVP = require('rsvp');

function wait(time, data){
    var prom = new RSVP.Promise(function(fulfill, reject){
        setTimeout(function(){
            console.log("over wait promise " + time + " " + data);
            fulfill(data);
        },
        time);
    });
    console.log("enter wait promise " + time + " " + data + " %j", prom);
    return prom;
}

function parse(data){
    var prom = RSVP.Promise.resolve().then(
        function(){
            console.log("1");
            return JSON.parse(data);
        }
    ).then(function (data){
        console.log("2");
        return wait(3000, data);
    });
    
    console.log("over here %j", prom);
    prom = prom.then(function(data){
        console.log("3");
        return wait(2000, data);
    });
    console.log("returing parse prom %j", prom);
    return prom;
}

function readFile(f){
    var prom = new RSVP.Promise(function(fulfill, reject){
        fs.readFile(f, 'utf8', function (err, data) {
            if(err){
                reject(err);
                console.log("reject 1");
                return;
            }
            var p = parse(data);
            console.log("called parse %j", p);
            p.then(function(obj){
                if(obj) {
                    fulfill(obj);
                    console.log("fulfill 1");
                    return;
                }
                else {
                    reject(obj);
                    console.log("reject 2");
                    return;
                }
            }, function(err){
                reject(err);
            });
            console.log("called parse %j", p);
        });
    });

    console.log("returing readFile prom %j", prom);
    return prom;
}

function success(data){
    console.log("success : " + data);
}

function failure(err){
    console.log("failure : " + err);
}

var prom = readFile('a.json');
var then = prom.then(success, failure);
console.log("EOF %j then=%j", prom, then);
