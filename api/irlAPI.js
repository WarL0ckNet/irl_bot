const cfg  =require('../config/'),
	irl_db = require('knex')(cfg.db.irl),
	moment = require('moment'),
	Users = require('./models/irl').Users,
	Cities = require('./models/irl').Cities,
	Places = require('./models/irl').Places,
	Meet = require('./models/irl').Meet,
	MeetUsers = require('./models/irl').MeetUsers,
	States = require('./models/irl').States,
	Settings = require('./models/irl').Settings,
	UserSets = require('./models/irl').UserSets,
	Queue = require('./models/irl').Queue;	
	
Users.knex(irl_db);
Cities.knex(irl_db);
Places.knex(irl_db);
Meet.knex(irl_db);
MeetUsers.knex(irl_db);
States.knex(irl_db);
Settings.knex(irl_db);
UserSets.knex(irl_db);
Queue.knex(irl_db);

const findCity = (code) => {
	return new Promise((resolve, reject) => {
		if (code.toString().match(/\D/g)){
			Cities
				.query()
				.where('name', code)
				.limit(1)
				.then(data => {
					if (data.length === 1){ 
						resolve(data[0]);
					}else{
						resolve(false);
					}	
				})
				.catch(err => {
					reject(err);
				});
		}else{
			Cities
				.query()
				.where('id', code)
				.limit(1)
				.then(data => {
					if (data.length === 1){ 
						resolve(data[0]);
					}else{
						resolve(false);
					}	
				})
				.catch(err => {
					reject(err);
				});
		}	
	});
};

const findPlace = (code, city = false) => {
	return new Promise((resolve, reject) => {
		if (code.match(/\D/g)){
			Places
				.query()
				.where('name', code)
				.andWhere('city_id', city)
				.limit(1)
				.then(data => {
					if (data.length === 1){ 
						resolve(data[0]);
					}else{
						reject('Место не найдено');
					}	
				})
				.catch(err => {
					reject(err);
				});
		}else{
			Places
				.query()
				.where('id', code)
				.limit(1)
				.then(data => {
					if (data.length === 1){ 
						resolve(data[0]);
					}else{
						reject('Место не найдено');
					}	
				})
				.catch(err => {
					reject(err);
				});
		}	
	});
};

const addCityToUser = (user_id, city_id) => {
	return new Promise((resolve, reject) => {
		UserCities
			.query()
			.where('user_id', user_id)
			.where('city_id', city_id)
			.limit(1)
			.then(data => {
				if (data.length === 0){
					const newUserCity = UserCities
						.query()
						.insert({
							user_id: user_id,
							city_id: city_id
						})
						.then(() => {
							resolve({
								user_id: user_id,
								city_id: city_id
							});
						})
						.catch(err => {
							reject(err);
						});
				}else{
					resolve(data[0]);
				}
			})
			.catch(err => {
				reject(err);
			});
	});	
};

const checkSetType = (sett_id, val) => {
	return new Promise((resolve, reject) => {
		Settings
			.query()
			.where('id', sett_id)
			.limit(1)
			.then(data => {
				if (data.length === 1){
					let t = data[0].type;
					if (t === 'b') {
						resolve(val === 'y' || val === 'n');
					}
					if (t === 'n') {
						resolve(val.search(/\D+/) < 0);
					}	
				}else{
					reject('Неизвестная настройка');
				}
			})
			.catch(err => {
				reject(err);
			});
	});	
};

const getSettings = (user) => {
	return new Promise((resolve, reject) => {
		UserSets
			.query()
			.where('user_id', user)
			.then(data => {
				Settings
					.query()
					.orderBy('id')
					.then(setts => {
						for (let i in setts){
							for (let u in data){
								if (data[u].sett_id === setts[i].id){
									setts[i].default_value = data[u].value;
								}
							}
						}
						resolve(setts);
					})
					.catch(err => {
						reject(err);
					});
			})
			.catch(err => {
				reject(err);
			});
	});
};		

