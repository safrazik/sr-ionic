import {LocalStorage, InMemoryStorage, IStorage} from './Storage';
import {Model} from './Model';
import {ModelCollection} from './ModelCollection';
import {IDataProvider, ISyncDataProvider} from './DataHandler';
import {Filter} from './Filter';

import * as loki from 'lokijs';
// import * as LokiIndexedAdapter from 'lokijs/src/loki-indexed-adapter';
import * as LokiIndexedAdapter from 'lokijs/src/loki-indexed-adapter';


// l = loki.getIndexedAdapter();
// l = new loki.Loki

export type FindByMethod = (params: any, results: LokiResultset<any>, filterFn: (results: LokiResultset<any>, filter: any) => LokiResultset<any> )=> any[] | Promise<any[]>;
export type SaveByMethod = (params: any, models: any[], saveFn: (modifiedModels: any[]) => any) => any | Promise<any>;

export class LokiDataProvider implements IDataProvider, ISyncDataProvider {

    db: Loki;

    private findByMethodsMap: {[functionName: string]: FindByMethod} = {};
    private saveByMethodsMap: {[functionName: string]: SaveByMethod} = {};
    private storage: IStorage = null;

    constructor(private options: LokiConfigureOptions = {}){
        if(!this.options.adapter && this.options.adapter !== null){
            this.options.adapter = new LokiIndexedAdapter('the_app_idb');
        }
        // if(!this.storage){
        //     this.storage = new InMemoryStorage();
        // }
    }

