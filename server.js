// Set up.
var express = require('express');
var app 	= express();

app.use(express.static(__dirname + '/public'));

// Respond to all requests with this single file. Angular will handle all page changes on the front-end. 
app.get('*', function(req, res) {
	res.sendFile(__dirname + '/public/html/index.html');
});

// Listen (start app with node server.js).
app.listen(8080);
console.log("App listening on port 8080.");