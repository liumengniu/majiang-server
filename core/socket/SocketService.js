/**
 * websocket相关服务（微信小程序端没有默认支持socket.io(需要自己额外处理)，这里用websocket）
 * @author Kevin
 * @Date: 2024-6-18
 */
const WebSocket = require('ws');
const _ = require("lodash");
const Utils = require("@/utils");
const stringify = require('fast-json-stable-stringify');
const GameControl = require("@services/game/GameControl");
const HackService = require("@coreServices/HackService");
const appConfig = require("@/config/AppletsConfig")
const prints = require("@utils/console");

class SocketService{
	constructor(){
		this.client = new WebSocket.Server({port: appConfig.wssPort});
		this.ws = null;
		this.instance = null;
	}

	/**
	 * 单例
	 * @returns {SocketService}
	 */
	static getInstance() {
		if (!this.instance) {
			this.instance = new SocketService();
		}
		return this.instance;
	}

	/**
	 * 初始化websocket服务
	 */
	init(){
		prints.printBanner(`socket服务器启动，监听${appConfig.wssPort}`);
		let _this = this;
		this.client.on('connection', function connection(ws, req) {
			ws.isAlive = true;
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
				await _this.onMessageHandle(message.toString(), ws.userId);
			});
			ws.on('close', async function(e) {
				let userId = id || ws.userId;
				await _this.onCloseHandle(e, userId);
			});
			ws.on('error', async function() {
				await _this.onErrorHandle();
			});
			ws.on('pong', () => { //收到pong帧，连接正常
				ws.isAlive = true;
			});
		})

		// 定期检查连接的心跳
		const interval = setInterval(() => {
			_this.client.clients.forEach(ws => {
				if (ws.isAlive === false) {
					return ws.terminate();
				}
				ws.isAlive = false;
				// 发送ping帧检测websocket是否还活着
				ws.ping();
			});
		}, 30000);

		this.client.on('close', () => {
			clearInterval(interval);
		});
	}


	/**
	 * 服务端回调操作
	 * @param message
	 * @param userId
	 * @returns {Promise<void>}
	 */
	async onMessageHandle(message, userId){
		if (message === 'ping') { //心跳
			console.log('心跳：来自客户端的ping');
			this.sendHeartBeat(userId);
		} else if(Utils.isJSON(message)) {  // API
			const parseMessage = JSON.parse(_.cloneDeep(message));
			if(_.isFunction(GameControl[parseMessage?.type])){
				GameControl[parseMessage?.type](parseMessage, this)
			}
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
		// 不做操作，等待客户断线重连，重连失败，则客户端AI会完成牌局
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
	 * 心跳 - 服务端回传
	 * @param userId
	 */
	sendHeartBeat(userId) {
		this.client.clients.forEach(ws => {
			if (ws.userId === userId) {
				ws.send('pong');
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
				let newRoomInfo = {};
				if (!_.isEmpty(data.roomInfo)) {
					newRoomInfo = HackService.cleanRoomInfo(_.cloneDeep(data.roomInfo), userId);
				}
				let userData = _.cloneDeep(data);
				userData.roomInfo = newRoomInfo;
				ws.send(stringify({message, data: userData, type}));
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
		userIds.forEach(userId => {
			this.client.clients.forEach(ws => {
				if (ws.userId === userId) {
					let newRoomInfo = {};
					if (!_.isEmpty(data.roomInfo)) {
						newRoomInfo = HackService.cleanRoomInfo(_.cloneDeep(data.roomInfo), userId);
					}
					let userData = _.cloneDeep(data);
					userData.roomInfo = newRoomInfo;
					console.log("服务端返回的值", message, userData, type)
					ws.send(JSON.stringify({ message, data: userData, type }));
				}
			});
		});
	}

	/**
	 * 通过条件广播给房间内其他玩家
	 * @param otherIds
	 * @param message
	 * @param data
	 * @param type
	 */
	sendDifferenceUser(otherIds, message, data, type) {
		otherIds.forEach(userId => {
			this.client.clients.forEach(ws => {
				if (ws.userId !== userId) {
					let newRoomInfo = {};
					if (!_.isEmpty(data.roomInfo)) {
						newRoomInfo = HackService.cleanRoomInfo(_.cloneDeep(data.roomInfo), userId);
					}
					let userData = _.cloneDeep(data);
					userData.roomInfo = newRoomInfo;
					console.log("服务端返回的值", message, userData, type)
					ws.send(JSON.stringify({ message, data: userData, type }));
				}
			});
		});
	}
}

module.exports =  SocketService;
