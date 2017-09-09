import {Model} from './Model';
import {Filter, ModelFilter} from './Filter';
import {DataHandler} from './DataHandler';

let _dataHandler = DataHandler;

export abstract class ModelCollection<T extends Model<T>> extends Array<T> {

  init(obj, cls: any = ModelCollection){
    // Set the prototype explicitly.
    Object.setPrototypeOf(obj, cls.prototype);
  }

  constructor(){
    super();
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, ModelCollection.prototype);
    return this;
  }

    private __meta: any = {};

    private __removed: any[] = [];

    private static __modelsCached: any = {};
    private static __modelsRemoved: any = {};

    getMeta(key: string){
        return this.__meta[key];
    }

    setMeta(key: string, value: any){
        this.__meta[key] = value;
    }

    toRaw(includeRelations = false){
        let raw: any[] = [];
        for(var model of this){
            raw.push(model.toRaw(includeRelations));
        }
        return raw;
    }

    toJson(includeRelations = false){
        let raw = this.toRaw(includeRelations);
        let json = JSON.stringify(raw);
        return json;
    }

    toArray(){
        return this.concat([]);
    }

    static getModelClassName(modelClass: any){
        var ret = modelClass.toString();
        ret = ret.substr('function '.length);
        ret = ret.substr(0, ret.indexOf('('));
        return ret;
    }

    getModelClassName(modelClass: any = null){
        if(!modelClass){
            modelClass = this.getModelClass();
        }
        return ModelCollection.getModelClassName(modelClass);
    }

    abstract getModelClass(): { new(): T; };

    save(options: any = {}): Promise<void> {
        let modelClass: any = this.getModelClass();
        let withRelations = options.with || {};
        let savePromise = _dataHandler.save(modelClass, this.toRaw(withRelations)).then(newData => {
            newData = Array.isArray(newData) ? newData : [newData];
            for(let i = 0; i < this.length; i++){
                if(newData[i]){
                    this[i].fill(newData[i]);
                }
            }
        });
        let removedCollection = modelClass.collection();
        for(let model of this.__removed){
            if(model.id){
                removedCollection.push(model);
            }
        }
        if(!removedCollection.length){
            return savePromise;
        }
        return new Promise<void>((resolve, reject)=> {
            Promise.all([savePromise, removedCollection.delete()]).then(()=> {
                resolve();
            }, reject);
        });
    }

    saveWith(withRelations: any) {
        return this.save({with: withRelations});
    }

    delete(): Promise<void> {
        return _dataHandler.delete(this.getModelClass(), this.toRaw());
    }

    static getModelById(modelClass: Function, id: any, createOnDemand = true){
        var modelClassName = typeof modelClass == 'string' ? modelClass : ModelCollection.getModelClassName(modelClass);
        let modelsCached = ModelCollection.__modelsCached;
        if(!modelsCached[modelClassName]){
            modelsCached[modelClassName] = {};
        }
        var model = modelsCached[modelClassName][id];
        if(!createOnDemand){
            return model || null;
        }
        if(!model){
            model = (<any>modelClass).model();
            model.fill({id: id});
            model.setMeta('partial', true);
        }
        modelsCached[modelClassName][id] = model;
        ModelCollection.__modelsCached[modelClassName][id] = model;
        return model;
    }

    private hydrateRaw(rawModels: any[], modelClass: any = null){
        if(!modelClass){
            modelClass = this.getModelClass();
        }
        return ModelCollection.hydrateRaw(rawModels, modelClass);
    }

    static hydrateRaw(rawModels: any[], modelClass: any){
        var models = modelClass.collection();
        for(var rawModel of rawModels){
            let id = parseInt(rawModel.id);
            var model = ModelCollection.getModelById(modelClass, id);
            model.fill(rawModel);
            model.setMeta('partial', false);
            let relatedDefinitions = (<any>modelClass).getRelated();
            for(let relatedName in []){
                let related = relatedDefinitions[relatedName];
                let relatedModelClassName = ModelCollection.getModelClassName(related.type);
                if(!related.many){
                    var relatedId = model.getValue(related.key);
                    let relatedModel = ModelCollection.getModelById(related.type, relatedId);
                    if(rawModel[relatedName]){
                        relatedModel.fill(rawModel[relatedName]);
                        relatedModel.setMeta('partial', false);
                    }
                    model[relatedName] = relatedModel;
                }
                else {
                    let relatedCollection = model.getRelation(relatedName, false);
                    if(!relatedCollection){
                        relatedCollection = related.type.collection();
                        relatedCollection.setMeta('partial', true);
                    }
                    if(rawModel[relatedName] && rawModel[relatedName].length){
                        var relModels: any[] = [];
                        for(var rel of rawModel[relatedName]){
                            let relModel = ModelCollection.getModelById(related.type, rel.id);
                            relModel.fill(rel);
                            relModel.setMeta('partial', false);
                            relModels.push(relModel);
                        }
                        relatedCollection.push(...relModels); // set all at once
                        relatedCollection.setMeta('partial', false);
                        relatedCollection.setMeta('eager', true);
                    }
                    model[relatedName] = relatedCollection;
                }
            }
            models.push(model);
        }
        return models;
    }

    findByMethod(method: string, params: any = {}): Promise<void> {
        var modelCass = this.getModelClass();
        return new Promise<void>((resolve, reject)=> {
            _dataHandler.findByMethod(modelCass, method, params).then((rawModels: any[])=> {
                this.clear();
                var models = this.hydrateRaw(rawModels);
                this.push(...models);
                resolve();
            }, reject);
        });
    }

    saveByMethod(method: string, params: any = {}): Promise<void> {
        return new Promise<void>((resolve, reject)=> {
            _dataHandler.saveByMethod(this.getModelClass(), this.toRaw(), method, params).then(newData => {
                newData = Array.isArray(newData) ? newData : [newData];
                for(let i = 0; i < this.length; i++){
                    if(newData[i]){
                        this[i].fill(newData[i]);
                    }
                }
                resolve()
            }, reject);
        });
    }

    findBy(filter: ModelFilter = {}): Promise<void> {
        this.getBy(filter);
        var modelCass = this.getModelClass();
        return new Promise<void>((resolve, reject)=> {
            _dataHandler.findBy(modelCass, filter).then((rawModels: any[])=> {
                this.clear();
                var models = this.hydrateRaw(rawModels);
                this.push(...models);
                resolve();
            }, reject);
        });
    }

    getBy(filter: ModelFilter = {}): void {
        let modelClass: any = this.getModelClass();
        let rawModels: any = [];
        this.clear();

        //*
        rawModels = _dataHandler.getBy(modelClass, filter);
        if(rawModels.length){
	        let models = this.hydrateRaw(rawModels);
	        this.push(...models);
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
    }

    at(index: number){
        return this[index];
    }

    clear(){
        this.splice(0, this.length);
    }

    add(model: T, index: number = null): number {
        if(index === null){
            this.push(model);
            index = this.length;
        }
        else {
            this.splice(index, 0, model);
        }
        return index;
    }

    private removeByIndex(index: number): T {
        let removed = this.splice(index, 1);
        this.__removed.push(removed[0]);
        return removed[0];
    }

    private removeByModel(model: T): number {
        let index = this.indexOf(model);
        this.splice(index, 1);
        this.__removed.push(model);
        return index;
    }

    remove(model: T): number;
    remove(index: number): T;
    remove(modelOrIndex: T | number): number | T {
        if(typeof modelOrIndex === "number"){
            return this.removeByIndex(modelOrIndex);
        }
        else {
            return this.removeByModel(modelOrIndex);
        }
    }

}