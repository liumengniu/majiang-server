/**
 * @author Kevin
 * @Date: 2024-6-18
 */

const redis = require("redis");
const stringify = require('fast-json-stable-stringify');
const _ = require("lodash");

const redisConfig = {
	port: 6379,          // Redis port
	host: '127.0.0.1',   // Redis host
	// prefix: 'sam:', //存诸前缀
	// ttl: 60 * 60 * 23,  //过期时间
	family: 4,
	db: 0
}
const client = redis.createClient(redisConfig);
class CacheClient {
	//-----------------------------------str --------------------------------------------
	set (type, key, value) {
		return new Promise((resolve, reject) => {
			client.set(type + ':' + key, stringify(value), (err, reply) => {
				if (err) {
					reject(err);
				}
				resolve(reply);
			});
		});
	};
	get(type, key) {
		return new Promise((resolve, reject) => {
			client.get(type + ':' + key, (err, reply) => {
				if (err) {
					reject(err);
				}
				if (reply) {
					const o = JSON.parse(reply);
					resolve(o);
				} else {
					resolve(null);
				}
			});
		});
	};
	del(type, key) {
		return new Promise((resolve, reject) => {
			client.del(type + ':' + key, (err, reply) => {
				if (err) {
					reject(err);
				} else {
					resolve(reply);
				}
			});
		});
	}
	
	async getAllKey(){
		return new Promise((resolve, reject) => {
			client.keys("*", (err, reply) => {
				if (err) {
					reject(err);
				} else {
					resolve(reply);
				}
			});
		})
	}
	
	async delKeys(keys){
		return new Promise((resolve, reject) => {
			client.del(keys, (err, reply) => {
				if (err) {
					reject(err);
				} else {
					resolve(reply);
				}
			});
		})
	}
	
	
	/**
	 * 删除redis 的全部数据（=================慎用慎用慎用慎用慎用慎用慎用慎用慎用慎用=========================）
	 */
	async delAllKeys(){
		let reply = await this.getAllKey();
		await this.delKeys(reply);
		let lastData = await this.getAllKey();
	}
	async testRedis(){
		const args = ["myzset", 1, JSON.stringify({a:1,b:2}), 2, "two", 3, "three", 99, "ninety-nine"];
		const args2 = ["myzset", 33, "thirty-three", 44, "forty-four", 55, "fifty-five"];
		const max = 99;
		const min = 1;
		const offset = 1;
		const count = 6;
		const args5 = ["myzset", max, min, "WITHSCORES", "LIMIT", offset, count];
		const args8 = ["myzset", "+inf", "-inf"];
		const args6 = ["player_level_1", 0, 15,"WITHSCORES"];
		const args7 = ["player_level_1_1595692800000", "000d1fe0-5b1d-4c81-a857-23614e41279d"];
		const args9 = ["player_level_1_1595692800000", "000d1fe0-5b1d-4c81-a857-23614e41279d"];
		let res1 = await this.zadd(args);
		let res3 = await this.zrevrangebyscore(args5);
		let res2 = await this.zadd(args2);
		let res4 = await this.zrevrangebyscore(args5);
		let res5 = await this.zrange(args6);
		let res6 = await this.zrank(args7);
		let res7 = await this.zscore(args9);
		console.log('------------------------222------',_.isArray(res5),'-----------------222-------------')
		for (let i=0;i<res5.length; i++){
			console.log('------------------------------',res5[i],'------------------------------')
		}
		console.log(res1, 'gggggggggggggggggggggg000000000000000000000000000000', res2,'hhhhhhhhh',res3,'hh00000000000000',res4);
		console.log('===========================================================',res5, '===========================================================');
		console.log('==============================res6=============================',res6, '==============================res6=============================');
		console.log('==============================res7=============================',res7, '==============================res7=============================');
	}
	
