/**
 * @author Kevin
 * @Date: 2024-6-18
 */

const Api = {
	create: "create",//创建房间
	join: 'join',//加入房间
	quit: "quit",//退出房间
	repetition: "repetition",//repetition
	dismissed:'dismissed',//dismissed
	notReady: 'notReady',//未准备
	ready: 'ready',//开始游戏
	userReady: 'userReady',//用户准备
	gameOverByWait: 'gameOverByWait',//单局结束，等待其他用户完成
	gameOver: 'gameOver',//游戏结束
	mineFryForMe: 'mineFryForMe',//雷炸了--自己
	mineFryForOther: 'mineFryForOther',//雷炸了--其他人
	gamePoneOver: 'gamePoneOver',//小局结束等待继续
	nextLevel: 'nextLevel',//用户开始下一局
	rollback: 'rollback',//暴雷回退
	goBack: ' goBack',//领取金币结束返回房间
	
	Me: 'Me',
	Other: "Other",
};

module.exports = Api;