    saveDb(){
        return new Promise((resolve, reject)=> {
            this.db.save((err)=> {
                if(err){
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    getCollection(modelClass: any){
        let modelClassName = this.getModelClassName(modelClass);
        let collection = this.db.getCollection(modelClassName);
        if(!collection){
            collection = this.db.addCollection(modelClassName);
        }
        return collection;
    }

    static applyFilter(results: LokiResultset<any>, filter: any = {}): LokiResultset<any> {
        let $sort = filter.$sort;
        let $limit = filter.$limit;
        let $skip = filter.$skip;
        let $with = filter.$with;

        delete filter.$sort;
        delete filter.$limit;
        delete filter.$skip;
        delete filter.$with;

        results = results.find(filter);
        if($sort){
            let sortDefs: [string, boolean][] = [];
            for(let prop in $sort){
                sortDefs.push([prop, $sort[prop] == -1]);
            }
            results = results.compoundsort(sortDefs);
        }
        if($limit !== undefined){
            results = results.limit($limit);
        }
        if($skip !== undefined){
            results = results.offset($skip);
        }
        if($with){
            // ignore
        }
        return results;
    }

    applyFilter(results: LokiResultset<any>, filter: any = {}): LokiResultset<any> {
        return LokiDataProvider.applyFilter(results, filter);
    }

	private getModelClassName(modelClass: Function){
		var ret = modelClass.toString();
		ret = ret.substr('function '.length);
		ret = ret.substr(0, ret.indexOf('('));
		return ret;
	}

    saveSync(modelClass: any, models: any[]){
        let collection = this.getCollection(modelClass);
        for(var model of models){
            if(!model.$loki){
                collection.insert(model);
            }
            else {
                collection.update(model);
            }
        }
        this.saveDb();
        return true;
    }

    cacheSync(modelClass: any, models: any[]){
        let collection = this.getCollection(modelClass);
        for(var model of models){
            if(model.$loki){
                collection.update(model);
                continue;
            }
            if(collection.findOne({id: model.id})){
                continue;
            }
            collection.insert(model);
        }
    }

    save(modelClass: any, models: any[]){
        return Promise.resolve(this.saveSync(modelClass, models));
    }

    deleteSync(modelClass: any, models: any[]){
        let collection = this.getCollection(modelClass);
        for(let model of models){
            collection.remove(model);
        }
        this.saveDb();
        return true;
    }

	delete(modelClass: any, models: any[]){
        return Promise.resolve(this.deleteSync(modelClass, models));
	}

    getBy(modelClass: any, filter: any){
        let collection = this.getCollection(modelClass);
        let results = collection.chain();
        results = this.applyFilter(results, filter);
        let rawModels = results.data();
        if(!Array.isArray(rawModels) || !rawModels.length){
            rawModels = [];
        }
        return rawModels;
    }

	findBy(modelClass: any, filter: any){
        return Promise.resolve(this.getBy(modelClass, filter));
    }

    registerFindByMethod(modelClass: typeof Model, method: string, fn: FindByMethod){
        var modelClassName = this.getModelClassName(modelClass);
        this.findByMethodsMap[modelClassName + '.' + method] = fn;
    }

    registerSaveByMethod(modelClass: typeof Model, method: string, fn: SaveByMethod){
        var modelClassName = this.getModelClassName(modelClass);
        this.saveByMethodsMap[modelClassName + '.' + method] = fn;
    }

    saveByMethod(modelClass: any, models: any[], method: any, params: any = {}){
        var modelClassName = this.getModelClassName(modelClass);
        return new Promise((resolve, reject)=> {
            var fn = this.saveByMethodsMap[modelClassName + '.' + method];
            if(!fn){
                reject('saveByMethod "' + method + '" not registered');
                return;
            }
            let fnResult = fn(params, models, (modifiedModels: any[])=> {
                if(modifiedModels && modifiedModels.length){
                    this.save(modelClass, modifiedModels);
                }
            });
            if(fnResult && fnResult.then){
                fnResult.then((data: any)=> {
                    resolve(data);
                }, reject);
            }
            else {
                resolve(fnResult);
            }
        });
    }

    findByMethod(modelClass: any, method: any, params: any){
        var modelClassName = this.getModelClassName(modelClass);
        return new Promise((resolve, reject)=> {
            var fn = this.findByMethodsMap[modelClassName + '.' + method];
            if(!fn){
                reject('findByMethod "' + method + '" not registered');
                return;
            }

            let collection = this.getCollection(modelClass);
            let results = collection.chain();

            try {
                let fnResult = fn(params, results, (results, filter)=> {
                    return this.applyFilter(results, filter);
                });
                if(fnResult && fnResult instanceof Promise){
                    fnResult.then(resolve, reject);
                }
                else {
                    resolve(fnResult);
                }
            }
            catch(e){
                reject(e);
            }
        });
    }

    static _fixtures: any = {};

    static setFixtures(fixtures: any){
        LokiDataProvider._fixtures = fixtures;
    }

    static getFixtures(){
        return LokiDataProvider._fixtures;
    }

    loadDb(){
        return new Promise((resolve, reject)=> {
            if(this.db){
                resolve();
                return;
            }
            this.db = new loki('first_db', this.options);
            this.db.loadDatabase({}, (err, data)=> {
                if(err){
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    initialize(){
        return new Promise((resolve, reject)=> {
            this.loadDb().then(()=> {
                let options = this.db.getCollection('_app_options');
                if(!options){
                    options = this.db.addCollection('_app_options');
                }
                // this.db.loadCollection(options);
                let initialDataFed: any = options.findOne({key: 'initialDataFed'});
                if(!initialDataFed || !initialDataFed.value){
                    var initialData = LokiDataProvider.getFixtures();
                    if(initialData instanceof Function){
                        initialData = initialData();
                    }
                    console.log('going to feed initial data', initialData);
                    for(var key in initialData){
                        let collection = this.db.addCollection(key);
                        for(var model of initialData[key]){
                            let rawModel = model instanceof Model ? model.toRaw(false) : model;
                            collection.insert(rawModel);
                        }
                    }
                    options.insert({key: 'initialDataFed', value: true});
                    this.saveDb().then(resolve, reject);
                }
                else {
                    resolve();
                }
            }, reject);
        });
    }

}