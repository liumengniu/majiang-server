/**
 * @author Kevin
 * @Date: 2024-6-18
 */

const _ = require("lodash");
const Koa = require("koa");
const app = new Koa();
const router = require('@/routers/gateway');
const bodyParser = require('koa-bodyparser');
const Utils = require("@/utils/index");
const appConfig = require("@/config/AppletsConfig")

class GateWayServer{
	constructor(){
		this._instance = null;
	}
	
	static getInstance(){
		console.log(process.pid, '---------------------------------------  process.pid 2222 ----------------------------------');
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
		app.listen(appConfig.port,() =>
			console.log(`
                --------------------------------------------------------------------------
                
                                            门服务器启动
                
                --------------------------------------------------------------------------
            `)
		);
	}
	//转发
	
	onErrorServer(){
		console.log(`
            --------------------------------------------------------------------------
            
                                        门服务启动异常
            
            --------------------------------------------------------------------------
        `);
	}
}

module.exports = GateWayServer;
