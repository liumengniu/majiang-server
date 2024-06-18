const _ = require("lodash");

const DataHelper ={
    /**
     * 1、修改 rooms 下第一层数据源
     * @param type {string}  例如 "grade" ,"gameTime"等等
     * @param rooms {object}  原userInfo数据
     * @param data {index}  修改后的数据
     */
    setRoomsInfo(type, rooms,data) {
        let response;
        response = _.set(rooms, [type], data);
        return _.cloneDeep(response);
    },
    /**
     * 1、修改 rooms 下第二层数据源
     * @param type {string}  例如 "grade" ,"gameTime"等等
     * @param scoreInfos {object}  原userInfo数据
     * @param data {index}  修改后的数据
     */
    setScoreInfo(type, scoreInfos,data) {
        let response;
        response = _.set(scoreInfos, [type], data);
        return _.cloneDeep(response);
    },
};

module.exports = DataHelper;