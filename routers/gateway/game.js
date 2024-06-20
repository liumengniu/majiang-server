/**
 * 游戏相关controller
 * @author Kevin
 * @Date: 2024-6-18
 */


const Router = require('koa-router');
const SocketService = require("../../core/socket/SocketService");
const GameService = require("../../services/game/GameService");
const game = new Router();
const _ = require("lodash")

let ws = SocketService.getInstance();

/**
 * 开始游戏
 */
game.post('/startGame', async ctx =>{
	const { roomId, userId } = ctx.request.body;
})

game.post('/getHandCards', async ctx=>{

})

module.exports = game;
