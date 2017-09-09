import {Predicate, ModelFilter, ModelFilterBase, ModelSort, ModelWith, ModelValues, ModelProperty, SortModifier, Model, ModelCollection} from 'sackets';
import {Category as CategorySub} from '../index';
import {CategoryCollection as CategoryCollectionSub} from '../index';
import {Item} from '../index';
import {ItemCollection} from '../index';


export interface CategoryFilterBase extends ModelFilterBase<CategoryFilterBase> {
  id?: Predicate.Number;
  name?: Predicate.String;

}

export interface CategoryFilter extends CategoryFilterBase, ModelFilter {
  $with?: CategoryWith;
  $sort?: CategorySort;
}

export interface CategoryValues extends ModelValues {
  id?: number;
  name?: string;
  items?: ItemCollection;

}

export interface CategorySort extends ModelSort {
  id?: SortModifier;
  name?: SortModifier;

}

export interface CategoryWith extends ModelWith {
  items?: boolean;

}

export type CategoryProperty = ModelProperty | 'id' | 'name' | 'items';

export class Category extends Model<CategorySub> implements CategoryValues {

  get id(): number {
    return super.getValue('id');
  }
  get name(): string {
    return super.getValue('name');
  }
  set name(name: string) {
    super.setValue('name', name);
  }

  get items(): ItemCollection {
    return super.getRelation('items');
  }
  set items(items: ItemCollection) {
    super.setRelation('items', items);
  }




  static property(property: CategoryProperty = null): CategoryProperty {
    return property;
  }

  static sort(properties: CategorySort = {}): CategorySort {
    return properties;
  }

  static values(values: CategoryValues = {}): CategoryValues {
    return values;
  }

  static with($with: CategoryWith = {}): CategoryWith {
    return $with;
  }

  fill(values: CategoryValues) {
    return super.fill(values);
  }

  findBy(filter: CategoryFilter = {}) {
    return super.findBy(filter);
  }

  // pretty method for findBy
  find(filter: CategoryFilter = {}) {
    return this.findBy(filter);
  }

  getBy(filter: CategoryFilter = {}) {
    return super.getBy(filter);
  }

  // pretty method for getBy
  get(filter: CategoryFilter = {}) {
    return this.getBy(filter);
  }

  save() {
    return super.save();
  }

  saveWith(withRelations: CategoryWith) {
    return super.saveWith(withRelations);
  }

  static getRelated(): any {
    return {
      items: {type: Item, inverseProperty: 'category', inverseKey: 'categoryId', many: true, collectionType: ItemCollection},

    };
  }

  getRelated() {
    return CategorySub.getRelated();
  }
/*
  assign(relations: { items?: ItemCollection; }) {
    return super.assign(relations);
  }
*/
  static model(properties?: CategoryValues): CategorySub {
    return super.model(CategorySub, properties);
  }

  static collection(models?: CategoryValues[]): CategoryCollectionSub {
    return super.collection(CategoryCollectionSub, models);
  }

  collection(models?: CategoryValues[]): CategoryCollectionSub {
    return CategorySub.collection(models);
  }

  static filter(filter?: CategoryFilter): CategoryFilter {
    return super.filter(filter);
  }

  filter(filter?: CategoryFilter): CategoryFilter {
    return CategorySub.filter(filter);
  }

  getModelClass(){ return CategorySub; }

  static getModelClass(){ return CategorySub; }

  getCollectionClass(){ return CategoryCollectionSub; }

  static getCollectionClass(){ return CategoryCollectionSub; }


  // asynchronous methods.
  static findAll(filter: CategoryFilter = {}): Promise<CategoryCollectionSub> {
    return super.findAll(CategorySub, filter);
  }

  static findOne(filter: CategoryFilter = {}): Promise<CategorySub> {
    return super.findOne(CategorySub, filter);
  }

  // synchronous methods.
  static getAll(filter: CategoryFilter = {}): CategoryCollectionSub {
    return super.getAll(CategorySub, filter);
  }

  static getOne(filter: CategoryFilter = {}): CategorySub {
    return super.getOne(CategorySub, filter);
  }

  toString(){
    return `${this.name}`.replace(/undefined/g, '').replace(/null/g, '').replace(/false/g, '');
  }

  static getPropertyDefinitions(): any {
    return {"id":{"type":"number"},"name":{"type":"string"},"items":{"type":"Item","many":true,"collectionType":"ItemCollection","inverseProperty":"category","inverseKey":"categoryId"}};
  }

  getPropertyDefinitions(): any {
    return CategorySub.getPropertyDefinitions();
  }

}

export class CategoryCollection extends ModelCollection<CategorySub> {

  constructor(){
    super();
    super.init(this, CategoryCollection);
    return this;
  }

  findBy(filter: CategoryFilter = {}) {
    return super.findBy(filter);
  }

  // support Array.find method
  find(predicate: (value: CategorySub, index: number, obj: CategoryCollectionSub) => boolean, thisArg?: any): CategorySub | undefined;
  find(filter?: CategoryFilter): Promise<void>;
  // pretty method for findBy
  find(filter: any = {}): any {
    if(filter instanceof Function){
      return super.find(filter);
    }
    return this.findBy(filter);
  }

  getBy(filter: CategoryFilter = {}) {
    return super.getBy(filter);
  }

  // pretty method for getBy
  get(filter: CategoryFilter = {}) {
    return this.getBy(filter);
  }

  save() {
    return super.save();
  }

  saveWith(withRelations: CategoryWith) {
    return super.saveWith(withRelations);
  }

  getModelClass(){ return CategorySub; }

  static getModelClass(){ return CategorySub; }

  getCollectionClass(){ return CategoryCollectionSub; }

  static getCollectionClass(){ return CategoryCollectionSub; }

}