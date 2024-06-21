const _ = require("lodash");

const DataHelper = {
	/**
	 * 1、修改 rooms 下第一层数据源
	 * @param roomId {string}  房间id
	 * @param rooms {object}  原rooms数据
	 * @param data {index}  修改后的数据
	 */
	setRoomsInfo(roomId, rooms, data) {
		let response = _.set(rooms, [roomId], data);
		return _.cloneDeep(response);
	},
	/**
	 * 修改房间第一层数据
	 * @param playerId   修改的某个玩家id
	 * @param roomInfo   原房间roomInfo的数据
	 * @param data       修改后的rooms数据
	 * @returns {*}
	 */
	setRoomInfo(playerId, roomInfo, data){
		let response;
		response = _.set(roomInfo, [playerId], data);
		return _.cloneDeep(response);
	},
	/**
	 * 修改房间第二层数据
	 * @param type       修改的属性
	 * @param playerId   修改的某个玩家id
	 * @param roomInfo   原房间roomInfo的数据
	 * @param data       需要修改的房间某个属性的值
	 * @returns {*}
	 */
	setRoomInfoDeep(type, playerId, roomInfo, data){
		let response;
		response = _.set(roomInfo, `${playerId}.${type}`, data);
		return _.cloneDeep(response);
	},
};

module.exports = DataHelper;
