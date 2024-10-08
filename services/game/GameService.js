/**
 * @author Kevin
 * @Date: 2024-6-20
 */
const _ = require("lodash")
const RoomService = require("@/core/services/RoomService");
const PlayerService = require("@/core/services/PlayerService");
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
	initCardIdx: 52,
	gangScore: 10,
	winScore: 10,
	/**
	 * 初始化游戏服务
	 * @param roomId
	 */
	init: function (roomId){

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
		let roomInfo = RoomService.getRoomInfo(roomId);
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
			// 更新房间全部玩家状态，状态改为游戏中
			PlayerService.updatePlayerInfoDeep("playerStatus", key, 3)
		}
		// 更新房间数据
		this.updateRooms(roomId, roomGameInfo);
		// 开始游戏，并发完手牌后，下一张牌的索引为52
		this.initGames(roomId, this.initCardIdx, this.gameCards);
		return RoomService.getRoomInfo(roomId);
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
		return RoomService.updateRoomInfoShallow(playerId, roomInfo, data)
	},
	/**
	 * 修改服务器所有房间数据源中某个房间数据
	 * @param roomId
	 * @param roomInfo
	 */
	updateRooms: function (roomId, roomInfo) {
		let oldRooms = _.get(RoomService, `rooms`);
		RoomService.updateRoomInfo(roomId, oldRooms, roomInfo)
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
		let oldRoomInfo = RoomService.getRoomInfo(roomId);
		let oldPlayedCards = _.get(oldRoomInfo, `${playerId}.playedCards`, []);
		let oldHandCards = _.get(oldRoomInfo, `${playerId}.handCards`, []);
		let allPlayedCards = RoomService.getGameInfoDeep(roomId, "allPlayedCards",  []);
		oldPlayedCards.push(cardNum);
		const newAllPlayedCards = _.uniq(allPlayedCards?.push(cardNum));
		let newHandCards = _.filter(oldHandCards, o=>o !== cardNum);
		let newRoomInfo = oldRoomInfo;
		RoomService.updateRoomInfoDeep("playedCards", playerId, oldRoomInfo, oldPlayedCards)
		RoomService.updateRoomInfoDeep("handCards", playerId, oldRoomInfo, newHandCards)
		// 更新对局游戏数据
		RoomService.updateGameCollectionsDeep(roomId, "optionPos", this.getNextPlayerPos(roomId, playerId))
		RoomService.updateGameCollectionsDeep(roomId, "optionTime", moment().valueOf())
		RoomService.updateGameCollectionsDeep(roomId, "activeCardNum", cardNum);
		RoomService.updateGameCollectionsDeep(roomId, "playCardPlayerId", playerId);
		RoomService.updateGameCollectionsDeep(roomId, "allPlayedCards", newAllPlayedCards)
		this.updateRooms(roomId, newRoomInfo)
		return RoomService.getRoomInfo(roomId);
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
		const isAllPlayerHasOption = this.handleHandCardByOtherPlayerCard(roomId, playerId, cardNum);
		if(isAllPlayerHasOption){
			return
		}
		this.handleHandCardByMe(roomId, playerId)
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
		const SocketService = require("@/core/socket/SocketService");
		const ws = SocketService.getInstance();
		let roomInfo = RoomService.getRoomInfo(roomId);
		let gameInfo = RoomService.getGameInfo(roomId);
		const tableIds = gameInfo?.tableIds;
		let isAllPlayerHasOption = false;  // 其他玩家是否可以进行操作
		let firstOperateId = null;
		let operateType = null;
		let msg = "";
		_.map(tableIds, (otherPlayerId, idx)=>{
			let isPlayerOption = false
			if(otherPlayerId !== playerId){  // 非出牌人
				const handCards = _.get(roomInfo, `${otherPlayerId}.handCards`, []);
				const sameCard = _.size(_.filter(handCards, h => h%50 === cardNum%50));
				const cards = _.concat([], handCards, [cardNum]);
				// 判断是否胡牌
				const isWinning = this.checkIsWinning(cards)
				if(isWinning) { // 可以胡
					isAllPlayerHasOption = isPlayerOption = true;
					operateType = 4;
					msg = "可以胡牌";
				} else if(sameCard === 3){  //可以碰
					isAllPlayerHasOption = isPlayerOption = true;
					operateType = 3;
					msg = "可以杠牌";
				} else if(sameCard === 2){  //可以杠
					isAllPlayerHasOption = isPlayerOption = true;
					operateType = 2;
					msg = "可以碰牌";
				}
				if(isPlayerOption && !firstOperateId){ //如果是多个玩家可以操作（比如多人都可以碰杠胡），数据更新一次，且操作权限指向第一个可以操作的玩家
					RoomService.updateGameCollectionsDeep(roomId, "optionPos", idx)
					firstOperateId = otherPlayerId;
				}
				if(isPlayerOption){
					const gameInfo = RoomService.getGameInfo(roomId)
					const roomInfo = RoomService.getRoomInfo(roomId)
					ws.sendToUser(otherPlayerId, msg, {operateType, playerId: otherPlayerId, gameInfo, roomInfo}, "operate");
				}
			}
		})
		if(isAllPlayerHasOption) {  // 告诉出牌人，其他玩家可以操作，指示灯轮转位置
			const gameInfo = RoomService.getGameInfo(roomId)
			const roomInfo = RoomService.getRoomInfo(roomId)
			ws.sendToUser(playerId, msg, {operateType, playerId: firstOperateId, gameInfo, roomInfo}, "operate");
		}
		return isAllPlayerHasOption;
	},
	/**
	 * 自摸牌时检测手牌（服务器下发的牌）
	 * 条件 -> 没有人能碰或者杠，则顺延的下家摸牌（服务端发一张牌给下家）
	 * @param roomId
	 * @param playerId
	 */
	handleHandCardByMe: function (roomId, playerId){
		const SocketService = require("@/core/socket/SocketService");
		const ws = SocketService.getInstance();
		let roomInfo = RoomService.getRoomInfo(roomId);
		let gameInfo = RoomService.getGameInfo(roomId);
		const tableIds = gameInfo?.tableIds || [];
		const keys = _.keys(roomInfo);
		const newCardNum = RoomService.getNextCard(roomId);
		if (typeof newCardNum !== "number" || _.toNumber(gameInfo?.activeCardIdx) >= _.toNumber(gameInfo?.lastActiveCardIdx)) { // 表示牌已摸完，流局
			this.flow(roomId, playerId, newCardNum)
			return
		}
		let nextPlayerId;
		_.map(keys, (otherPlayerId, idx)=>{
			if (otherPlayerId === playerId) {
				nextPlayerId = idx + 1 >= _.size(keys) ? keys[0] : keys[idx + 1];
			}
		})
		// 1. 更新摸牌人的手牌
		const {newRoomInfo, newCards} = RoomService.updateHandCards(roomId, nextPlayerId, newCardNum)
		// 2. 更新操作人位置为下家（playCard方法已经重置过了，多次重置防止网络波动BUG）
		RoomService.updateGameCollectionsDeep(roomId, "optionPos", this.getPosById(roomId,nextPlayerId))
		// 3. 发一张牌给下家
		ws.sendToUser(nextPlayerId, "摸一张牌", {cardNum: newCardNum,roomInfo: newRoomInfo, gameInfo,playerId: nextPlayerId }, "deliverCard");
		const otherIds = _.filter(tableIds, t=> t !== nextPlayerId);
		ws.sendDifferenceUser(otherIds, "摸一张牌", {cardNum: null,roomInfo: newRoomInfo, gameInfo,playerId: nextPlayerId }, "deliverCard")
		// 4. 自摸牌检测
		const isWinning = this.checkIsWinning(newCards);
		const sameCard = _.size(_.filter(newCards, h => h%50 === newCardNum%50));
		gameInfo = RoomService.getGameInfo(roomId)
		roomInfo = RoomService.getRoomInfo(roomId)
		if(isWinning){
			ws.sendToUser(nextPlayerId, "自摸，可以胡牌", {operateType: 4, playerId: nextPlayerId, gameInfo, roomInfo}, "operate");
		} else if(sameCard === 4){
			RoomService.updateGameCollectionsDeep(roomId, "activeCardNum", newCardNum);
			ws.sendToUser(nextPlayerId, "自摸杠牌", {operateType: 3, playerId: nextPlayerId, gameInfo, roomInfo}, "operate");
		}
	},
	/**
	 * 通过playerId获取位置
	 */
	getPosById: function (roomId, playerId) {
		const gameInfo = RoomService.getGameInfo(roomId);
		const tableIds = gameInfo?.tableIds;
		let pos = null;
		_.map(tableIds, (key, idx) => {
			if (playerId === key) pos = idx
		})
		return pos
	},
	/**
	 * 开碰
	 */
	peng: function (roomId, playerId, pengArr){
		const roomInfo = RoomService.getRoomInfo(roomId);
		const oldHandCards = _.get(roomInfo, `${playerId}.handCards`);
		const newHandCards = _.filter(oldHandCards, o=> !_.includes(this.computedCards(pengArr), o%50));
		RoomService.updateRoomInfoDeep("handCards", playerId, roomInfo, newHandCards)
		// 将当前出牌玩家的牌，放到【开碰】的玩家的数据源中
		const activeCardNum = RoomService.getGameInfoDeep(roomId, "activeCardNum");
		let pengCards = [];
		const oldPengCards = RoomService.getRoomInfoDeep(roomId, playerId, "pengCards") || [];
		const playCardPlayerId = RoomService.getGameInfoDeep(roomId, 'playCardPlayerId');  //上一个出牌的玩家
		//有时候会有网络波动，瞬间操作时，上一个出的牌会比其他操作慢推送至玩家，需要判断
		if (_.includes(this.computedCards(pengArr), activeCardNum % 50)) {
			pengCards = _.concat([], oldPengCards || [], pengArr, [activeCardNum]);
			RoomService.updateRoomInfoDeep("playedCards", playCardPlayerId, roomInfo, _.filter(roomInfo[playCardPlayerId]?.playedCards, o => o !== activeCardNum))
		} else {
			const allPlayedCards = RoomService.getGameInfoDeep(roomId, "allPlayedCards");
			const correctCardNum = _.find(allPlayedCards, o=> o%50 === (pengArr[0])%50);
			pengCards = _.concat([], oldPengCards || [], pengArr, [correctCardNum]);
			RoomService.updateRoomInfoDeep("playedCards", playCardPlayerId, roomInfo, _.filter(roomInfo[playCardPlayerId]?.playedCards, o => o !== correctCardNum))
		}
		RoomService.updateRoomInfoDeep("pengCards", playerId, roomInfo, pengCards)
		RoomService.updateGameCollectionsDeep(roomId, "optionTime", moment().valueOf())
		RoomService.updateGameCollectionsDeep(roomId, "optionPos", this.getPosById(roomId,playerId))
		return RoomService.getRoomInfo(roomId);
	},
	/**
	 * 开杠
	 */
	gang: function (roomId, playerId, gangArr){
		const roomInfo = RoomService.getRoomInfo(roomId);
		const oldHandCards = _.get(roomInfo, `${playerId}.handCards`);
		const newHandCards = _.filter(oldHandCards, o=> !_.includes(this.computedCards(gangArr), o%50));
		// 杠完之后，从牌堆最后面下发一张新牌给开杠玩家
		const cardNum = RoomService.getLastNextCard(roomId);
		const finalHandCards = this.adjustHandCards(_.concat([], newHandCards, [cardNum]));
		RoomService.updateRoomInfoDeep("handCards", playerId, roomInfo, finalHandCards);
		// 将当前出牌玩家的牌，放到【开碰】的玩家的数据源中
		const activeCardNum = RoomService.getGameInfoDeep(roomId, "activeCardNum");
		let gangCards = [];
		const oldGangCards =  RoomService.getRoomInfoDeep(roomId, playerId,"gangCards") || [];
		//有时候会有网络波动，瞬间多个玩家同时操作时，上一个出的牌会比其他操作慢推送至玩家，需要判断
		const playCardPlayerId = RoomService.getGameInfoDeep(roomId, 'playCardPlayerId');  //上一个出牌的玩家
		if (_.includes(this.computedCards(gangArr), activeCardNum % 50)) {
			gangCards = _.concat([], oldGangCards || [], gangArr, [activeCardNum]);
			RoomService.updateRoomInfoDeep("playedCards", playCardPlayerId, roomInfo, _.filter(roomInfo[playCardPlayerId]?.playedCards, o=> o !== activeCardNum))
		} else {
			const allPlayedCards = RoomService.getGameInfoDeep(roomId, "allPlayedCards");
			const correctCardNum = _.find(allPlayedCards, o=> o%50 === gangArr[0]%50);
			gangCards = _.concat([], oldGangCards || [], gangArr, [correctCardNum]);
			RoomService.updateRoomInfoDeep("playedCards", playCardPlayerId, roomInfo, _.filter(roomInfo[playCardPlayerId]?.playedCards, o => o !== correctCardNum))
		}
		RoomService.updateRoomInfoDeep("gangCards", playerId, roomInfo, gangCards);
		RoomService.updateGameCollectionsDeep(roomId, "optionTime", moment().valueOf());
		RoomService.updateGameCollectionsDeep(roomId, "optionPos", this.getPosById(roomId,playerId));
		return RoomService.getRoomInfo(roomId);
	},
	/**
	 * 胡牌
	 * 【结算分数】
	 * 【杠牌算 杠数*10分】
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
				cards: this.adjustHandCards(_.concat([], _.get(value, 'handCards'), key === playerId ? [cardNum] : null)),
				isWinner: key === playerId,
				gangCount: key === playerId ? gangCount : 0,
				score: key === playerId ? gangCount * this.gangScore + this.winScore : -(this.winScore)
			}
		})
		return result;
	},
	/**
	 * 流局
	 * 【结算分数】
	 * 【杠牌算 杠数*10分】
	 */
	flow: function (roomId,playerId, cardNum){
		const SocketService = require("@/core/socket/SocketService");
		const ws = SocketService.getInstance();
		// cardNum 有数据则是胡别人的牌， cardNum无数据则是自摸胡牌
		const roomInfo = RoomService.getRoomInfo(roomId);
		let result = {}
		_.forEach(roomInfo, (value, key) => {
			const handCards = _.get(roomInfo, `${key}.handCards`);
			const playedCards = _.get(roomInfo, `${key}.playedCards`);
			const cards = _.concat([], handCards, playedCards, cardNum);
			let gangCount = 0;
			// 检查是否有杠牌
			for (let i = 0; i < cards.length - 3; i++) {
				if (cards[i] % 50 === cards[i + 1] % 50 && cards[i] % 50 === cards[i + 2] % 50 && cards[i] % 50 === cards[i + 3] % 50) {
					gangCount++
				}
			}
			result[key] = {
				cards: this.adjustHandCards(_.concat([], _.get(value, 'handCards'), key === playerId ? [cardNum] : null)),
				isWinner: null,
				isFlow: true,
				gangCount: gangCount,
				score: gangCount * this.gangScore
			}
		})
		_.forEach(roomInfo, (value, key) => {
			ws.sendToUser(key, "流局，无人胜出", {result}, "flow");
		})
		return result;
	}
}

module.exports = GameService
