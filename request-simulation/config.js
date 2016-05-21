var firebaseConfig = {
  baseUrl : "https://dev-preppo.firebaseio.com/",
  //baseUrl : "https://shining-inferno-4918.firebaseio.com/",
  secret : "6Uqqvzd5nXmc4di7m1G53atJa2jXJXouh46C63rp"
};

var mongoConfig = {
  dbUrl : "mongodb://192.168.0.24:27017/live"
};

var ENV = 'dev';
if(ENV === 'local'){
  var apiServerConfig = {
    "host" : "192.168.0.24",
    "port" : 8002,
    "method" : "http"
  };
}
else if(ENV === 'dev'){
  var apiServerConfig = {
    "host" : "dev.api.preppo.in",
    "port" : 443,
    "method" : "https",
  };
}

module.exports = {
  firebaseConfig : firebaseConfig,
  mongoConfig : mongoConfig,
  apiServerConfig : apiServerConfig
};