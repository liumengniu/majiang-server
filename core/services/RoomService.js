const models = require("@/models");
const User = models.User;
const _ = require("lodash");
const moment = require("moment")
const PlayerService = require("@/core/services/PlayerService");
/**
 * 数据结构
 * 1、rooms {roomId: roomInfo}
 * roomInfo.id    房间id  roomId
 * roomInfo.status  玩家的房间状态  0 未准备  1 准备  2 游戏中  3 已解散
 * roomInfo.score   玩家的分数
 *
 * 2 roomIds  [...roomId]
 *
 * 3 scoreInfos { roomId: gameInfo }
 *  gameInfo.activeIdx       服务端最后发给玩家的牌的索引
 *  gameInfo.lastActiveIdx   服务端最后发给杠牌玩家的牌的索引
 *  gameInfo.cards           服务端当前洗完牌的集合
 */


const RoomService = {
	/**
	 * 房间数据集合
	 */
	rooms: {},
	/**
	 * 房间id集合
	 */
	roomIds: [],
	/**
	 * 所有房间游戏情况集合
	 */
	gameCollections: {},
	/**
	 * 创建房间
	 * @param playerId
	 */
	createRoom: async function (playerId) {
		let isLogin = this.checkIsLogin(playerId);
		console.log(PlayerService.getPlayerInfo(playerId), '======playerIdplayerIdplayerIdplayerIdplayerId===============', PlayerService)
		if (isLogin) {
			let roomId = this.createRoomId();
			this.roomIds.push(roomId);
			let user = {};
			try {
				user = await User.findOne({where: {id: playerId}});
			} catch (e) {
			}
			let data = _.zipObject([playerId], [{
				id: playerId, roomId: roomId, status: 1, score: 0, isHomeOwner: true, pos: 0, optionPos: 0,
				roomRule: user.roomRule || 0, avatar: user.avatar, name: user.name, isHint: user.isHint || 0
			}]);
			this.rooms = this.updateRoomInfo(roomId, this.rooms, data);
			// 设置玩家房间号 和 玩家位置
			let playerInfo = {pos: 0, roomId,  playerStatus: 2};
			PlayerService.updatePlayerInfo(playerId, playerInfo);
			return RoomService.getRoomInfo(roomId);
		} else {
			throw null
		}
	},
	
	/**
	 * 加入房间
	 * @param roomId
	 * @param playerId
	 */
	joinRoom: async function (roomId, playerId) {
		let count = this.getPlayerCount(roomId);
		let isRoomExist = this.isRoomExist(roomId);
		let isLogin = this.checkIsLogin(playerId);
		if (!isLogin) {
			throw "用户未登录";
			return;
		}
		if (!isRoomExist) {
			throw "房间已被解散";
			return;
		}
		if (count >= 4) {
			throw "房间已满";
			return;
		}
		console.log("----------------------------");
		let roomInfo = _.get(this.rooms, roomId);
		const user = await User.findOne({where: {id: playerId}});
		let playerCount = this.getPlayerCount(roomId);
		PlayerService.setPos(roomId, playerId, playerCount);
		let data = _.assign(roomInfo, _.zipObject([playerId], [{
			id: playerId,
			roomId: roomId,
			status: 0,
			score: 0,
			isHomeOwner: false,
			pos: playerCount,
			optionPos: 0,
			roomRule: 0,
			avatar: user.avatar,
			name: user.name,
			isHint: true
		}]));
		this.rooms = this.updateRoomInfo(roomId, this.rooms, data);
		// 设置玩家房间号 和 玩家位置
		let playerInfo = {pos: count, roomId, playerStatus: 2};
		PlayerService.updatePlayerInfo(playerId, playerInfo);
		// ----- end  -----
		return _.get(this.rooms, roomId, {});
	},
	
	/**
	 * 退出房间
	 * @param roomId
	 * @param playerId
	 */
	quitRoom: function (roomId, playerId) {
		if(!roomId){
			roomId = PlayerService.getRoomId(playerId);
		}
		let isInRoom = PlayerService.isPlayerInRoom(roomId, playerId);
		if (isInRoom) {   //在房间内
			let roomInfo = _.get(this.rooms, roomId);
			let oldPlayerInfo = _.get(roomInfo, playerId);
			let isHomeOwner = _.get(oldPlayerInfo, 'isHomeOwner');
			let newRoomInfo = _.omit(roomInfo, playerId);
			//如果房间只有一个人，直接解散房间,清除房间的数据
			if (_.size(newRoomInfo) <= 0) {
				this.disbandRoom(roomId);
				return;
			}
			if (isHomeOwner) {
				// 1、该玩家是房主，房主退房，后面的补位
				let ids = _.keys(newRoomInfo);
				let nextPlayerId = "";
				for (let i = 0; i < ids.length; i++) {
					let pos = PlayerService.getPos(ids[i]);
					if (pos === 1) {
						nextPlayerId = ids[i];
						break;
					}
				}
				//清除个人在房间内的数据,仅保留登录态
				PlayerService.cleanUserRoomStatus(playerId);
				PlayerService.setPos(roomId, nextPlayerId, 0);
				_.set(this.rooms, `${roomId}.${nextPlayerId}.isHomeOwner`, true);
			}
			this.rooms = this.updateRoomInfo(roomId, this.rooms, newRoomInfo);
		}
		return this.getRoomInfo(roomId);
	},
	
	
	/**
	 * 掉线操作
	 * @param roomId
	 * @param playerId
	 */
	disconnect: function (roomId, playerId) {
		let isInRoom = PlayerService.isPlayerInRoom(roomId, playerId);
		if (isInRoom) {
			let roomInfo = _.get(this.rooms, roomId);
			let oldPlayerInfo = _.get(roomInfo, playerId);
			// ----  该玩家在游戏中  -----
			let playerStatus = _.get(oldPlayerInfo, 'status');
			if (playerStatus === 2) {
				// ----  该玩家在游戏中  -----
				// 则什么都不执行
				//todo --------暂时玩家在游戏中，依然清除全部数据，后期改为断线重连------------
				// ----  该玩家不在游戏中  -----
				let isHomeOwner = _.get(oldPlayerInfo, 'isHomeOwner');
				let data = _.omit(roomInfo, playerId);
				// 清除玩家与房间有关的属性
				// todo 不清除玩家信息，等待下一次重连
				// PlayerService.cleanUserStatus(playerId);
				//如果房间只有一个人，直接解散房间,清除房间的数据
				if (!_.size(data)) {
					this.disbandRoom(roomId);
					return;
				}
				if (isHomeOwner) {
					// 1、该玩家是房主，房主退房，后面的补位
					let ids = _.keys(data);
					let nextPlayerId = "";
					for (let i = 0; i < ids.length; i++) {
						let pos = PlayerService.getPos(ids[i]);
						if (pos === 1) {
							nextPlayerId = ids[i];
							break;
						}
					}
					PlayerService.setPos(roomId, nextPlayerId, 0);
					_.set(this.rooms, `${roomId}.${nextPlayerId}.isHomeOwner`, true);
				}
				this.rooms = this.updateRoomInfo(roomId, this.rooms, data);
				//todo -------------------------  end -------------------------------
			} else {
				// ----  该玩家不在游戏中  -----
				let isHomeOwner = _.get(oldPlayerInfo, 'isHomeOwner');
				let data = _.omit(roomInfo, playerId);
				//清除玩家与房间有关的属性

				// PlayerService.cleanUserStatus(playerId);

				//如果房间只有一个人，直接解散房间,清除房间的数据
				if (!_.size(data)) {
					this.disbandRoom(roomId);
					return;
				}
				if (isHomeOwner) {
					// 1、该玩家是房主，房主退房，后面的补位
					let ids = _.keys(data);
					let nextPlayerId = "";
					for (let i = 0; i < ids.length; i++) {
						let pos = PlayerService.getPos(ids[i]);
						if (pos === 1) {
							nextPlayerId = ids[i];
							break;
						}
					}
					PlayerService.setPos(roomId, nextPlayerId, 0);
					_.set(this.rooms, `${roomId}.${nextPlayerId}.isHomeOwner`, true);
				}
				this.rooms = this.updateRoomInfo(roomId, this.rooms, data);
			}
		}
		//推送给客户端
		let roomInfo = _.get(this.rooms, roomId);
		const SocketService = require("../socket/SocketService");
		const ws = SocketService.getInstance();
		for (let pid in roomInfo) {
			ws.sendToUser(pid, `用户${pid}已经退出房间`, roomInfo, 'quit');
		}
		return _.get(this.rooms, roomId, {});
	},
	
	/**
	 * 解散房间
	 * @param roomId
	 */
	disbandRoom: function (roomId) {
		const roomInfo = this.getRoomInfo(roomId);
		this.rooms = _.omit(this.rooms, roomId);
		this.roomIds = _.filter(this.roomIds, o=> o !== roomId);
		const keys = _.keys(roomInfo);
		this.updateGameCollections(roomId, null)
		this.updateRoomInfo(roomId, this.rooms, null)
		_.map(keys, k=>{
			PlayerService.updatePlayerInfo(k, {
				isLogin: true,
				playerStatus: 1,
			})
		})
	},
	
	/**
	 * 生成房间 id
	 */
	createRoomId: function () {
		let newId;
		while (true) {
			newId = (Math.round(Math.random() * 900000) + 100000).toString();
			if (!_.includes(this.roomIds, newId)) {
				break;
			}
		}
		return newId;
	},
	/**
	 * 设置房间状态
	 * @param roomId   (0 房间存在  1 房间已在游戏中 )
	 */
	setRoomStatus: function (roomId) {

	},
	
	/**
	 * 检查登录态
	 * @param playerId
	 */
	checkIsLogin: function (playerId) {
		let isLogin = PlayerService.getIsLogin(playerId);
		return isLogin
	},
	
	/**
	 * 检查登录态和是否已在房间内
	 * @param roomId
	 * @param playerId
	 */
	checkLoginAndInRoom: function (roomId, playerId) {
		let isLogin = PlayerService.getIsLogin(playerId);
		if (!isLogin) { // 未登录
			return false;
		}
		let isInRoom = PlayerService.isPlayerInRoom(roomId, playerId);
		if (isInRoom) {  // 用户已在房间内
			return false;
		}
		return true;
	},
	
	/**
	 * 获取房间人数
	 * @param roomId
	 */
	getPlayerCount: function (roomId) {
		let count = 0;
		if (!roomId) {
			return 0;
		}
		let roomInfo = _.get(this.rooms, roomId);
		if (!_.isEmpty(roomInfo)) {
			count = _.size(roomInfo);
		}
		return count;
	},
	
	/**
	 * 房间是否存在
	 * @param roomId
	 */
	isRoomExist: function (roomId) {
		let roomInfo = _.get(this.rooms, roomId);
		if (_.isEmpty(roomInfo)) {
			return false;
		}
		return true;
	},
	
	/**
	 * 房间是否人数已满
	 * @param roomId
	 */
	checkRoomIsFull: function (roomId) {
		let roomInfo = _.get(this.rooms, roomId);
		let count = this.getPlayerCount(roomId);
		if (count === 4) {
			return true;
		}
		return false;
	},
	
	/**
	 * 获取房间的游戏规则
	 * @param roomId
	 * @param playerId
	 */
	getRoomRule: function (roomId, playerId) {
		let roomInfo = _.get(this.rooms, roomId);
		let roomRule;
		for (let key in roomInfo) {
			roomRule = roomInfo[key].roomRule;
			break;
		}
		return roomRule;
	},
	
	/**
	 * 房间用户准备
	 * @param roomId
	 * @param playerId
	 * @param status
	 */
	setout: function (roomId, playerId, status) {
		let isLogin = this.checkIsLogin(playerId);
		if (isLogin) {
			let roomInfo = _.get(this.rooms, roomId);
			let playerInfo = _.get(roomInfo, playerId);
			if (playerInfo) {
				let data = _.cloneDeep(playerInfo);
				data.status = status;
				let newPlayerInfo = _.zipObject([playerId], [data]);
				let res = _.assign({}, roomInfo, newPlayerInfo);
				this.rooms = this.updateRoomInfo(roomId, this.rooms, res);
			}
		}
		return _.get(this.rooms, roomId)
	},
	
	/**
	 * 获取房间内数据
	 * @param roomId
	 */
	getRoomInfo: function (roomId) {
		return _.get(this.rooms, roomId);
	},
	
	/**
	 * 获取房间内用户的数据
	 * @param roomId
	 * @param playerId
	 */
	getRoomPlayerInfo: function (roomId, playerId) {
		let roomInfo = this.getRoomInfo(roomId);
		let playerInfo = _.get(roomInfo, playerId);
		return playerInfo;
	},

	/**
	 * 更新全部房间数据（！！！！！！！！慎用！！！！！！！！！！！）
	 * @param newRooms
	 */
	updateRooms: function (newRooms){
		this.rooms = _.cloneDeep(newRooms);
	},
	/**
	 * 更新某个房间的全部数据
	 * @param roomId
	 * @param rooms
	 * @param data
	 * @returns {*}
	 */
	updateRoomInfo(roomId, rooms, data) {
		if(_.isEmpty(data)){
			this.rooms = _.omit(rooms, roomId)
			return this.rooms
		}
		_.set(rooms, [roomId], data);
		return this.rooms;
	},
	/**
	 * 修改房间某个玩家的全部数据
	 * @param playerId   修改的某个玩家id
	 * @param roomInfo   原房间roomInfo的数据
	 * @param data       修改后的rooms数据
	 * @returns {*}
	 */
	updateRoomInfoShallow(playerId, roomInfo, data){
		let response;
		response = _.set(roomInfo, [playerId], data);
		return _.cloneDeep(response);
	},
	/**
	 * 修改房间第二层数据
	 * （房间某个玩家的某个字段数据）
	 * @param type       修改的属性
	 * @param playerId   修改的某个玩家id
	 * @param roomInfo   原房间roomInfo的数据
	 * @param data       需要修改的房间某个属性的值
	 * @returns {*}
	 */
	updateRoomInfoDeep(type, playerId, roomInfo, data){
		let response;
		response = _.set(roomInfo, `${playerId}.${type}`, data);
		return roomInfo;
	},
	/**
	 * 整理手牌(万、条、索合并并排序)
	 * @param cards
	 * @returns {*}
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
	 * 更新手牌数据
	 * @param roomId
	 * @param playerId
	 * @param newCardNum
	 * @returns {{newCards: *, newRoomInfo: *}}
	 */
	updateHandCards: function (roomId, playerId, newCardNum){
		let roomInfo = this.getRoomInfo(roomId);
		let newHandCards = _.concat([], _.get(roomInfo, `${playerId}.handCards`, []), [newCardNum])
		// 摸牌之后，重新洗手牌排序
		const newCards = this.adjustHandCards(newHandCards);
		const newRoomInfo = this.updateRoomInfoDeep("handCards", playerId, roomInfo, newCards)
		return {newRoomInfo, newCards};
	},

	/**
	 * 初始化 gameCollections 的数据
	 * @param roomId
	 * @param activeCardIdx
	 * @param cards
	 */
	initGameCollections(roomId, activeCardIdx, cards){
		let gameCollections = {};
		gameCollections[roomId] = {
			activeCardIdx: _.toNumber(activeCardIdx),
			lastActiveCardIdx: _.size(cards) - 1,
			cards,
			optionPos: 0,
			optionTime: moment().valueOf()
		}
		this.gameCollections = _.cloneDeep(gameCollections)
	},

	/**
	 * 获取当前房间的游戏信息
	 * @param roomId
	 * @returns {Exclude<GetFieldType<{}, `${string}`>, null | undefined> | {}}
	 */
	getGameInfo: function (roomId){
		return _.get(this.gameCollections, `${roomId}`, {});
	},
	/**
	 * 下发下一张牌
	 * @param roomId
	 */
	getNextCard(roomId) {
		const gameInfo = this.getGameInfo(roomId)
		const oldCards = _.get(gameInfo, `cards`, [])
		const oldActiveCardIdx = _.get(gameInfo, `activeCardIdx`);
		let newActiveCardIdx = _.toNumber(oldActiveCardIdx) + 1;
		this.updateGameCollectionsDeep(roomId, "activeCardIdx", newActiveCardIdx)
		return _.get(oldCards, `${newActiveCardIdx}`) || false;
	},
	/**
	 * 从牌堆尾部下发下一张牌
	 * （对于开杠的玩家，规则是从牌堆屁股补一张）
	 * @param roomId
	 */
	getLastNextCard(roomId){
		const gameInfo = this.getGameInfo(roomId)
		const oldCards = _.get(gameInfo, `cards`, [])
		const oldLastActiveCardIdx = _.get(gameInfo, `lastActiveCardIdx`);
		let newLastActiveCardIdx = _.toNumber(oldLastActiveCardIdx) - 1;
		this.updateGameCollectionsDeep(roomId, "lastActiveCardIdx", newLastActiveCardIdx)
		return _.get(oldCards, `${newLastActiveCardIdx}`);
	},
	/**
	 * 更新某一局游戏信息
	 * @param roomId
	 * @param type
	 * @param data
	 */
	updateGameCollectionsDeep(roomId, type, data){
		let gameInfo = this.getGameInfo(roomId)
		if(_.isArray(data)){
			_.map(data, o=>{
				_.set(gameInfo, o?.type, o?.data);
			})
		} else {
			_.set(gameInfo, type, data);
		}
		this.updateGameCollections(roomId, gameInfo)
		return gameInfo;
	},
	/**
	 * 更新全部游戏信息
	 * @param roomId
	 * @param newGameInfo
	 * @returns {{}}
	 */
	updateGameCollections: function (roomId, newGameInfo){
		if(_.isEmpty(newGameInfo)){
			this.gameCollections = _.omit(this.gameCollections, roomId);
			return this.gameCollections;
		}
		_.set(this.gameCollections, roomId, newGameInfo);
		return this.gameCollections;
	}
};

module.exports = RoomService;
