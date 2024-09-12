const models = require("@/models");
const User = models.User;
const SocketService = require("@/core/socket/SocketService.js");
let ws = SocketService.getInstance();
const {v4: uuidv4} = require('uuid');
const cacheClient = require("@utils/cacheClient");
const RoomService = require("@/core/services/RoomService");
const _ = require("lodash");
const moment = require("moment");

moment.updateLocale("cn", {
	week: {
		dow: 1, // First day of week is Monday
		doy: 4  // First week of year must contain 4 January (7 + 1 - 4)
	}
});

const UserService = {
	/**
	 * 普通登录
	 * @param info
	 * @returns {Promise<Model<any, TModelAttributes>|Model<any, any>>}
	 */
	login: async (info) => {
		let {account, password, avatar, name, gender} = info;
		let userInfo = await User.findOne({where: {account}});
		if (!_.isEmpty(userInfo)) {
			return userInfo;
		}
		let newUser = {
			id: uuidv4(),
			account,
			password,
			name: name || account,
			avatar: avatar || 'http://thirdwx.qlogo.cn/mmopen/vi_32/DYAIOgq83erD6MOUwRKV9NyBAqnoFDTnltzAe2zWOkKxyDOFibVBb1ZV5CaATJwYAuNqZ5sXMBC4c8iacaHDf8RA/132',
			gender: gender || 2,
		};
		userInfo = await User.create(newUser);
		return userInfo;
	},
	
	
	/**
	 * 更新战斗规则
	 * @param data
	 * @returns {Promise<Model<any, TModelAttributes>>}
	 */
	async updateFightRule(data) {
		let {rule, userId, roomId, roomRule, isHint} = data;
		console.log(rule, userId, roomId, roomRule, isHint);
		await User.update({rule, roomRule, isHint}, {where: {id: userId}});
		if (roomId) {
			let roomInfo = _.get(RoomService, `rooms.${roomId}`);
			for (let key in roomInfo) {
				let item = _.get(roomInfo, key);
				_.set(roomInfo, `[${key}].roomRule`, roomRule);
				_.set(roomInfo, `[${key}].isHint`, isHint);
			}
			for (let key in roomInfo) {
				ws.sendToUser(key, '', roomInfo);
			}
		}
		let user = await User.findOne({where: {id: userId}});
		return user;
	},
	/**
	 * 更新设置
	 * @param data
	 * @returns {Promise<Model<any, TModelAttributes>>}
	 */
	async updateSet(data) {
		let {music, sound, shake, userId, isNew, isSkipRule, isNewGame} = data;
		await User.update({music, sound, shake, isNew, isSkipRule, isNewGame}, {where: {id: userId}});
		let user = await User.findOne({where: {id: userId}});
		return user;
	},
	/**
	 * 更新游戏等级
	 * @param data
	 * @returns {Promise<Model<any, any>>}
	 */
	async updateLv(data) {
		let {lv, userId} = data;
		let user = await User.findOne({where: {id: userId}});
		let userLv = 0;
		switch (user.lv) {
			case '倔强青铜':
				userLv = 1;
				break;
			case '秩序白银':
				userLv = 2;
				break;
			case '荣耀黄金':
				userLv = 3;
				break;
			case '永恒钻石':
				userLv = 4;
				break;
			case '最强王者':
				userLv = 5;
				break;
		}
		if (userLv === lv) {
			lv += 1;
			await User.update({lv}, {where: {id: userId}});
		}
		user = await User.findOne({where: {id: userId}});
		return user;
	},
	
	async gameOverBySingle(data) {
		let {record, userId, gold} = data;
		let user = await User.findOne({where: {id: userId}});
		if (user.bestRecord < record) {
			record = user.bestRecord
		}
		await User.update({bestRecord: record, coin: user.coin + gold}, {where: {id: userId}});
		user = await User.findOne({where: {id: userId}});
		return user;
	},
	
	
	/**
	 * 获取排行榜
	 * @param data
	 * @returns {Promise<*[]>}
	 */
	async getLeaderboard(data) {
		const {lv, userId} = data;
		//获取用时最少的前15名(如果自己不在15内，加上自己)
		let args = [`player_level_${lv}_${moment().startOf('week').format('x')}`, 0, 15, "WITHSCORES"];
		let rangeSet = await cacheClient.zrange(args);
		let args2 = [`player_level_${lv}_${moment().startOf('week').format('x')}`, userId];
		let isHasMe = _.includes(rangeSet, userId);
		if (!isHasMe && userId) {
			let myRank = await cacheClient.zrank(args2);
			let myRankScore = await cacheClient.zscore(args2);
			if (myRank && myRankScore) {
				rangeSet = _.concat(rangeSet, [myRankScore, myRank]);
			}
		}
		//通过userId补全数据信息，再传递给客户端
		let ids = _.filter(rangeSet, (o, idx) => idx % 2 === 0);
		let users = await User.findAll({where: {id: ids}});
		let rankUserInfos = [];
		for (let i = 0; i < rangeSet.length; i++) {
			if (i % 2 === 0) {
				let obj = _.find(users, p => p.id === rangeSet[i]);
				if (_.get(rangeSet, `${i + 1}`) && obj) {
					obj.dataValues.time = _.ceil(rangeSet[i + 1], 3);
				}
				rankUserInfos.push(obj)
			}
		}
		return rankUserInfos;
	},
	
	/**
	 * 领取金币
	 * @param data
	 * @returns {Promise<Model<any, any>>}
	 */
	async getCoinBySingle(data) {
		const {coin, multiple, userId} = data;
		let user = await User.findOne({where: {id: userId}});
		let claimStatus = _.get(user, 'claimStatus');
		let isCurrentWeek = moment().isAfter(moment(moment().startOf('week').format('x')));
		if (claimStatus && isCurrentWeek) {
			throw "本周已领取过,无法重复领取";
			return;
		}
		let firstTime = moment().startOf('week').add('h', 8).format('x');    //当前周的周一八点
		let lastTime = moment().startOf('week').add('h', 20).format('x');    //当前周的周一20点
		let isAllowTime = moment().isAfter(moment(firstTime)) && moment().isBefore(moment(lastTime));
		if (!isAllowTime) {
			throw "领取时间为周一8点至周一20点之间";
			return;
		} else {
			if (!_.get(user, 'claimStatus')) {
				await User.update({
					coin: _.get(user, 'coin') + coin * multiple,
					claimStatus: moment().format('x')
				}, {where: {id: userId}});
			}
		}
		user = await User.findOne({where: {id: userId}});
		return user;
	},
	
	/**
	 * 创建用户id
	 * @returns {Promise<string>}
	 */
	async createUId() {
		let uId = (Math.round(Math.random() * 90000000) + 10000000).toString();
		let user = await User.findOne({where: {uId}});
		if (user) {
			uId = await UserService.createUId();
		} else {
			return uId;
		}
	},
	
	async deleteUser(id) {//测试专用
		await User.destroy({where: {id}});
	}
	
};

module.exports = UserService;
