(function(exports) {
    "use strict";
    if (typeof tbsJs == 'undefined') {
        console.warn('can not find tbsJs');
        return false;
    }
    var isTbsApiEnabled = tbsJs.isTbsJsapiEnabled(); //开关
    if (!isTbsApiEnabled) {
        console.warn('isTbsApiEnabled = ', isTbsApiEnabled);
        return false;
    }

    var qua = tbsJs.getQUA2(); // tbsJs 是终端注入的对象
    try {
        var quaObj = {};
        var keyValues = qua.split('&');
        keyValues.forEach(function(keyValue) {
            keyValue = keyValue.split('=');
            quaObj[keyValue[0]] = keyValue[1];
        });
    } catch (e) {
        console.error('parse qua error, qua = ', qua);
        return false;
    }

    if (quaObj['QV'] == 2) {
        var quaVersion = 2;
        var coreName = quaObj['CO'];
        var coreVersion = quaObj['COVN'];
        //IMTT iOS系统内核 AMTT android系统内核
        if (coreName == 'AMTT' || coreName == 'IMTT') {
            var kernelType = 2;
        } else {
            var kernelType = 1;
        }
        var parentPackage = quaObj['PP'];
        var packageVersion = quaObj['PPVC'];
    } else {
        var quaVersion = 3;
        var coreName = quaObj['CO'];
        var coreVersion = quaObj['COVC'];
        if (coreName == 'SYS') {
            var kernelType = 2;
        } else {
            var kernelType = 1;
        }
        var parentPackage = quaObj['PP'];
        var packageVersion = quaObj['PPVN'];
    }

    if (!window.tbs_bridge) {
        if (parseInt(coreVersion, 10) >= 25405) {
            window.tbs_bridge = {
                nativeExec : function(service, action, callbackId, options) {
                    return prompt(options, 'mtt:[' + [service, action, callbackId] + ']');
                }
            };
        } else {
            console.warn('Not Support TBS JSAPI');
            return false;
        }
    }

    tbs_bridge.callbackId = Date.now();
    tbs_bridge.callbacks = {};

    tbs_bridge.exec = function(service, action, options, callback) {
        var callbackId,
            ret,
            optType = typeof options,
            cbType = typeof callback;

        // 情况一：(service, action)
        if (optType === 'undefined' && cbType === 'undefined') {
            options = '';
        }
        // 情况二：(service, action, callback)
        else if (optType === 'function') {
            callback = options;
            options = '';
            cbType = 'function';
        }
        // 情况三：(service, action, options)
        // 情况四：(service, action, options, callback)

        // options 不是函数 不是对象 也不是undefined，就抛出类型错误
        else if (optType !== 'object') {
            throw new TypeError('[' + service + '.' + action + '] "options" parameter of the interface must be an Object or Function!');
        }

        // 到这里已经保证 options 一定对象或空字符串
        callbackId = service + tbs_bridge.callbackId++;
        options = options === '' ? '' : JSON.stringify(options);

        if (cbType === 'function') {
            tbs_bridge.callbacks[callbackId] = callback;
        }
        ret = tbs_bridge.nativeExec(service, action, callbackId, options);
        if (ret === 'true') {
            return true;
        } else if (ret === 'false') {
            return false;
        } else {
            return ret;
        }
    };

    /**
     * 给终端执行的回调函数
     *
     * @param {String} callbackId 前端在执行 tbs_bridge.nativeExec() 方法时传给终端的ID，此时透传回来
     * @param {Object} result 终端返回的结果，结构如： {keep: true|false, data: xxx}，keep 是否保留callback，data 是终端要返回给接口的真实数据，可为任意 JS 数据类型
     */
    tbs_bridge.callbackFromNative = function(callbackId, result) {
        var callback = tbs_bridge.callbacks[callbackId];

        try {
            result = JSON.parse(result);
        } catch (err) {
            throw err;
        }

        if (callback) {
            if (!result.keep) {
                delete tbs_bridge.callbacks[callbackId];
            }
            callback(result.data);
        }
    };

    tbs_bridge.createEvent = function(type, data) {
        var event = document.createEvent('Events');
        event.initEvent(type, false, false);
        if (data) {
            for (var i in data) {
                if (data.hasOwnProperty(i)) {
                    event[i] = data[i];
                }
            }
        }
        return event;
    };

    tbs_bridge.fireEvent = function(type, params) {
        var channel = window.channel[type];
        if (channel) {
            var data = params && JSON.parse(params);
            var evt = tbs_bridge.createEvent(type, data);
            channel.fire(evt);
        }
    };

    window.channel = {
        create : function(type) {
            return window.channel[type] = new Channel(type);
        },
        nextGuid : 0
    };

    var Channel = function(type) {
        this.type = type;
        this.handlers = {};
        this.numHandlers = 0;
        this.onHasSubscribersChange = null;
    };

    Channel.prototype.subscribe = function(f) {
        var func = f,
            guid = f.observer_guid;

        if (!guid) {
            // first time any channel has seen this subscriber
            guid = '' + window.channel.nextGuid++;
        }
        func.observer_guid = guid;
        f.observer_guid = guid;

        // Don't add the same handler more than once.
        if (!this.handlers[guid]) {

            this.handlers[guid] = func;
            this.numHandlers++;

            if (this.numHandlers == 1) {
                this.onHasSubscribersChange && this.onHasSubscribersChange();
            }
        }
    };

    /**
     * Unsubscribes the function with the given guid from the channel.
     */
    Channel.prototype.unsubscribe = function(f) {
        var guid = f.observer_guid,
            handler = this.handlers[guid];
        if (handler) {
            delete this.handlers[guid];
            this.numHandlers--;

            if (this.numHandlers === 0) {
                this.onHasSubscribersChange && this.onHasSubscribersChange();
            }
        }
    };

    /**
     * Calls all functions subscribed to this channel.
     */
    Channel.prototype.fire = function(e) {
        if (this.numHandlers) {
            // Copy the values first so that it is safe to modify it from within
            // callbacks.
            var toCall = [];
            for (var item in this.handlers) {
                toCall.push(this.handlers[item]);
            }
            for (var i = 0; i < toCall.length; ++i) {
                toCall[i](e);
            }
        }
    };

    // 根据 tbs.oa.com 平台的数据和终端返回 qua 信息进行过滤 tbs js api data
    var filterData = function(data) {
        var ret = {};
        for (var service in data) {
            ret[service] = {};
            var hash = {};
            for (var action in data[service]) {
                var api = data[service][action];
                var version = -1; //当前最合适的版本号
                var matchCode = null;//当前最合适的代码
                for (var pp in api) { //parentPackage
                    hash[pp] = api[pp];
                }
                if (parentPackage != 'all' && hash[parentPackage] && hash[parentPackage].length > 0) { //有匹配宿主的代码
                    for (var i = 0, l = hash[parentPackage].length; i < l; ++i) {
                        var detail = hash[parentPackage][i];
                        var detailCoreVersion = parseInt(detail.versions[1], 10) || -1;
                        if (kernelType == detail.versions[0]) { //内核匹配成功
                            if (coreVersion == detailCoreVersion) {
                                matchCode = detail.code; //精确匹配api
                                break;
                            } else if (coreVersion > detailCoreVersion) {
                                if (version == -1) { //第一个可能符合条件的code
                                    version = detailCoreVersion;
                                    matchCode = detail.code;
                                } else if (version != 0 && detailCoreVersion < version) { //更加精确的code
                                    version = detailCoreVersion;
                                    matchCode = detail.code;
                                } else if (version == 0) {//detailCoreVersion为0则匹配所有版本号
                                    version = detailCoreVersion;
                                    matchCode = detail.code;
                                } else { //当前的更为符合条件

                                }
                            } else {
                                //不符合条件，即所有内核匹配成功的代码都不支持早期版本
                            }
                        } else {//内核未匹配成功

                        }
                    }

                }

                if (matchCode) { //已找到匹配的代码
                    ret[service][action] = matchCode;
                } else { //还未找到匹配的代码
                    if (hash['all']) {
                        for (var i = 0, l = hash['all'].length; i < l; ++i) {
                            var detail = hash['all'][i];
                            var detailCoreVersion = parseInt(detail.versions[1], 10) || -1;
                            if (kernelType == detail.versions[0]) { //内核匹配成功
                                if (coreVersion == detailCoreVersion) {
                                    matchCode = detail.code; //除宿主外精确匹配api
                                    break;
                                } else if (coreVersion > detailCoreVersion) {
                                    if (version == -1) { //第一个可能符合条件的code
                                        version = detailCoreVersion;
                                        matchCode = detail.code;
                                    } else if (version != 0 && detailCoreVersion < version) { //更加精确的code
                                        version = detailCoreVersion;
                                        matchCode = detail.code;
                                    } else if (version == 0) {//detailCoreVersion为0则匹配所有版本号
                                        version = detailCoreVersion;
                                        matchCode = detail.code;
                                    } else { //当前的更为符合条件

                                    }
                                } else {
                                    //不符合条件，即所有内核匹配成功的代码都不支持早期版本
                                }
                            } else {//内核未匹配成功

                            }
                        }

                        if (matchCode) { //已找到匹配的代码
                            ret[service][action] = matchCode;
                        } else {
                            console.log('can not find matching code, service = ', service, ', action = ', action,
                                ', parentPackage = ', parentPackage, ', kernelType = ', kernelType,
                                ', coreVersion = ', coreVersion);
                        }
                    }
                }
            }
        }

        return ret;
    };

    /**
     *  根据过滤后的数据进行构建 tbs js api
     *
     * @param {Object} apiData 过滤后的数据
     */
    var buildApi = function(apiData) {
        for (var service in apiData) {
            for (var action in apiData[service]) {
                try {
                    new Function(apiData[service][action])();
                } catch (e) {
                    console.error('apiData[service][action] = ', apiData[service][action]);
                    console.error(e);
                }
            }
        }
    };

    /**
     * 创建命名空间
     *
     * @param {String} name 如：tbs.app
     * @returns {Object} 返回一个对象，对应一个具体的 service 对象
     */
    var createNamespace = function(name) {
        var arr = name.split('.'),
            space = window;

        arr.forEach(function(a) {
            space[a] = space[a] || {};
            space = space[a];
        });
        return space;
    };

    // exports public api
    exports.tbs = {
        /**
         * 用来对API进行定义
         *
         * @param {String} name 要定义 api 字符串，包括命名空间、模块名称和api名称，如：tbs.debug.log
         * @param {Function} fn 调用 name 参数定义的 api 时，真正要执行的函数
         */
        define : function(name, fn) {
            var index = name.lastIndexOf('.'),
                ns = createNamespace(name.substring(0, index));
            ns[name.substring(index + 1)] = fn;
        }
    };

    var tbsApiData = {"data":{"app":{"sendLinkToDesktop":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.app.sendLinkToDesktop\", function(options,callback){\n\treturn tbs_bridge.exec(\"app\", \"sendLinkToDesktop\", options,callback);\n});"}]},"isLinkOnDesktop":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.app.isLinkOnDesktop\", function(options,callback){\n\treturn tbs_bridge.exec(\"app\", \"isLinkOnDesktop\", options,callback);\n});"}]},"saveOfflinePage":{"wx":[{"versions":[1,"0"],"code":"tbs.define(\"tbs.app.saveOfflinePage\", function(callback){\n\treturn tbs_bridge.exec(\"app\", \"saveOfflinePage\", callback);\n});"}]}},"network":{"type":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.network.type\", function(){\n\treturn tbs_bridge.exec(\"network\", \"type\");\n});"}]}},"debug":{"test1":{"wx":[{"versions":[1,"0"],"code":"tbs.define(\"tbs.debug.test1\", function(){\n \talert(\"tbs.debug.test1()\");\n\talert(\"wechat x5 allVersion all star\");\n});"}]},"test2":{"wx":[{"versions":[1,"036530"],"code":"tbs.define(\"tbs.debug.test2\", function(){\n  alert(\"tbs.debug.test2()\");\n alert(\"wechat x5 Version036530 wechat *.qq.com\");\n});"}]},"test3":{"all":[{"versions":[1,"0"],"code":"tbs.define(\"tbs.debug.test3\", function(){\n  alert(\"tbs.debug.test1()\");\n alert(\"all x5 allVersion all *.sina.com\");\n});"}]}},"deeplink":{"deeplinkCheckInstallation":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.deeplink.deeplinkCheckInstallation\", function(options,callback){\n\treturn tbs_bridge.exec(\"deeplink\", \"deeplinkCheckInstallation\", options,callback);\n});"}]}},"event":{"downloadstatuschange":{"all":[{"versions":[1,"025477"],"code":"tbs.define(\"tbs.event.downloadstatuschange\", function(handler){\n    var str = new Date().getTime();\n    window[str] = handler;\n    var ch = channel['ondownloadstatuschange'];\n    if (!ch) {\n        ch = channel.create('ondownloadstatuschange');\n        ch.onHasSubscribersChange = function () {\n            tbs_bridge.exec(\"download\", \"subscribeChanged\", { numHandlers: this.numHandlers });\n        }\n    }\n    ch.subscribe(handler);\n});"}]},"connectionchange":{"all":[{"versions":[1,"025477"],"code":"tbs.define(\"tbs.event.connectionchange\", function(handler){\n    var str = new Date().getTime();\n    window[str] = handler;\n    var ch = channel['onconnectionchange'];\n    if (!ch) {\n        ch = channel.create('onconnectionchange');\n        ch.onHasSubscribersChange = function () {\n            tbs_bridge.exec(\"network\", \"subscribeChanged\", { numHandlers: this.numHandlers });\n        }\n    }\n    ch.subscribe(handler);\n});"}]},"onwebviewvalidate":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.event.onwebviewvalidate\", function(handler){\n    var str = new Date().getTime();\n    window[str] = handler;\n    var ch = channel['onwebviewvalidate'];\n      if (!ch) {\n         ch = channel.create('onwebviewvalidate');\n         ch.onHasSubscribersChange = function () {\n         tbs_bridge.exec(\"debug\", \"subscribeChanged\", { numHandlers: this.numHandlers, type: 'onwebviewvalidate'});\n      }\n    }\n    ch.subscribe(handler);\n});"}]},"onfirstscreen":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.event.onfirstscreen\", function(handler){\n    var str = new Date().getTime();\n    window[str] = handler;\n    var ch = channel['onfirstscreen'];\n    if (!ch) {\n        ch = channel.create('onfirstscreen');\n        ch.onHasSubscribersChange = function () {\n          tbs_bridge.exec(\"debug\", \"subscribeChanged\", { numHandlers: this.numHandlers, type: 'onfirstscreen'});\n        }\n    }\n    ch.subscribe(handler);\n});"}]},"onminiqbstatuschange":{"all":[{"versions":[1,"036507"],"code":"tbs.define(\"tbs.event.onminiqbstatuschange\", function(handler){\n    var str = new Date().getTime();\n    window[str] = handler;\n    var ch = channel['onminiqbstatuschange'];\n    if (!ch) {\n        ch = channel.create('onminiqbstatuschange');\n        ch.onHasSubscribersChange = function () {\n          tbs_bridge.exec(\"debug\", \"subscribeChanged\", { numHandlers: this.numHandlers, type: 'onminiqbstatuschange'});\n        }\n    }\n    ch.subscribe(handler);\n});"}]}},"midpage":{"openMidPage":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.midpage.openMidPage\", function(options,callback){\n\treturn tbs_bridge.exec(\"midpage\", \"openMidPage\", options,callback);\n});"}]},"closeMidPage":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.midpage.closeMidPage\", function(callback){\n\treturn tbs_bridge.exec(\"midpage\", \"closeMidPage\", callback);\n});"}]}},"download":{"getDownloadFileTotalSize":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.download.getDownloadFileTotalSize\", function(options){\n\treturn tbs_bridge.exec(\"download\", \"getDownloadFileTotalSize\", options);\n});"}]},"getDownloadProgress":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.download.getDownloadProgress\", function(options){\n\treturn tbs_bridge.exec(\"download\", \"getDownloadProgress\", options);\n});"}]},"getDownloadStatus":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.download.getDownloadStatus\", function(options){\n\treturn tbs_bridge.exec(\"download\", \"getDownloadStatus\", options);\n});"}]},"installApp":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.download.installApp\", function(options,callback){\n\treturn tbs_bridge.exec(\"download\", \"installApp\", options,callback);\n});"}]},"isFileDownloaded":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.download.isFileDownloaded\", function(options){\n\treturn tbs_bridge.exec(\"download\", \"isFileDownloaded\", options);\n});"}]},"startDownload":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.download.startDownload\", function(options,callback){\n\treturn tbs_bridge.exec(\"download\", \"startDownload\", options,callback);\n});"}]}},"tbs":{"callSystemChooseWifi":{"all":[{"versions":[1,"025477"],"code":"tbs.define(\"tbs.tbs.callSystemChooseWifi\", function(){\n\treturn tbs_bridge.exec(\"tbs\", \"callSystemChooseWifi\");\n});"}]},"getCurrConnectedWifiInfo":{"all":[{"versions":[1,"025477"],"code":"tbs.define(\"tbs.tbs.getCurrConnectedWifiInfo\", function(){\n\treturn tbs_bridge.exec(\"tbs\", \"getCurrConnectedWifiInfo\");\n});"}]},"isQBRunning":{"all":[{"versions":[1,"025477"],"code":"tbs.define(\"tbs.tbs.isQBRunning\", function(){\n\treturn tbs_bridge.exec(\"tbs\", \"isQBRunning\");\n});"}]},"isQBServiceRunning":{"all":[{"versions":[1,"025477"],"code":"tbs.define(\"tbs.tbs.isQBServiceRunning\", function(){\n\treturn tbs_bridge.exec(\"tbs\", \"isQBServiceRunning\");\n});"}]},"runQBService":{"all":[{"versions":[1,"025477"],"code":"tbs.define(\"tbs.tbs.runQBService\", function(callback){\n\treturn tbs_bridge.exec(\"tbs\", \"runQBService\", callback);\n});"}]},"dialog":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.tbs.dialog\", function(options,callback){\n\treturn tbs_bridge.exec(\"tbs\", \"dialog\", options,callback);\n});"}]},"qua2":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.tbs.qua2\", function(){\n\treturn tbs_bridge.exec(\"tbs\", \"qua2\");\n});"}]},"toast":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.tbs.toast\", function(options,callback){\n\treturn tbs_bridge.exec(\"tbs\", \"toast\", options,callback);\n});"}]}},"gameplayer":{"login":{"all":[{"versions":[1,"0"],"code":"tbs.define(\"tbs.gameplayer.login\", function(options,callback){\n\treturn tbs_bridge.exec(\"gameplayer\", \"login\", options,callback);\n});"}]},"refreshToken":{"all":[{"versions":[1,"0"],"code":"tbs.define(\"tbs.gameplayer.refreshToken\", function(options,callback){\n\treturn tbs_bridge.exec(\"gameplayer\", \"refreshToken\", options,callback);\n});"}]},"share":{"all":[{"versions":[1,"0"],"code":"tbs.define(\"tbs.gameplayer.share\", function(options,callback){\n\treturn tbs_bridge.exec(\"gameplayer\", \"share\", options,callback);\n});"}]},"logout":{"all":[{"versions":[1,"0"],"code":"tbs.define(\"tbs.gameplayer.logout\", function(options,callback){\n\treturn tbs_bridge.exec(\"gameplayer\", \"logout\", options,callback);\n});"}]},"version":{"all":[{"versions":[1,"0"],"code":"tbs.define(\"tbs.gameplayer.version\", function(options,callback){\n\treturn tbs_bridge.exec(\"gameplayer\", \"version\", options,callback);\n});"}]},"getUserInfo":{"all":[{"versions":[1,"0"],"code":"tbs.define(\"tbs.gameplayer.getUserInfo\", function(options,callback){\n\treturn tbs_bridge.exec(\"gameplayer\", \"getUserInfo\", options,callback);\n});"}]},"getGamePlayerAuthInfo":{"all":[{"versions":[1,"0"],"code":"tbs.define(\"tbs.gameplayer.getGamePlayerAuthInfo\", function(options,callback){\n\treturn tbs_bridge.exec(\"gameplayer\", \"getGamePlayerAuthInfo\", options,callback);\n});"}]},"getGameFriends":{"all":[{"versions":[1,"0"],"code":"tbs.define(\"tbs.gameplayer.getGameFriends\", function(options,callback){\n\treturn tbs_bridge.exec(\"gameplayer\", \"getGameFriends\", options,callback);\n});"}]},"getAvailableLoginType":{"all":[{"versions":[1,"0"],"code":"tbs.define(\"tbs.gameplayer.getAvailableLoginType\", function(options,callback){\n\treturn tbs_bridge.exec(\"gameplayer\", \"getAvailableLoginType\", options,callback);\n});"}]},"sendToDesktop":{"all":[{"versions":[1,"0"],"code":"tbs.define(\"tbs.gameplayer.sendToDesktop\", function(options,callback){\n\treturn tbs_bridge.exec(\"gameplayer\", \"sendToDesktop\", options,callback);\n});"}]},"pay":{"all":[{"versions":[1,"0"],"code":"tbs.define(\"tbs.gameplayer.pay\", function(options,callback){\n\treturn tbs_bridge.exec(\"gameplayer\", \"pay\", options,callback);\n});"}]},"openTopicCircle":{"all":[{"versions":[1,"0"],"code":"tbs.define(\"tbs.gameplayer.openTopicCircle\", function(options,callback){\n\treturn tbs_bridge.exec(\"gameplayer\", \"openTopicCircle\", options,callback);\n});"}]}},"gameframework":{"webToNativeCallback":{"all":[{"versions":[1,"0"],"code":"tbs.define(\"tbs.gameframework.webToNativeCallback\", function(options){\n\treturn tbs_bridge.exec(\"gameframework\", \"webToNativeCallback\", options);\n});"}]},"launchGame":{"all":[{"versions":[1,"0"],"code":"tbs.define(\"tbs.gameframework.launchGame\", function(options){\n\treturn tbs_bridge.exec(\"gameframework\", \"launchGame\", options);\n});"}]},"isGameFrameworkSupported":{"all":[{"versions":[1,"025486"],"code":"tbs.define(\"tbs.gameframework.isGameFrameworkSupported\", function(){\n\treturn tbs_bridge.exec(\"gameframework\", \"isGameFrameworkSupported\");\n});"}]}},"device":{"getIMEI":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.device.getIMEI\", function(callback){\n\treturn tbs_bridge.exec(\"device\", \"getIMEI\", callback);\n});"}]},"getMAC":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.device.getMAC\", function(callback){\n\treturn tbs_bridge.exec(\"device\", \"getMAC\", callback);\n});"}]}},"package":{"getApkInfo":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.package.getApkInfo\", function(options,callback){\n\treturn tbs_bridge.exec(\"package\", \"getApkInfo\", options,callback);\n});"}]},"isApkInstalled":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.package.isApkInstalled\", function(options,callback){\n\treturn tbs_bridge.exec(\"package\", \"isApkInstalled\", options,callback);\n});"}]},"runApp":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.package.runApp\", function(options,callback){\n\treturn tbs_bridge.exec(\"package\", \"runApp\", options,callback);\n});"}]}},"screen":{"cancelPageFullScreen":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.screen.cancelPageFullScreen\", function(callback){\n\treturn tbs_bridge.exec(\"screen\", \"cancelPageFullScreen\", callback);\n});"}]},"cancelScreenBacklight":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.screen.cancelScreenBacklight\", function(callback){\n\treturn tbs_bridge.exec(\"screen\", \"cancelScreenBacklight\", callback);\n});"}]},"requestPageFullScreen":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.screen.requestPageFullScreen\", function(callback){\n\treturn tbs_bridge.exec(\"screen\", \"requestPageFullScreen\", callback);\n});"}]},"requestScreenBacklight":{"all":[{"versions":[1,"025450"],"code":"tbs.define(\"tbs.screen.requestScreenBacklight\", function(callback){\n\treturn tbs_bridge.exec(\"screen\", \"requestScreenBacklight\", callback);\n});"}]}},"video":{"sniffVideo":{"all":[{"versions":[1,"36811"],"code":"tbs.define(\"tbs.video.sniffVideo\", function(webUrl, clarity, callback){\n  var options = {\"webUrl\":webUrl, \"clarity\":clarity};\n  return tbs_bridge.exec(\"video\", \"sniffVideo\", options, callback);\n});"}]}}},"hosts":{"all":"all","com.tencent.mm":"wx","com.tencent.moblieqq":"qq","com.tencent.mtt":"qb","com.qzone":"qz"}}; // 后台会替换整个字符串，包括双引号
    parentPackage = tbsApiData.hosts[parentPackage] || 'all';
    buildApi(filterData(tbsApiData.data)); // 根据解析后的 qua 进行过滤数据，并且构建 tbs api

    //触发终端的更新白名单逻辑
    tbsJs.onReady('{useCachedApi : "true"}', function(result) {
    });
})(window);