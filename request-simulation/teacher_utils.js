//Usage t = new StopWatch()
//t.reset(); t.resume(); t.pause(); t.resume(); t.getTime(); t.reset();

function StopWatch(){
  var duration = 0;
  var lastTS = 0; //not yet set
  var running = false;
  
  //can be called anytime to reset the timer
  this.reset = function(initDuration){
    duration = 0;
    if(initDuration){
      duration = initDuration;
    }
    running = false;
  };
  
  //called after reset() or pause()
  this.resume = function(){
    if(!running){
      lastTS = new Date().getTime();
      running = true;
    }
    else{
      console.log("resume() : already running");
    }
  };
  
  //called after resume()
  this.pause = function(){
    if(running){
      var interval = new Date().getTime() - lastTS;
      duration += interval;
      lastTS = 0;
      running = false;
    }
    else{
      console.log("pause() : not running");
    }
  };
  
  //can be called anytime to get current elapsed time
  this.getElapsedTime = function(){
    var elapsed = duration;
    if(running){
      var currentInterval = new Date().getTime() - lastTS;
      elapsed += currentInterval ;
    }
    return elapsed;
  };
}

module.exports = {
  StopWatch : StopWatch
};