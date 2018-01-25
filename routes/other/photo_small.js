const Router = require('koa-router');
const photoSmallRouter = new Router();
const {photoSmallPath} = require('../../settings').upload;
photoSmallRouter
	.get('/:id', async (ctx, next) => {
		const {data, db} = ctx;
		const {user} = data;
		const {id} = ctx.params;
		const photo = await db.PhotoModel.findOnly({_id: id});
		if(photo.type === 'fund') {
			// const applicationForm = db.FundApplicationFormModel.findOnly({_id: photo.applicationFormId});
		} else if(photo.uid !== user.uid && userLevel < 7) {
			ctx.throw(401, '权限不足');
		}
		ctx.filePath = photoSmallPath + photo.path;
		await next();
	});
module.exports = photoSmallRouter;