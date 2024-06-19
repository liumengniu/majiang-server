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
				console.log('ws.userId', ws.userId);
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
			message = JSON.parse(message);
			switch (message.type) {
				case 'setUserId':
					console.log('11111111111111');
					this.ws.userId = message.data;
					this.sendMessage(stringify({message: '设置成功', data:{userId: message.data},type: "setUserId"}));
					break;
			}
			console.log('重连用户', message.data);
			let roomId = await cacheClient.get('userRoom', message.data);
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
	sendToUser(userId, message,data,type){
		console.log(userId, message,data,type,'-----------------')
		this.client.clients.forEach(ws => {
			console.log('-wsws----------------', ws)
			if (ws.userId === userId) {
				console.log('推送用户：', ws.userId);
				ws.send(stringify({message, data,type}));
			}
		})
	}
	//广播给房间
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
