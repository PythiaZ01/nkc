var realUrl = "";
localStorage.setItem("apptype", "app");
var allLinks = document.querySelectorAll("a");
var allButtons = document.querySelectorAll("button");
// 禁止点击连接执行跳转
Array.prototype.forEach.call(allLinks, function(link) {
  link.addEventListener("click", function(e) {
    e.preventDefault();
  })
})
// window.addEventListener("click", function(e) {
//   console.log("禁止点击")
//   e.preventDefault();
// })
$(document).ready(function() {
  // 获取url的apptype参数，要么为app，要么为false
  var apptype = getQueryVariable("apptype");
  if(apptype === "app") {
    // 去掉body的paddingTop
    if(location.pathname === "/") {
      $("body").css("padding-top", "10px");
    }
  }
})

apiready = function() {
  // 为所有的a标签添加点击事件
  // 监听全局a标签的点击事件
  // 并阻止链接点击跳转
  var allLinks = document.querySelectorAll("a");
  Array.prototype.forEach.call(allLinks, function(link) {
    link.addEventListener("click", function() {
      if(this.href) {
        var isHostUrl = siteHostLink(this.href);
        // 如果是本站链接则打开app内页，否则使用外站浏览页打开
        if(isHostUrl) {
          var paramIndex = this.href.indexOf("?");
          var newHref = "";
          var equaiHref = false;
          if(paramIndex > -1) {
            newHref = (this.href).substring(0, paramIndex)
          }else{
            newHref = this.href;
          }
          if(newHref.length > 0) {
            if(api.winName.indexOf(newHref) > -1) {
              equaiHref = true;
            }
          }
          if(equaiHref) {
            appFreshUrl(this.href);
          }else{
            appOpenUrl(this.href);
          }
        }else{
          api.openWin({
            name: 'link',
            url: 'widget://html/link/link.html',
            pageParam: {
                name: 'link',
                linkUrl: this.href
            }
          });
        }
      }
    })
  })
  // 将本页的title和description传入app中
  var locationUrl = window.location.href;
  var urlType = getShareTypeByUrl(locationUrl);
  if(urlType !== "common") {
    getSiteMeta();
  }
}

/**
 * 给url添加apptype参数
 * @param {*} urlStr 
 */
function addApptypeToUrl(url) {
  var resultUrl = url.split("?")[0];
  var paramStr = "";
  var paramsArr;
  var queryString = (url.indexOf("?") !== -1) ? url.split("?")[1] : "";
  paramStr = resultUrl + "?apptype=app";
  if(queryString !== "") {
    paramsArr = queryString.split("&");
    for(var i=0;i<paramsArr.length;i++) {
      paramStr += ("&"+paramsArr[i]);
    }
  }
  return paramStr;
}


/**
 * 使用api对象中的方法打开新连接
 * @param {} urlStr 
 */
function appOpenUrl(urlStr) {
  var paramStr = addApptypeToUrl(urlStr)
  // 如果是可以分享的类型则使用分享模板打开以便分享，否则使用其他模板打开
  var windowFile = "widget://html/common/commonInfo.html";
  var shareType = getShareTypeByUrl(paramStr);
  if(shareType !== "common") {
    windowFile = "widget://html/common/shareInfo.html"
  }
  api.openWin({
    name: paramStr,
    url: windowFile,
    pageParam: {
      realUrl: paramStr,
      shareType: shareType
    }
  })
}

/**
 * 使用api对象中的方法刷新当前页面的的链接
 * @param {*} key 
 */
function appFreshUrl(urlStr) {
  var paramStr = addApptypeToUrl(urlStr)
  var winName = api.winName;
  var shareType = api.pageParam.shareType;
  api.openFrame({
    name: winName,
    url: paramStr,
    reload: true,
    pageParam: {
      realUrl: paramStr,
      shareType: shareType
    }
  })
}

/**
 * 获取url中的app参数
 * @param {*} key 
 */
function getQueryVariable(key)
{
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    if(pair[0] == key){return pair[1];}
  }
  return(false);
}

/**
 * 判断url是否为本站链接
 * @param {*} urlStr
 */
function siteHostLink(urlStr) {
  var hostStr = window.location.host;
  var hostIndex = urlStr.indexOf(hostStr);
  if(hostIndex === -1) {
    return false;
  }else{
    return true;
  }
}

/**
 * 获取当前页面的meta中的title和description
 */
function getSiteMeta() {
  var title, description;
  try{
    title = document.getElementsByTagName("title")[0].text;
  }catch(e){
    title = "来自科创论坛的分享";
  }
  try {
    description = document.getElementsByName("description")[0].getAttribute("content");
  }catch(e) {
    description = "倡导科学理性，发展科技爱好";
  }
  var para = {
    title: title,
    description: description
  };
  var paraStr = JSON.stringify(para);
  api.execScript({
    name: realUrl,
    script: 'getAppMeta('+paraStr+');'
  });
}


/**
* @description 根据url判断分享类型
* @param {String} sourceUrl
* @return shareType
*/
function getShareTypeByUrl(sourceUrl) {
  var typeObj = {
    "thread": "/t/",
    "user": "/u/",
    "post": "/p/",
    "forum": "/f/",
    "activity": "/activity/"
  }
  var shareType = "common";
  for(var i in typeObj) {
    if(sourceUrl.indexOf(typeObj[i]) > -1) {
      shareType = i;
      break;
    }
  }
  return shareType;
}