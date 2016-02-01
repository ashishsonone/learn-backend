var express = require('express');
var routers = require('./routers');

var app = express();
var port = 8002;

app.use('/api', routers.api_router);
app.use('/', routers.root_router);

app.listen(port);
console.log("Router running on port " + port);
