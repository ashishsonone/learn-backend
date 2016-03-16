"use strict"
var express = require('express');
var http = require('http');
var ssh = require('./ssh');

var app = express();
var server = http.Server(app)
var io = require("socket.io")(server);

io.on("connection", function (socket) {
    // we've got a client connection
    console.log("---> " + "connection received");
    socket.on('command', function(command){
        console.log("command #" + command);
        socket.emit('response', '<b>ack</b> for ' + command);
        ssh.execCommandWithSocket(command, socket);
    });
});

app.set('view engine', 'ejs');

var baseFolder = '/home/ashish/Desktop';

app.use('/browse', function(req, res){
    console.log("url is " + req.url);
    var subPath = decodeURI(req.url);
    var completePath = baseFolder + subPath;
    var command = "ls " + "'" + completePath + "'";

    var promise = ssh.execCommand(command);
    console.log("command is" + command);
    promise = promise.then(function(result){
        var files = result.stdout;
        if(files != null){
            files = files.trim();
            files = files.split('\n');
        }
        else{
            files = [result.stderr + ""];
        }

        console.log("files=" + files);

        var hrefBase = subPath.slice(1);
        hrefBase = '/browse/' + hrefBase;
        console.log("hrefBase is='" + hrefBase + "'");
        res.render('pages/index', {files : files, base : hrefBase});
    });

    promise.catch(function(err){
        var files = [err + ""];
        res.render('pages/index', {files : files});
    });
});

server.listen(3000);
console.log("listening on 3000");
