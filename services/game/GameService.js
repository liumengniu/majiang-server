/**
 * @author Kevin
 * @Date: 2024-6-20
 */
const _ = require("lodash")
const RoomService = require("../../core/app/RoomService");
const moment = require("moment")
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
	gangScore: 10,
	winScore: 10,
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
		return RoomService.setRoomInfo(playerId, roomInfo, data)
	},
	/**
	 * 修改服务器所有房间数据源中某个房间数据
	 * @param roomId
	 * @param roomInfo
	 */
	updateRooms: function (roomId, roomInfo) {
		let oldRooms = _.get(RoomService, `rooms`);
		RoomService.setRoomsInfo(roomId, oldRooms, roomInfo)
	},
	/**
	 * 修改服务器保存的所有房间的游戏数据
	 */
	initGames: function (roomId, activeCardIdx, cards) {
		RoomService.initGameCollections(roomId, activeCardIdx, cards)
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
		// 更新对局游戏数据
		RoomService.setGameCollectionsDeep(roomId, "optionPos", this.getNextPlayerPos(roomId, playerId))
		RoomService.setGameCollectionsDeep(roomId, "optionTime", moment().valueOf())
		this.updateRooms(roomId, newRoomInfo)
		return newRoomInfo;
	},
	/**
	 * 获取下一位出牌的玩家（同时其他玩家可以-抢碰、抢杠）
	 * @param roomId
	 * @param playerId
	 */
	getNextPlayerPos:function (roomId, playerId){
		const gameInfo = RoomService.getGameInfo(roomId);
		const roomInfo = RoomService.getRoomInfo(roomId);
		let optionPos = _.get(gameInfo, `optionPos`, 0);
		const playerCount = _.size(roomInfo) - 1;
		return _.toNumber(optionPos) + 1  > playerCount ? 0 : _.toNumber(optionPos) + 1;
	},
	/**
	 * 检测其他人打出的牌（主要是碰和杠）
	 */
	handleOtherPlayerCard: function (roomId, playerId, cardNum){
		const isPlayerOption = this.handleHandCardByOtherPlayerCard(roomId, playerId, cardNum);
		if(isPlayerOption){
			return
		}
		this.handleHandCardByMe(roomId, playerId, cardNum)
	},
	/**
	 * 判断是否可以胡牌
	 * @param cards
	 * 胡牌必须手上的牌型满足 AAA + ABC + AA(只有一对将) 三个条件
	 */
	checkIsWinning: function (cards) {
		if (cards.length % 3 !== 2) return false;  // 检查手牌长度是否符合胡牌要求
		cards.sort((a, b) => a % 50 - b % 50);     // 将手牌再次排序防止BUG（非必须，摸牌时已经排序过）
		// 检查所有可能的将牌组合
		for (let i = 0; i < cards.length - 1; i++) {
			if (cards[i]%50 === cards[i + 1]%50) {
				// 复制手牌并去掉将牌
				let remaining = cards.slice();
				remaining.splice(i, 2);
				// 递归检查剩余的牌是否符合AAA+ABC规则
				if (this.checkIsAAAorABC(this.computedCards(remaining))) {
					return true;
				}
			}
		}
		return false;
	},

	/**
	 * 将原始卡牌 换算成用于计算的卡牌
	 * 原来的麻将牌通过50的倍数定义的（---->因为每个花色牌有4张相同的，计算时又不需要区分<----），计算时需要换算成便于计算的
	 * @param cards
	 */
	computedCards: function (cards) {
		return _.map(cards, o => o % 50)
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
				if (this.checkIsAAAorABC(remaining)) return true;
			}
		}
		return false;
	},

	/**
	 * 其他玩家出牌时检测手牌（主要是碰、杠、胡）
	 * @param roomId  房间id
	 * @param playerId  玩家id
	 * @param cardNum  检测的牌（别人打出或者自摸的牌）
	 */
	handleHandCardByOtherPlayerCard: function (roomId, playerId, cardNum){
		const SocketService = require("../../core/socket/SocketService");
		const ws = SocketService.getInstance();
		let roomInfo = _.get(RoomService, `rooms.${roomId}`);
		const keys = _.keys(roomInfo);
		let isPlayerOption = false;  // 其他玩家是否可以进行操作
		_.map(_.filter(keys, k => k !== playerId), (otherPlayerId, idx)=>{
			const handCards = _.get(roomInfo, `${otherPlayerId}.handCards`, []);
			const sameCard = _.size(_.filter(handCards, h => h%50 === cardNum%50));
			const cards = _.concat([], handCards, [cardNum]);
			// 判断是否胡牌
			const isWinning = this.checkIsWinning(cards)
			if(isWinning) { // 可以胡
				isPlayerOption = true;
				ws.sendToUser(otherPlayerId, "可以胡牌", {operateType: 4, playerId: otherPlayerId}, "operate");
			} else if(sameCard === 3){  //可以碰
				isPlayerOption = true;
				ws.sendToUser(otherPlayerId, "可以杠牌", {operateType: 3, playerId: otherPlayerId}, "operate");
			} else if(sameCard === 2){  //可以杠
				isPlayerOption = true;
				ws.sendToUser(otherPlayerId, "可以碰牌", {operateType: 2, playerId: otherPlayerId}, "operate");
			}
		})
		return isPlayerOption;
	},
	/**
	 * 自摸牌时检测手牌（服务器下发的牌）
	 * 条件 -> 没有人能碰或者杠，则顺延的下家摸牌（服务端发一张牌给下家）
	 * @param roomId
	 * @param playerId
	 * @param cardNum
	 */
	handleHandCardByMe: function (roomId, playerId, cardNum){
		const SocketService = require("../../core/socket/SocketService");
		const ws = SocketService.getInstance();
		let roomInfo = _.get(RoomService, `rooms.${roomId}`);
		const keys = _.keys(roomInfo);
		const newCardNum = RoomService.getNextCard(roomId);
		let nextPlayerId;
		_.map(keys, (otherPlayerId, idx)=>{
			if (otherPlayerId === playerId) {
				nextPlayerId = idx + 1 >= _.size(keys) ? keys[0] : keys[idx + 1];
			}
			ws.sendToUser(otherPlayerId, "轮到下家摸牌", 1, "nextHandCard");
		})
		// 1. 更新摸牌人的手牌
		const {newRoomInfo, newCards} = RoomService.updateHandCards(roomId, nextPlayerId, newCardNum)
		// 2. 发一张牌给下家
		ws.sendToUser(nextPlayerId, "摸一张牌", {cardNum: newCardNum,roomInfo: newRoomInfo, playerId: nextPlayerId }, "deliverCard");
		// 3. 自摸牌检测
		const isWinning = this.checkIsWinning(newCards);
		const sameCard = _.size(_.filter(newCards, h => h%50 === newCardNum%50));
		if(isWinning){
			ws.sendToUser(nextPlayerId, "自摸，可以胡牌", {operateType: 4, playerId: nextPlayerId}, "operate");
		} else if(sameCard === 4){
			ws.sendToUser(nextPlayerId, "自摸杠牌", {operateType: 3, playerId: nextPlayerId}, "operate");
		}
	},
	/**
	 * 开碰
	 */
	peng: function (roomId, playerId, pengArr){
		const roomInfo = RoomService.getRoomInfo(roomId);
		const oldHandCards = _.get(roomInfo, `${playerId}.handCards`);
		const newHandCards = _.filter(oldHandCards, o=> !_.includes(pengArr, o));
		const oldPlayedCards = _.get(roomInfo, `${playerId}.playedCards`);
		const newPlayedCards = _.uniq(_.concat([], oldPlayedCards, pengArr));
		RoomService.setRoomInfoDeep("handCards", playerId, roomInfo, newHandCards)
		RoomService.setRoomInfoDeep("playedCards", playerId, roomInfo, newPlayedCards)
		RoomService.setGameCollectionsDeep(roomId, "optionTime", moment().valueOf())
		return RoomService.getRoomInfo(roomId);
	},
	/**
	 * 开杠
	 */
	gang: function (roomId, playerId, gangArr){
		const roomInfo = RoomService.getRoomInfo(roomId);
		const oldHandCards = _.get(roomInfo, `${playerId}.handCards`);
		const newHandCards = _.filter(oldHandCards, o=> !_.includes(gangArr, o));
		const oldPlayedCards = _.get(roomInfo, `${playerId}.playedCards`);
		const newPlayedCards = _.uniq(_.concat([], oldPlayedCards, gangArr));
		RoomService.setRoomInfoDeep("handCards", playerId, roomInfo, newHandCards)
		RoomService.setRoomInfoDeep("playedCards", playerId, roomInfo, newPlayedCards)
		RoomService.setGameCollectionsDeep(roomId, "optionTime", moment().valueOf())
		return RoomService.getRoomInfo(roomId);
	},
	/**
	 * 胡牌
	 * 【结算分数】
	 * 【杠牌算翻倍】
	 */
	win: function (roomId, playerId, cardNum) {
		// cardNum 有数据则是胡别人的牌， cardNum无数据则是自摸胡牌
		const roomInfo = RoomService.getRoomInfo(roomId);
		const handCards = _.get(roomInfo, `${playerId}.handCards`);
		const playedCards = _.get(roomInfo, `${playerId}.playedCards`);
		const cards = _.concat([], handCards, playedCards, cardNum);
		let gangCount = 0;
		// 检查是否有杠牌
		for (let i = 0; i < cards.length - 3; i++) {
			if (cards[i] % 50 === cards[i + 1] % 50 && cards[i] % 50 === cards[i + 2] % 50 && cards[i] % 50 === cards[i + 3] % 50) {
				gangCount++
			}
		}
		let result = {}
		_.forEach(roomInfo, (value, key) => {
			result[key] = {
				cards: _.concat([], _.get(value, 'handCards'), _.get(value, 'playedCards'), key === playerId ? [cardNum] : null),
				isWinner: key === playerId,
				gangCount: key === playerId ? gangCount : 0,
				score: key === playerId ? gangCount * this.gangScore + this.winScore : -this.this.winScore
			}
		})
		return result;
	}
}

module.exports = GameService
