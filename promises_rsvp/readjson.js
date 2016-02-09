"use strict"
var fs = require('fs');
var RSVP = require('rsvp');

function parse(data){
    return RSVP.Promise.resolve().then(
        function(){
            return JSON.parse(data);
        }
    ).then(function wait(data){
        console.log("wait data=" + data);
        return new RSVP.Promise(function(f, r){
            setTimeout(function(){
                f(data);
            }, 3000);
        });
    });
}

function readFile(f){
    return new RSVP.Promise(function(fulfill, reject){
        fs.readFile(f, 'utf8', function (err, data) {
            if(err){
                reject(err);
                console.log("reject 1");
                return;
            }
            parse(data).then(function(obj){
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
        });
    });
}

function success(data){
    console.log("success : " + data);
}

function failure(err){
    console.log("failure : " + err);
}

var p = readFile('a.json');
p.then(success, failure);
console.log('hello');
