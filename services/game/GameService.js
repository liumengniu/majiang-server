/**
 * @author Kevin
 * @Date: 2024-6-20
 */
const _ = require("lodash")
const RoomService = require("../../core/app/RoomService");
const moment = require("moment")
const DataHelper = require("../../utils/DataHelper");
// const SocketService = require("../../core/socket/SocketService");

// let ws = SocketService.getInstance();

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
	roomGameInfo: {},  //房间的详情，包括游戏详情
	activeCardIdx: 52,
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
		this.updateRooms(roomId, roomGameInfo);
		this.initGames(roomId, 52, this.gameCards);
		return roomGameInfo;
	},
	/**
	 *  获取手牌数据
	 */
	getHandCards: function (cards, idx) {
		let handCards = idx === 0 ? cards.slice(0, 14) : idx === 1 ? cards.slice(14, 27) : idx === 2 ? cards.slice(27, 40) : idx === 3 ? cards.slice(40, 53) : [];
		return this.adjustHandCards(handCards);
	},
	/**
	 * 摸一张新牌
	 */
	getNextCard: function (){
		return this.activeCardIdx ++;
	},
	/**
	 * 整理手牌(万、条、索合并并排序)
	 */
	adjustHandCards: function (cards){

		let adjustCards = _.cloneDeep(cards);
		for (let i = 0; i < adjustCards.length - 1; i++) {
			for (let j = 0; j < adjustCards.length - i - 1; j++) {
				if (adjustCards[j]%50 > adjustCards[j + 1]%50) {
					[adjustCards[j], adjustCards[j + 1]] = [adjustCards[j + 1], adjustCards[j]];
				}
			}
		}

		return adjustCards
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
	 * 修改服务器保存的所有房间的游戏数据
	 */
	initGames: function (roomId, activeCardIdx, cards) {
		DataHelper.initGameCollections(roomId, activeCardIdx, cards)
	},
	/**
	 * 更新服务器保存的所有房间的游戏数据
	 * @param roomId
	 */
	updateGames: function (roomId) {
		DataHelper.updateGameCollections(roomId)
	},
	/**
	 * 某个玩家出牌
	 * @param roomId
	 * @param cardNum
	 * @param playerId
	 */
	playCard: function (roomId, cardNum, playerId){
		let oldRoomInfo = _.get(RoomService, `rooms.${roomId}`);
		const keys = _.keys(oldRoomInfo)
		let oldPlayedCards = _.get(oldRoomInfo, `${playerId}.playedCards`, []);
		let oldHandCards = _.get(oldRoomInfo, `${playerId}.handCards`, []);
		oldPlayedCards.push(cardNum);
		let newHandCards = _.filter(oldHandCards, o=>o !== cardNum);
		let newRoomInfo = oldRoomInfo;
		_.set(newRoomInfo, `${playerId}.playedCards`, oldPlayedCards)
		_.set(newRoomInfo, `${playerId}.handCards`, newHandCards)
		_.set(newRoomInfo, `${playerId}.optionPos`, this.getNextPlayerPos(playerId,oldRoomInfo))
		this.updateRooms(roomId, newRoomInfo)
		return newRoomInfo;
	},
	/**
	 * 获取下一位出牌的玩家（同时其他玩家可以-抢碰、抢杠）
	 * @param playerId
	 * @param roomInfo
	 */
	getNextPlayerPos:function (playerId, roomInfo){
		let playerPos = _.get(roomInfo, `${playerId}.pos`);
		return _.toNumber(playerPos) + 1  > 3 ? 0 : _.toNumber(playerPos) + 1;
	},
	/**
	 * 检测其他人打出的牌（主要是碰和杠）
	 */
	handleOtherPlayerCard: function (roomId, playerId, cardNum){
		const SocketService = require("../../core/socket/SocketService");
		const ws = SocketService.getInstance();
		let roomInfo = _.get(RoomService, `rooms.${roomId}`);
		const keys = _.keys(roomInfo);
		const values = _.values(roomInfo);
		let isPlayerOption = false;
		_.map(keys, (otherPlayerId, idx)=>{
			//判断是否能碰
			const handCards = _.get(roomInfo, `${playerId}.handCards`, []);
			const sameCard = _.size(_.filter(handCards, h => h === cardNum));
			if(sameCard === 3){  //可以碰
				isPlayerOption = true;
				ws.sendToUser(otherPlayerId, "可以杠牌", 3, "option");
			} else if(sameCard === 2){  //可以杠
				isPlayerOption = true;
				ws.sendToUser(otherPlayerId, "可以碰牌", 2, "option");
			} else {
				// isPlayerOption = false;
				// ws.sendToUser(playerId, "轮到我摸牌", 1, "option");
			}
		})
		if(!isPlayerOption){  //没有人能碰或者杠，则顺延的下家摸牌（服务端发一张牌给下家）
			const newCardNum = DataHelper.updateGameCollections(roomId);
			// DataHelper.setRoomsInfo()
			let nextPlayerId;
			_.map(keys, (otherPlayerId, idx)=>{
				if(otherPlayerId === playerId){
					nextPlayerId = idx+1 <=3 ? keys[idx+1] : keys[0];
				}
				ws.sendToUser(otherPlayerId, "轮到下家摸牌", 1, "nextHandCard");
			})
			//发一张牌给下家
			ws.sendToUser(nextPlayerId, "摸一张牌", {cardNum: newCardNum, }, "deliverCard");
		} else { // 否则等待20秒（标准时间），20秒内无人碰或者杠，则还是顺延下家

		}
	},
	/**
	 * 判断是否可以胡牌（湖南麻将必须自摸才能胡牌）
	 * @param cards
	 * 胡牌必须手上的牌型满足 AAA + ABC + AA(只有一对将) 三个条件
	 */
	checkIsWinning: function (cards) {
		if (cards.length % 3 !== 2) return false;  // 检查手牌长度是否符合胡牌要求
		cards.sort((a, b) => a % 50 - b % 50);     // 将手牌再次排序防止BUG（非必须，摸牌时已经排序过）
		// 检查所有可能的将牌组合
		for (let i = 0; i < cards.length - 1; i++) {
			if (cards[i] === cards[i + 1]) {
				// 复制手牌并去掉将牌
				let remaining = cards.slice();
				remaining.splice(i, 2);
				// 递归检查剩余的牌是否符合AAA+ABC规则
				if (this.checkIsAAAorABC(remaining)) {
					return true;
				}
			}
		}
		return false;
	},
	/**
	 * 检测牌是否是 AAA 或 ABC 牌型
	 * @param cards
	 * @returns {boolean}
	 */
	checkIsAAAorABC: function (cards){
		if (cards.length === 0) return true;

		// 检查是否可以拆分出AAA
		for (let i = 0; i < cards.length - 2; i++) {
			if (cards[i] === cards[i + 1] && cards[i] === cards[i + 2]) {
				let remaining = cards.slice();
				remaining.splice(i, 3);
				if (this.checkIsAAAorABC(remaining)) return true;
			}
		}

		// 检查是否可以拆分出ABC
		for (let i = 0; i < cards.length - 2; i++) {
			let a = cards[i];
			let b = a + 1;
			let c = a + 2;
			if (cards.includes(b) && cards.includes(c)) {
				let remaining = cards.slice();
				remaining.splice(remaining.indexOf(a), 1);
				remaining.splice(remaining.indexOf(b), 1);
				remaining.splice(remaining.indexOf(c), 1);
				if (cards(remaining)) return true;
			}
		}
		return false;
	},

	/**
	 * 检测手牌（主要是自摸和杠）
	 */
	handleHandCard: function (){

	}

}

module.exports = GameService
