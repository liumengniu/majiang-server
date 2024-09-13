/**
 * 房间相关controller
 * @author Kevin
 * @Date: 2024-6-18
 */


const Router = require('koa-router');
const SocketService = require("@/core/socket/SocketService");
const RoomService = require("@/core/services/RoomService");
const Validate = require("@/utils/vlidate");
const Errors = require("@/utils/api/errors");
const HttpStatus = require("@/utils/api/httpStatus");
const room = new Router();
const _ = require("lodash")

let ws = SocketService.getInstance();


/**
 * 创建房间
 */
room.post('/createRoom', async ctx =>{
	let { userId } = ctx.request.body;
	let response;
	if(!userId){
		response = Validate.checkSuccess("参数异常", Errors.INVALID_PARAM, HttpStatus.OK, {});
		ctx.body = response;
		return;
	}
	let roomInfo;
	try{
		roomInfo = await RoomService.createRoom(userId);
		console.log(roomInfo, '+++++++++++++++++++++++++++++++++++++++++++');
		if(!_.isEmpty(roomInfo)){
			ws.sendToUser(userId,`恭喜创建房间成功，房号${_.get(roomInfo,`${userId}.roomId`)}`,{roomInfo}, 'create');
		} else {
			ws.sendToUser(userId,`创建房间失败,请稍后重试`,roomInfo, 'create');
		}
	}catch(e){
		ws.sendToUser(userId,`创建房间失败,请稍后重试`,roomInfo, 'create');
	}
	response = Validate.checkSuccess("创建成功", Errors.SUCCESS, HttpStatus.OK, roomInfo);
	ctx.body = response;
})

/**
 * 加入房间
 */
room.post("/joinRoom", async ctx =>{
	let { roomId,userId } = ctx.request.body;
	let response;
	if(!userId){
		response = Validate.checkSuccess("参数异常", Errors.INVALID_PARAM, HttpStatus.OK, {});
		ctx.body = response;
		return;
	}
	let roomInfo;
	try{
		roomInfo = await RoomService.joinRoom(roomId,userId);
		for(let k in roomInfo){
			ws.sendToUser(_.get(roomInfo,`${k}.id`),`欢迎用户${userId}加入房间${roomId}`,{roomInfo},'join');
		}
		response = Validate.checkSuccess("加入成功", Errors.SUCCESS, HttpStatus.OK, roomInfo);
	}catch(e){
		response = Validate.checkSuccess(e, Errors.ROOM_NOT_EXIST, HttpStatus.OK, roomInfo);
	}
	ctx.body = response;
});

/**
 * 退出房间
 */
room.post("/quitRoom", async ctx =>{
	let { roomId,userId } = ctx.request.body;
	let response;
	if(!userId){
		response = Validate.checkSuccess("参数异常", Errors.INVALID_PARAM, HttpStatus.OK, {});
		ctx.body = response;
		return;
	}
	let roomInfo;
	try{
		roomInfo = await RoomService.quitRoom(roomId,userId);
		for(let k in roomInfo){
			ws.sendToUser(_.get(roomInfo,`${k}.id`),`用户${userId}已退出房间${roomId}`,roomInfo,'quit');
		}
		response = Validate.checkSuccess("退出成功", Errors.SUCCESS, HttpStatus.OK, roomInfo);
	}catch(e){
		response = Validate.checkSuccess(e, Errors.ROOM_NOT_EXIST, HttpStatus.OK, roomInfo);
	}
	ctx.body = response;
});

module.exports = room;
