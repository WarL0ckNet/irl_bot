var express = require('express'),
	http = require('http'),
	app = express(),
	cfg  =require('./config/');

//boot
require('./boot/')(app);

app.get('/', function(req, res) {
	res.render('index');
});

app.get('/manual', function(req, res) {
	res.render('manual');
});

app.use(function(req, res) {
	res.status(404).render('404');
});

http.createServer(app).listen(app.get('port'), function() {
	if ('development' == app.get('env')) {
		console.log('Express server listening on port ' + app.get('port'));
	}
});