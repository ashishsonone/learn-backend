var async = require('async');
var http = require('http');

A1 = function(){
  async.parallel(
    {
      root: function(callback){
        http.get("http://localhost:8002/api", function(res){
          console.log("GET /api " + res.statusCode);
          callback(null, res.statusCode);
        });
      },

      mcq: function(callback){
        http.get("http://localhost:8002/api/questions/MCQ", function(res){
          console.log("GET /api/questions/MCQ", res.statusCode);
          callback(null, res.statusCode);
        });
      }
    },
    function(err, results){
      if(!err){
        console.log("all done");
        console.log(results.root);
        console.log(results.mcq);
      }
      else{
          console.log(err);
      }
    }
  );
}

W1 = function(){
  async.waterfall([
    function(callback){
      callback(null, 'one', 'two');
    },
    function(arg1, arg2, callback){
      callback(null, 'three');
    },
    function(arg1, callback){
      callback(null, 'done');
    }
  ], 
  function(err, result){
    console.log("waterfall over with " + result);
  });
}

H1 = function(){
  var options = {
    host: 'localhost',
    port: 8002,
    path: '/api/questions/MCQ',
    method: 'GET'
  };

  http.request(options, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      console.log('BODY: ' + chunk);
    });
  }).end();
}

H1();
