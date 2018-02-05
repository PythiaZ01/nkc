const Router = require('koa-router');
const remittanceRouter = new Router();
remittanceRouter
	.use('/', async (ctx, next) => {
		const {applicationForm} = ctx.data;
		if(applicationForm.disabled) ctx.throw(401, '抱歉！该申请表已被管理员封禁。');
		const {adminSupport} = applicationForm.status;
		if(!adminSupport) ctx.throw(400, '管理员审核暂未通过无法进行汇款操作，请等待。');
		await next();
	})
	.get('/', async (ctx, next) => {
		const {db, data} = ctx;
		const {remittance} = data.applicationForm;
		ctx.template = 'interface_fund_remittance.pug';
		await Promise.all(remittance.map(async r => {
			if(r.uid) {
				r.user = await db.UserModel.findOnly({uid: r.uid});
			}
		}));
		data.nav = '汇款';
		await next();
	})
	.post('/', async (ctx, next) => {
		const {data, body, db} = ctx;
		const {applicationForm, user} = data;
		const {number} = body;
		const {fund, remittance} = applicationForm;
		for(let i = 0; i < remittance.length; i++) {
			const r = remittance[i];
			if(i < number && !r.status) ctx.throw(400, '请依次汇款！');
			if(i === number) {
				if(r.status) ctx.throw(400, '已经打过款了，请勿重复提交！');
				if(!r.passed) ctx.throw(400, '该申请人的中期报告还未通过，请通过后在打款。');
				r.status = true;
				r.uid = user.uid;
				const time = new Date();
				r.time = time;
				const newId = await db.SettingModel.operateSystemID('fundBills', 1);
				const newFundBill = db.FundBillModel({
					_id: newId,
					uid: user.uid,
					applicationFormId: applicationForm._id,
					fundId: fund._id,
					changed: -1*r.money,
					toc: time,
					notes: `项目${applicationForm.code}第${i+1}期汇款，汇款金额${r.money}元`
				});
				await newFundBill.save();
				break;
			}
		}
		const obj = {remittance};
		if(number === 0) {
			obj['status.remittance'] = true;
		}
		await applicationForm.update(obj);
		ctx.print('remittance', applicationForm.remittance);
		await next();
	});
module.exports = remittanceRouter;