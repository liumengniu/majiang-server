/**
 * 游戏相关controller
 * @author Kevin
 * @Date: 2024-6-18
 */


const Router = require('koa-router');
const game = new Router();

/**
 * 开始游戏
 */
game.post('/startGame', async ctx =>{
	const { roomId, userId } = ctx.request.body;
})

module.exports = game;
