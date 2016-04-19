var firebaseConfig = {
  baseUrl : "https://shining-inferno-4918.firebaseio.com/"
};

var mongoConfig = {
  dbUrl : "mongodb://192.168.0.24:27017/live"
};

var apiServerConfig = {
  "host" : "192.168.0.23",
  "port" : 8002,
  "method" : "http"
};

module.exports = {
  firebaseConfig : firebaseConfig,
  mongoConfig : mongoConfig,
  apiServerConfig : apiServerConfig
};