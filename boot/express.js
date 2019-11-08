let express = require('express'),
	favicon = require('serve-favicon'),
	morgan = require('morgan'),
	moment = require('moment'),
	config = require('../config/');

module.exports = (app) => {

	// all environments
	app.set('port', config.env.port || 3000);
	app.set('views', __dirname + '/../views');
	app.set('view engine', 'pug');
	app.use(express.static('public'));
	app.use(favicon(__dirname + '/../public/img/favicon.ico'));
	morgan.token('now', function() {
		return moment().format('DD.MM.YY HH:mm:ss');
	});
	app.use(morgan(':now :req[x-forwarded-for] :method :url :status :res[content-length] - :response-time ms'));
};