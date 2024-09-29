/**
 * 门服务（PS：拆服务实际看用户量，几百几千就没必要了）
 * @author Kevin
 * @Date: 2024-6-18
 */

const _ = require("lodash");
const Koa = require("koa");
const app = new Koa();
const router = require('@/routers/gateway');
const bodyParser = require('koa-bodyparser');
const appConfig = require("@/config/AppletsConfig")
const prints = require("@utils/console");

class GateWayServer{
	constructor(){
		this._instance = null;
	}
	
	static getInstance(){
		if(!this._instance){
			this._instance = new GateWayServer();
		}
		return this._instance;
	}
	
	// 初始化
	init(protocol,host,port){
		try{
			this.startDoorServer()
		}catch(e){
			this.onErrorServer();
		}
	}
	//启动服务
	startDoorServer(){
		app.use(async (ctx, next) => {
			ctx.set("Access-Control-Allow-Origin", "*");
			ctx.set('Access-Control-Allow-Methods', 'POST,GET,OPTIONS,PUT,DELETE');
			ctx.set('Access-Control-Allow-Headers', 'Content-type');
			ctx.set('Content-Type', 'application/json;charset=UTF-8');
			await next();
		});
		app.use(bodyParser());
		app.use(router.routes()).use(router.allowedMethods("*"));
		app.listen(appConfig.port,() => prints.printBanner(`门服务器启动，监听${appConfig.port}`));
	}

	onErrorServer(){
		prints.printErrorBanner(`门服务启动异常`)
	}
}

module.exports = GateWayServer;
