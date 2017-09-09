export interface IDataProvider {
    save: (modelClass: Function, models: any[]) => Promise<any>;
    delete: (modelClass: Function, models: any[]) => Promise<any>;
    findBy: (modelClass: Function, filter: any) => Promise<any>;
    findByMethod: (modelClass: Function, method: any, params: any) => Promise<any>;
    saveByMethod: (modelClass: Function, models: any[], method: any, params: any) => Promise<any>;
    initialize: () => Promise<any>;
}
export interface ISyncDataProvider {
    saveSync: (modelClass: Function, models: any[]) => any;
    deleteSync: (modelClass: Function, models: any[]) => any;
    getBy: (modelClass: Function, filter: any) => any;
    cacheSync: (modelClass: Function, models: any[]) => any;
    initialize: () => Promise<any>;
}
export declare class DataHandler {
    static _dataProvider: IDataProvider;
    static _syncDataProvider: ISyncDataProvider;
    static setDataProvider(dataProvider: IDataProvider): void;
    static getDataProvider(): IDataProvider;
    static setSyncDataProvider(syncDataProvider: ISyncDataProvider): void;
    static getSyncDataProvider(): ISyncDataProvider;
    static initialize(): Promise<any[]>;
    static save(modelClass: any, models: any[]): Promise<any>;
    static delete(modelClass: any, models: any[]): Promise<any>;
    static findBy(modelClass: any, filter: any): Promise<{}>;
    static getBy(modelClass: any, filter: any): any;
    static findByMethod(modelClass: any, method: any, params?: any): Promise<{}>;
    static saveByMethod(modelClass: any, models: any[], method: any, params?: any): Promise<any>;
}
