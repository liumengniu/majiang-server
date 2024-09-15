/**
 * 大厅路由
 * @author Kevin
 * @Date:
 */

const Router = require("koa-router");
const hall = new Router();

/**
 * 回到大厅
 */
hall.post('/backLobby', async ctx =>{
	const { roomId, userId } = ctx.request.body;
	ctx.body = "退回大厅";
})

/**
 * 获取大厅房间列表
 */
hall.post('/getLobbyList', async ctx =>{
	const { roomId, userId } = ctx.request.body;
	ctx.body = "退回大厅";
})

module.exports = hall;