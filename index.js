/**
 * 服务进程入口
 * @author Kevin
 * @Date: 2024-6-18
 */

global.Promise = require('bluebird');
require('module-alias/register');
const App = require("@/core/app/App");
App.startAllServer();
