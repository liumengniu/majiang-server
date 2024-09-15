/**
 * 大厅服务（PS：拆服务实际看用户量，几百几千就没必要了）
 * @author Kevin
 * @Date:
 */

const _ = require("lodash");
const Koa = require("koa");
const app = new Koa();
const hallRouter = require('@/routers/hall');
const bodyParser = require('koa-bodyparser');
const appConfig = require("@/config/AppletsConfig")

class HallServer{
	constructor(){
		this._instance = null;
	}

	/**
	 * 大厅实例
	 * @returns {*}
	 */
	static getInstance(){
		if(!this._instance){
			this._instance = new HallServer();
		}
		return this._instance;
	}

	/**
	 * 初始化大厅相关服务
	 * @param protocol
	 * @param host
	 * @param port
	 */
	init(protocol,host,port){
		try{
			this.startHallServer()
		}catch(e){
			this.onErrorServer();
		}
	}

	/**
	 * 启动大厅服务方法
	 */
	startHallServer(){
		app.use(async (ctx, next) => {
			ctx.set("Access-Control-Allow-Origin", "*");
			ctx.set('Access-Control-Allow-Methods', 'POST,GET,OPTIONS,PUT,DELETE');
			ctx.set('Access-Control-Allow-Headers', 'Content-type');
			ctx.set('Content-Type', 'application/json;charset=UTF-8');
			await next();
		});
		app.use(bodyParser());
		app.use(hallRouter.routes()).use(hallRouter.allowedMethods("*"));
		app.listen(appConfig.port,() =>
			console.log(`
                --------------------------------------------------------------------------
                
                                            门服务器启动
                
                --------------------------------------------------------------------------
            `)
		);
	}

	/**
	 * 大厅服务启动异常
	 */
	onErrorServer(){
		console.log(`
            --------------------------------------------------------------------------
            
                                          大厅服务启动异常
            
            --------------------------------------------------------------------------
        `);
	}
}

module.exports = HallServer