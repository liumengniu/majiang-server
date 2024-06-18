/**
 * @author Kevin
 * @Date: 2024-6-18
 */


const Router = require('koa-router');
const Validate = require("../../utils/vlidate");
const Errors = require("../../utils/api/errors");
const HttpStatus = require("../../utils/api/httpStatus");
const user = new Router();

/**
 * 注册用户
 */
user.post('/register', async ctx =>{
	const { roomId, userId } = ctx.request.body;
})

user.post('/login', async ctx =>{
	let response;
	const { account, password } = ctx.request.body;
	response = Validate.checkSuccess("登录成功", Errors.SUCCESS, HttpStatus.OK, {userId: "testId"})
	ctx.body = response
})

module.exports = user;
