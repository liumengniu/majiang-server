/**
 * @author Kevin
 * @Date: 2024-6-18
 */


const Router = require('koa-router');
const user = new Router();

/**
 * 注册用户
 */
user.post('/register', async ctx =>{
	const { roomId, userId } = ctx.request.body;
})

module.exports = user;
