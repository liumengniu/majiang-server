/**
 * 服务进程入口
 * @author Kevin
 * @Date: 2024-6-18
 */


global.Promise = require('bluebird');
const App = require("./core/app/App");
App.startAllServer();
console.log(process.pid,'-------------- 主进程 pid-------------------');
