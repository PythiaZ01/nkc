const PATH = require('path');
const Router = require('koa-router');
const frameRouter = new Router();
frameRouter
  .get('/:_id', async (ctx, next) => {
    const {db, params, settings, fs, query, data} = ctx;
    const {_id} = params;
    const {messageFilePath} = settings.upload;
    const messageFile = await db.MessageFileModel.findOnly({_id});
    const {ext, path} = messageFile;
    let rePath = path.replace(_id+"."+ext, _id+"-frame.jpg");
    // let path = "/2019/08/262-frame.jpg";
    let filePath = PATH.join(settings.upload.messageVideoFramePath, rePath);
    try {
      await fs.access(filePath);
    } catch(err) {
      filePath = settings.statics.defaultMessageVideoFramePath;
    }
    ctx.set('Cathe-Control', `public, max-age=${settings.cache.maxAge}`);
    ctx.filePath = filePath;
    ctx.type = "jpg";
    await next();
  })
module.exports = frameRouter;