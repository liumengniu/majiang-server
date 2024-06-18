/**
 * 房间相关controller
 * @author Kevin
 * @Date: 2024-6-18
 */



const Router = require('koa-router');
const room = new Router();

/**
 * 创建房间
 */
room.post('/createRoom', async ctx =>{
	const { roomId, userId } = ctx.request.body;
})

module.exports = room;
