var RSVP = require('rsvp');
function toss() {
  var n = Math.floor(Math.random() * 6) + 1;
  return new RSVP.Promise(function(fulfill, reject){
    setTimeout(function(){
      console.log("tossed " + n);
      fulfill(n);
    }, 1000);
  });
}

function threeDice() {
  var tosses = [];
  
  function add(x, y) {
    return x + y;
  }
  
  for (var i=0; i<3; i++) { tosses.push(toss()); }
  
  return RSVP.all(tosses).then(function(results) { // [2]
    console.log("called reduce function");
    return results.reduce(add); // [3]
  });
}

function logResults(result) {
  console.log("Rolled " + result + " with three dice.");
}

function logErrorMessage(error) {
  console.log("Oops: " + error.message);
}

function a(val){
  console.log("called a with " + val);
  return 2;
}

function b(val){
  console.log("called b with " + val);
}

function c(val){
  console.log("called c with " + val);
}

threeDice()
  .then(a)
  .then(null)
  .then(c);
