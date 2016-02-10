"use strict"
var request = require('request');

function get(){
    var options = {
        url : "http://localhost:8002/v1/admin/help",
        json : true // Automatically parses the JSON string in the response 
    }
    request(options, function(err, res, body){
        console.log("%j", err);
        console.log("%j", res.body.message);
    });
}

function post(){
    var options = {
        method : "post",
        uri : "http://localhost:8002/v1/admin/login",
        body : {
            email : "ashish@trumplab.com",
            password : "qwerty"
        },
        json : true
    }

    request(options, function(err, res, body){
        console.log("%j", err);
        console.log("%j", res.headers);
        console.log("%j", res.body);
    });
}

function getWithSessionHeader(){
    var options = {
        method : "get",
        uri : "http://localhost:8002/v1/admin/users",
        qs : { //query parameters
            limit : 1
        },
        headers :{
            Cookie : "connect.sid=s%3AT3DuR1cNKCLIo6_pTk80sI_Gb-BO9p72.soq9gnkUYUEJJ4YTdPAnkwaaOxWB%2BgmlffpkOV%2BljCA"
        },
        json : true
    }

    request(options, function(err, res, body){
        console.log("%j", err);
        console.log("%j", res.headers);
        console.log("%j", res.body);
    });
}

getWithSessionHeader();
