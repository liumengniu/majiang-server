/**
 * @author Kevin
 * 随机生成id
 */

const intformat = require('biguint-format')
const FlakeId = require('flake-idgen');
const flakeIdGen = new FlakeId();

const IDHelper = {
	getId: function () {
		return intformat(flakeIdGen.next(), 'dec');
	}
};

module.exports = IDHelper;
