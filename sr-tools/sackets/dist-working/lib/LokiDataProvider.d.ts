/// <reference types="lokijs" />
import { Model } from './Model';
import { IDataProvider, ISyncDataProvider } from './DataHandler';
export declare type FindByMethod = (params: any, results: LokiResultset<any>, filterFn: (results: LokiResultset<any>, filter: any) => LokiResultset<any>) => any[] | Promise<any[]>;
export declare type SaveByMethod = (params: any, models: any[], saveFn: (modifiedModels: any[]) => any) => any | Promise<any>;
export declare class LokiDataProvider implements IDataProvider, ISyncDataProvider {
    private options;
    db: Loki;
    private findByMethodsMap;
    private saveByMethodsMap;
    private storage;
    constructor(options?: LokiConfigureOptions);
    saveDb(): Promise<{}>;
    getCollection(modelClass: any): LokiCollection<{}>;
    static applyFilter(results: LokiResultset<any>, filter?: any): LokiResultset<any>;
    applyFilter(results: LokiResultset<any>, filter?: any): LokiResultset<any>;
    private getModelClassName(modelClass);
    saveSync(modelClass: any, models: any[]): boolean;
    cacheSync(modelClass: any, models: any[]): void;
    save(modelClass: any, models: any[]): Promise<boolean>;
    deleteSync(modelClass: any, models: any[]): boolean;
    delete(modelClass: any, models: any[]): Promise<boolean>;
    getBy(modelClass: any, filter: any): {}[];
    findBy(modelClass: any, filter: any): Promise<{}[]>;
    registerFindByMethod(modelClass: typeof Model, method: string, fn: FindByMethod): void;
    registerSaveByMethod(modelClass: typeof Model, method: string, fn: SaveByMethod): void;
    saveByMethod(modelClass: any, models: any[], method: any, params?: any): Promise<{}>;
    findByMethod(modelClass: any, method: any, params: any): Promise<{}>;
    static _fixtures: any;
    static setFixtures(fixtures: any): void;
    static getFixtures(): any;
    loadDb(): Promise<{}>;
    initialize(): Promise<{}>;
}
