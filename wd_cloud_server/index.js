"use strict"
var express = require('express');
var app = express();

app.set('view engine', 'ejs');

var ssh = require('./ssh');

var baseFolder = '/home/ashish/Desktop';

app.use('/', function(req, res){
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
        console.log("hrefBase is=" + hrefBase);
        res.render('pages/index', {files : files, base : hrefBase});
    });

    promise.catch(function(err){
        var files = [err + ""];
        res.render('pages/index', {files : files});
    });
});

app.listen(8000);
console.log("listening on 8000");
