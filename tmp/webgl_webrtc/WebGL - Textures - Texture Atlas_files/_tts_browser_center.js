/* @date:2015-12-14_15_31_10 */
!function(a){function b(){!function(b,c,d,e,f,g,h){function i(a){return function(){return h.push(a,arguments),g}}return b[c]?void(a.__tk__define=a.define):(b[c]=g={args:h=[],config:i(1),use:i(2),on:i(3)},b.TKdefine=i(0),e=d.createElement("script"),e.id=c+"node",e.charset="utf-8",e.async=!0,e.src="//ext.taotaosou.com/browser-static/taobao/sea.js?t=12141531",f=d.getElementById("site-nav")?d.getElementById("site-nav"):d.getElementsByTagName("head")[0],void f.appendChild(e))}(window,"__tk__seajs",document)}function c(a,b){var c,d=document.createElement("script");d.type="text/javascript",d.charset="utf-8",d.src=a,d.async=!0,d.onload=d.onreadystatechange=function(){d.isLoad||d.readyState&&"loaded"!==d.readyState&&"complete"!==d.readyState||(d.isLoad=!0,"function"==typeof b&&b(d),d.onload=d.onreadystatechange=null,d.parentNode.removeChild(d))},c=document.getElementById("site-nav")?document.getElementById("site-nav"):document.body,c.appendChild(d)}function d(){var a="0000000000000001",b=e(),c="";return t&&(t.getAttribute("data-id")&&(a=t.getAttribute("data-id")),t.getAttribute("data-source")&&(b=t.getAttribute("data-source")),t.getAttribute("data-guid")&&(c=t.getAttribute("data-guid"))),{id:a,browser:b,guid:c}}function e(){var b="other";if(q.match(/CoolNovo/))b="CoolNovo";else if(q.match(/MetaSr/))b="sogou";else if(q.match(/QIHU 360EE/))b="360js";else if(q.match(/Chrome/))b="Chrome";else if(q.match(/MSIE/)){var c=/msie ([\d.]+)/gi,d=c.exec(q);b=null!==d?d[0]:"ie"}else"object"==typeof a.external&&a.external.twGetRunPath&&a.external.twGetRunPath.match(/360se/)&&(b="360aq");return b}function f(){for(var a="s-",b=1;32>=b;b++){var c=Math.floor(16*Math.random()).toString(16);a+=c,(8===b||12===b||16===b||20===b)&&(a+="-")}return a}function g(a){var b,c=document.createElement("img");"string"==typeof a&&(a+=a.match(/\?/)?"&t=":"?t=",a+=(new Date).getTime()),c.setAttribute("src",a),c.setAttribute("width",0),c.setAttribute("height",0),c.style.display="none",c.onerror=null,document.getElementById("TK-log")?b=document.getElementById("TK-log"):(b=document.createElement("div"),b.id="TK-log",document.body.appendChild(b)),b.appendChild(c)}function h(){var a="//log.taotaosou.com/browser_statistics.do?",b="";s.match("www.mogujie.com/note/")||s.match("www.mogujie.com/group/topic/")?b="MGJ_Note_PV":s.match("meilishuo.com")&&(b="MLS_Share_PV"),b&&g(a+"type="+b)}function i(){var a="//log.taotaosou.com/ditchSite.do?",b="";r.match(/baidu.com/)?b="baidu.com":r.match(/qq.com/)?b="qq.com":r.match(/taobao.com/)?b="taobao.com":r.match(/tmall.com/)?b="tmall.com":r.match(/4399.com/)?b="4399.com":r.match(/360.cn/)?b="360.cn":r.match(/youku.com/)&&(b="youku.com"),b&&g(a+"ditchId="+d().id+"&fromSite="+b+"&z1_guid="+d().guid)}function j(){try{b(),a.__tk__seajs.config({map:[[/init.js/,function(a){return a+=-1===a.indexOf("?")?"?":"&",a+="t=12141531"}]]}),a.__tk__seajs.use("init")}catch(c){g("//log.taotaosou.com/browser_statistics.do?type=center_err")}}function k(){var a="user.qzone.qq.com";r===a&&(d().id.match(/B611040020150619/)||c("//ext.taotaosou.com/browser-static/qzone/qzone.js?t=12141531"))}function l(){s.match(/hzwuzhou|chaoji99|etao|alipay|zhifubao|alimama|alibaba|360safe.com|ie.sogou.com|liebao.cn|maxthon.cn|chrome.google.com\/webstore/)||d().id.match(/B611040020150619/)||c("//ext.taotaosou.com/js/tts_union_center.js?suid=10003028&v=12141531")}function m(){var a=("https:"===document.location.protocol?"https://":"http://")+"hm.baidu.com/h.js?";c(a+"f5127c6793d40d199f68042b8a63e725")}function n(b){var c=function(b){"complete"===document.readyState?b():document.addEventListener?(document.addEventListener("DOMContentLoaded",b,!1),a.addEventListener("load",b,!1)):document.attachEvent("onreadystatechange",b)};return b?void(q.match(/MSIE/)?c(function(){b()}):b()):!1}function o(a,b){var c=b||{};for(var d in a)"object"==typeof a[d]?(c[d]=a[d].constructor===Array?[]:{},o(a[d],c[d])):c[d]=a[d];return c}var p=function(){return a.self!==top?!0:!1};if("undefined"!=typeof a.TTSBrowserPlugin||p())return!1;a.TTSBrowserPlugin=!0;var q=a.navigator.userAgent,r=a.document.location.host,s=a.document.location.href,t=document.getElementById("J---TK-load"),u=f();a.jiayuId=u;var v="",w=document.cookie;w.match(/tracknick/)&&(v=w.replace(/.*tracknick=/,"").replace(/;.*/,""));var x=function(){return"item.taobao.com"!==r&&"detail.tmall.com"!==r||!document.getElementById("LineZing")?"":document.getElementById("LineZing").getAttribute("shopid")}(),y="//dclog.taotaosou.com/statistics.do?systemName=ttk_all&host="+(r||"")+"&ditch="+(d().id||"")+"&browser="+(d().browser||"")+"&url=1&ref="+(a.encodeURIComponent(a.document.referrer)||"")+"&sid="+a.jiayuId+"&z1_guid="+d().guid+"&z2_nick="+a.encodeURIComponent(v)+"&z3_shopid="+x;g(y),n(function(){c("//ext.taotaosou.com/js/config.js",function(){var b={media:{def:!0},taobao:{def:!0,model:{list:!0,detail:!0,lds:!0}},tmt:{def:!0,model:{shopSite:!0,paopao:!0,insert:!0,href:!0,qzone:!0,cps:!0}}};a.TK_config&&(b=o(a.TK_config,b)),i(),h(),b.taobao.def&&j();var c=["taobao","tmall","jd","vip","mogujie","meilishuo"];if(b.tmt.def)if(b.tmt.model.qzone&&k(),b.tmt.model.shopSite){for(var d=0;d<c.length;d++)if(r.indexOf(c[d])>=0){l();break}}else l()})}),m()}(window);