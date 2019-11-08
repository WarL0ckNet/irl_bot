const graphqlHTTP = require('express-graphql'),
	schema = require('./schema');

module.exports = (app) => {
	app.use('/api/', graphqlHTTP({
		schema,
		graphiql: true,
	}));
};