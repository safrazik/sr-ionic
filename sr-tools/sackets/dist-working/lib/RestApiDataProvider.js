"use strict";
var AjaxRequest = (function () {
    function AjaxRequest(options) {
        if (options === void 0) { options = {}; }
        this.headers = {};
        this.url = options.url;
        this.params = options.params || {};
        this.method = options.method || 'GET';
        this.dataType = options.dataType || 'json';
        this.data = options.data;
        this.xhr = options.xhr || new XMLHttpRequest();
        if (options.headers) {
            for (var key in options.headers) {
                this.setHeader(key, options.headers[key]);
            }
        }
    }
    AjaxRequest.prototype.setHeader = function (key, value) {
        this.headers[key] = value;
    };
    AjaxRequest.prototype.unserializeData = function (rawData) {
        if (this.dataType == 'json') {
            return JSON.parse(rawData);
        }
        return rawData;
    };
    AjaxRequest.prototype.serializeData = function (data) {
        if (this.dataType == 'json') {
            return JSON.stringify(data);
        }
        return data;
    };
    AjaxRequest.prototype.send = function () {
        var _this = this;
        var encode = encodeURIComponent;
        encode = function (data) { return data; };
        var query = Object.keys(this.params)
            .map(function (k) { return encode(k) + '=' + encode(_this.params[k]); })
            .join('&');
        var url = this.url + (query ? '?' + query : '');
        this.xhr.open(this.method, url);
        if (this.dataType == 'json') {
            this.setHeader('Accept', 'application/json');
            this.setHeader('Content-Type', 'application/json');
        }
        for (var key in this.headers) {
            if (this.headers.hasOwnProperty(key)) {
                this.xhr.setRequestHeader(key, this.headers[key]);
            }
        }
        return new Promise(function (resolve, reject) {
            _this.xhr.onload = function () {
                if (_this.xhr.status === 200 || _this.xhr.status == 201) {
                    var data = _this.unserializeData(_this.xhr.responseText);
                    resolve(data);
                }
                else {
                    reject(new Error(_this.xhr.statusText));
                }
            };
            _this.xhr.onerror = function () {
                reject('Ajax Request Failed');
            };
            _this.xhr.ontimeout = function () {
                reject('Ajax Request Timed Out');
            };
            _this.xhr.send(_this.serializeData(_this.data));
        });
    };
    return AjaxRequest;
}());
var RestApiDataProvider = (function () {
    function RestApiDataProvider(url, resourceMap) {
        if (resourceMap === void 0) { resourceMap = {}; }
        this.url = url;
        this.resourceMap = resourceMap;
    }
    RestApiDataProvider.setHeader = function (key, value) {
        RestApiDataProvider.headers[key] = value;
    };
    RestApiDataProvider.prototype.doAjax = function (method, url) {
    };
    RestApiDataProvider.prototype.getResourceName = function (modelClass) {
        for (var resource in this.resourceMap) {
            if (this.resourceMap[resource] === modelClass) {
                return resource;
            }
        }
        return this.getModelClassName(modelClass).toLowerCase() + 's';
    };
    RestApiDataProvider.prototype.doHttp = function (method, modelClass, params, path, data) {
        var _this = this;
        if (params === void 0) { params = {}; }
        if (path === void 0) { path = null; }
        if (data === void 0) { data = null; }
        return new Promise(function (resolve, reject) {
            var resource = _this.getResourceName(modelClass);
            var url = _this.url + '/' + resource;
            if (path !== null) {
                url += '/' + path;
            }
            var ajax = new AjaxRequest({
                url: url,
                params: params,
                method: method,
                data: data,
                headers: RestApiDataProvider.headers,
            });
            ajax.send().then(resolve, reject);
        });
    };
    RestApiDataProvider.prototype.getModelClassName = function (modelClass) {
        var ret = modelClass.toString();
        ret = ret.substr('function '.length);
        ret = ret.substr(0, ret.indexOf('('));
        return ret;
    };
    RestApiDataProvider.prototype.save = function (modelClass, models) {
        var promises = [];
        // let model = models[0];
        // let rawModel = model;
        // let rawModel = JSON.parse(JSON.stringify(model));
        // for(var relatedProp in model.getRelated()){
        //     // alert(relatedProp);
        //     delete rawModel[relatedProp];
        // }
        // delete rawModel.__relations;
        for (var _i = 0, models_1 = models; _i < models_1.length; _i++) {
            var model = models_1[_i];
            promises.push(this.doHttp(model.id ? 'PUT' : 'POST', modelClass, {}, model.id, model));
        }
        return Promise.all(promises);
        // return new Promise((resolve, reject)=> {
        // });
    };
    RestApiDataProvider.prototype.delete = function (modelClass, models) {
        var promises = [];
        // let model = models[0];
        for (var _i = 0, models_2 = models; _i < models_2.length; _i++) {
            var model = models_2[_i];
            promises.push(this.doHttp('DELETE', modelClass, {}, model.id));
        }
        return Promise.all(promises);
        // return new Promise((resolve, reject)=> {
        // });
    };
    RestApiDataProvider.prototype.findBy = function (modelClass, filter) {
        var $sort = filter.$sort;
        var $limit = filter.$limit;
        var $skip = filter.$skip;
        var $with = filter.$with;
        delete filter.$sort;
        delete filter.$limit;
        delete filter.$skip;
        delete filter.$with;
        var params = {};
        if (Object.keys(filter).length) {
            params.filter = JSON.stringify(filter);
        }
        if ($limit !== undefined) {
            params.limit = $limit;
        }
        if ($skip !== undefined) {
            params.skip = $skip;
        }
        if ($sort !== undefined) {
            // params.sort = JSON.stringify(options.sort);
            var sortArray = [];
            for (var prop in $sort) {
                sortArray.push(($sort[prop] == -1 ? '-' : '') + prop);
            }
            if (sortArray.length) {
                params.sort = sortArray.join(',');
            }
        }
        if ($with !== undefined) {
            var withArray = [];
            for (var prop in $with) {
                if ($with[prop]) {
                    withArray.push(prop);
                }
            }
            if (withArray.length) {
                params.expand = withArray.join(',');
            }
        }
        return this.doHttp('GET', modelClass, params);
        // return new Promise((resolve, reject)=> {
        // });
    };
    RestApiDataProvider.prototype.findByMethod = function (modelClass, method, params) {
        if (params === void 0) { params = {}; }
        return this.doHttp('GET', modelClass, params, method);
    };
    RestApiDataProvider.prototype.saveByMethod = function (modelClass, models, method, params) {
        if (params === void 0) { params = {}; }
        var model = models[0];
        var rawModel = model;
        return this.doHttp('POST', modelClass, params, method, rawModel);
    };
    RestApiDataProvider.prototype.initialize = function () {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    };
    RestApiDataProvider.headers = {};
    return RestApiDataProvider;
}());
exports.RestApiDataProvider = RestApiDataProvider;
//# sourceMappingURL=RestApiDataProvider.js.map