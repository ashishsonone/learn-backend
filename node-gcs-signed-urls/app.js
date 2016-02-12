/*
 * refer
 * https://www.npmjs.com/package/gcs-signed-urls
 *
 * set env variables using 
 *   $ source env.sh
 *
 * to convert json file to pem file: (pem file just contains the private key part)
 * 1) copy the value of private_key field
 * 2) echo -e "<the-copied-value-pasted-here>" > node-8b730f95b44d.pem
 *      -e parameters tell echo to interpret '\n' within the copied key string
 */
var express = require('express'),
	app  	= express(),
	
	//CloudStorage = require("gcs-signed-urls")("/home/ashish/Documents/node-8b730f95b44d.pem", "temporary@node-1189.iam.gserviceaccount.com", "vm-containers.node-1189.appspot.com");
    CloudStorage = require("gcs-signed-urls")();

app.engine('ejs', require('ejs').renderFile);

app.get("/", function(req,res,next) {
	
	var fields = CloudStorage.uploadRequest("example.txt", "key"+Date.now());
	
	res.render(__dirname + "/form.ejs", {fields: fields});
	
});

app.listen(process.env.PORT || 3001);
