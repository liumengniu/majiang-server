const fs = require("fs");
const path = require("path");

const ConfigService = {
    serverConfigPath: path.normalize(__dirname + "/../../" +'/config/serviceConfig.json'),
    //读取 serviceConfig 下的配置
    loadAllConfig: function(){
        let jsonString = fs.readFileSync(this.serverConfigPath,"utf-8");
        let jsonConfig = JSON.parse(jsonString);
        return jsonConfig;
    },
    //获取服务配置
    getServicesConfig: function(){
        let jsonConfig = this.loadAllConfig();
        return jsonConfig?.services;
    },
    //获取微信配置
    getWeixinConfig: function(){
        let jsonConfig = this.loadAllConfig();
        return jsonConfig?.weixin;
    },
    //获取门服务配置
    getDoorServiceConfig:function(){
        let serverConfig = this.getServicesConfig();
        return serverConfig?.DoorService.hosts;
    },
    //获取大厅服务配置
    getHallServiceConfig:function(){
        let serverConfig = this.getServicesConfig();
        return serverConfig?.HallService.hosts;
    },
    //获取游戏服务配置
    getGameServiceConfig:function(){
        let serverConfig = this.getServicesConfig();
        return serverConfig?.GameService.hosts;
    },
    //获取redis 服务配置
    getCacheConfig:function(){
        let serverConfig = this.getServicesConfig();
        return serverConfig?.cache;
    },
    // 获取均衡服务配置
    serverblance: function(){
        let serverConfig = this.getServicesConfig();
        return serverConfig?.serverblance;
    }
};

module.exports = ConfigService;
