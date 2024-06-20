/**
 * @author Kevin
 * @Date: 2024-6-20
 */
const _ = require("lodash")
const RoomService = require("../../core/app/RoomService");
const moment = require("moment")

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
	roomGameInfo: {},  //房间详情
	/**
	 * 初始化游戏服务
	 * @param roomId
	 */
	init: function (roomId){
		this.roomGameInfo = RoomService.getRoomInfo(roomId);
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
		console.log(arr,'ggggggggggggggggggggggggggggggggggg')
		return arr;
	},
	/**
	 * 开始游戏
	 */
	startGame: function (roomId) {
		let roomInfo = _.get(RoomService, `rooms.${roomId}`, {});
		this.gameCards = _.cloneDeep(this.shuffle());
		//生成游戏开始数据
		for (let key in roomInfo) {
			let data = {};
			data.startTime = moment().valueOf();
			data.status = 2;
			data.gameCards = this.gameCards;
			this.updateRoomGameInfo(roomId, key, data);
		}
		this.roomGameInfo = roomInfo;
		return this.gameCards;
	},
	/**
	 * 更新正在游玩的房间的游戏数据
	 */
	updateRoomGameInfo: function (roomId, playerId, data) {
		let oldInfo = _.get(RoomService.rooms, `${roomId}.${playerId}`);
		// todo 注意lodash 的方法会直接改引用地址的数据，无法多修改一次数据
		let newInfo = _.assign(oldInfo, data);
		this.updatePlayerInfoByRoom(roomId, playerId, newInfo);
	},
	/**
	 * 更改房间集合里的 - 玩家信息
	 * @param roomId
	 * @param playerId
	 * @param data
	 */
	updatePlayerInfoByRoom: function (roomId, playerId, data) {
		_.set(RoomService, `rooms.${roomId}.${playerId}`, data);
	},
}

module.exports = GameService
