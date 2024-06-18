/**
 * @author Kevin
 * HTTP请求类
 */

const got = require('got');

class Http {
	constructor() {
		this._instance = null;
	}
	
	static getInstance() {
		if (!this._instance) {
			this._instance = new Http();
		}
		return this._instance;
	}
	
	/**
	 * 请求参数字符串拼接
	 */
	queryString(data) {
		let paramUrl = "";
		for (let key in data) {
			paramUrl += key + "=" + data[key] + "&";
		}
		return paramUrl;
	}
	
	/**
	 * 获取get请求的url
	 */
	getUrl(url, data) {
		let paramUrl = "";
		paramUrl = this.queryString(data);
		if (paramUrl !== '') {
			paramUrl = paramUrl.substr(0, paramUrl.lastIndexOf('&'));
			url = url + '?' + paramUrl;
		}
		return url;
	}
	
	/**
	 * get请求
	 */
	async get(url, data) {
		let res = null;
		try {
			let realUrl = this.getUrl(url, data);
			const {body} = await got(realUrl);
			res = body.result;
		} catch (error) {
			console.log(error.response.body);
		}
		return res;
	}
	
	/**
	 * post请求
	 * @param  url
	 * @param  data  JS对象 { key: value}
	 */
	async post(url, data) {
		let res = null;
		try {
			const {body} = await got.post(url, {json: data, responseType: 'json'});
			res = body.result;
		} catch (err) {
		}
		return res;
	}
}

module.exports = Http;
