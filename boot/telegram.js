const TeleBot = require('telebot'),
	cfg  =require('../config/'),
	token = cfg.token,
	bot = new TeleBot({
					token,
					usePlugins: ['askUser']
					}),
	num = require('numeral'),
	https = require('https'),
	irl = require('../api/irlAPI'),
	moment = require('moment');
	
moment.locale('ru');

const newUserMsg = (tbot, msg) => {
	let replyMarkup = [[bot.inlineButton('Справка', { callback: 'help' }), bot.inlineButton('Сменить ник', { callback: 'nick' })]];
	return tbot.sendMessage(msg.from.id, `*Привет!*\n`+
		`Ты у нас впервые? Если хочешь остаться выбери себе *ник*.\n`+
		`Что-то не понятно? Почитай *справку* !`,
		{
			parseMode: 'Markdown',
			replyMarkup: tbot.inlineKeyboard(replyMarkup)
		});
};

const showHelp = (tbot, msg) => {
	let replyMarkup = [
		[bot.inlineButton('Справка', { callback: 'help' }),
		bot.inlineButton('Сменить ник', { callback: 'nick' }),
		bot.inlineButton('Города', { callback: 'cities' })]
	];	
	return tbot.sendMessage(msg.from.id, "*Как это работает?*\n"+
		"/help - показать эту справку\n" +
		"Все остальные действия доступны по кнопкам внизу." +
		" Для полного доступа к возможностям бота достаточно установить ник",
		{
			parseMode: 'Markdown',
			replyMarkup: tbot.inlineKeyboard(replyMarkup)
		}
	);
};

const getCalendar = (month = null, year = null) => {
	let now = moment(),
		m = (month ? month - 1 : moment().month()),
		y = (year ? year : moment().year()),
		date_start = moment().year(y).month(m).date(1),
		wd_start = date_start.weekday(),
		date_stop = moment(date_start).add(1, 'M').subtract(1, 'd'),
		wd_stop = date_stop.weekday(),
		res = [], btnday;
	res.push([
				bot.inlineButton('<', { callback: `cal${moment().year(y).month(m).date(1).subtract(1, 'M').format('YYYYMM')}`}),
				bot.inlineButton(date_start.format('MMMM YYYY'), { callback: 'null'}),
				bot.inlineButton('>', {	callback: `cal${moment().year(y).month(m).date(1).add(1, 'M').format('YYYYMM')}`})
			]);
	let nwd = [], str;
	for (let i = 0; i < 7; i++ ){
		nwd.push(bot.inlineButton(moment().weekday(i).format('ddd'), { callback: 'null' }));
	}		
	res.push(nwd);
	str = [];
	for (let i = 0; i < wd_start; i++){
		str.push(bot.inlineButton(' ', { callback: 'null'}));
	}
	for (let d = 1; d <=  date_start.daysInMonth(); d++){
		if (moment().year(y).month(m).date(d).weekday() === 0){
			str = [];
		}
		if (moment().year(y).month(m).date(d).format() === moment(now).format()){
			btnday = '\u2B50' + d;
		}else{
			btnday = '' + d;
		}	
		str.push(bot.inlineButton(btnday, { callback: `set${moment().month(m).year(y).date(d).format('YYYYMMDD')}`}));
		if (moment().year(y).month(m).date(d).weekday() === 6){
			res.push(str);
		}
	}
	for (let i = wd_stop; i < 6; i++){
		str.push(bot.inlineButton(' ', { callback: 'null'}));
	}
	res.push(str);
	return bot.inlineKeyboard(res);
};

const checkPeriod = cfg.subcribe.check, sendPeriod = cfg.subcribe.send;
let userList = {}, lastCheckTime, lastSendTime, lockCheck = false, lockSend = false;

const getUserProp = (user_id, prop) => {
	return (userList[user_id] ? userList[user_id][prop] : '');
};

const setUserProp = (user_id, prop, value) => {
	if (! userList[user_id]){
		userList[user_id]  = {};
	}
	userList[user_id][prop] = value;
};

const clearUserProp = (user_id) => {
	delete userList[user_id];
};	

