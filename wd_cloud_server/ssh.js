var exec = require('child_process').exec;
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

module.exports = {
    execCommand : execCommand
};
