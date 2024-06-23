// const SocketService = require("./../socket/SocketService");
// const ws = SocketService.getInstance();
const _ = require("lodash");
const PlayerManager = require("./PlayerManager");
const DataHelper = require("./../../utils/DataHelper");
const models = require("./../../models");
const User = models.User;
/**
 * 数据结构
 * 1、rooms {roomId: roomInfo}
 * roomInfo.id    房间id  roomId
 * roomInfo.status  玩家的房间状态  0 未准备  1 准备  2 游戏中
 * roomInfo.score   玩家的分数
 *
 * 2 roomIds  [...roomId]
 *
 * 3 scoreInfos { roomId: gameInfo }
 *  gameInfo.activeIdx   服务端最后发给玩家的牌的索引
 *  gameInfo.cards       服务端当前洗完牌的集合
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
		if (isLogin) {
			let roomId = this.createRoomId();
			this.roomIds.push(roomId);
			let user = {};
			try {
				user = await User.findOne({where: {id: playerId}});
			} catch (e) {
			}
			PlayerManager.setPos(roomId, playerId, 0);
			let data = _.zipObject([playerId], [{
				id: playerId, roomId: roomId, status: 1, score: 0, isHomeOwner: true, pos: 0, optionPos: 0,
				roomRule: user.roomRule || 0, avatar: user.avatar, name: user.name, isHint: user.isHint || 0
			}]);
			this.rooms = DataHelper.setRoomsInfo(roomId, this.rooms, data);
			// 设置玩家房间号 和 玩家位置
			let playerInfo = {pos: 0, roomId};
			PlayerManager.setPlayerInfo(roomId, playerId, playerInfo);
			// ----- end  -----
			return _.get(this.rooms, roomId, {});
		} else {
			return null;
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
		PlayerManager.setPos(roomId, playerId, playerCount);
		let data = _.assign(roomInfo, _.zipObject([playerId], [{
			id: playerId,
			roomId: roomId,
			status: 0,
			score: 0,
			isHomeOwner: false,
			pos: playerCount - 1,
			optionPos: 0,
			roomRule: 0,
			avatar: user.avatar,
			name: user.name,
			isHint: true
		}]));
		this.rooms = DataHelper.setRoomsInfo(roomId, this.rooms, data);
		// 设置玩家房间号 和 玩家位置
		let playerInfo = {pos: count, roomId};
		PlayerManager.setPlayerInfo(roomId, playerId, playerInfo);
		// ----- end  -----
		return _.get(this.rooms, roomId, {});
	},
	
	/**
	 * 退出房间
	 * @param roomId
	 * @param playerId
	 */
	quitRoom: function (roomId, playerId) {
		let isInRoom = PlayerManager.isPlayerInRoom();
		if (isInRoom) {   //在房间内
			let roomInfo = _.get(this.rooms, roomId);
			let oldPlayerInfo = _.get(roomInfo, playerId);
			let isHomeOwner = _.get(oldPlayerInfo, 'isHomeOwner');
			let data = _.omit(roomInfo, playerId);
			//清除个人在房间内的数据,仅保留登录态
			PlayerManager.cleanUserRoomStatus(playerId);
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
					let pos = PlayerManager.getPos(ids[i]);
					if (pos === 1) {
						nextPlayerId = ids[i];
						break;
					}
				}
				PlayerManager.setPos(roomId, nextPlayerId, 0);
				_.set(this.rooms, `${roomId}.${nextPlayerId}.isHomeOwner`, true);
			}
			this.rooms = DataHelper.setRoomsInfo(roomId, this.rooms, data);
		}
		return _.get(this.rooms, roomId, {});
	},
	
	
	/**
	 * 掉线操作
	 * @param roomId
	 * @param playerId
	 */
	disconnect: function (roomId, playerId) {
		let isInRoom = PlayerManager.isPlayerInRoom(roomId, playerId);
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
				//清除玩家与房间有关的属性
				PlayerManager.cleanUserStatus(playerId);
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
						let pos = PlayerManager.getPos(ids[i]);
						if (pos === 1) {
							nextPlayerId = ids[i];
							break;
						}
					}
					PlayerManager.setPos(roomId, nextPlayerId, 0);
					_.set(this.rooms, `${roomId}.${nextPlayerId}.isHomeOwner`, true);
				}
				this.rooms = DataHelper.setRoomsInfo(roomId, this.rooms, data);
				//todo -------------------------  end -------------------------------
			} else {
				// ----  该玩家不在游戏中  -----
				let isHomeOwner = _.get(oldPlayerInfo, 'isHomeOwner');
				let data = _.omit(roomInfo, playerId);
				//清除玩家与房间有关的属性
				PlayerManager.cleanUserStatus(playerId);
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
						let pos = PlayerManager.getPos(ids[i]);
						if (pos === 1) {
							nextPlayerId = ids[i];
							break;
						}
					}
					PlayerManager.setPos(roomId, nextPlayerId, 0);
					_.set(this.rooms, `${roomId}.${nextPlayerId}.isHomeOwner`, true);
				}
				this.rooms = DataHelper.setRoomsInfo(roomId, this.rooms, data);
			}
		}
		//推送给客户端
		let roomInfo = _.get(this.rooms, roomId);
		const SocketService = require("./../socket/SocketService");
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
		this.rooms = _.omit(this.rooms, roomId);
		this.roomIds = _.remove(this.roomIds, roomId);
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
		let isLogin = PlayerManager.getIsLogin(playerId);
		if (!isLogin) { // 未登录
			return false;
		} else {
			return true;
		}
	},
	
	/**
	 * 检查登录态和是否已在房间内
	 * @param roomId
	 * @param playerId
	 */
	checkLoginAndInRoom: function (roomId, playerId) {
		let isLogin = PlayerManager.getIsLogin(playerId);
		if (!isLogin) { // 未登录
			return false;
		}
		let isInRoom = PlayerManager.isPlayerInRoom(roomId, playerId);
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
				let newPlayerInfgo = _.zipObject([playerId], [data]);
				let res = _.assign({}, roomInfo, newPlayerInfgo);
				this.rooms = DataHelper.setRoomsInfo(roomId, this.rooms, res);
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
	}
};

module.exports = RoomService;
