/**
 * 日志服务
 * @author Kevin
 * @Date: 2024-6-18
 */

const path = require('path');
const log4js = require('koa-log4');

log4js.configure({
	appenders: {
		access: {
			type: 'dateFile',
			pattern: '-yyyy-MM-dd.log', //生成文件的规则
			filename: path.join('../back-end/logs/', 'access.log') //生成文件名
		},
		application: {
			type: 'dateFile',
			pattern: '-yyyy-MM-dd.log',
			filename: path.join('../back-end/logs/', 'application.log')
		},
		out: {
			type: 'console'
		}
	},
	categories: {
		default: { appenders: [ 'out' ], level: 'info' },
		access: { appenders: [ 'access' ], level: 'info' },
		application: { appenders: [ 'application' ], level: 'WARN'}
	}
});

exports.accessLogger = () => log4js.koaLogger(log4js.getLogger('access')); //记录所有访问级别的日志
exports.logger = log4js.getLogger('application');  //记录所有应用级别的日志
