var express = require('express');

app = express();

//for parsing post data
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

appRouter = express.Router();

appRouter.post('/login', (req, res) => {
    username = req.body.username; //post params
    password = req.body.password;

    console.log(username + ", " + password);
    if(username == 'root' && password == 'toor'){
        res.setHeader('Set-Cookie', "username=root");
        res.send("Authenticated\nNow you can go to the home page");
    }
    else{
        res.status(404).send("Invalid Credentials");
    }
});

appRouter.get('/logout', (req, res) => {
    res.setHeader('Set-Cookie', "username=");
    res.redirect('/login');
});

appRouter.get('/', (req, res) => {
    console.log(req.headers);
    res.status(200).send("Welcome to Home Page");
    /*
    if(req.session != undefined && req.session.username != undefined){
        res.status(200).send("Welcome to Home Page");
    }
    else{
        res.redirect('/login');
    }
    */
});

app.use('/', appRouter);
app.listen(8002);
console.log("Listening on port " + 8002);
