/**
 * @author Kevin
 * @Date:
 */
const _ = require("lodash")

const HackService = {
	/**
	 * 数据清洗（房间）
	 * 源数据不改，只在 http 或者 websocket 返回数据的时候修改
	 * 在发送给客户端的数据需要隐藏他人数据
	 */
	cleanRoomInfo: function (roomInfo, playerId){
		_.forIn(_.cloneDeep(roomInfo), function(value, key) {
			if(key !== playerId){
				_.set(roomInfo, `${key}.handCards`, [])
			}
		});
		return roomInfo
	},
	/**
	 * 数据清洗（当前局游戏）
	 * @param gameInfo
	 * @returns {*}
	 */
	cleanGameInfo: function (gameInfo){
		_.set(_.cloneDeep(gameInfo), `.cards`, [])
		return gameInfo
	},
}

module.exports = HackService