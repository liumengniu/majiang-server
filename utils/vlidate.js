/**
 * @author Kevin
 * @Date: 2024-6-18
 */

const _ = require("lodash");
const Errors = require("./api/errors")
const HttpStatus = require("./api/httpStatus");
const Parameter = require('parameter');

class Validate {
	constructor(errMsg, errCode, errStatus, result) {
		this.errMsg = errMsg;
		this.errCode = errCode;
		this.errStatus = errStatus;
		this.result = result;
	}
	
	static checkSuccess(errMsg, errCode, errStatus, result) {
		let response = {};
		response.errCode = errCode;
		response.errMsg = errMsg || "操作成功";
		response.errStatus = errStatus;
		response.result = result;
		return response;
	}
	
	static validateParams(rule, params) {
		let response = {};
		let parameter = new Parameter({
			validateRoot: true, // restrict the being validate value must be a object
		});
		let errors = parameter.validate(rule, params);
		if (errors) {
			response.errCode = Errors.INVALID_PARAM;
			response.errMsg = "参数类型错误";
			response.errStatus = HttpStatus.FORBIDDEN;
			response.result = errors
			return response;
		}
		return errors;
	}
}

module.exports = Validate;
