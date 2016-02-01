/*
 *  getUser() ---- getAge(user) --->\
 *          \                        \
 *           \---- getSchool(user)--->\ 
 *                                     \----> logUserInfo(details); 
 */
var RSVP = require('rsvp');

function elapsedTimer(t){
  startTime = t;

  getElapsedTime = function(){
    return new Date().getTime() - startTime;
  };

  return {
      getElapsedTime : getElapsedTime
  }
}

timer = elapsedTimer(new Date().getTime());

function getUser() {
  console.log(timer.getElapsedTime() + " " + "getUser called");
  var n = Math.floor(Math.random() * 6) + 1;
  return new RSVP.Promise(function(fulfill, reject){
    setTimeout(function(){
      console.log(timer.getElapsedTime() + " " + "getUser over " + n);
      fulfill("person-" + n);
    }, 1000);
  });
}

function getAge(user){
  console.log(timer.getElapsedTime() + " " + "getAge called");
  return new RSVP.Promise(function(fulfill, reject){
    setTimeout(function(){
      var n = Math.floor(Math.random() * 20) + 20;
      console.log(timer.getElapsedTime() + " " + "getAge over " + n);
      fulfill(n);
    }, 500);
  });
}

function getSchool(user){
  console.log(timer.getElapsedTime() + " " + "getSchool called");
  return new RSVP.Promise(function(fulfill, reject){
    setTimeout(function(){
      var n = Math.floor(Math.random() * 20) + 20;
      console.log(timer.getElapsedTime() + " " + "getSchool over " + n);
      fulfill("school-" + n);
    }, 3000);
  });
}

function logUserInfo(details){
  console.log(timer.getElapsedTime() + " " + "user details are : " + details);
}

var promise = getUser();
var agePromise = promise.then(getAge);
var schoolPromise = promise.then(getSchool);

var allInfoPromise = new RSVP.all([agePromise, schoolPromise]);

allInfoPromise.then(logUserInfo);
