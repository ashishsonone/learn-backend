var http = require('http');

var server = http.createServer((req, res) => {
    res.write("\nSome Secrets:");
    res.write("\n" + process.env.SECRET_PASSPHRASE);
    res.write("\n" + process.env.SECRET_TWO);
    res.end("\nthis is home\n");
});

server.listen(10002);
