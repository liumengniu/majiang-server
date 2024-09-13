/**
 * @author Kevin
 * @Date: 2024-6-18
 */

const Router = require('koa-router');
const Validate = require("@/utils/vlidate");
const Errors = require("@/utils/api/errors");
const HttpStatus = require("@/utils/api/httpStatus");
const PlayerService = require("@/core/services/PlayerService");
const RoomService = require("@/core/services/RoomService");
const UserService = require("@/services/user/UserService");
const ConfigServices = require("@coreServices/ConfigService");
const user = new Router();
const _ = require("lodash")

/**
 * 注册用户
 */
user.post('/register', async ctx =>{
	const { roomId, userId } = ctx.request.body;
})

user.post('/login', async ctx =>{
	let response;
	let data = ctx.request.body;
	if(!data || !data.account) {
		response = Validate.checkSuccess("参数异常", Errors.INVALID_PARAM, HttpStatus.OK, {});
		ctx.body = response;
	} else {
		// 获取游戏服务器信息
		let gameServerInfo = ConfigServices.getGameServiceConfig();
		// 获取持久化个人信息
		let userInfo = await UserService.login(data);
		// 获取个人游戏信息
		let playerId = _.get(userInfo, 'id');
		let roomId = PlayerService.getRoomId(playerId);
		console.log(PlayerService, '==============PlayerService===============', RoomService.getRoomInfo(roomId))
		let playerInfo;
		if(roomId){  //如果用户在房间内
			let roomInfo = RoomService.getRoomInfo(roomId);
			if(!_.isEmpty(roomInfo)){  //且房间还存在
				playerInfo = PlayerService.getPlayerInfo(playerId);
			} else{  //房间不存在，同步清除用户的房间信息
				PlayerService.cleanUserStatus(playerId);
			}
			let result = { userInfo, gameServerInfo,playerInfo };
			response = Validate.checkSuccess("用户还在房间内", Errors.SUCCESS, HttpStatus.OK, result)
		} else { //清除用户所有房间状态及登录状态
			let result = { userInfo, gameServerInfo };
			if (userInfo && gameServerInfo) {
				PlayerService.setIsLogin(playerId,true);
				response = Validate.checkSuccess("登录成功", Errors.SUCCESS, HttpStatus.OK, result)
			} else {
				response = Validate.checkSuccess("用户不存在", Errors.USER_NOT_REGISTER, HttpStatus.OK, null)
			}
		}
		ctx.body = response;
	}
})

module.exports = user;