module.exports = (app) => {

	bot.on(/\/start/, (msg) => {
		irl.findUserById(msg.from.id).then(
			result => {
				if (result.length === 1){
					let replyMarkup = [
						[
							bot.inlineButton('Справка', { callback: 'help' }),
							bot.inlineButton('Сменить ник', { callback: 'nick' })
						],
						[
							bot.inlineButton('Города', { callback: 'cities' })
						]
					];
					if (result[0].user_city){
						replyMarkup[1].push(bot.inlineButton('Места', { callback: `places${result[0].user_city}` }));
					}
					replyMarkup[1].push(bot.inlineButton('\u2699', { callback: `settings${result[0].id}` }));
					return bot.sendMessage(msg.from.id, `С возвращением, ${result[0].nick}!`, { replyMarkup: bot.inlineKeyboard(replyMarkup) });
				}else{
					return newUserMsg(bot, msg);
				}
			},
			error => {
				return bot.sendMessage(msg.from.id, `Ошибка: ${error}`);
			}
		);
	});
	
	bot.on(/\/help/, (msg) => {
		showHelp(bot, msg);
	});
	
	bot.on('ask.nick', (msg) => {
	    const nick = msg.text;
		irl.findUserById(msg.from.id).then(
				result => {
					if (result.length === 1){	
						irl.setNick(msg.from.id, nick).then(
							resNick => {
								return bot.sendMessage(msg.from.id, `Пользователю установлен ник: *${resNick}*`,
								{
									parseMode: 'Markdown'
								});
							},
							errNick => {
								return bot.sendMessage(msg.from.id, `Ошибка: ${errNick}`);
							}
						);
					}else{
						irl.addUser(msg.from.id, nick).then(
							resAddUser => {
								return bot.sendMessage(msg.from.id, `Пользователь с ником *${resAddUser}* успешно зарегистрирован`,
								{
									parseMode: 'Markdown'
								});
							},
							errAddUser => {
								return bot.sendMessage(msg.from.id, `Ошибка: ${errAddUser}`);
							}
						);
					}
				},
				error => {
					return bot.sendMessage(msg.from.id, `Ошибка: ${error}`);
				}
			);	
	});		

	bot.on('ask.city', (msg) => {
	    const city = msg.text;
		irl.findUserById(msg.from.id).then(
			result => {
				if (result.length === 1){
					irl.addCity(city).then(
						resAddCity => {
							setUserProp(msg.from.id, 'addCity', city);
							return bot.sendMessage(msg.from.id, `Добавлен город: *${resAddCity}*. Укажите часовой пояс относительно UTC`,
							{
								parseMode: 'Markdown',
								ask: 'timezone'
							});
						},
						errAddCity => {
							return bot.sendMessage(msg.from.id, `Ошибка: ${errAddCity}`);
						}
					);
				}else{
					return newUserMsg(bot, msg);
				}
			},
			error => {
				return bot.sendMessage(msg.from.id, `Ошибка: ${error}`);
			}
		);
	});

	bot.on('ask.timezone', (msg) => {
		let tz = msg.text.match(/(\-*\d+)/), city = getUserProp(msg.from.id, 'addCity');
		irl.setTimeZone(city, tz).then(
			result => {
				return bot.sendMessage(msg.from.id, result);
			},
			error => {
				return bot.sendMessage(msg.from.id, `Ошибка: ${error}`);
			}
		);
	});
	
	bot.on('ask.place', (msg) => {
		let name = msg.text, city = getUserProp(msg.from.id, 'addPlace');
		irl.addPlace(city, name)
			.then(
				resAddPlace => {
					return bot.sendMessage(msg.from.id, resAddPlace);
				},
				errAddPlace => {
					return bot.sendMessage(msg.from.id, `Ошибка: ${errAddPlace}`);
				}
			);
	});

	bot.on('ask.address', (msg) => {
		let adr =  msg.text, place = getUserProp(msg.from.id, 'addrPlace');
		irl.setAddress(place, adr)
			.then(
				resSetAdr => {
					return bot.sendMessage(msg.from.id, resSetAdr);
				},
				errSetAdr => {
					return bot.sendMessage(msg.from.id, `Ошибка: ${errSetAdr}`);
				}
			);
	});
	bot.on('ask.time', (msg) => {
		let time = msg.text.match(/(\d{1,2})[:\-](\d{1,2})/);
		setUserProp(msg.from.id, 'meetTime', (parseInt(time[1]) < 10 ? `0${parseInt(time[1])}` : time[1]) + ':' + (parseInt(time[2]) < 10 ? `0${parseInt(time[2])}` : time[2]));
		return bot.sendMessage(msg.from.id, `Начало в *${userList[msg.from.id].meetTime}*. Сколько часов продлится встреча?`,
			{
				parseMode: 'Markdown',
				ask: 'duration'
			});
	});

	bot.on('ask.duration', (msg) => {
		let dur = msg.text.match(/(\d+)/);
		setUserProp(msg.from.id, 'meetDuration', parseInt(dur[1]));
		let place = getUserProp(msg.from.id, 'addMeet'),
			dt = getUserProp(msg.from.id, 'meetDate'),
			time = getUserProp(msg.from.id, 'meetTime'),
			duration = getUserProp(msg.from.id, 'meetDuration');
		if (! place){
			return bot.sendMessage(msg.from.id, 'Не указано место встречи');
		}else if (! dt){
			return bot.sendMessage(msg.from.id, 'Не указана дата встречи');
		}else if (! time){
			return bot.sendMessage(msg.from.id, 'Не указано время встречи');
		}else if (! duration){
			return bot.sendMessage(msg.from.id, 'Не указана длительность встречи');
		}else{
			irl.addMeet(place, dt, time, duration).then(
				result => {
					clearUserProp(msg.from.id);
					return bot.sendMessage(msg.from.id, result);
				},
				error => {
					return bot.sendMessage(msg.from.id, `Ошибка: ${error}`);
				}
			);
		}	
	});	

	bot.on('ask.new_val', (msg) => {
		let value = msg.text.match(/(.+)/),
			user = getUserProp(msg.from.id, 'newValueUser'),
			sett = getUserProp(msg.from.id, 'newValueSetId');
		irl.setUserSets(user, sett, value[1]).then(
			resSetUserSets => {
				return bot.sendMessage(msg.from.id, resSetUserSets);
			},	
			errSetUserSets => {
				return bot.sendMessage(msg.from.id, `Ошибка: ${errSetUserSets}`);
			}
		);	
	});	
	
	bot.on('location', (msg) => {
		let place = getUserProp(msg.from.id, 'mapPlace');
		irl.findUserById(msg.from.id).then(
			result => {
				if (result.length === 1){
					irl.setMapPlace(place[0], msg.location)
						.then(
							resMapPlace => {
								return bot.sendVenue(msg.from.id,
									[msg.location.latitude, msg.location.longitude],
									resMapPlace.name,
									resMapPlace.address
								);	
							},
							errMapPlace => {
								return bot.sendMessage(msg.from.id, `Ошибка: ${errMapPlace}`);
							}
						);
				}else{
					return newUserMsg(bot, msg);
				}
			},
			error => {
				return bot.sendMessage(msg.from.id, `Ошибка: ${error}`);
			}
		);		
	});

	bot.on('callbackQuery', (msg) => {
		let cmd = msg.data;
		if (cmd === 'help'){
			showHelp(bot, msg);
		}else if (cmd === 'nick'){
			return bot.sendMessage(msg.from.id, 'Введите свой ник', {ask: 'nick'});
		}else if (cmd === 'addCity'){
			return bot.sendMessage(msg.from.id, 'Введите название города', {ask: 'city'});
		}else if (cmd === 'cities'){
			irl.findUserById(msg.from.id).then(
				result => {
					if (result.length === 1){
						irl.cityList().then(
							resCityList => {
								let res = [], btntext;
								for (let i in resCityList){
									btntext = `${resCityList[i].name} (UTC`;
									if (resCityList[i].timezone > 0){
										btntext += `+${resCityList[i].timezone}`;
									}else if (resCityList[i].timezone < 0){
										btntext += resCityList[i].timezone;
									}
									btntext += ')';
									if (result[0].user_city && result[0].user_city === resCityList[i].id){
										btntext = `\u2B50 Встречи в городе ${btntext}`;
									}else{
										btntext = `Встречи в городе ${btntext}`;
									}	
									res.push([bot.inlineButton(btntext, { callback: `places${resCityList[i].id}`})]);
								}
								res.push([bot.inlineButton('Добавить город', { callback: 'addCity'})]);
								return bot.sendMessage(msg.from.id, 'Список доступных городов', {
									replyMarkup: bot.inlineKeyboard(res)
								});
							},
							errCityList => {
								return bot.sendMessage(msg.from.id, `Ошибка: ${errCityList}`);
							}
						);
					}else{
						return newUserMsg(bot, msg);
					}
				},
				error => {
					return bot.sendMessage(msg.from.id, `Ошибка: ${error}`);
				}
			);
		}else if (cmd.search(/^city\d+$/) === 0){
			let city = cmd.match(/city(\d+)/);
			irl.findUserById(msg.from.id).then(
				result => {
					if (result.length === 1){
						irl.setCity(result[0].id, city[1]).then(
							resSetCity => {
								return bot.sendMessage(msg.from.id, `Для пользователя *${result[0].nick}* установлен город *${resSetCity.name}*`,
									{
										parseMode: 'Markdown'
									});
							},
							errSetCity => {
								return bot.sendMessage(msg.from.id, `Ошибка: ${errSetCity}`);
							}
						);
					}else{
						return newUserMsg(bot, msg);
					}
				},
				error => {
					return bot.sendMessage(msg.from.id, `Ошибка: ${error}`);
				}
			);
		}else if (cmd.search(/^places\d+$/) === 0){
			let city = cmd.match(/places(\d+)/);
			irl.infoCity(city[1]).then(
				resInfoCity => {
					irl.сityPlaces(city[1])
						.then(
							resPlaceList => {
								let res = [], txt, str;
								if (resPlaceList.length > 0){
									for (let i in resPlaceList){
										str = [
												bot.inlineButton(`${resPlaceList[i].name}`, { callback: `place${resPlaceList[i].id}`}),
												bot.inlineButton(`Встречи (${resPlaceList[i].meets})`, { callback: `meets${resPlaceList[i].id}`})
											];
										res.push(str);	
									}
									txt = `Список мест встреч в городе ${resInfoCity.name}`;
								}else{
									txt = `Пока мест встречи в городе ${resInfoCity.name} нет`;
								}
								res.push([
											bot.inlineButton('Добавить место', { callback: `addPlace${city[1]}`}),
											bot.inlineButton('Мой город', { callback: `city${city[1]}`})
										]);
								return bot.sendMessage(msg.from.id, txt, {
									replyMarkup: bot.inlineKeyboard(res)
								});
							},
							errPlaceList => {
								return bot.sendMessage(msg.from.id, `Ошибка: ${errPlaceList}`);
							}
						);
				},
				errInfoCity => {
					return bot.sendMessage(msg.from.id, `Ошибка: ${errInfoCity}`);
				}
			);
		}else if (cmd.search(/^addPlace\d+$/) === 0){
			let city = cmd.match(/addPlace(\d+)/);
			irl.infoCity(city[1]).then(
				resInfoCity => {
					setUserProp(msg.from.id, 'addPlace', city[1]);
					return bot.sendMessage(msg.from.id, `Введите название места в городе "${resInfoCity.name}"`, {ask: 'place'});
				},
				errInfoCity => {
					return bot.sendMessage(msg.from.id, `Ошибка: ${errInfoCity}`);
				}
			);
		}else if (cmd.search(/^addrPlace\d+$/) === 0){
			let place = cmd.match(/addrPlace(\d+)/);
			irl.infoPlace(place[1]).then(
				resInfoPlace => {
					setUserProp(msg.from.id, 'addrPlace', place[1]);
					return bot.sendMessage(msg.from.id, `Введите адрес места "${resInfoPlace.name}"`, {ask: 'address'});
				},
				errInfoPlace => {
					return bot.sendMessage(msg.from.id, `Ошибка: ${errInfoPlace}`);
				}
			);
		}else if (cmd.search(/^mapPlace\d+$/) === 0){
			let place = cmd.match(/mapPlace(\d+)/);
			irl.infoPlace(place[1]).then(
				resInfoPlace => {
					setUserProp(msg.from.id, 'mapPlace', place[1]);
					return bot.sendMessage(msg.from.id, `Отправьте геопозицию места "${resInfoPlace.name}"`);
				},
				errInfoPlace => {
					return bot.sendMessage(msg.from.id, `Ошибка: ${errInfoPlace}`);
				}
			);
		}else if (cmd.search(/^place\d+$/) === 0){
			let place = cmd.match(/place(\d+)/);
			irl.infoPlace(place[1]).then(
				resInfoPlace => {
					if (resInfoPlace.latitude && resInfoPlace.longitude){
						return bot.sendVenue(msg.from.id,
							[resInfoPlace.latitude, resInfoPlace.longitude],
							resInfoPlace.name,
							(resInfoPlace.address ? resInfoPlace.address : '-')
						);	
					}else if (resInfoPlace.address){
						let replyMarkup = [[bot.inlineButton('Указать место на карте', { callback: `mapPlace${place[1]}` })]];
						return bot.sendMessage(msg.from.id, `"${resInfoPlace.name}" ${resInfoPlace.address}`, { replyMarkup: bot.inlineKeyboard(replyMarkup) });
					}else{
						let replyMarkup = [[bot.inlineButton('Указать адрес места', { callback: `addrPlace${place[1]}` })]];
						return bot.sendMessage(msg.from.id, `"${resInfoPlace.name}"`, { replyMarkup: bot.inlineKeyboard(replyMarkup) });
					}	
				},
				errInfoPlace => {
					return bot.sendMessage(msg.from.id, `Ошибка: ${errInfoPlace}`);
				}
			);
		}else if (cmd.search(/^meets\d+$/) === 0){
			let place = cmd.match(/meets(\d+)/);
			irl.infoPlace(place[1]).then(
				resInfoPlace => {
					irl.placeMeets(place[1]).then(
						resMeets => {
							let res = [], txt, dtb, dte;
							if (resMeets.length > 0){
								for (let i in resMeets){
									dtb = moment(resMeets[i].time_begin).add(resMeets[i].timezone, 'h');
									dte = moment(resMeets[i].time_end).add(resMeets[i].timezone, 'h');
									if (dte.date() != dtb.date()){
										res.push([bot.inlineButton(`${parseInt(i) + 1}. ${moment(dtb).format('DD.MM.YYYY HH:mm')}-${moment(dte).format('DD.MM.YYYY HH:mm')}`, { callback: `meet${resMeets[i].id}`})]);
									}else{
										res.push([bot.inlineButton(`${parseInt(i) + 1}. ${moment(dtb).format('DD.MM.YYYY с HH:mm')} до ${moment(dte).format('HH:mm')}`, { callback: `meet${resMeets[i].id}`})]);
									}	
								}	
								txt = `Список встреч "${resInfoPlace.name}" (для записи выберите встречу)`;
							}else{
								txt = `Встреч "${resInfoPlace.name}" не запланировано`;
							}
							res.push([bot.inlineButton('Добавить встречу', { callback: `addMeet${place[1]}`})]);
							return bot.sendMessage(msg.from.id, txt, {
								replyMarkup: bot.inlineKeyboard(res)
							});
						},
						errMeets => {
							return bot.sendMessage(msg.from.id, `Ошибка: ${errMeets}`);
						}
					);
				},
				errInfoPlace => {
					return bot.sendMessage(msg.from.id, `Ошибка: ${errInfoPlace}`);
				}
			);	
		}else if (cmd.search(/^meet\d+$/) === 0){
			let meet = cmd.match(/meet(\d+)/);
			irl.infoMeet(meet[1], msg.from.id).then(
				resInfoMeet => {
					irl.infoPlace(resInfoMeet.place_id).then(
						resInfoPlace => {
							let dtb, dte;
							dtb = moment(resInfoMeet.time_begin).add(resInfoMeet.timezone, 'h');
							dte = moment(resInfoMeet.time_end).add(resInfoMeet.timezone, 'h');
							let info = `*Место встречи "${resInfoPlace.name}"*\n` +
								`\tНачало: _${moment(dtb).format('DD.MM.YYYY в HH:mm')}_\n` +
								`\tОкончание: _${moment(dte).format('DD.MM.YYYY в HH:mm')}_\n`;
							irl.meetUsers(resInfoMeet.id).then(
								resMeetUsers => {
									if (resMeetUsers.length > 0){
										info += `*На встречу записались ${resMeetUsers.length} человек:*\n`
										for (let i in resMeetUsers){
											info += `\t - ${resMeetUsers[i].nick} - _${resMeetUsers[i].state}_`;
										}
									}else{
										info += '*На встречу пока никто не записался*';
									}
									let res = [bot.inlineButton('Информация о месте', { callback: `place${resInfoMeet.place_id}`})];
									if (! resInfoMeet.user){
										 res.push(bot.inlineButton('Записаться', { callback: `recTo${resInfoMeet.id}`}));
									}else{
										 res.push(bot.inlineButton('Изменить статус', { callback: `changeState${resInfoMeet.id}`}));
									}	
									return bot.sendMessage(msg.from.id, info,
										{
											parseMode: 'Markdown',
											replyMarkup: bot.inlineKeyboard([res])
										});
								},
								errMeetUsers => {
									return bot.sendMessage(msg.from.id, `Ошибка: ${errMeetUsers}`);
								}
							);
						},
						errInfoPlace => {
							return bot.sendMessage(msg.from.id, `Ошибка: ${errInfoPlace}`);
						}
					);	
				},
				errInfoMeet => {
					return bot.sendMessage(msg.from.id, `Ошибка: ${errInfoMeet}`);
				}
			);
		}else if (cmd.search(/^recTo\d+$/) === 0){
			let meet = cmd.match(/recTo(\d+)/);
			irl.recToMeet(meet[1], msg.from.id).then(
				resRecMeet => {
					return bot.sendMessage(msg.from.id, resRecMeet, { parseMode: 'Markdown' });
				},
				errRecMeet => {
					return bot.sendMessage(msg.from.id, `Ошибка: ${errRecMeet}`);
				}
			);
		}else if (cmd.search(/^changeState\d+$/) === 0){
			let meet = cmd.match(/changeState(\d+)/);
			irl.stateList().then(
				resStates => {
					let res = [];
					for (let i in resStates){
						res.push([bot.inlineButton(resStates[i].descr, { callback: `upd${meet[1]}to${resStates[i].id}`})]);
					}
					return bot.sendMessage(msg.from.id, 'Выберите новый статус', { replyMarkup: bot.inlineKeyboard(res) });
				},
				errStates => {
					return bot.sendMessage(msg.from.id, `Ошибка: ${errStates}`);
				}
			);
		}else if (cmd.search(/^upd\d+to\d+$/) === 0){
			let upd = cmd.match(/upd(\d+)to(\d+)/);
			irl.changeState(upd[1], msg.from.id, upd[2]).then(
				resChangeState => {
					return bot.sendMessage(msg.from.id, resChangeState, { parseMode: 'Markdown' });
				},
				errChangeState => {
					return bot.sendMessage(msg.from.id, `Ошибка: ${errChangeState}`);
				}
			);
		}else if (cmd.search(/^addMeet\d+$/) === 0){
			let place = cmd.match(/addMeet(\d+)/);
			setUserProp(msg.from.id, 'addMeet', place[1]);
			return bot.sendMessage(msg.from.id, 'Выберите дату встречи',
				{
					replyMarkup: getCalendar()
				});
		}else if (cmd.search(/^cal\d{6}$/) === 0){
			let cal = cmd.match(/cal(\d{4})(\d{2})/);
			return bot.sendMessage(msg.from.id, 'Выберите дату', {
				replyMarkup: getCalendar(cal[2], cal[1])
			});
		}else if (cmd.search(/^set\d{8}$/) === 0){
			let cal = cmd.match(/set(\d{4})(\d{2})(\d{2})/),
				dt = moment().year(cal[1]).month(cal[2] - 1).date(cal[3]);
			setUserProp(msg.from.id, 'meetDate', dt.format('YYYYMMDD'));
			return bot.sendMessage(msg.from.id, `Выбрано: *${dt.format('DD.MM.YYYY, dddd')}*.\nВыберите время начала (в виде ЧЧ:ММ)`,
				{
					parseMode: 'Markdown',
					ask: 'time'
				});
		}else if (cmd.search(/^settings\d+$/) === 0) {
			let user = cmd.match(/settings(\d+)/);
			irl.getUserSets(user[1]).then(
				resGetUserSets => {
					let res = [];
					for (let i in resGetUserSets){
						let btntext = resGetUserSets[i].name;
						if (resGetUserSets[i].type === 'b'){
							btntext = `${btntext} ${(resGetUserSets[i].default_value === 'n' ? '\u2610' : '\u2611')}`;
							res.push([bot.inlineButton(btntext,
							{ callback: `user${user[1]}Set${resGetUserSets[i].id}to${(resGetUserSets[i].default_value === 'n' ? 'y' : 'n')}`})]);
						}else{
							btntext = `${btntext}: ${resGetUserSets[i].default_value}`;
							res.push([bot.inlineButton(btntext, { callback: `user${user[1]}Set${resGetUserSets[i].id}`})]);
						}	
					}
					return bot.sendMessage(msg.from.id, 'Настройки пользователя', { replyMarkup: bot.inlineKeyboard(res) });
				},
				errGetUserSets => {
					return bot.sendMessage(msg.from.id, `Ошибка: ${errGetUserSets}`);
				}
			);
		}else if (cmd.search(/^user\d+Set.*/) === 0) {
			let sets = cmd.match(/user(\d+)Set(.*)$/);
			if (sets[2].search(/^\d+to.*/) === 0){
				let vals = sets[2].match(/(\d+)to(.+)/);
				irl.setUserSets(sets[1], vals[1], vals[2]).then(
					resSetUserSets => {
						return bot.sendMessage(msg.from.id, resSetUserSets);
					},	
					errSetUserSets => {
						return bot.sendMessage(msg.from.id, `Ошибка: ${errSetUserSets}`);
					}
				);	
			}else if (sets[2].search(/^\d+/) === 0) {
				setUserProp(msg.from.id, 'newValueUser', sets[1]);	
				setUserProp(msg.from.id, 'newValueSetId', sets[2]);	
				return bot.sendMessage(msg.from.id, 'Введите новое значение настройки', {ask: 'new_val'});
			}
		}
	});

	bot.on('tick', (msg) => {
		let now = moment(), tm_start;
		if (! lastCheckTime){
			lastCheckTime = now;
		}
		if (! lastSendTime){
			lastSendTime = now;
		}
		if (! lockCheck){
			tm_start = moment(lastCheckTime).add(checkPeriod, 'm');
			if (tm_start < now){
				lockCheck = true;
				//console.log(`Создание очереди на ${moment(now, 'YYYYMMDD HH:mm:ss')}`);
				irl.createQueueList(now).then(
					resCreateList => {
						//console.log(resCreateList);
					},
					errCreateList => {
						console.log(`Error: ${errCreateList}`);
					}
				);
				lastCheckTime = now;
				lockCheck = false;
			}
		}
		if (! lockSend){
			tm_start = moment(lastSendTime).add(sendPeriod, 'm'); 
			if (tm_start < now){
				lockSend = true;
				//console.log(`Отправка очереди на ${moment(now, 'YYYYMMDD HH:mm:ss')}`);
				irl.getQueueList(now).then(
					resQueueList => {
						let res_send;
						for (let q in resQueueList){
							res_send = bot.sendMessage(resQueueList[q].telegram_id, resQueueList[q].message, { parseMode: 'Markdown'});
							irl.setDeliveryResult(resQueueList[q].id, (! res_send.error)).then(
								resSetResult => {
									//console.log(resSetResult);
								},
								errSetResult => {
									console.log(`Error: ${errSetResult}`);
								}
							);
						}
						lastSendTime = now;
						lockSend = false;
					},
					errQueueList => {
						console.log(`Error: ${errQueueList}`);
					}	
				);
				lastSendTime = now;
				lockSend = false;
			}
		}	
	});
	
	bot.start();
};
