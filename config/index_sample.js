module.exports = {
	env: {
		port: 8000
	},
	db: {
		irl: {
			client: 'pg',
			searchPath: 'public',
			connection: {
				host: '127.0.0.1',
				user: 'user',
				password: 'password',
				database: 'db'
			}
		}
	},
	token: 'you_telegram_token',
	subscribe: {
		check: 1,
		send: 1
	}
};