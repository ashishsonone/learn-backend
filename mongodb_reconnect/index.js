"use strict"
var express = require('express');
var mongoose = require('mongoose');

var app = express();

var userSchema = mongoose.Schema({
    name : String
});

var userModel = mongoose.model('user', userSchema);

function connectWithRetry(){
    attempting = true;
    mongoose.connect("mongodb://localhost:27017/delete", {server:{auto_reconnect:false}}, function(err){
        if (err) {
            console.log("(retry in 5s)connectWithRetry error %j", err);
            setTimeout(connectWithRetry, 5000);
        }
    });
}

var attempting = true;

/*
 * mongoose.connection.readyState
 * Connection ready state
 * 0 = disconnected
 * 1 = connected
 * 2 = connecting
 * 3 = disconnecting
 */

var db = mongoose.connection;
db.on('error', function() {
    console.log("db error");
});

db.on('connecting', function() {
    console.log("db connecting");
});

db.on('connected', function() {
    attempting = false;
    console.log("db connected");
});

db.on('disconnecting', function() {
    console.log("db disconnecting");
});

db.on('disconnected', function() {
    console.log("db disconnected readyState=" + db.readyState);
    if(!attempting){
        connectWithRetry();
    }
});

db.on('reconnected', function() {
    console.log("db reconnected");
});

connectWithRetry();

app.use('/', function(req, res){
    userModel.find({}).exec(function(err, users){
        if(!err){
            res.json(users);
        }
        else{
            res.json({"error" : "db connection error", "debug" : err});
        }
    })
});

app.listen(8003);
