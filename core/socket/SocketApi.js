/**
 * @author Kevin
 * @Date: 2024-6-18
 */

const SocketApi = {
	//创建房间
	create: "create",
	//加入房间
	join: 'join',
	//退出房间
	quit: "quit",
	//设置长连接唯一标识
	setUserId: "setUserId",
	//开始游戏
	startGame: 'startGame',
	//主动重连
	reconnect: 'reconnect',
	//出牌
	playCard: 'playCard',
	// 碰牌
	peng: 'peng',
	// 开杠
	gang: 'gang',
	// 胡牌
	win: 'win',
	// 流局
	flow: 'flow'
};

module.exports = SocketApi;
