/**
 * @author Kevin
 * @Date: 2024-6-20
 */
const _ = require("lodash")
const RoomService = require("../../core/app/RoomService");
const moment = require("moment")
const DataHelper = require("../../utils/DataHelper");

const GameService = {
	cards: [
		11,12,13,14,15,16,17,18,19,//万
		21,22,23,24,25,26,27,28,29,//条
		31,32,33,34,35,36,37,38,39,//筒
		
		61,62,63,64,65,66,67,68,69,//万
		71,72,73,74,75,76,77,78,79,//条
		81,82,83,84,85,86,87,88,89,//筒
		
		111,112,113,114,115,116,117,118,119,//万
		121,122,123,124,125,126,127,128,129,//条
		131,132,133,134,135,136,137,138,139,//筒
		
		161,162,163,164,165,166,167,168,169,//万
		171,172,173,174,175,176,177,178,179,//条
		181,182,183,184,185,186,187,188,189,//筒
	],
	gameCards:[],
	gameInfo: {},  //房间详情
	roomGameInfo: {},  //房间的详情，包括游戏详情
	/**
	 * 初始化游戏服务
	 * @param roomId
	 */
	init: function (roomId){
		this.gameInfo = RoomService.getRoomInfo(roomId);
	},
	/**
	 * 洗牌算法
	 * @returns {*}
	 */
	shuffle:function (){
		let arr = _.cloneDeep(this.cards);
		for(let i=0;i<arr.length;i++){
			let idx = Math.floor(Math.random() * arr.length);
			let t = arr[idx];
			arr[idx] = arr[i];
			arr[i] = t;
		}
		return arr;
	},
	/**
	 * 开始游戏
	 */
	startGame: function (roomId) {
		let roomInfo = _.get(RoomService, `rooms.${roomId}`, {});
		this.gameCards = _.cloneDeep(this.shuffle());
		//生成游戏开始数据
		let idx = 0;
		let roomGameInfo;
		for (let key in roomInfo) {
			let data = {};
			data.startTime = moment().valueOf();
			data.status = 2;
			data.handCards = this.getHandCards(this.gameCards, idx);
			data.playedCards = [];
			roomGameInfo = this.updateRoomInfo(key, roomInfo, _.assign({},roomInfo[key],data))
			idx++;
		}
		this.roomGameInfo = roomGameInfo;
		this.updateRooms(roomId, roomGameInfo)
		return roomGameInfo;
	},
	/**
	 *  获取手牌数据
	 */
	getHandCards: function (cards, idx) {
		let handCards = [];
		handCards = idx === 0 ? cards.slice(0, 14) : idx === 1 ? cards.slice(14, 27) : idx === 2 ? cards.slice(27, 40) : idx === 3 ? cards.slice(40, 53) : [];
		return handCards
	},
	/**
	 * 修改房间数据
	 */
	updateRoomInfo: function (playerId, roomInfo, data){
		return DataHelper.setRoomInfo(playerId, roomInfo, data)
	},
	/**
	 * 修改服务器所有房间数据源中某个房间数据
	 * @param roomId
	 * @param roomInfo
	 */
	updateRooms: function (roomId, roomInfo) {
		let oldRooms = _.get(RoomService, `rooms`);
		DataHelper.setRoomsInfo(roomId, oldRooms, roomInfo)
	},
	/**
	 * 某个玩家出牌
	 * @param roomId
	 * @param cardNum
	 * @param playerId
	 */
	playCard: function (roomId, cardNum, playerId){
		let oldRoomInfo = _.get(RoomService, `rooms.${roomId}`);
		let oldPlayedCards = _.get(oldRoomInfo, `${playerId}.playedCards`, []);
		oldPlayedCards.push(cardNum);
		const newRoomInfo = DataHelper.setRoomInfoDeep("playedCards",playerId, oldRoomInfo, oldPlayedCards);
		this.updateRooms(roomId, newRoomInfo)
		return newRoomInfo;
	}
	/**
	 * 某个玩家碰牌
	 */
}

module.exports = GameService