const getSetValue = (user, sett_id) => {
	return new Promise((resolve, reject) => {
		getSettings(user).then(
			resSettings => {
				for (let i in resSettings){
					if (resSettings[i].id === sett_id){
						resolve(resSettings[i].default_value);
					}	
				}
			},
			errSettings => {
				reject(errSettings);
			}
		);
	});	
};

const queueExists = (key) => {
	return new Promise((resolve, reject) => {
		Queue
			.query()
			.where('uni_key', key)
			.limit(1)
			.then(data => {
				resolve(data.length === 1);
			})
			.catch(err => {
				reject(err);
			});
	});	
};

const addQueue = (user, msg, time, key) => {
	return new Promise((resolve, reject) => {
		Queue
			.query()
			.insert({
				user_id: user,
				message: msg,
				send_time: time,
				uni_key: key
			})
			.then(resolve(`${user}: ${msg} - ${time} > ${key}`))
			.catch(err => {
				reject(err);
			});
	});	
};

const getInfo = () => {
	return {
		url: 'https://irl.tsumo.ru',
		copyright: '\u00A9 WarL0ck, ' + moment().year(),
		date: moment().format()
	};	
};

module.exports = {
	info: () => {
		return getInfo();	
	},
	findUserById: (id) => {
		return new Promise((resolve, reject) => {
			Users
				.query()
				.where('telegram_id', id)
				.limit(1)
				.then(data => {
					resolve(data);
				})
				.catch(err => {
					reject(err);
				});
		});
	},
	setNick: (id, nick) => {
		return new Promise((resolve, reject) => {
			Users
				.query()
				.where('telegram_id', id)
				.patch({
    				nick: nick
				})
				.then(resolve(nick))
				.catch(err => {
					reject(err);
				});
		});
	},
	addUser: (id, nick) => {
		return new Promise((resolve, reject) => {
			Users
				.query()
				.insert({telegram_id: id, nick: nick})
				.then(resolve(nick))
				.catch(err => {
					reject(err);
				});
		});
	},
	addCity: (city) => {
		return new Promise((resolve, reject) => {
			findCity(city)
				.then(
					resFind => {
						if (resFind){
							reject(`город ${resFind.name} уже есть`);
						}else{
							Cities
								.query()
								.insert({name: city})
								.then(resolve(city))
								.catch(err => {
									reject(err);
								});
						}
					},
					errFind => {
						reject(errFind);
					}
				);
		});		
	},
	setTimeZone: (city, tz) => {
		return new Promise((resolve, reject) => {
			findCity(city)
				.then(
					resFind => {
						if (resFind){
							let t = parseInt(tz);
							Cities
								.query()
								.where('id', resFind.id)
								.patch({timezone: t})
								.then(resolve(`Часовой пояс UTC${(t>0 ? '+' + t : (t <0 ? t : ''))} установлен`))
								.catch(err => {
									reject(err);
								});
						}
					},
					errFind => {
						reject(errFind);
					}
				);
		});		
	},
	setCity: (id, city) => {
		return new Promise((resolve, reject) => {
			findCity(city)
				.then(
					resFind => {
						Users
							.query()
							.where('id', id)
							.patch({user_city: city})
							.then(resolve(resFind))
							.catch(err => {
								reject(err);
							});
					},
					errFind => {
						reject(errFind);
					}
				);
		});
	},
	cityList: () => {
		return new Promise((resolve, reject) => {
			Cities
				.query()
				.orderBy('name')
				.then(data => {
					resolve(data);
				})
				.catch(err => {
					reject(err);
				});
		});
	},
	cityByUser: (id) => {
		return new Promise((resolve, reject) => {
			UserCities
				.query()
				.where('user_id', id)
				.andWhere('is_default', true)
				.limit(1)
				.then((city) => {
					if (city.length === 1){
						resolve(city[0].city_id);
					}else{
						reject('Город пользователя не найден');
					}	
				})
				.catch(err => {
					reject(err);
				});
		});
	},
	сityPlaces: (city) => {
		return new Promise((resolve, reject) => {
			findCity(city)
				.then(
					resFind => {
						Places
							.query()
							.where('city_id', resFind.id)
							.orderBy('name')
							.then(data => {
								if (data.length > 0){
									for (let i in data){
										Meet
											.query()
											.count('id as cnt')
											.where('place_id', data[i].id)
											.then(meet => {
												data[i].meets = meet[0].cnt;
												if (i >= (data.length - 1)){
													resolve(data);
												}
											})
											.catch(err => {
												reject(err);
											});
									}
								}else{
									resolve(data);
								}	
							})
							.catch(err => {
								reject(err);
							});
					},
					errFind => {
						reject(errFind);
					}
				);			
		});
	},
	mapPlaces: () => {
		return new Promise((resolve, reject) => {
			Places
				.query()			
				.join('cities', 'cities.id', '=', 'places.city_id')
				.select('cities.name as city', 'places.name', 'places.address', 'places.longitude', 'places.latitude')
				.whereNotNull('latitude')
				.whereNotNull('longitude')
				.orderBy('cities.name')
				.then(data => {
					resolve({
						info: getInfo(),
						records : data
					});
				})
				.catch(err => {
					reject(err);
				});
		});
	},
	addPlace: (city, name) => {
		return new Promise((resolve, reject) => {
			findCity(city)
				.then(
					resFindCity => {
						findPlace(name, resFindCity.id)
							.then(
								resFindPlace => {
									reject('Такое место уже есть');
								},
								errFindPlace => {
									if (errFindPlace === "Место не найдено"){
										Places
											.query()
											.insert({name: name, city_id: resFindCity.id})
											.then(
												resolve(`В городе ${resFindCity.name} добавлено место ${name}`)
											)
											.catch(err => {
												reject(err);
											});
									}
								}
							);
					},
					errFindCity => {
						reject(errFindCity);
					}
				);			
		});
	},
	setAddress: (place, addr) => {
		return new Promise((resolve, reject) => {
			findPlace(place)
				.then(
					resFindPlace => {
						Places
							.query()
							.where('id', resFindPlace.id)
							.patch({address: addr})
							.then(
								resolve(`Для места ${resFindPlace.name} добавлен адрес ${addr}`)
							)
							.catch(err => {
								reject(err);
							});
					},
					errFindPlace => {
						reject(errFindPlace);
					}
				);
		});
	},
	setMapPlace: (place, location) => {
		return new Promise((resolve, reject) => {
			findPlace(place)
				.then(
					resFindPlace => {
						Places
							.query()
							.where('id', resFindPlace.id)
							.patch({
								latitude: location.latitude,
								longitude: location.longitude
							})
							.then(resolve(resFindPlace))
							.catch(err => {
								reject(err);
							});
					},		
					errFindPlace => {
						reject(errFindPlace);
					}
				);
		});
	},
	infoPlace: (place) => {
		return new Promise((resolve, reject) => {
			Places
				.query()
				.where('id', place)
				.limit(1)
				.then(data => {
					if (data.length === 1 ){
						resolve(data[0]);
					}else{
						reject('Место не найдено');
					}	
				})
				.catch(err => {
					reject(err);
				});
		});
	},
	infoCity: (city) => {
		return new Promise((resolve, reject) => {
			Cities
				.query()
				.where('id', city)
				.limit(1)
				.then(data => {
					if (data.length === 1 ){
						resolve(data[0]);
					}else{
						reject('Город не найден');
					}	
				})
				.catch(err => {
					reject(err);
				});
		});
	},
	infoMeet: (meet, telegram_id) => {
		return new Promise((resolve, reject) => {
			Meet
				.query()
				.join('places', 'meet.place_id', '=', 'places.id')
				.join('cities', 'places.city_id', '=', 'cities.id')
				.select('meet.*', 'cities.timezone as timezone')
				.where('meet.id', meet)
				.limit(1)
				.then(data => {
					if (data.length === 1 ){
						let res = data[0];
						MeetUsers
							.query()
							.join('users', 'meet_users.user_id', '=', 'users.id')
							.join('states', 'meet_users.state', '=', 'states.id')
							.select('users.nick as nick', 'states.descr as state')
							.where('users.telegram_id', telegram_id)
							.andWhere('meet_users.meet_id', data[0].id)
							.limit(1)
							.then(user => {
								if (user.length === 1){
									res.user = user[0];
								}
								resolve(res);
							})
							.catch(err => {
								reject(err);
							});
					}else{
						reject('Встреча не найдена');
					}	
				})
				.catch(err => {
					reject(err);
				});
		});
	},
	placeMeets: (place) => {
		return new Promise((resolve, reject) => {
			Meet
				.query()
				.join('places', 'meet.place_id', '=', 'places.id')
				.join('cities', 'places.city_id', '=', 'cities.id')
				.select('meet.*', 'cities.timezone as timezone')
				.where('meet.place_id', place)
				.orderBy('time_begin')
				.then(data => {
					resolve(data);
					}
				)
				.catch(err => {
					reject(err);
				});
		});
	},
	addMeet: (place, date, time, duration) => {
		return new Promise((resolve, reject) => {
			let time_begin = moment(`${date} ${time}`, 'YYYYMMDD HH:mm'),
				time_end = moment(time_begin).add(duration, 'h');
			Meet
				.query()
				.insert({
					place_id: place,
					time_begin,
					time_end
				})		
				.then(resolve('Встреча успешно добавлена'))
				.catch(err => {
					reject(err);
				});
		});
	},
	meetUsers: (meet) => {
		return new Promise((resolve, reject) => {
			MeetUsers
				.query()
				.join('users', 'meet_users.user_id', '=', 'users.id')
				.join('states', 'meet_users.state', '=', 'states.id')
				.select('meet_users.*', 'users.nick as nick', 'states.descr as state')
				.where('meet_users.meet_id', meet)
				.then(data => {
					resolve(data);
				})
				.catch(err => {
					reject(err);
				});
		});
	},
	recToMeet: (meet, telegram_id) => {
		return new Promise((resolve, reject) => {
			Users
				.query()
				.where('telegram_id', telegram_id)
				.limit(1)
				.then(user => {
					if (user.length === 1){
						MeetUsers
							.query()
							.where('meet_id', meet)
							.andWhere('user_id', user[0].id)
							.limit(1)
							.then(data => {
								if (data.length === 1){
									resolve(`*${user[0].nick}* уже записан на встречу`);	
								}else{
									MeetUsers
										.query()
										.insert({
											meet_id: meet,
											user_id: user[0].id,
											state: 0
										})
										.then(resolve(`*${user[0].nick}* записался на встречу`))
										.catch(err => {
											reject(err);
										});
								}
							})
							.catch(err => {
								reject(err);
							});
					}else{
						reject('Пользователь не зарегистрирован');
					}	
				})
				.catch(err => {
					reject(err);
				});
		});
	},
	changeState: (meet, telegram_id, newState) => {
		return new Promise((resolve, reject) => {
			Users
				.query()
				.where('telegram_id', telegram_id)
				.limit(1)
				.then(user => {
					if (user.length === 1){
						MeetUsers
							.query()
							.where('meet_id', meet)
							.andWhere('user_id', user[0].id)
							.limit(1)
							.then(data => {
								if (data.length === 1){
									MeetUsers
										.query()
										.patch({ state: newState })
										.where('id', data[0].id)
										.then(resolve(`*${user[0].nick}* изменил статус`))
										.catch(err => {
											reject(err);
										});
								}else{
									resolve(`*${user[0].nick}* не записан на встречу`);	
								}
							})
							.catch(err => {
								reject(err);
							});
					}else{
						reject('Пользователь не зарегистрирован');
					}	
				})
				.catch(err => {
					reject(err);
				});
		});
	},
	stateList: () => {
		return new Promise((resolve, reject) => {
			States
				.query()
				.orderBy('id')
				.then(data => {
					resolve(data);
				})
				.catch(err => {
					reject(err);
				});
		});
	},
	getUserSets: (user) => {
		return new Promise((resolve, reject) => {
			getSettings(user).then(
				resSettings => {
					resolve(resSettings);
				},
				errSettings => {
					reject(errSettings);
				}
			);
		});
	},
	setUserSets: (user, sett_id, val) => {
		return new Promise((resolve, reject) => {
			checkSetType(sett_id, val).then(
				resCheck => {
					if (resCheck){
						UserSets
							.query()
							.where('user_id', user)
							.andWhere('sett_id', sett_id)
							.limit(1)
							.then(data => {
								if (data.length === 1){					
									UserSets
										.query()
										.patch({value: val})
										.where('user_id', user)
										.andWhere('sett_id', sett_id)
										.then(resolve('Настройка обновлена успешно'))
										.catch(err => {
											reject(err);
										});
								}else{
									UserSets
										.query()
										.insert(
											{
												user_id: user,
												sett_id: sett_id,
												value: val
											}
										)
										.then(resolve('Настройка добавлена успешно'))
										.catch(err => {
											reject(err);
										});
								}		
							})
							.catch(err => {
								reject(err);
							});
					}else{
						reject('Значение настройки неверного типа');
					}		
				},
				errCheck => {
					reject(errCheck);
				}
			);	
		});
	},
	getQueueList: (time) => {
		return new Promise((resolve, reject) => {
			Queue
				.query()
				.join('users', 'queue.user_id', '=', 'users.id')
				.select('queue.*', 'users.telegram_id')
				.where('is_delivery', false)
				.andWhere('send_time', '<=', moment(time, 'YYYYMMDD HH:mm:ss'))
				.then(data => {
					resolve(data);
				})
				.catch(err => {
					reject(err);
				});
		});
	},
	setDeliveryResult: (que_id, result) => {
		return new Promise((resolve, reject) => {
			Queue
				.query()
				.patch({is_delivery: result})		
				.where('id', que_id)
				.then(resolve(`Записи ${que_id} установлен результат ${result}`))
				.catch(err => {
					reject(err);
				});
		});
	},
	createQueueList: (time) => {
		return new Promise((resolve, reject) => {
			UserSets
				.query()
				.join('settings', 'settings.id', '=', 'user_setts.sett_id')
				.where('settings.in_queue', true)
				.andWhere('settings.type', 'b')
				.andWhere('user_setts.value', 'y')
				.then(data => {
					for (let i in data){
						// оповещение о встрече, нужно проверить настройку 3 - время (key=user#sett#meet)
						if (data[i].sett_id === 1){
							MeetUsers
								.query()
								.join('meet', 'meet.id', '=', 'meet_users.meet_id')
								.join('places', 'places.id', '=', 'meet.place_id')
								.join('cities', 'cities.id', '=', 'places.city_id')
								.select('meet.*', 'places.name as name', 'places.address as address', 'cities.timezone as timezone')
								.where('user_id', data[i].user_id)
								.then(my_meets => {
									getSetValue(data[i].user_id, 3).then(
										resValue => {
											for (let m in my_meets){
												let msg, dts = moment(my_meets[m].time_begin).add(my_meets[m].timezone, 'h').subtract(resValue, 'm'),
													dts1 = moment(dts).subtract(1, 'm'),
													dts2 = moment(dts).add(1, 'm'),
													key = `${data[i].user_id}#${data[i].sett_id}#${my_meets[m].id}`;
													//console.log(`${my_meets[m].id} = ${moment(dts1).format()} < ${moment(time).format()} < ${moment(dts2).format()}`);
												if (dts1 < time && time < dts2){
													queueExists(key).then(
														resExists => {
															if (! resExists){
																msg = `Через *${resValue}* минут у вас встреча в *${my_meets[m].name}* по адресу ${my_meets[m].address}`;
																addQueue(data[i].user_id, msg, time, key).then(
																	resAddQueue => {
																		console.log(resAddQueue);
																	},
																	errAddQueue => {
																		console.err(errExists);
																	}
																);
															}													
														},
														errExists => {
															console.err(errExists);
														}
													);
												}
											}
										},
										errValue => {
											reject(errValue);
										}
									);	
								})
								.catch(err => {
									reject(err);
								});
						}
						// оповещение о изменениях во встречах (key=user#sett#meet#player#player_state)
						if (data[i].sett_id === 2){
							// встречи пользователя
							MeetUsers
								.query()
								.where('user_id', data[0].user_id)
								.then(my_meets => {
									for (let i in my_meets){
										// другие пользователи этих встреч
										MeetUsers
											.query()
											.join('meet', 'meet.id', '=', 'meet_users.meet_id')
											.join('users', 'users.id', '=', 'meet_users.user_id')
											.join('states', 'states.id', '=', 'meet_users.state')
											.select('meet.*', 'users.nick as nick', 'states.descr as descr', 'users.id as user_id', 'states.id as state')
											.where('meet.id', my_meets[i].meet_id)
											.where('meet_users.user_id', '<>', my_meets[i].user_id)
											.where('meet.time_begin', '>=', moment(time, 'YYYYMMDD HH:mm:ss'))
											.then(meets => {
												let msg, key;
												for (let m in meets){
													key = `${my_meets[i].user_id}#${data[i].sett_id}#${my_meets[i].id}#${meets[m].user_id}#${meets[m].state}`;
													queueExists(key).then(
														resExists => {
															if (! resExists){
																msg = `Пользователь *${meets[m].nick}* сменил статус на _${meets[m].descr}_`;
																addQueue(my_meets[i].user_id, msg, time, key).then(
																	resAddQueue => {
																		console.log(resAddQueue);
																	},
																	errAddQueue => {
																		console.err(errExists);
																	}
																);
															}
														},
														errExists => {
															console.err(errExists);
														}
													);
												}
												resolve(`Добавлены новые записи`);
											})
											.catch(err => {
												reject(err);
											});
									}		
								})
								.catch(err => {
									reject(err);
								});
						}
						// оповещение о новых встречах в городе (key=user#sett#meet)
						if (data[i].sett_id === 4){
							Meet
								.query()
								.join('places', 'meet.place_id', '=', 'places.id')
								.join('users', 'users.user_city', '=', 'places.city_id')
								.join('cities', 'places.city_id', '=', 'cities.id')
								.select('meet.*', 'places.*', 'cities.timezone as timezone')
								.where('users.id', data[0].user_id)
								.andWhere('time_begin', '>=', moment(time, 'YYYYMMDD HH:mm:ss'))
								.then(meets => {
									if (meets.length > 0){
										let msg, dtb, dte, key;
										for (let m in meets){
											key = `${data[0].user_id}#${data[i].sett_id}#${meets[m].id}`;
											queueExists(key).then(
												resExists => {
													if (! resExists){
														msg = 'Новая встреча:';
														dtb = moment(meets[m].time_begin).add(meets[m].timezone, 'h');
														dte = moment(meets[m].time_end).add(meets[m].timezone, 'h');
														if (dte.date() != dtb.date()){
															msg = `${msg} _${moment(dtb).format('DD.MM.YYYY HH:mm')}-${moment(dte).format('DD.MM.YYYY HH:mm')}_.`;
														}else{
															msg = `${msg} _${moment(dtb).format('DD.MM.YYYY с HH:mm')} до ${moment(dte).format('HH:mm')}_.`;
														}	
														msg = `${msg} Место: *${meets[m].name}*, ${meets[m].address}`;
														addQueue(data[0].user_id, msg, time, key).then(
															resAddQueue => {
																console.log(resAddQueue);
															},
															errAddQueue => {
																console.err(errExists);
															}
														);
													}
												},
												errExists => {
													console.err(errExists);
												}
											);
										}
										resolve(`Добавлены новые записи`);
									}
								})
								.catch(err => {
									reject(err);
								});
						}
					}
				})
				.catch(err => {
					reject(err);
				});
		});
	}
};