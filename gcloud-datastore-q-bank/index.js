var express = require('express');
var gcloud = require('gcloud');
var config = require('./config');
var test_json = require('./test_json');
var driver = require('./driver')(config);
var bodyParser = require('body-parser');

var dataset = gcloud.datastore.dataset(config.gcloud);
var PORT = 8002;

var app = express();
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

var router = express.Router();
router.post('/blogs/new', (req, res) => {
    var key = dataset.key(['Blog']);
    if(typeof(req.body.title) === undefined || req.body.title === null){
        req.body.title = "Default title";
    }

    var tags;
    var re = /[, ]+/;
    if(typeof(req.body.tags) === undefined || req.body.tags === null){
        tags = ["universal"];
    }
    else{
        console.log(req.body.tags);
        tags = req.body.tags.split(re);
        console.log(tags);
    }

    dataset.save({
        key: key,
        data: {
            title: req.body.title,
            tags : tags
        }
    },
    function(err){
        if(!err){
            res.json({message : 'Successful created object with key=' + key.id});
        }
        else{
            console.log(key.path);
            console.log(err);
            res.json({error : 'Error'});
        }
    });
});

router.get('/blogs/:id', (req, res) => {
    //var key = dataset.key(['Book', 5639445604728832]);
    var key = dataset.key(['Blog', Number(req.params.id)]);

    dataset.get(key, function(err, entity){
        if(!err){
            console.log("here %j", entity);
            res.json(driver.fromDataStore(entity));
        }
        else{
            res.json({'error' : err});
        }
    });
});

router.get('/blogs/tags/:tag', (req, res) => {
    var query = dataset.createQuery('Blog');
    query.autoPaginate(false);
    query.filter('tags=', req.params.tag);
    dataset.runQuery(query, function(err, results){
        if(!err){
            res.json(results);
        }
        else{
            res.json({'error' : err});
        }
    });
});

router.post('/', (req, res) => {
    console.log('p /');
    res.json({'message' : "POST Welcome to our api page"});
});

router.get('/', (req, res) => {
    console.log('g /');
    res.json({'message' : "Welcome to our api page"});
});
router.post('/', (req, res) => {
    console.log('p /');
    res.json({'message' : "POST Welcome to our api page"});
});

app.use('/api', router);
app.listen(PORT);
console.log("listening on port " + PORT);
