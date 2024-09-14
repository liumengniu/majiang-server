/**
 * websocket相关服务（微信小程序端没有默认支持socket.io(需要自己额外处理)，这里用websocket）
 * @author Kevin
 * @Date: 2024-6-18
 */
const WebSocket = require('ws');
const _ = require("lodash");
const moment = require("moment")
const cacheClient = require("@/utils/cacheClient");
const Utils = require("@/utils");
const stringify = require('fast-json-stable-stringify');
const RoomService = require("@/core/services/RoomService");
const PlayerService = require("@/core/services/PlayerService");
const GameService = require("@/services/game/GameService");
const SocketApi = require("@socket/SocketApi");

class SocketService{
	constructor(){
		this.client = new WebSocket.Server({port: 8082});
		this.ws = null;
		this._instance = null;
	}
	
	static getInstance(){
		if(!this._instance){
			this._instance = new SocketService();
		}
		return this._instance;
	}
	
	init(){
		console.log(`
                --------------------------------------------------------------------------

                                            websocket 服务启动监听

                --------------------------------------------------------------------------
            `);
		let _this = this;
		this.client.on('connection', function connection(ws, req) {
			console.log(req,"------------------------",ws)
			let url = _.get(req, 'url');
			let params = _.split(url, '=');
			let id = params[1];
			_this.ws = ws;
			ws.req = req;
			ws.sendJson = function (json) {
				if (this.readyState === 1) {
					_this.sendMessage(stringify(json));
				}
			};
			_this.sendMessage('连接成功');
			ws.on('message', async function (message) {
				console.log(message.toString());
				await _this.onMessageHandle(message.toString(), ws.userId);
			});
			ws.on('close', async function(e) {
				let userId = id || ws.userId;
				await _this.onCloseHandle(e, userId);
			});
			ws.on('error', async function() {
				await _this.onErrorHandle();
			});
		})
	}
	/**
	 * 服务端回调操作
	 * @param message
	 * @param userId
	 * @returns {Promise<void>}
	 */
	async onMessageHandle(message, userId){
		console.log(message, userId, '-----------==============--------------===============')
		if (message === 'HeartBeat') {
			console.log('心跳反回了吗');
			this.sendHeartBeat(userId);
		} else if(Utils.isJSON(message)) {
			const parseMessage = JSON.parse(_.cloneDeep(message));
			this.onMessageTypeHandle(parseMessage)
			let roomId = await cacheClient.get('userRoom', parseMessage.data);
			if (roomId) {
				let roomInfo = RoomService.getRoomInfo(roomId);
				if (roomInfo?.roomStatus === 2) {
					this.ws.send(stringify({message:'重连推送', roomInfo,type:'Me'}));
				} else {
					this.ws.send("房间游戏已结束");//如果要渲染结算界面，可以推送房间信息
				}
			}
		} else {
			console.log(message);
		}
	}
	
