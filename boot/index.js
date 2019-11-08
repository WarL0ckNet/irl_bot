module.exports = (app) => {
	require("./express")(app);
	require("./graphql")(app);
	require("./telegram")(app);
};