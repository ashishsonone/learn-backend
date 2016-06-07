"use strict"
var ENV = process.env.ENV;

var enumEnvironment = ['local', 'dev'];

if(!ENV|| enumEnvironment.indexOf(ENV) == -1){
  console.log("######ALARM######");
  console.log("====environment variable 'ENV' must be one of [local, dev]====");
  console.log("######ALARM######");
  process.exit();
}

if(ENV === 'local'){
  var apiServerConfig = {
    "host" : "127.0.0.1",
    "port" : 8002,
    "method" : "http"
  };

  var firebaseConfig = {
    baseUrl : "https://shining-inferno-4918.firebaseio.com/",
  };
}
else if(ENV === 'dev'){
  var apiServerConfig = {
    "host" : "dev.api.preppo.in",
    "port" : 443,
    "method" : "https",
  };

  var firebaseConfig = {
    baseUrl : "https://dev-preppo.firebaseio.com/",
  };
}

module.exports = {
  firebaseConfig : firebaseConfig,
  apiServerConfig : apiServerConfig
};