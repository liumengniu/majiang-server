/**
 * @author Kevin
 * @Date: 2024-6-18
 */

const Util = {
	isJSON: function (str) {
		if (typeof str == 'string') {
			try {
				JSON.parse(str);
				return true;
			} catch (e) {
				return false;
			}
		} else {
			return false;
		}
	}
};

module.exports = Util;
