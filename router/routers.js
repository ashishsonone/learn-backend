var express = require('express');

//==== main router ======
var root_router = express.Router();
root_router.get('/', (req, res) => {
    res.status(200).send("Home Page");
});

about_fn = (req, res) => {
    res.send("route /about works !");
};
root_router.get('/about', about_fn);

root_router.get('/:end_point', (req, res) => {
    res.status(200).send("Random root end point '/" + req.params['end_point'])
});

//====== api router ======
var api_router = express.Router();

//this won't invoke the middleware as it comes before the middleware definition
api_router.get('/', (req, res) => {
    res.status(200).send("Api Home Page");
});

//api_router middle_ware for each of the /api requests
api_router.use((req, res, next) => {
    //process api authentication
    console.log("Api Authentication Middleware");

    //resume
    next();
});

api_router.param('id', function(req, res, next, id){
    console.log("Checking and Adjusting id parameter " + id);
    
    id = "_" + id;
    req.id = id;
    next();
});

api_router.get('/people/:id', (req, res) => {
    var id = req.id; //access the modified id from req object set in above middleware
    res.status(200).send({id : id, name : 'Person' + id});
});

//======== export the routers =========
module.exports = {
    root_router : root_router,
    api_router : api_router
};
