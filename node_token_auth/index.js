var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

//enable CORS
app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', req.headers.origin); //origins allowed for request, dynamically set to request's origin
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS, PATCH, PUT'); //type of methods allowed
  res.header('Access-Control-Allow-Headers', 'x-session-token, accept'); //allow headers
  res.header('Access-Control-Allow-Credentials', true); //allow cookie to be sent
  var method = req.method && req.method.toUpperCase && req.method.toUpperCase();
  if(method === 'OPTIONS'){
      res.status(204);
      res.end();
      return;
  }
  next();
});

app.use('/', function(req, res, next){
    console.log("%j", req.headers);
    console.log("%j", req.body);
    console.log("%j", req.params);
    console.log("%j", req.query);
    console.log("Header X-Session-Token : " + req.get('x-session-token')); //use req.get for case insensitive access to header field
    next();
});

var users = [
    {'email' : 'ashish@trumplab.com', 'password' : 'qwerty'},
    {'email' : 'hardik@trumplab.com', 'password' : 'kuchbhi'}
];

var tokens = {}; //store token -> user mapping

function getUserFromDB(email){
    for(var i=0; i<users.length; i++){
        var user = users[i];
        if(user.email === email) return user;
    }
}

function genAndStoreSessionToken(user){
    var token = new Date().getTime();
    tokens[token] = user;
    return token;
}

function destroySessionToken(token){
    delete tokens[token];
}

app.get('/admin/tokens', function(req, res){
    res.json(tokens);
});


//requires email, password in body field
app.post('/login', function(req, res){
    var email = req.body.email;
    var password = req.body.password;

    var user = getUserFromDB(email); //email, or fb-id or gplus-id
    console.log(email + " " + password + " %j", user);
    if(!user || user.password !== password){
        res.status(401);
        res.json({status : "failure"});
        return;
    }

    //generate a new session token, and store in DB
    var token = genAndStoreSessionToken(user);
    res.json({"x-session-token" : token});
});

app.get('/logout', function(req, res){
    var token = req.get('x-session-token');
    destroySessionToken(token);
    res.json({success : true});
});

function secure(req, res, next){
    var token = req.get('x-session-token');
    console.log("token = " +  token);
    if(!token){
        res.status(401);
        res.json({status : "no token"});
        return;
    }
    var user = tokens[token];
    if(!user){
        res.status(401);
        res.json({status : "invalid token"});
        return;
    }

    console.log("authenticated yay as " + user);
    req.user = user; //set user in req so that api can use it identify current user
    next();
}

app.use('/secure', secure);

app.get('/secure/me', function(req, res){
    console.log("yay ! authenticated by middleware 'secure' as " + req.user);
    res.json(req.user);
});

app.listen(8999);
