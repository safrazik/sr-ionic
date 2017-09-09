import { Model } from './Model';
import { ModelFilter } from './Filter';
export declare abstract class ModelCollection<T extends Model<T>> extends Array<T> {
    private __meta;
    private __removed;
    private static __modelsCached;
    private static __modelsRemoved;
    getMeta(key: string): any;
    setMeta(key: string, value: any): void;
    toRaw(includeRelations?: boolean): any[];
    toJson(includeRelations?: boolean): string;
    toArray(): T[];
    static getModelClassName(modelClass: any): any;
    getModelClassName(modelClass?: any): any;
    abstract getModelClass(): {
        new (): T;
    };
    save(options?: any): Promise<void>;
    saveWith(withRelations: any): Promise<void>;
    delete(): Promise<void>;
    static getModelById(modelClass: Function, id: any, createOnDemand?: boolean): any;
    private hydrateRaw(rawModels, modelClass?);
    static hydrateRaw(rawModels: any[], modelClass: any): any;
    findByMethod(method: string, params?: any): Promise<void>;
    saveByMethod(method: string, params?: any): Promise<void>;
    findBy(filter?: ModelFilter): Promise<void>;
    getBy(filter?: ModelFilter): void;
    clear(): void;
    add(model: T, index?: number): number;
    private removeByIndex(index);
    private removeByModel(model);
    remove(model: T): number;
    remove(index: number): T;
}
