module.exports = async (ctx, next) => {
  const {params, nkcModules, data, db, state} = ctx;
  const {page = 0} = params;
  const {match} = state;
  const {subDisciplinesId, targetUser} = data;
  match.uid = targetUser.uid;
  match.type = "forum";
  match.fid = {$in: subDisciplinesId};
  const count = await db.SubscribeModel.count(match);
  const paging = await nkcModules.apiFunction.paging(page, count);
  const subscribes = await db.SubscribeModel.find(match);
  const subscribesObj = {};
  subscribes.map(s => subscribesObj[s.fid] = s);
  data.subscribes = await db.SubscribeModel.extendSubscribes(subscribes);
  data.subscribesObj = subscribesObj;
  data.paging = paging;
  await next();
};