	/**
	 * websocket回调(根据约定的消息类型)
	 * @param message
	 */
	onMessageTypeHandle(message) {
		const type = message.type;
		const data = message?.data;
		if (type === SocketApi["setUserId"]) {
			this.ws.userId = message.data;
			this.sendMessage(stringify({message: '设置成功', data: {userId: message.data}, type: "setUserId"}));
		} else if (type === SocketApi["startGame"]) {
			const roomInfo = GameService.startGame(message?.roomId);
			const gameInfo = RoomService.getGameInfo(message?.roomId)
			const jsonData = {roomInfo, gameInfo}
			this.broadcastToRoom(_.keys(roomInfo), `房间${message?.roomId}游戏开始`, jsonData, 'startGame')
		} else if(type === SocketApi["reconnect"]){  //断线重连，获取全部数据
			const playerId = data?.userId;
			const roomId = PlayerService.getRoomId(playerId);
			const playerInfo = PlayerService.getPlayerInfo(playerId);
			const gameInfo = RoomService.getGameInfo(roomId)
			const roomInfo = RoomService.getRoomInfo(roomId);
			this.sendToUser(playerId, `断线重连成功，继续游戏`, {playerInfo, roomInfo, gameInfo, playerId}, 'reconnect');
		}else if (type === SocketApi["playCard"]) {
			// 1.更新服务器数据
			const roomInfo = GameService.playCard(data?.roomId, data?.cardNum, data?.userId);
			const gameInfo = RoomService.getGameInfo(data?.roomId)
			const keys = _.keys(roomInfo);
			// 2. 新数据推送给相关玩家
			const jsonData = {roomInfo, gameInfo, cardNum: data?.cardNum, playerId: data?.userId, playCardTime: moment().valueOf()}
			this.broadcastToRoom(keys, `房间${data?.roomId}玩家出牌`, jsonData, 'playCard')
			// 3. 检测其他玩家是否需要打出的牌
			GameService.handleOtherPlayerCard(data.roomId, data.userId, data.cardNum)
			// 4. 这张牌其他玩家可以处理（碰杠胡），推送给能处理的玩家
		} else if (type === SocketApi["peng"]) {
			// 1. 修改游戏数据
			const roomInfo = GameService.peng(data?.roomId, data.userId, data?.pengArr)
			const gameInfo = RoomService.getGameInfo(data?.roomId)
			// 2. 新数据推送给相关玩家
			const jsonData = {roomInfo,gameInfo, pengArr: data?.pengArr, playerId: data?.userId, playCardTime: moment().valueOf()}
			this.broadcastToRoom(_.keys(roomInfo), `房间${data?.roomId}玩家${data.userId}开碰`, jsonData, 'peng')
		} else if (type === SocketApi["gang"]) { //杠牌
			const roomInfo = GameService.gang(data?.roomId, data.userId, data?.gangArr)
			const gameInfo = RoomService.getGameInfo(data?.roomId)
			const jsonData = { roomInfo, gameInfo, gangArr: data?.gangArr,playerId: data?.userId,playCardTime: moment().valueOf() }
			this.broadcastToRoom(_.keys(roomInfo), `房间${data?.roomId}玩家${data.userId}开杠`, jsonData, 'gang')
		} else if (type === SocketApi["win"]) { //胡牌
			const result = GameService.win(data?.roomId, data.userId, data?.cardNum);
			const jsonData = { result,playerId: data?.userId,playCardTime: moment().valueOf() }
			this.broadcastToRoom(_.keys(result), `房间${data?.roomId}玩家${data.userId}胡牌`, jsonData, 'winning')
		} else {

		}
	}

	/**
	 * ws关闭回调
	 * @param e
	 * @param userId
	 * @returns {Promise<void>}
	 */
	async onCloseHandle(e,userId){
		console.log("------------------onCloseHandle---------------------")
		let roomId = PlayerService.getRoomId(userId);
		if(roomId){
			// RoomService.disconnect(roomId, userId);
		} else {
			// PlayerService.cleanUserStatus(userId);
		}
	}

	/**
	 * ws错误异常回调
	 */
	onErrorHandle(){
		console.log("------------------onErrorHandle---------------------")
	}
	//---------------------服务端主动操作---------------------
	/**
	 * 单发消息
	 * @param data
	 */
	sendMessage(data){
		this.ws.send(data);
	}
	
	/**
	 * 心跳检测 - 回传
	 * @param userId
	 */
	sendHeartBeat(userId) {
		this.client.clients.forEach(ws => {
			if (ws.userId === userId) {
				ws.send('HeartBeat');
			}
		})
	}
	/**
	 * 单发消息给指定用户
	 * @param userId
	 * @param message
	 * @param data
	 * @param type
	 */
	sendToUser(userId, message, data, type) {
		this.client.clients.forEach(ws => {
			if (ws.userId === userId) {
				console.log(`推送至用户id${ws.userId}的消息`,  message, data, type);
				ws.send(stringify({message, data, type}));
			}
		})
	}
	
	/**
	 * 广播给房间全部玩家
	 * @param userIds
	 * @param message
	 * @param data
	 * @param type
	 */
	broadcastToRoom(userIds, message, data, type) {
		for(let i=0;i<userIds.length;i++){
			let userId = userIds[i];
			this.client.clients.forEach(ws => {
				if (ws.userId === userId) {
					ws.send(stringify({message, data,type}));
				}
			})
		}
	}

	/**
	 * 通过条件广播给房间内不同玩家
	 * @param roomInfo
	 * @param userId
	 */
	sendDifferenceUser(roomInfo, userId) {
		for(let key in roomInfo){
			if (key === userId) {
				this.ws.sendToUser(userId,'自己操作', roomInfo, 'Me');
			} else {
				this.ws.sendToUser(key,'他人操作', roomInfo, 'Other');
			}
		}
	}
}

module.exports =  SocketService;
