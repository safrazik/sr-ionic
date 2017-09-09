import {Storage} from './Storage';
import sift from 'sift';
import {Model} from './Model';
import {ModelCollection} from './ModelCollection';

import {fixtures} from '../fixtures';

sift.use({
    $contains: function(a: string, b: string){
        // console.log(a, b);
        return typeof b === 'string' && b.toLowerCase().indexOf(a.toLowerCase()) !== -1;
    },
    $startswith: function(a: string, b: string){
        return typeof b === 'string' && b.toLowerCase().indexOf(a.toLowerCase()) === 0;
    },
    $endswith: function(a: string, b: string){
        return typeof b === 'string' && b.toLowerCase().indexOf(a.toLowerCase()) === b.length - 1;
    }
});

function sortFn(res: any[], property: any, desc = false){
    var results = res.slice(0);
    results.sort(function(a,b) {
        var x = a[property];
        var y = b[property];
        if(typeof x == 'string' && typeof y == 'string'){
            x = x.toLowerCase();
            y = y.toLowerCase();
        }
        return x < y ? -1 : x > y ? 1 : 0;
        // return a.born - b.born;
    });
    return results;
}
// function skipFn(results: any, skip: number){
//     return results;
// }
// function limitFn(results: any, skip: number){
//     return results;
// }
function filterFn(results: any[], filter: any = {}, options: any = {}){
    results = sift(filter, results);
    if(options.sort){
        for(var prop in options.sort){
            var sortModifier = options.sort[prop];
            if(sortModifier !== 1 && sortModifier !== -1){
                continue;
            }
            results = sortFn(results, prop, sortModifier === -1);
        }
    }
    if(options.limit || options.skip){
        var skipIndex = options.skip || 0;
        var limitIndex = skipIndex + options.limit || results.length;
        results = results.slice(skipIndex, limitIndex);
    }
    return results;
}

function saveFn(models: any[]) {
}

export class LocalDataProvider {

    private storage: Storage;
    private findByMethodsMap: any = {};
    private saveByMethodsMap: any = {};

    constructor(options: {latency?: number} = {latency: 0}){
        this.storage = new Storage({latency: options.latency});
    }

	private getModelClassName(modelClass: Function){
		var ret = modelClass.toString();
		ret = ret.substr('function '.length);
		ret = ret.substr(0, ret.indexOf('('));
		return ret;
	}

	saveData(modelClass: any, models: any[]){
        return new Promise((resolve, reject)=> {
            this.storage.getItem('entities.' + this.getModelClassName(modelClass)).then((rawModels: Array<any>)=> {
                var maxId = 0;
                let modelsMap = {};
                let rawModelsMap = {};
                for(var model of models){
                    if(model.id){
                        modelsMap[model.id] = model;
                    }
                }
                for(var i in rawModels){
                    let rawModel = rawModels[i];
                    var id = parseInt(rawModel.id);
                    maxId = id > maxId ? id : maxId;
                    let mod = modelsMap[id];
                    if(mod){
                        rawModels[i] = mod;
                    }
                    rawModelsMap[id] = rawModel;
                }
                for(var model of models){
                    if(!rawModelsMap[model.id]){
                        model.setValue('id', ++maxId); // id is not writable
                        rawModels.push(model);
                    }
                }
                this.storage.setItem('entities.' + this.getModelClassName(modelClass), rawModels).then(resolve, reject);
            }, reject);
        });
	}

	deleteData(modelClass: any, models: any[]){
        return new Promise((resolve, reject)=> {
            this.storage.getItem('entities.' + this.getModelClassName(modelClass)).then((rawModels: Array<any>)=> {
                let deletedIds = models.map(model => model.id);
                for(var i in rawModels){
                    if(deletedIds.indexOf(parseInt(rawModels[i].id)) !== -1){
                        rawModels.splice(<any>i, 1);
                    }
                }
                this.storage.setItem('entities.' + this.getModelClassName(modelClass), rawModels);
                resolve();
            });
        });
	}

	findData(modelClass: any, filter: any, options: any){
		return new Promise((resolve, reject)=> {
            this.storage.getItem('entities.' + this.getModelClassName(modelClass)).then((rawModels: any)=> {
				rawModels = filterFn(rawModels, filter, options);
                if(!rawModels.length || !Array.isArray(rawModels)){
                    rawModels = [];
                }
				resolve(rawModels);
            });
		});
    }

    registerFindByMethod(modelClass: typeof Model, method: string, fn: (params: any, rawModels: any[], applyFilter: typeof filterFn)=> any[] | Promise<any[]>){
        var modelClassName = this.getModelClassName(modelClass);
        this.findByMethodsMap[modelClassName + '.' + method] = fn;
    }

    registerSaveByMethod(modelClass: typeof Model, method: string, fn: (params: any, models: any[], save: typeof saveFn) => any | Promise<any>){
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
            let fnResult = fn(params, models, saveFn);
            if(fnResult && fnResult.then){
                fnResult.then((data)=> {
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
            this.storage.getItem('entities.' + this.getModelClassName(modelClass)).then((rawModels: any)=> {
                if(!rawModels.length || !Array.isArray(rawModels)){
                    rawModels = [];
                }
                try {
                    var models = ModelCollection.hydrateRaw(rawModels, modelClass);
                    let fnResult = fn(params, models, filterFn);
                    if(fnResult && fnResult.then){
                        fnResult.then(resolve, reject);
                    }
                    else {
                        resolve(fnResult);
                    }
                }
                catch(e){
                    reject(e);
                }
            }, reject);
        });
    }

	initialize(){
        var initialData = fixtures();
		console.log(initialData);
		return new Promise((resolve, reject)=> {
			if(1 < 100){
				// return resolve();
			}
			this.storage.getItem('initialDataFed').then((initialDataFed) => {
				if(initialDataFed){
                    resolve();
					return;
				}
				setInitialData();
			}, reject);

			let setInitialData = ()=> {
                console.log('init daa', initialData);
                var promises = [];
				for(var key in initialData){
                    var initialDataArr = [];
                    for(var d of initialData[key]){
                        initialDataArr.push(d instanceof Model ? d.toRaw(false) : d);
                    }
				    promises.push(this.storage.setItem('entities.' + key, initialDataArr));
                }
                promises.push(this.storage.setItem('initialDataFed', '1'));
                Promise.all(promises).then(resolve, reject);
			}
		});
	}

}