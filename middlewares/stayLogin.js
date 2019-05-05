const Cookies = require('cookies-string-parse');
const languages = require('../languages');
module.exports = async (ctx, next) => {
	const {data, db} = ctx;
	// cookie
	let userInfo = ctx.cookies.get('userInfo', {signed: true});
	if(!userInfo) {
	  // 为了兼容app中的部分请求无法附带cookie，故将cookie放到了url中
		try{
      let {cookie} = ctx.query || {};
      if(cookie) {
        cookie = new Buffer(cookie, 'base64').toString();
        if(cookie) {
          const cookies = new Cookies(cookie, {
            keys: [ctx.settings.cookie.secret]
          });
          userInfo = cookies.get('userInfo', {signed: true});
        }
      }
		} catch(err) {
		  if(global.NKC.NODE_ENV !== 'production') console.log(err);
		}
	}
	let userOperationsId = [], userRoles = [], userGrade = {}, user;
	if(userInfo) {
		const {username, uid} = JSON.parse(decodeURI(userInfo));
		user = await db.UserModel.findOne({uid});
		if(!user || user.username !== username) {
			ctx.cookies.set('userInfo', '');
			ctx.status = 401;
			ctx.error = new Error('缓存验证失败');
      user = undefined;
		}
	}
  let languageName = 'zh_cn';
	if(!user) {
		// 游客
		const visitorRole = await db.RoleModel.extendRole('visitor');
		userOperationsId = visitorRole.operationsId;
		userRoles = [visitorRole];
	} else {
    // 用户
		await user.update({tlv: Date.now()});
		if(!user.certs.includes('default')) {
			user.certs.unshift('default');
		}
		if(user.xsf > 0) {
			if(!user.certs.includes('scholar')) {
				user.certs.push('scholar');
			}
		} else {
			const index = user.certs.indexOf('scholar');
			if(index !== -1) {
				user.certs.splice(index, 1);
			}
		}
		// 获取用户信息
    const userPersonal = await db.UsersPersonalModel.findOnly({uid: user.uid});
    await db.UserModel.extendUsersInfo([user]);
		user.newMessage = await user.getNewMessagesCount();
		user.authLevel = await userPersonal.getAuthLevel();
		user.subscribeUsers = (await db.UsersSubscribeModel.findOne({uid: user.uid})).subscribeUsers;
		user.draftCount = await db.DraftModel.count({uid: user.uid});
    user.generalSettings = await db.UsersGeneralModel.findOnly({uid: user.uid});
    languageName = user.generalSettings.language;
    if(user.generalSettings.lotterySettings.status) {
      const redEnvelopeSettings = await db.SettingModel.findOnly({_id: 'redEnvelope'});
      if(redEnvelopeSettings.c.random.close) {
        user.generalSettings.lotterySettings.status = false;
      }
    }
    if(user.generalSettings.draftFeeSettings.kcb !== 0) {
      await user.generalSettings.update({'draftFeeSettings.kcb': 0});
    }
		// 获取新点赞数
    const votes = await db.PostsVoteModel.find({tUid: user.uid, toc: {$gt: user.tlv}});
    let newVoteUp = 0;
    votes.map(v => {
      if(v.type === 'up') {
        newVoteUp += v.num;
      } else if(v.type === 'down') {
        newVoteUp -= v.num;
      }
    });
    user.newVoteUp = newVoteUp>0?newVoteUp:0;
		// 判断用户是否被封禁
		if(user.certs.includes('banned')) {
      const role = await db.RoleModel.extendRole('banned');
        if(!role) return;
        userRoles.push(role);
        for(let operationId of role.operationsId) {
          if(!userOperationsId.includes(operationId)) {
            userOperationsId.push(operationId);
          }
        }
		} else {
      // 除被封用户以外的所有用户都拥有普通角色的权限
      const defaultRole = await db.RoleModel.extendRole('default');
			userOperationsId = defaultRole.operationsId;
			// 根据用户积分计算用户等级，并且获取该等级下的所有权限
			userGrade = await user.extendGrade();
			if(userGrade) {
				userOperationsId = userOperationsId.concat(userGrade.operationsId);
      }
      // 根据用户的角色获取权限
      await Promise.all(user.certs.map(async cert => {
        const role = await db.RoleModel.extendRole(cert);
        if(!role) return;
        userRoles.push(role);
        for(let operationId of role.operationsId) {
          if(!userOperationsId.includes(operationId)) {
            userOperationsId.push(operationId);
          }
        }
      }));
		}
  }
  // 根据用户语言设置加载语言对象
  ctx.state.language = languages[languageName];
  ctx.state.lang = (type, operationId) => {
    return ctx.state.language[type][operationId];
  };

	data.userOperationsId = userOperationsId;
	data.userRoles = userRoles;
	data.userGrade = userGrade;
  data.user = user;
	await next();
};