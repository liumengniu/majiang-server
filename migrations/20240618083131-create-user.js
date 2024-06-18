'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.UUID
      },
	    uId: {
		    type: Sequelize.STRING,
		    comment: "用户Id"
	    },
	    account: {
		    type: Sequelize.STRING,
		    comment: "账号"
	    },
	    password: {
		    type: Sequelize.STRING,
		    comment: '密码'
	    },
	    name: {
		    type: Sequelize.STRING,
		    comment: '名称',
	    },
	    gender: {
		    comment: '对应角色的性别：0.男；1.女;2.未知',
		    type: Sequelize.INTEGER,
	    },
	    avatar: {
		    comment: '头像',
		    type: Sequelize.STRING,
	    },
	    score: {
		    comment: '战绩',
		    type: Sequelize.JSON,
	    },
	    lv: {
		    comment: '等级: 1.倔强青铜；2.秩序白银；3.荣耀黄金；4.永恒钻石；5.最强王者',
		    type: Sequelize.INTEGER,
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
		    type: Sequelize.BOOLEAN,
		    defaultValue: true
	    },
	    sound: {
		    comment: '音效',
		    type: Sequelize.BOOLEAN,
		    defaultValue: true
	    },
	    shake: {
		    comment: '震动',
		    type: Sequelize.BOOLEAN,
		    defaultValue: true
	    },
	    rule: {
		    comment: '对战规则',
		    type: Sequelize.JSON,
		    defaultValue: {
			    schema: 1, // 1.百雷竞速；2.单局10雷
			    fail: 1, // 1.暴雷扣分；2.暴雷失败
			    isHint: true
		    }
	    },
	    roomRule: {
		    comment: '对战规则',
		    type: Sequelize.INTEGER,
		    defaultValue: 0   // 0 (百雷&扣分) 1(百雷&失败) 2(十雷&扣分) 3(十雷&失败)
	    },
	    isHint:{
		    comment: '是否提示规则',
		    type: Sequelize.BOOLEAN,
		    defaultValue: true
	    },
	    isNew: {
		    comment: '是否为新人（查看新手引导）',
		    type: Sequelize.BOOLEAN,
		    defaultValue: true
	    },
	    isNewGame: {
		    comment: '是否为第一次创建游戏',
		    type: Sequelize.BOOLEAN,
		    defaultValue: true
	    },
	    isSkipRule: {
		    comment: '跳过规则',
		    type: Sequelize.BOOLEAN,
		    defaultValue: false
	    },
	    claimStatus:{
		    comment: '领取状态',
		    type: Sequelize.STRING,
	    },
	    coin: {
		    comment: '金币',
		    type: Sequelize.INTEGER,
		    defaultValue: 0
	    },
	    wechatOpenId: {
		    comment: '微信openId',
		    type: Sequelize.STRING
	    },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};
