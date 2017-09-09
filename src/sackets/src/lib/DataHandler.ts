// import {KeyValueDataProvider} from './KeyValueDataProvider';
import {LokiDataProvider} from './LokiDataProvider';
// import {InMemoryDataProvider} from './InMemoryDataProvider';
import {Filter} from './Filter';
import {InMemoryStorage} from './Storage';
import {ModelCollection} from './ModelCollection';

export interface IDataProvider {
	save: (modelClass: Function, models: any[])=> Promise<any>;
	delete: (modelClass: Function, models: any[])=> Promise<any>;
	findBy: (modelClass: Function, filter: any)=> Promise<any>;
	findByMethod: (modelClass: Function, method: any, params: any)=> Promise<any>;
	saveByMethod: (modelClass: Function, models: any[], method: any, params: any)=> Promise<any>;
	initialize: () => Promise<any>;
}

export interface ISyncDataProvider {
	saveSync: (modelClass: Function, models: any[])=> any;
	deleteSync: (modelClass: Function, models: any[])=> any;
	getBy: (modelClass: Function, filter: any)=> any;
	cacheSync: (modelClass: Function, models: any[])=> any;
	// findByMethodSync: (modelClass: Function, method: any, params: any)=> any;
	// saveByMethod: (modelClass: Function, models: any[], method: any, params: any)=> any;
	initialize: () => Promise<any>;
}

export class DataHandler {

	static _syncDataProvider: ISyncDataProvider = new LokiDataProvider();
	static _dataProvider: IDataProvider = <LokiDataProvider>DataHandler._syncDataProvider;

	static setDataProvider(dataProvider: IDataProvider){
		DataHandler._dataProvider = dataProvider;
	}

	static getDataProvider(): IDataProvider{
		return DataHandler._dataProvider;
	}

	static setSyncDataProvider(syncDataProvider: ISyncDataProvider){
		DataHandler._syncDataProvider = syncDataProvider;
	}

	static getSyncDataProvider(): ISyncDataProvider {
		return DataHandler._syncDataProvider;
	}

	static initialize(){
		if(<any>DataHandler._syncDataProvider === <any>DataHandler._dataProvider){
			return DataHandler._dataProvider.initialize();
		}
		return Promise.all([
			DataHandler._syncDataProvider.initialize(),
			DataHandler._dataProvider.initialize()
		]);
	}

	static save(modelClass: any, models: any[]){
		DataHandler._syncDataProvider.saveSync(modelClass, models);
		return DataHandler._dataProvider.save(modelClass, models);
	}

	static delete(modelClass: any, models: any[]){
		DataHandler._syncDataProvider.deleteSync(modelClass, models);
		return DataHandler._dataProvider.delete(modelClass, models);
	}

	static findBy(modelClass: any, filter: any){
		return new Promise((resolve, reject)=> {
			DataHandler._dataProvider.findBy(modelClass, filter).then((rawModels)=> {
				if(rawModels && rawModels.length){
					DataHandler._syncDataProvider.cacheSync(modelClass, rawModels);
					// let modelClassName = ModelCollection.getModelClassName(modelClass);
					// InMemoryStorage.setItemSync('models.' + modelClassName, rawModels);
				}
				resolve(rawModels);
			}, reject);
		});
	}

	static getBy(modelClass: any, filter: any){
		return DataHandler._syncDataProvider.getBy(modelClass, filter);
		// @TODO improve
        // let modelClassName = ModelCollection.getModelClassName(modelClass);
        // let rawModels = InMemoryStorage.getItemSync('models.' + modelClassName);
        // if(rawModels && rawModels.length){
        //     rawModels = Filter.filterResults(rawModels, filter);
        // }
        // return rawModels || [];
	}

	static findByMethod(modelClass: any, method: any, params: any = {}){
		return new Promise((resolve, reject)=> {
			DataHandler._dataProvider.findByMethod(modelClass, method, params).then((rawModels)=> {
				if(rawModels && rawModels.length){
					DataHandler._syncDataProvider.cacheSync(modelClass, rawModels);
				}
				resolve(rawModels);
			}, reject);
		});
	}

	static saveByMethod(modelClass: any, models: any[], method: any, params: any = {}){
		return DataHandler._dataProvider.saveByMethod(modelClass, models, method, params);
	}

}