var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var RSVP = require('rsvp');

var sshURL = 'ssh ashish@ashish-Inspiron ';

function execCommand(cmd){
    cmd = sshURL + '"' + cmd + '"'; //single quotes used in file path, 
    //so use double quotes for enclosing command to be executed over ssh

    console.log("ssh command=" + cmd);
    promise = new RSVP.Promise(function(resolve, reject){
        exec(cmd, function(error, stdout, stderr){
            //console.log("e=" + error + ", stdout=" + stdout + ", stderr" + stderr);
            resolve({
                error : error,
                stdout : stdout,
                stderr : stderr
            });
        });
    });
    return promise;
}

function sendResponse(msg, socket){
    if(socket){
        console.log('sending response');
        socket.emit('response', msg);
    }
}

function execCommandWithSocket(cmd, socket){
    cmd = sshURL + "'" + cmd + "'"; //single quotes used in file path, 
    //so use double quotes for enclosing command to be executed over ssh

    console.log("(socket) ssh command=" + cmd);
    var ls = spawn("ssh", ["ashish@ashish-Inspiron", cmd]);

    ls.stdout.on('data', (data) => {
        console.log('stdout :' + data);
        sendResponse('stdout :' + data, socket);
    });

    ls.stderr.on('data', (data) => {
        console.log('stderr :' + data);
        sendResponse('stderr :' + data, socket);
    });

    ls.on('close', (code) => {
        console.log('exited with :' + code);
        sendResponse('exited with :' + code, socket);
    });

    ls.on('error', function( err ){
        console.log('error :' + err);
        sendResponse('error :' + err, socket);
    });
}

module.exports = {
    execCommand : execCommand,
    execCommandWithSocket : execCommandWithSocket
};
