const Errors = {
    TIMEOUT: -1, // 系统繁忙
    SUCCESS: 0, // 成功
    INVALID_PARAM: 20000,
    FAILURE: 1, //操作失败

    //------------ user ---------------
    USER_ID_INVALID: 10001, // 用户id无效
    USER_PASSWORD_INVALID: 10002,
    INVALID_ACCOUNT_OR_PASSWORD: 10003,  //账号或密码错误
    USER_NOT_REGISTER: 10004,
    GET_UPLOAD_TOKEN_ERROR: 10005,
    UPDATE_USER_FAILED: 10006,          //更新用户信息失败
    //-------------- end ---------------

    //-------------- propbag ----------------
    RED_WIRE_INSUFFICIENT: 10007,
    GET_COIN_ERROR: 10008,    //领取金币失败
    //------------ room ---------------
    ROOM_CREATE_SUCCESS: 20001, //创建房间成功
    ROOM_JOIN_ERROR: 20002, //加入房间失败
    ROOM_NOT_EXIST: 20003,  //房间不存在或者已经解散
    //-------------- end -------------------
};


module.exports = Errors;
