const {
	GraphQLSchema,
	GraphQLObjectType,
	GraphQLList,
	GraphQLString,
	GraphQLFloat,
	GraphQLInt
} = require('graphql');

const {
	GraphQLDate,
	GraphQLTime,
	GraphQLDateTime
} = require('graphql-iso-date');

const irl = require('../api/irlAPI');

const Info = new GraphQLObjectType({
		name: 'Information',
		description: "Информация о источнике данных",
		fields: {
			url: {
				type: GraphQLString,
				description: "Ссылка на сайт"
			},
			copyright: {
				type: GraphQLString,
				description: "Информация о правах"
			},
			date: {
				type: GraphQLDateTime,
				description: "Дата и время запроса"
			}
		}
	}),
	PlaceRecord = new GraphQLObjectType({
		name: 'PlaceRecord',
		description: "Запись о месте встречи",
		fields: {
			city: {
				type: GraphQLString,
				description: "Название города"
			},
			name: {
				type: GraphQLString,
				description: "Название места встречи"
			},
			address: {
				type: GraphQLString,
				description: "Адрес места встречи"
			},
			longitude: {
				type: GraphQLFloat,
				description: "Долгота"
			},
			latitude: {
				type: GraphQLFloat,
				description: "Широта"
			}
		} 
	}),
	PlaceData = new GraphQLObjectType({
		name: 'PlaceData',
		description: "Данные о месте встречи",
		fields: {
			info: {
				type: Info,
				description: "Информация о источнике данных"
			},
			records: {
				type: new GraphQLList(PlaceRecord),
				description: "Список мест встречи"
			}
		} 
	});

module.exports = new GraphQLSchema({
	query: new GraphQLObjectType({
		name: 'MainQueries',
		description: "Точка вызова функций",
		fields: {
			info: {
				type: Info,
				description: "Получить информацию",
				resolve: () => {
					return irl.info();
				}
			},
			places: {
				type: PlaceData,
				description: "Список мест встречи",
				resolve: () => {
					return irl.mapPlaces();
				}
			}
		}
	})
});