	//----------------------------------- zset(主要是做排行榜之类的) --------------------------------------------
	/**
	 * Zadd
	 */
	async zadd(args){
		return new Promise((resolve, reject) => {
			client.zadd(args, (addError, addResponse) => {
				if (addError) {
					reject(addError);
				} else {
					resolve(addResponse);
				}
			});
		})
	}
	/**
	 * zrevrangebyscore
	 */
	async zrevrangebyscore(args){
		const max = 99;
		const min = 1;
		const offset = 1;
		const count = 6;
		return new Promise((resolve, reject) => {
			client.zrevrangebyscore(args, (err, response) => {
				if (err) {
					reject(err);
				} else {
					resolve(response);
				}
			});
		})
	}
	
	/**
	 * zrevrange(获取score值倒序的集合)
	 */
	async zrevrange (args){
		return new Promise((resolve, reject) => {
			client.zrevrange (args, (err, response) => {
				if (err) {
					reject(err);
				} else {
					resolve(response);
				}
			});
		})
	}
	
	/**
	 * zrange(获取score值正序的集合)
	 */
	async zrange (args){
		return new Promise((resolve, reject) => {
			client.zrange (args, (err, response) => {
				if (err) {
					reject(err);
				} else {
					resolve(response);
				}
			});
		})
	}
	
	/**
	 * zrank(获取用户的当前排名)
	 */
	async zrank(args){
		return new Promise((resolve, reject) => {
			try{
				client.zrank (args, (err, response) => {
					if (err) {
						reject(err);
					} else {
						resolve(response);
					}
				});
			}catch(e){
				reject(e)
			}
			
		})
	}
	
	/**
	 * zrank(获取用户的当前排名)
	 */
	async zscore(args){
		return new Promise((resolve, reject) => {
			client.zscore (args, (err, response) => {
				if (err) {
					reject(err);
				} else {
					resolve(response);
				}
			});
		})
	}
	//----------------------------------------------------- list --------------------------------------------
	/**
	 * lpush 新增list数据
	 */
	async lpush(args){
		return new Promise((resolve, reject) => {
			client.lpush (args, (err, response) => {
				if (err) {
					reject(err);
				} else {
					resolve(response);
				}
			});
		})
	}
	/**
	 * lrange 获取list数据 (按入栈的顺序倒序返回)
	 */
	async lrange(args){
		return new Promise((resolve, reject) => {
			client.lrange (args, (err, response) => {
				if (err) {
					reject(err);
				} else {
					resolve(response);
				}
			});
		})
	}
	
	
	async testRedis(){
		const args = ["myzset", 1, JSON.stringify({a:1,b:2}), 2, "two", 3, "three", 99, "ninety-nine"];
		const args2 = ["myzset", 33, "thirty-three", 44, "forty-four", 55, "fifty-five"];
		const max = 99;
		const min = 1;
		const offset = 1;
		const count = 6;
		const args5 = ["myzset", max, min, "WITHSCORES", "LIMIT", offset, count];
		const args8 = ["myzset", "+inf", "-inf"];
		const args6 = ["player_level_1", 0, 15,"WITHSCORES"];
		const args7 = ["player_level_1_1595692800000", "000d1fe0-5b1d-4c81-a857-23614e41279d"];
		const args9 = ["player_level_1_1595692800000", "000d1fe0-5b1d-4c81-a857-23614e41279d"];
		let res1 = await this.zadd(args);
		let res3 = await this.zrevrangebyscore(args5);
		let res2 = await this.zadd(args2);
		let res4 = await this.zrevrangebyscore(args5);
		let res5 = await this.zrange(args6);
		let res6 = await this.zrank(args7);
		let res7 = await this.zscore(args9);
		console.log('------------------------222------',_.isArray(res5),'-----------------222-------------')
		for (let i=0;i<res5.length; i++){
			console.log('------------------------------',res5[i],'------------------------------')
		}
		console.log(res1, 'gggggggggggggggggggggg000000000000000000000000000000', res2,'hhhhhhhhh',res3,'hh00000000000000',res4);
		console.log('===========================================================',res5, '===========================================================');
		console.log('==============================res6=============================',res6, '==============================res6=============================');
		console.log('==============================res7=============================',res7, '==============================res7=============================');
	}
}


const cacheClient = new CacheClient();
module.exports = cacheClient;
