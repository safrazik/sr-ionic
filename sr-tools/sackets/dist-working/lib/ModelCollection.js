"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var DataHandler_1 = require('./DataHandler');
var _dataHandler = DataHandler_1.DataHandler;
var ModelCollection = (function (_super) {
    __extends(ModelCollection, _super);
    function ModelCollection() {
        _super.apply(this, arguments);
        this.__meta = {};
        this.__removed = [];
    }
    ModelCollection.prototype.getMeta = function (key) {
        return this.__meta[key];
    };
    ModelCollection.prototype.setMeta = function (key, value) {
        this.__meta[key] = value;
    };
    ModelCollection.prototype.toRaw = function (includeRelations) {
        if (includeRelations === void 0) { includeRelations = false; }
        var raw = [];
        for (var _i = 0, _a = this; _i < _a.length; _i++) {
            var model = _a[_i];
            raw.push(model.toRaw(includeRelations));
        }
        return raw;
    };
    ModelCollection.prototype.toJson = function (includeRelations) {
        if (includeRelations === void 0) { includeRelations = false; }
        var raw = this.toRaw(includeRelations);
        var json = JSON.stringify(raw);
        return json;
    };
    ModelCollection.prototype.toArray = function () {
        return this.concat([]);
    };
    ModelCollection.getModelClassName = function (modelClass) {
        var ret = modelClass.toString();
        ret = ret.substr('function '.length);
        ret = ret.substr(0, ret.indexOf('('));
        return ret;
    };
    ModelCollection.prototype.getModelClassName = function (modelClass) {
        if (modelClass === void 0) { modelClass = null; }
        if (!modelClass) {
            modelClass = this.getModelClass();
        }
        return ModelCollection.getModelClassName(modelClass);
    };
    ModelCollection.prototype.save = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var modelClass = this.getModelClass();
        var withRelations = options.with || {};
        var savePromise = _dataHandler.save(modelClass, this.toRaw(withRelations)).then(function (newData) {
            newData = Array.isArray(newData) ? newData : [newData];
            for (var i = 0; i < _this.length; i++) {
                if (newData[i]) {
                    _this[i].fill(newData[i]);
                }
            }
        });
        var removedCollection = modelClass.collection();
        for (var _i = 0, _a = this.__removed; _i < _a.length; _i++) {
            var model = _a[_i];
            if (model.id) {
                removedCollection.push(model);
            }
        }
        if (!removedCollection.length) {
            return savePromise;
        }
        return new Promise(function (resolve, reject) {
            Promise.all([savePromise, removedCollection.delete()]).then(function () {
                resolve();
            }, reject);
        });
    };
    ModelCollection.prototype.saveWith = function (withRelations) {
        return this.save({ with: withRelations });
    };
    ModelCollection.prototype.delete = function () {
        return _dataHandler.delete(this.getModelClass(), this.toRaw());
    };
    ModelCollection.getModelById = function (modelClass, id, createOnDemand) {
        if (createOnDemand === void 0) { createOnDemand = true; }
        var modelClassName = typeof modelClass == 'string' ? modelClass : ModelCollection.getModelClassName(modelClass);
        var modelsCached = ModelCollection.__modelsCached;
        if (!modelsCached[modelClassName]) {
            modelsCached[modelClassName] = {};
        }
        var model = modelsCached[modelClassName][id];
        if (!createOnDemand) {
            return model || null;
        }
        if (!model) {
            model = modelClass.model();
            model.fill({ id: id });
            model.setMeta('partial', true);
        }
        modelsCached[modelClassName][id] = model;
        ModelCollection.__modelsCached[modelClassName][id] = model;
        return model;
    };
    ModelCollection.prototype.hydrateRaw = function (rawModels, modelClass) {
        if (modelClass === void 0) { modelClass = null; }
        if (!modelClass) {
            modelClass = this.getModelClass();
        }
        return ModelCollection.hydrateRaw(rawModels, modelClass);
    };
    ModelCollection.hydrateRaw = function (rawModels, modelClass) {
        var models = modelClass.collection();
        for (var _i = 0, rawModels_1 = rawModels; _i < rawModels_1.length; _i++) {
            var rawModel = rawModels_1[_i];
            var id = parseInt(rawModel.id);
            var model = ModelCollection.getModelById(modelClass, id);
            model.fill(rawModel);
            model.setMeta('partial', false);
            var relatedDefinitions = modelClass.getRelated();
            for (var relatedName in []) {
                var related = relatedDefinitions[relatedName];
                var relatedModelClassName = ModelCollection.getModelClassName(related.type);
                if (!related.many) {
                    var relatedId = model.getValue(related.key);
                    var relatedModel = ModelCollection.getModelById(related.type, relatedId);
                    if (rawModel[relatedName]) {
                        relatedModel.fill(rawModel[relatedName]);
                        relatedModel.setMeta('partial', false);
                    }
                    model[relatedName] = relatedModel;
                }
                else {
                    var relatedCollection = model.getRelation(relatedName, false);
                    if (!relatedCollection) {
                        relatedCollection = related.type.collection();
                        relatedCollection.setMeta('partial', true);
                    }
                    if (rawModel[relatedName] && rawModel[relatedName].length) {
                        var relModels = [];
                        for (var _a = 0, _b = rawModel[relatedName]; _a < _b.length; _a++) {
                            var rel = _b[_a];
                            var relModel = ModelCollection.getModelById(related.type, rel.id);
                            relModel.fill(rel);
                            relModel.setMeta('partial', false);
                            relModels.push(relModel);
                        }
                        relatedCollection.push.apply(relatedCollection, relModels); // set all at once
                        relatedCollection.setMeta('partial', false);
                        relatedCollection.setMeta('eager', true);
                    }
                    model[relatedName] = relatedCollection;
                }
            }
            models.push(model);
        }
        return models;
    };
    ModelCollection.prototype.findByMethod = function (method, params) {
        var _this = this;
        if (params === void 0) { params = {}; }
        var modelCass = this.getModelClass();
        return new Promise(function (resolve, reject) {
            _dataHandler.findByMethod(modelCass, method, params).then(function (rawModels) {
                _this.clear();
                var models = _this.hydrateRaw(rawModels);
                _this.push.apply(_this, models);
                resolve();
            }, reject);
        });
    };
    ModelCollection.prototype.saveByMethod = function (method, params) {
        var _this = this;
        if (params === void 0) { params = {}; }
        return new Promise(function (resolve, reject) {
            _dataHandler.saveByMethod(_this.getModelClass(), _this.toRaw(), method, params).then(function (newData) {
                newData = Array.isArray(newData) ? newData : [newData];
                for (var i = 0; i < _this.length; i++) {
                    if (newData[i]) {
                        _this[i].fill(newData[i]);
                    }
                }
                resolve();
            }, reject);
        });
    };
    ModelCollection.prototype.findBy = function (filter) {
        var _this = this;
        if (filter === void 0) { filter = {}; }
        this.getBy(filter);
        var modelCass = this.getModelClass();
        return new Promise(function (resolve, reject) {
            _dataHandler.findBy(modelCass, filter).then(function (rawModels) {
                _this.clear();
                var models = _this.hydrateRaw(rawModels);
                _this.push.apply(_this, models);
                resolve();
            }, reject);
        });
    };
    ModelCollection.prototype.getBy = function (filter) {
        if (filter === void 0) { filter = {}; }
        var modelClass = this.getModelClass();
        var rawModels = [];
        this.clear();
        //*
        rawModels = _dataHandler.getBy(modelClass, filter);
        if (rawModels.length) {
            var models = this.hydrateRaw(rawModels);
            this.push.apply(this, models);
        }
        return;
        //*/
        /*

        let modelClassName = ModelCollection.getModelClassName(modelClass);
        let modelsCached = ModelCollection.__modelsCached;
        if(modelsCached[modelClassName]){
            for(let id in modelsCached[modelClassName]){
                let model = modelsCached[modelClassName][id];
                rawModels.push(model.toRaw());
            }
        }
        if(rawModels.length){
            rawModels = Filter.filterResults(rawModels, filter);
            let models = this.hydrateRaw(rawModels);
            this.push(...models);
        }
        return this;
        //*/
    };
    ModelCollection.prototype.clear = function () {
        this.splice(0, this.length);
    };
    ModelCollection.prototype.add = function (model, index) {
        if (index === void 0) { index = null; }
        if (index === null) {
            this.push(model);
            index = this.length;
        }
        else {
            this.splice(index, 0, model);
        }
        return index;
    };
    ModelCollection.prototype.removeByIndex = function (index) {
        var removed = this.splice(index, 1);
        this.__removed.push(removed[0]);
        return removed[0];
    };
    ModelCollection.prototype.removeByModel = function (model) {
        var index = this.indexOf(model);
        this.splice(index, 1);
        this.__removed.push(model);
        return index;
    };
    ModelCollection.prototype.remove = function (modelOrIndex) {
        if (typeof modelOrIndex === "number") {
            return this.removeByIndex(modelOrIndex);
        }
        else {
            return this.removeByModel(modelOrIndex);
        }
    };
    ModelCollection.__modelsCached = {};
    ModelCollection.__modelsRemoved = {};
    return ModelCollection;
}(Array));
exports.ModelCollection = ModelCollection;
//# sourceMappingURL=ModelCollection.js.map