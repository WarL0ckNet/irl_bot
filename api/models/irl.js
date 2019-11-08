const {
	Model
} = require('objection');

class Users extends Model {
	static get tableName() {
		return 'users';
	}
}

class Cities extends Model {
	static get tableName() {
		return 'cities';
	}
}

class Places extends Model {
	static get tableName() {
		return 'places';
	}
}

class Meet extends Model {
	static get tableName() {
		return 'meet';
	}
}

class MeetUsers extends Model {
	static get tableName() {
		return 'meet_users';
	}
}

class States extends Model {
	static get tableName() {
		return 'states';
	}
}

class Settings extends Model {
	static get tableName() {
		return 'settings';
	}
}

class UserSets extends Model {
	static get tableName() {
		return 'user_setts';
	}
}

class Queue extends Model {
	static get tableName() {
		return 'queue';
	}
}


module.exports = {
	Users,
	Cities,
	Places,
	Meet,
	MeetUsers,
	States,
	Settings,
	UserSets,
	Queue	
};