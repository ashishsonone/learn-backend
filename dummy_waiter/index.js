var express  = require('express');
var app = express();

var arrived = 0;
var completed = 0;

app.get('/', 
    function(req, res){
        arrived++;
        console.log("arrived : " + arrived);
        setTimeout(()=> {
            completed++;
            console.log("completed : " + completed);
            res.json({msg : 'dummy'});
        },
        3000);
    }
);

app.get('/health',
    function(req, res){
        res.end("maje me\n");
    }
);

app.listen(8002);
