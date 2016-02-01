var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');


var app = express();
app.use(session({secret : 'abcd1234'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));


app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);


app.get('/', function(req, res){
	console.log(req.session);
	console.log(req.session.id + "|||" + req.session.cookie.maxAge + ", " + req.session.cookie.expires);
	var sess = req.session;
	if(sess.email){
		res.redirect('/admin');
	}
	else{
		res.render('index.html');
	}
});

app.post('/login', function(req, res){
	console.log(req.session);
	var sess = req.session;
	sess.email = req.body.email;
	res.json({message : "logged in"});
});

app.get('/admin', function(req, res){
	console.log(req.session);
	var sess = req.session;
	if(sess.email){
		res.json({message : "Welcome to admin page"});
	}
	else{
		res.json({message: "Please login first"});
	}
});

app.get('/logout', (req, res) => {
	console.log(req.session);
	req.session.destroy(function(err){
		if(err){
			console.log(err);
		}
		else{
			res.redirect('/');
		}
	});
});

app.listen(8002);
