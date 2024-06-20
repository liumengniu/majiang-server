/**
 * @author Kevin
 * @Date: 2024-6-18
 */
const Koa = require("koa");
const app = new Koa();
const _ = require('lodash');
const router = require('./../../routers');
const bodyParser = require('koa-bodyparser');
const { sequelize } = require("./../../models");
const SocketService = require("../socket/SocketService");
//门
const DoorServer = require("./GateWayServer");
const cacheClient = require("../../utils/CacheClient");

const App = {
	connectServers: [],           //连接服务器的数组
	totalServersInfo: [],         //所有服务器的信息数组
	startServersInfo: [],         //启动服务器的数据
	cache: null,                  //系统缓存
	sequelizes: [],               // 数据库集合
	client: null,
	startAllServer: function () {
		try {
			// this.cleanRedis();
			// this.testRedis();
			this.initSocket();
			this.initServer();
			this.startDoorServer();      // 门服务
			this.initDB();
		} catch (e) {
			this.onErrorServer(e);
		}
	},
	
	async cleanRedis(){
		await cacheClient.delAllKeys()
	},
	
	async testRedis(){
		await cacheClient.testRedis();
	},
	
	
	//启动短连接服务
	initServer: async function () {
		app.use(async (ctx, next) => {
			let {method, url, header} = ctx.request;
			ctx.set("Access-Control-Allow-Origin", "*");
			ctx.set('Access-Control-Allow-Methods', 'POST,GET,OPTIONS,PUT,DELETE');
			ctx.set('Access-Control-Allow-Headers', 'Content-type');
			ctx.set('Content-Type', 'application/json;charset=UTF-8');
			await next();
		});
		app.use(bodyParser());
		app.use(router.routes()).use(router.allowedMethods("*"));
		// app.use(accessLogger());         // 服务请求日志
		app.listen(5000, () =>
			console.log(`
                --------------------------------------------------------------------------
                
                                            游戏服务器启动,端口5000
                
                --------------------------------------------------------------------------
            `, process.env.NODE_ENV)
		);
	},
	
	/**
	 * 启动门服务
	 */
	startDoorServer() {
		const doorServer = DoorServer.getInstance();
		doorServer.init();
	},
	/**
	 * 启动大厅服务
	 */
	startHallServer() {
		const hallServer = HallServer.getInstance();
		hallServer.init();
	},
	
	/**
	 * 启动长连接服务
	 * @returns {Promise<void>}
	 */
	initSocket: async function () {
		this.client = SocketService.getInstance();
		this.client.init();
	},
	/**
	 * 初始化数据库服务
	 * @returns {Promise<void>}
	 */
	initDB: async function () {
		// await sequelize.drop();
		// await sequelize.sync({ force: true });
	},
	
	onErrorServer: async function (e) {
		console.log(e, `
            --------------------------------------------------------------------------
            
                                        服务启动异常
            
            --------------------------------------------------------------------------
        `);
		
	}
};


module.exports = App;
