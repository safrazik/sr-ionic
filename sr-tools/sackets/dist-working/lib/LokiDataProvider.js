"use strict";
var Model_1 = require('./Model');
var loki = require('lokijs');
// import * as LokiIndexedAdapter from 'lokijs/src/loki-indexed-adapter';
var LokiIndexedAdapter = require('lokijs/src/loki-indexed-adapter');
var LokiDataProvider = (function () {
    function LokiDataProvider(options) {
        if (options === void 0) { options = {}; }
        this.options = options;
        this.findByMethodsMap = {};
        this.saveByMethodsMap = {};
        this.storage = null;
        if (!this.options.adapter) {
            this.options.adapter = new LokiIndexedAdapter('the_app_idb');
        }
        // if(!this.storage){
        //     this.storage = new InMemoryStorage();
        // }
    }
    LokiDataProvider.prototype.saveDb = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.db.save(function (err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    };
    LokiDataProvider.prototype.getCollection = function (modelClass) {
        var modelClassName = this.getModelClassName(modelClass);
        var collection = this.db.getCollection(modelClassName);
        if (!collection) {
            collection = this.db.addCollection(modelClassName);
        }
        return collection;
    };
    LokiDataProvider.applyFilter = function (results, filter) {
        if (filter === void 0) { filter = {}; }
        var $sort = filter.$sort;
        var $limit = filter.$limit;
        var $skip = filter.$skip;
        var $with = filter.$with;
        delete filter.$sort;
        delete filter.$limit;
        delete filter.$skip;
        delete filter.$with;
        results = results.find(filter);
        if ($sort) {
            var sortDefs = [];
            for (var prop in $sort) {
                sortDefs.push([prop, $sort[prop] == -1]);
            }
            results = results.compoundsort(sortDefs);
        }
        if ($limit !== undefined) {
            results = results.limit($limit);
        }
        if ($skip !== undefined) {
            results = results.offset($skip);
        }
        if ($with) {
        }
        return results;
    };
    LokiDataProvider.prototype.applyFilter = function (results, filter) {
        if (filter === void 0) { filter = {}; }
        return LokiDataProvider.applyFilter(results, filter);
    };
    LokiDataProvider.prototype.getModelClassName = function (modelClass) {
        var ret = modelClass.toString();
        ret = ret.substr('function '.length);
        ret = ret.substr(0, ret.indexOf('('));
        return ret;
    };
    LokiDataProvider.prototype.saveSync = function (modelClass, models) {
        var collection = this.getCollection(modelClass);
        for (var _i = 0, models_1 = models; _i < models_1.length; _i++) {
            var model = models_1[_i];
            if (!model.$loki) {
                collection.insert(model);
            }
            else {
                collection.update(model);
            }
        }
        this.saveDb();
        return true;
    };
    LokiDataProvider.prototype.cacheSync = function (modelClass, models) {
        var collection = this.getCollection(modelClass);
        for (var _i = 0, models_2 = models; _i < models_2.length; _i++) {
            var model = models_2[_i];
            if (model.$loki) {
                collection.update(model);
                continue;
            }
            if (collection.findOne({ id: model.id })) {
                continue;
            }
            collection.insert(model);
        }
    };
    LokiDataProvider.prototype.save = function (modelClass, models) {
        return Promise.resolve(this.saveSync(modelClass, models));
    };
    LokiDataProvider.prototype.deleteSync = function (modelClass, models) {
        var collection = this.getCollection(modelClass);
        for (var _i = 0, models_3 = models; _i < models_3.length; _i++) {
            var model = models_3[_i];
            collection.remove(model);
        }
        this.saveDb();
        return true;
    };
    LokiDataProvider.prototype.delete = function (modelClass, models) {
        return Promise.resolve(this.deleteSync(modelClass, models));
    };
    LokiDataProvider.prototype.getBy = function (modelClass, filter) {
        var collection = this.getCollection(modelClass);
        var results = collection.chain();
        results = this.applyFilter(results, filter);
        var rawModels = results.data();
        if (!Array.isArray(rawModels) || !rawModels.length) {
            rawModels = [];
        }
        return rawModels;
    };
    LokiDataProvider.prototype.findBy = function (modelClass, filter) {
        return Promise.resolve(this.getBy(modelClass, filter));
    };
    LokiDataProvider.prototype.registerFindByMethod = function (modelClass, method, fn) {
        var modelClassName = this.getModelClassName(modelClass);
        this.findByMethodsMap[modelClassName + '.' + method] = fn;
    };
    LokiDataProvider.prototype.registerSaveByMethod = function (modelClass, method, fn) {
        var modelClassName = this.getModelClassName(modelClass);
        this.saveByMethodsMap[modelClassName + '.' + method] = fn;
    };
    LokiDataProvider.prototype.saveByMethod = function (modelClass, models, method, params) {
        var _this = this;
        if (params === void 0) { params = {}; }
        var modelClassName = this.getModelClassName(modelClass);
        return new Promise(function (resolve, reject) {
            var fn = _this.saveByMethodsMap[modelClassName + '.' + method];
            if (!fn) {
                reject('saveByMethod "' + method + '" not registered');
                return;
            }
            var fnResult = fn(params, models, function (modifiedModels) {
                if (modifiedModels && modifiedModels.length) {
                    _this.save(modelClass, modifiedModels);
                }
            });
            if (fnResult && fnResult.then) {
                fnResult.then(function (data) {
                    resolve(data);
                }, reject);
            }
            else {
                resolve(fnResult);
            }
        });
    };
    LokiDataProvider.prototype.findByMethod = function (modelClass, method, params) {
        var _this = this;
        var modelClassName = this.getModelClassName(modelClass);
        return new Promise(function (resolve, reject) {
            var fn = _this.findByMethodsMap[modelClassName + '.' + method];
            if (!fn) {
                reject('findByMethod "' + method + '" not registered');
                return;
            }
            var collection = _this.getCollection(modelClass);
            var results = collection.chain();
            try {
                var fnResult = fn(params, results, function (results, filter) {
                    return _this.applyFilter(results, filter);
                });
                if (fnResult && fnResult instanceof Promise) {
                    fnResult.then(resolve, reject);
                }
                else {
                    resolve(fnResult);
                }
            }
            catch (e) {
                reject(e);
            }
        });
    };
    LokiDataProvider.setFixtures = function (fixtures) {
        LokiDataProvider._fixtures = fixtures;
    };
    LokiDataProvider.getFixtures = function () {
        return LokiDataProvider._fixtures;
    };
    LokiDataProvider.prototype.loadDb = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.db = new loki('first_db', _this.options);
            _this.db.loadDatabase({}, function (err, data) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data);
            });
        });
    };
    LokiDataProvider.prototype.initialize = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.loadDb().then(function () {
                var options = _this.db.getCollection('_app_options');
                if (!options) {
                    options = _this.db.addCollection('_app_options');
                }
                // this.db.loadCollection(options);
                var initialDataFed = options.findOne({ key: 'initialDataFed' });
                if (!initialDataFed) {
                    var initialData = LokiDataProvider.getFixtures();
                    if (initialData instanceof Function) {
                        initialData = initialData();
                    }
                    console.log('going to feed initial data', initialData);
                    for (var key in initialData) {
                        var collection = _this.db.addCollection(key);
                        for (var _i = 0, _a = initialData[key]; _i < _a.length; _i++) {
                            var model = _a[_i];
                            var rawModel = model instanceof Model_1.Model ? model.toRaw(false) : model;
                            collection.insert(rawModel);
                        }
                    }
                    options.insert({ 'initialDataFed': true });
                    _this.saveDb().then(resolve, reject);
                }
            });
        });
    };
    LokiDataProvider._fixtures = {};
    return LokiDataProvider;
}());
exports.LokiDataProvider = LokiDataProvider;
//# sourceMappingURL=LokiDataProvider.js.map