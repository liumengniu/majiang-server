'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init({
	  id: {
		  primaryKey: true,
		  type: DataTypes.UUID
	  },
	  uId: {
		  type: DataTypes.STRING,
		  comment: "用户Id"
	  },
	  account: {
		  type: DataTypes.STRING,
		  comment: "账号"
	  },
	  password: {
		  type: DataTypes.STRING,
		  comment: '密码'
	  },
	  name: {
		  type: DataTypes.STRING,
		  comment: '名称',
	  },
	  gender: {
		  comment: '对应角色的性别：0.男；1.女;2.未知',
		  type: DataTypes.INTEGER,
	  },
	  avatar: {
		  comment: '头像',
		  type: DataTypes.STRING,
	  },
	  score: {
		  comment: '战绩',
		  type: DataTypes.JSON,
	  },
	  lv: {
		  comment: '等级: 1.倔强青铜；2.秩序白银；3.荣耀黄金；4.永恒钻石；5.最强王者',
		  type: DataTypes.INTEGER,
		  defaultValue: 1,
		  get() {
			  switch (this.getDataValue('lv')) {
				  case 1:
					  return '倔强青铜';
				  case 2:
					  return '秩序白银';
				  case 3:
					  return '荣耀黄金';
				  case 4:
					  return '永恒钻石';
				  case 5:
					  return '最强王者';
			  }
		  }
	  },
	
	  music: {
		  comment: '音乐',
		  type: DataTypes.BOOLEAN,
		  defaultValue: true
	  },
	  sound: {
		  comment: '音效',
		  type: DataTypes.BOOLEAN,
		  defaultValue: true
	  },
	  shake: {
		  comment: '震动',
		  type: DataTypes.BOOLEAN,
		  defaultValue: true
	  },
	  rule: {
		  comment: '对战规则',
		  type: DataTypes.JSON,
		  defaultValue: {
			  schema: 1, // 1.百雷竞速；2.单局10雷
			  fail: 1, // 1.暴雷扣分；2.暴雷失败
			  isHint: true
		  }
	  },
	  roomRule: {
		  comment: '对战规则',
		  type: DataTypes.INTEGER,
		  defaultValue: 0   // 0 (百雷&扣分) 1(百雷&失败) 2(十雷&扣分) 3(十雷&失败)
	  },
	  isHint:{
		  comment: '是否提示规则',
		  type: DataTypes.BOOLEAN,
		  defaultValue: true
	  },
	  isNew: {
		  comment: '是否为新人（查看新手引导）',
		  type: DataTypes.BOOLEAN,
		  defaultValue: true
	  },
	  isNewGame: {
		  comment: '是否为第一次创建游戏',
		  type: DataTypes.BOOLEAN,
		  defaultValue: true
	  },
	  isSkipRule: {
		  comment: '跳过规则',
		  type: DataTypes.BOOLEAN,
		  defaultValue: false
	  },
	  claimStatus:{
		  comment: '领取状态',
		  type: DataTypes.STRING,
	  },
	  coin: {
		  comment: '金币',
		  type: DataTypes.INTEGER,
		  defaultValue: 0
	  },
	  wechatOpenId: {
		  comment: '微信openId',
		  type: DataTypes.STRING
	  }
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};
