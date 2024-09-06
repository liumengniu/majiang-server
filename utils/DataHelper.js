const _ = require("lodash");
const RoomService = require("../core/app/RoomService");

const DataHelper = {
	/**
	 * 1、修改 rooms 下第一层数据源
	 * @param roomId {string}  房间id
	 * @param rooms {object}  原rooms数据
	 * @param data {index}  修改后的数据
	 */
	setRoomsInfo(roomId, rooms, data) {
		let response = _.set(rooms, [roomId], data);
		return _.cloneDeep(response);
	},
	/**
	 * 修改房间第一层数据
	 * @param playerId   修改的某个玩家id
	 * @param roomInfo   原房间roomInfo的数据
	 * @param data       修改后的rooms数据
	 * @returns {*}
	 */
	setRoomInfo(playerId, roomInfo, data){
		let response;
		response = _.set(roomInfo, [playerId], data);
		return _.cloneDeep(response);
	},
	/**
	 * 修改房间第二层数据
	 * @param type       修改的属性
	 * @param playerId   修改的某个玩家id
	 * @param roomInfo   原房间roomInfo的数据
	 * @param data       需要修改的房间某个属性的值
	 * @returns {*}
	 */
	setRoomInfoDeep(type, playerId, roomInfo, data){
		let response;
		response = _.set(roomInfo, `${playerId}.${type}`, data);
		return _.cloneDeep(response);
	},
	/**
	 * 更新手牌
	 */
	updateHandCards: function (playerId, newCardNum){
	
	},
	/**
	 * 更新打出去的牌
	 */
	updatePlayedCards: function (){
	
	},
	
	/**
	 * 初始化 gameCollections 的数据
	 * @param roomId
	 * @param activeCardIdx
	 * @param cards
	 */
	initGameCollections(roomId, activeCardIdx, cards){
		let  gameCollections = _.get(RoomService, `gameCollections`, {});
		gameCollections[roomId] = {
			activeCardIdx: _.toNumber(activeCardIdx), cards
		}
		_.set(RoomService, `gameCollections`, gameCollections);
	},
	/**
	 * 更新 gameCollections的数据
	 * @param roomId
	 */
	updateGameCollections(roomId) {
		const gameInfo = _.get(RoomService, `gameCollections.${roomId}`, {});
		const oldCards = _.get(gameInfo, `cards`, [])
		let response;
		const oldActiveCardIdx = _.get(gameInfo, `activeCardIdx`);
		let newActiveCardIdx = _.toNumber(oldActiveCardIdx) + 1;
		response = _.set(gameInfo, `activeCardIdx`, newActiveCardIdx);
		_.set(RoomService, `gameCollections.${roomId}`, response);
		return _.get(oldCards, `${newActiveCardIdx}`);
	}
};

module.exports = DataHelper;
