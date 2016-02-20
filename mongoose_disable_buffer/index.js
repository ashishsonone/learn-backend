var mongoose = require('mongoose');

function connect(){
    attempting = true;
    console.log("db connecting");
    mongoose.connect("mongodb://localhost:27018/bug", {
        server : {
            auto_reconnect : false,
            poolSize: 10
        }
    }, function(err){
        console.log("db error %j", err);
        if(err){
            setTimeout(function(){
                connect();
            }, 5000);
        }
    });
}

var attempting = false;
mongoose.connection.on('disconnected', function(){
    if(!attempting){
        connect();
    }
});

mongoose.connection.on('connected', function(){
    attempting = false;
});

var http = require('http');
var server = http.createServer(function(req, res){
    console.log("received request");
    find()
    .then(function(items){
        console.log("success : %j", items);
        res.end('success');
    })
    .then(null, function(err){
        console.log("error : %j", err);
        res.end('error');
    });
});
server.listen(8999);

var NewsSchema = mongoose.Schema({
    status : String,
    content : String
}
,{ read: 'primary', bufferCommands : false} 
);

var NewsModel = mongoose.model('news', NewsSchema, 'news');

function find(){
    try{
        return NewsModel.find({}).exec();
    }
    catch(e){
        console.log("$$$$$$$$$$$$$$$$$$");
        return mongoose.Promise.resolve("ERROR");
    }
}

//actual
connect();
