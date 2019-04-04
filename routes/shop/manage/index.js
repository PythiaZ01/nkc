const Router = require('koa-router');
const homeRouter = require('./home');
const shelfRouter = require('./shelf');
const infoRouter = require('./info');
const decorationRouter = require('./decoration');
const classifyRouter = require('./classify');
const orderRouter = require('./order');
const goodslistRouter = require('./goodslist');
const manageRouter = new Router();
manageRouter
  .get ('/', async (ctx, next) => {
    const {data, db, params} = ctx;
    const {user} = data;
    if(!user) {
      return ctx.redirect('/login');
    }
    const store = await db.ShopStoresModel.findOne({uid: user.uid});
    if(!store) {
      return ctx.redirect('/shop/openStore');
    }else{
      return ctx.redirect(`/shop/manage/${store.storeId}/home`)
    }
  })
  .use('/:account', async (ctx, next) => {
    const {data, db, params} = ctx;
    const {account} = params;
    const {user} = data;
    const myStore = await db.ShopStoresModel.findOne({storeId: account});
    if(!myStore || !user || user.uid !== myStore.uid) ctx.throw(400, "您不是该店店主");
    data.myStore = myStore;
    await next();
  })
  .get('/:account', async (ctx, next) => {
    const {data, db, params} = ctx;
    const {account} = params;
    return ctx.redirect(`/shop/manage/${account}/home`);
		// ctx.template = 'shop/manage/index.pug';
    // await next();
  })
  .use('/:account/home', homeRouter.routes(), homeRouter.allowedMethods())
  .use('/:account/shelf', shelfRouter.routes(), shelfRouter.allowedMethods())
  .use('/:account/info', infoRouter.routes(), infoRouter.allowedMethods())
  .use('/:account/decoration', decorationRouter.routes(), decorationRouter.allowedMethods())
  .use('/:account/classify', classifyRouter.routes(), classifyRouter.allowedMethods())
  .use('/:account/order', orderRouter.routes(), orderRouter.allowedMethods())
  .use('/:account/goodslist', goodslistRouter.routes(), goodslistRouter.allowedMethods())
module.exports = manageRouter;