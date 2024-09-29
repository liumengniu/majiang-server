/**
 *
 * @author Kevin
 * @Date:
 */

const chalk = require('chalk');

const prints = {
	printBanner: function (message) {
		const border = '─'.repeat(74);
		const padding = ' '.repeat((border.length - message.length) / 2 - 1); // 额外减去1个空格以确保更居中

		console.log(chalk.green(border));
		console.log(chalk.green(padding + message));
		console.log(chalk.green(border));
	},
	printErrorBanner: function (message) {
		const border = '─'.repeat(74);
		const padding = ' '.repeat((border.length - message.length) / 2 - 1); // 额外减去1个空格以确保更居中

		console.log(chalk.red(border));
		console.log(chalk.red(padding + message));
		console.log(chalk.red(border));
	},
}


module.exports = prints