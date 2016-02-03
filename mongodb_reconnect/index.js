"use strict"
var express = require('express');
var mongoose = require('mongoose');

var app = express();

var userSchema = mongoose.Schema({
    name : String,
    age : Number,
    liked : {} //mixed can be boolean true/false or can be a neutral comment string, or can be rating(number) from 1 to 10
});

var i = Math.floor(Math.random() * 100);

var userModel = mongoose.model('user', userSchema);

function connectWithRetry(){
    attempting = true;
    mongoose.connect("mongodb://localhost:27018/delete", {server:{auto_reconnect:false, socketOptions: {connectTimeoutMS: 5000, socketTimeouMS : 5000}}}, function(err){
        if (err) {
            console.log("(retry in 5s)connectWithRetry error %j", err);
            setTimeout(connectWithRetry, 5000);
        }
    });
}

mongoose.set('debug', true);

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

app.get('/', function(req, res){
    userModel.find({}).maxTime(5000).exec(function(err, users){
        if(!err){
            res.json(users);
        }
        else{
            res.json({"error" : "db connection error", "debug" : err});
        }
    });
});

app.get('/:name', function(req, res){
    var newUser = new userModel();
    newUser.name = req.params.name;
    newUser.age = i++;
    newUser.save(function(err, user){
        console.log("new user : %j", user);
        res.json(user);
    });
});

app.get('/update/:name', function(req, res){
    userModel.findOne({name : req.params.name}, function(err, newUser){
        newUser.age = i++;
        var likedType = Math.floor(Math.random()*3);
        if(likedType == 0){//boolean
            newUser.liked = true;
        }
        else if(likedType == 1){//number
            newUser.liked = i++;
        }
        else{//string
            newUser.liked = "my view is it will earn rs " + (i++) + " cr";
        }
        newUser.markModified('liked');   //since like is mixed type, its not being tracked 
                                        //by mongoose, we need to explicitly tell it
        newUser.save(function(err, user){
            console.log("new user : %j", user);
            res.json(user);
        });
    });
});

app.listen(8003);
