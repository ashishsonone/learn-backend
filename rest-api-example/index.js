var express = require('express');
var app = express();
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/bearDB');
var bodyParser = require('body-parser');
var Bear = require('./app/models/bear');

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

var port = 8002;

//router
var router = express.Router();

router.use(function(req, res, next){
    console.log('Middleware invoked');
    next();
});

router.get('/', (req, res) => {
    res.json({message : 'hooray! welcome to our api'});
});

router.route('/bears')
    .post((req, res) => {
        var bear = new Bear();
        bear.name = req.body.name;

        bear.save(function(err){
            if(err){
                res.send(err);
            }
            res.json({message : "Bear created!"});
        });
    })

    .get((req, res) => {
        Bear.find(function(err, bears) {
            if(err){
                res.send(err);
            }
            res.json(bears);
        });
    });

router.route('/bears/:bear_id')
    .get((req, res) => {
        Bear.findById(req.params.bear_id, (err, bear) => {
            if(err){
                res.send(err);
            }
            res.json(bear);
        })
    })
    .put((req, res) => {
        Bear.findById(req.params.bear_id, (err, bear) => {
            if(err){
                res.send(err);
            }

            bear.name = req.body.name; //update the info
            bear.save(function(err) {
                if(err){
                    res.send(err);
                }
                res.json({message : "Bear updated !"});
            });
        });
    });
app.use('/api', router);

app.listen(port);

console.log("look at port " + port);
