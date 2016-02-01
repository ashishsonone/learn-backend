var express = require('express'),
app = express();

app.get('/book/:title', function (req, res) {
    res.status(200).send(req.param('title') + " success found");
});

app.listen(8000, function () {
    console.log('Listening on port 8000');
});
