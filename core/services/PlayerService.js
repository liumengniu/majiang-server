/**
 * @author Kevin
 * @Date: 2024-6-18
 */

const _ = require("lodash");

const PlayerService = {
	/**
	 * 数据结构
	 * 1、playerInfos {playerId: playerInfo}
	 * playerInfo.id             玩家id
	 * playerInfo.playerStatus   玩家的状态  0 未登录   1 已登录   2 房间中  3 游戏中
	 * playerInfo.score          玩家的分数
	 * playerInfo.pos            玩家的位置
	 */
	playerInfos: {},
	
	/**
	 * 获取用户全部信息
	 * @param playerId
	 */
	getPlayerInfo: function (playerId) {
		return _.get(this.playerInfos, playerId);
	},
	/**
	 * 设置登录状态
	 * @param playerId
	 * @param isLogin
	 */
	setIsLogin: function (playerId, isLogin) {
		this.updatePlayerInfoDeep("isLogin", playerId, isLogin)
	},
	/**
	 * 得到登录状态
	 * @param playerId
	 */
	getIsLogin: function (playerId) {
		return _.get(this.playerInfos, `${playerId}.isLogin`);
	},
	
	/**
	 * 清除用户状态
	 * @param playerId
	 */
	cleanUserStatus: function (playerId) {  //将用户状态全部置空，恢复到未加入房间且未登录状态
		this.playerInfos = _.cloneDeep(_.omit(this.playerInfos, playerId))
	},
	
	/**
	 * 清除用户房间状态（保留登录态）
	 * @param playerId
	 */
	cleanUserRoomStatus: function (playerId) {  //将用户状态全部置空，恢复到未加入房间且未登录状态
		let data = {isLogin: true, playerStatus: 1};
		this.updatePlayerInfo(playerId, data)
	},
	
	/**
	 * 设置用户在房间操作的全部数据
	 * @param playerId
	 * @param data
	 */
	updatePlayerInfo: function (playerId, data) {
		let oldPlayerInfo = this.getPlayerInfo(playerId);
		let newPlayerInfo = _.assign({}, oldPlayerInfo, data);
		_.set(this.playerInfos, playerId, newPlayerInfo);
		return this.getPlayerInfo(playerId);
	},
	/**
	 * 修改玩家信息某个字段
	 * @param type
	 * @param playerId
	 * @param data
	 */
	updatePlayerInfoDeep: function (type, playerId, data) {
		_.set(this.playerInfos, `${playerId}.${type}`, data);
	},
	/**
	 * 设置用户的房间id
	 * @param roomId
	 * @param playerId
	 */
	setRoomId: function (roomId, playerId) {
		_.set(this.playerInfos, `${playerId}.roomId`, roomId);
	},
	
	/**
	 * 获取用户的房间id
	 * @param playerId
	 */
	getRoomId: function (playerId) {
		if (!playerId) {
			return null;
		}
		return _.get(this.playerInfos, `${playerId}.roomId`, null);
	},
	
	/**
	 * 设置用户在房间的位置
	 * @param roomId
	 * @param pos
	 * @param playerId
	 */
	setPos: function (roomId, playerId, pos) {
		if (pos > 3) {
			return;
		}
		if (pos && playerId) {
			let oldPos = this.getPos(playerId);
			if (!oldPos) {
				_.set(this.playerInfos, `${playerId}.pos`, pos);
			}
		}
	},
	
	/**
	 * 获取用户在房间的位置
	 * @param playerId
	 */
	getPos: function (playerId) {
		if (!playerId) {
			return null;
		}
		return _.get(this.playerInfos, `${playerId}.pos`, null);
	},
	
	/**
	 * 获取用户是否在房间内
	 * @param roomId
	 * @param playerId
	 */
	isPlayerInRoom: function (roomId, playerId) {
		if (this.getRoomId(playerId) === roomId) {
			return true;
		}
		return false;
	}
};

module.exports = PlayerService;
