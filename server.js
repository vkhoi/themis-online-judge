// Set up.
var express 	= require('express');
var app 		= express();
var bodyParser 	= require('body-parser');

// Set location for static files. Location public/img becomes /img for users.
app.use(express.static(__dirname + '/public'));

// Set location for libraries in node_modules. Installed libraries are now accessed via /lib.
app.use('/lib', express.static(__dirname + '/node_modules'))

app.use(bodyParser.urlencoded({'extended':'true'}));            // Parse application/x-www-form-urlencoded.
app.use(bodyParser.json());                                     // Parse application/json.
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // Parse application/vnd.api+json as json.

app.use('/api', require('./api/index'));

// Respond to all requests with this single file. Angular will handle all page changes on the front-end. 
app.get('*', function(req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

// Listen (start app with node server.js).
app.listen(8080);
console.log("App listening on port 8080.");