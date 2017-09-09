import {LocalDataProvider} from './LocalDataProvider';

interface IDataProvider {
	saveData: (modelClass: Function, models: any[])=> Promise<any>;
	deleteData: (modelClass: Function, models: any[])=> Promise<any>;
	findData: (modelClass: Function, filter: any, options: any)=> Promise<any>;
	findByMethod: (modelClass: Function, method: any, params: any)=> Promise<any>;
	saveByMethod: (modelClass: Function, models: any[], method: any, params: any)=> Promise<any>;
	initialize: () => Promise<any>;
}

export class DataHandler {

	static _dataProvider: IDataProvider = new LocalDataProvider();

	static setDataProvider(dataProvider: IDataProvider){
		DataHandler._dataProvider = dataProvider;
	}

	static getDataProvider(): IDataProvider{
		return DataHandler._dataProvider;
	}

	static initialize(){
		return DataHandler._dataProvider.initialize();
	}

	static saveData(modelClass: any, models: any[]){
		return DataHandler._dataProvider.saveData(modelClass, models);
	}

	static deleteData(modelClass: any, models: any[]){
		return DataHandler._dataProvider.deleteData(modelClass, models);
	}

	static findData(modelClass: any, filter: any, options: any){
		return DataHandler._dataProvider.findData(modelClass, filter, options);
	}

	static findByMethod(modelClass: any, method: any, params: any = {}){
		return DataHandler._dataProvider.findByMethod(modelClass, method, params);
	}

	static saveByMethod(modelClass: any, models: any[], method: any, params: any = {}){
		return DataHandler._dataProvider.saveByMethod(modelClass, models, method, params);
	}

}