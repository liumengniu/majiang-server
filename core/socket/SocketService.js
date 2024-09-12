/**
 * websocket相关服务（微信小程序端不兼容socket.io，这里用websocket）
 * @author Kevin
 * @Date: 2024-6-18
 */
const WebSocket = require('ws');
const cacheClient = require("./../../utils/cacheClient");
const Utils = require("./../../utils");
const stringify = require('fast-json-stable-stringify');
const _ = require("lodash");
const RoomService = require("../app/RoomService");
const PlayerManager = require("../app/PlayerManager");
const GameService = require("../../services/game/GameService");
const moment = require("moment")

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
	//---------------------服务端回调操作--------------------------
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
				let roomInfo = RoomService.rooms[roomId];
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
		if (message.type === "setUserId") {
			this.ws.userId = message.data;
			this.sendMessage(stringify({message: '设置成功', data: {userId: message.data}, type: "setUserId"}));
		} else if (type === "startGame") {
			let roomInfo = GameService.startGame(message?.roomId);
			const gameInfo = RoomService.getGameInfo(message?.roomId)
			for (let k in roomInfo) {
				this.sendToUser(k, `房间${message?.roomId}游戏开始`, {roomInfo, gameInfo}, 'startGame');
			}
		} else if (type === "playCard") {
			// 1.更新服务器数据
			const roomInfo = GameService.playCard(data?.roomId, data?.cardNum, data?.userId);
			const gameInfo = RoomService.getGameInfo(data?.roomId)
			console.log("开始推送给", roomInfo)
			// 2. 新数据推送给相关玩家
			for (let k in roomInfo) {
				this.sendToUser(k, `房间${data?.roomId}玩家出牌`, {
					roomInfo,
					gameInfo,
					cardNum: data?.cardNum,
					playerId: data?.userId,
					playCardTime: moment().valueOf()
				}, 'playCard');
			}
			// 3. 检测其他玩家是否需要打出的牌
			GameService.handleOtherPlayerCard(data.roomId, data.userId, data.cardNum)
			// 4. 这张牌其他玩家可以处理（碰杠胡），推送给能处理的玩家
		} else if (type === "peng") {
			// 1. 修改游戏数据
			const roomInfo = GameService.peng(data?.roomId, data.userId, data?.pengArr)
			// 2. 新数据推送给相关玩家
			for (let k in roomInfo) {
				this.sendToUser(k, `房间${data?.roomId}玩家${data.userId}开碰`, {
					roomInfo: roomInfo,
					pengArr: data?.pengArr,
					playerId: data?.userId,
					playCardTime: moment().valueOf()
				}, 'peng');
			}
		} else if (type === "gang") { //杠牌
			const roomInfo = GameService.gang(data?.roomId, data.userId, data?.gangArr)
			for (let k in roomInfo) {
				this.sendToUser(k, `房间${data?.roomId}玩家${data.userId}开杠`, {
					roomInfo: roomInfo,
					gangArr: data?.gangArr,
					playerId: data?.userId,
					playCardTime: moment().valueOf()
				}, 'gang');
			}
		} else if (type === "win") { //胡牌
			const result = GameService.win(data?.roomId, data.userId, data?.cardNum);
			const roomInfo = GameService.peng(data?.roomId, data.userId, data?.pengArr)
			for (let k in roomInfo) {
				this.sendToUser(k, `房间${data?.roomId}玩家${data.userId}胡牌`, {
					result,
					playerId: data?.userId,
					playCardTime: moment().valueOf()
				}, 'winning');
			}
		} else {

		}
	}
	
	async onCloseHandle(e,userId){
		let roomId = PlayerManager.getRoomId(userId);
		if(roomId){
			RoomService.disconnect(roomId, userId);
		} else {
			PlayerManager.cleanUserStatus(userId);
		}
	}
	
	onErrorHandle(){
		console.log("------------------onErrorHandle---------------------")
	}
	//---------------------服务端主动操作---------------------
	//单发消息
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
	//单发消息给单个用户
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
	broadcastToRoom(userIds, message,data,type){
		for(let i=0;i<userIds.length;i++){
			let userId = userIds[i];
			this.client.clients.forEach(ws => {
				if (ws.userId === userId) {
					console.log('推送用户：', this.ws.userId);
					ws.send(stringify({message, data,type}));
				}
			})
		}
	}
	
	// 通过条件广播给房间内不同玩家
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
