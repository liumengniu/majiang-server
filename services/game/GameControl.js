/**
 * 操作游戏
 * @author Kevin
 * @Date:
 */
const _ = require("lodash")
const GameService = require("@/services/game/GameService");
const RoomService = require("@coreServices/RoomService");
const PlayerService = require("@coreServices/PlayerService");
const moment = require("moment")
const stringify = require("fast-json-stable-stringify");

const GameControl = {
	/**
	 * 设置长连接唯一标识
	 * @param message
	 * @param ws
	 */
	setUserId: function (message, ws) {
		ws.ws.userId = message.data;
		ws.sendMessage(stringify({message: '设置成功', data: {userId: message.data}, type: "setUserId"}));
	},
	/**
	 * 开始游戏
	 * @param message
	 * @param ws
	 */
	startGame: function (message, ws) {
		const roomInfo = GameService.startGame(message?.roomId);
		const gameInfo = RoomService.getGameInfo(message?.roomId)
		const jsonData = {roomInfo, gameInfo}
		ws.broadcastToRoom(_.keys(roomInfo), `房间${message?.roomId}游戏开始`, jsonData, 'startGame')
	},
	/**
	 * 断线重连
	 * @param message
	 * @param ws
	 */
	reconnect: function (message, ws) {
		const data = message?.data;
		const playerId = data?.userId;
		const roomId = PlayerService.getRoomId(playerId);
		const playerInfo = PlayerService.getPlayerInfo(playerId);
		const gameInfo = RoomService.getGameInfo(roomId)
		const roomInfo = RoomService.getRoomInfo(roomId);
		ws.sendToUser(playerId, `断线重连成功，继续游戏`, {playerInfo, roomInfo, gameInfo, playerId}, 'reconnect');
	},
	/**
	 * 出牌
	 * @param message
	 * @param ws
	 */
	playCard: function (message, ws) {
		const data = message?.data;
		// 1.更新服务器数据
		const roomInfo = GameService.playCard(data?.roomId, data?.cardNum, data?.userId);
		const gameInfo = RoomService.getGameInfo(data?.roomId)
		const keys = _.keys(roomInfo);
		// 2.新数据推送给相关玩家
		const jsonData = {roomInfo, gameInfo, cardNum: data?.cardNum, playerId: data?.userId, playCardTime: moment().valueOf()}
		ws.broadcastToRoom(keys, `房间${data?.roomId}玩家出牌`, jsonData, 'playCard')
		// 3. 检测其他玩家是否需要打出的牌
		GameService.handleOtherPlayerCard(data.roomId, data.userId, data.cardNum)
	},
	/**
	 * 碰
	 * @param message
	 * @param ws
	 */
	peng: function (message, ws){
		const data = message?.data;
		// 1. 修改游戏数据
		const roomInfo = GameService.peng(data?.roomId, data.userId, data?.pengArr)
		const gameInfo = RoomService.getGameInfo(data?.roomId)
		// 2. 新数据推送给相关玩家
		const jsonData = {roomInfo,gameInfo, pengArr: data?.pengArr, playerId: data?.userId, playCardTime: moment().valueOf()}
		ws.broadcastToRoom(_.keys(roomInfo), `房间${data?.roomId}玩家${data.userId}开碰`, jsonData, 'peng')
	},
	/**
	 * 杠
	 * @param message
	 * @param ws
	 */
	gang: function (message, ws) {
		const data = message?.data;
		const roomInfo = GameService.gang(data?.roomId, data.userId, data?.gangArr)
		const gameInfo = RoomService.getGameInfo(data?.roomId)
		const jsonData = { roomInfo, gameInfo, gangArr: data?.gangArr,playerId: data?.userId,playCardTime: moment().valueOf() }
		ws.broadcastToRoom(_.keys(roomInfo), `房间${data?.roomId}玩家${data.userId}开杠`, jsonData, 'gang')
	},
	/**
	 * 胡牌
	 * @param message
	 * @param ws
	 */
	win: function (message, ws){
		const data = message?.data;
		const result = GameService.win(data?.roomId, data.userId, data?.cardNum);
		const jsonData = { result,playerId: data?.userId,playCardTime: moment().valueOf() }
		ws.broadcastToRoom(_.keys(result), `房间${data?.roomId}玩家${data.userId}胡牌`, jsonData, 'winning')
	}
}

module.exports = GameControl