import {Predicate, ModelFilter, ModelFilterBase, ModelSort, ModelWith, ModelValues, ModelProperty, SortModifier, Model, ModelCollection} from 'sackets';
import {Item as ItemSub} from '../index';
import {ItemCollection as ItemCollectionSub} from '../index';
import {Category} from '../index';


export interface ItemFilterBase extends ModelFilterBase<ItemFilterBase> {
  id?: Predicate.Number;
  name?: Predicate.String;
  price?: Predicate.Number;
  categoryId?: Predicate.Number;

}

export interface ItemFilter extends ItemFilterBase, ModelFilter {
  $with?: ItemWith;
  $sort?: ItemSort;
}

export interface ItemValues extends ModelValues {
  id?: number;
  name?: string;
  price?: number;
  categoryId?: number;
  category?: Category;

}

export interface ItemSort extends ModelSort {
  id?: SortModifier;
  name?: SortModifier;
  price?: SortModifier;
  categoryId?: SortModifier;

}

export interface ItemWith extends ModelWith {
  category?: boolean;

}

export type ItemProperty = ModelProperty | 'id' | 'name' | 'price' | 'categoryId' | 'category';

export class Item extends Model<ItemSub> implements ItemValues {

  get id(): number {
    return super.getValue('id');
  }
  get name(): string {
    return super.getValue('name');
  }
  set name(name: string) {
    super.setValue('name', name);
  }

  get price(): number {
    return super.getValue('price');
  }
  set price(price: number) {
    super.setValue('price', price);
  }

  get categoryId(): number {
    return super.getValue('categoryId');
  }
  set categoryId(categoryId: number) {
    super.setValue('categoryId', categoryId);
  }

  get category(): Category {
    return super.getRelation('category');
  }
  set category(category: Category) {
    super.setRelation('category', category);
  }




  static property(property: ItemProperty = null): ItemProperty {
    return property;
  }

  static sort(properties: ItemSort = {}): ItemSort {
    return properties;
  }

  static values(values: ItemValues = {}): ItemValues {
    return values;
  }

  static with($with: ItemWith = {}): ItemWith {
    return $with;
  }

  fill(values: ItemValues) {
    return super.fill(values);
  }

  findBy(filter: ItemFilter = {}) {
    return super.findBy(filter);
  }

  // pretty method for findBy
  find(filter: ItemFilter = {}) {
    return this.findBy(filter);
  }

  getBy(filter: ItemFilter = {}) {
    return super.getBy(filter);
  }

  // pretty method for getBy
  get(filter: ItemFilter = {}) {
    return this.getBy(filter);
  }

  save() {
    return super.save();
  }

  saveWith(withRelations: ItemWith) {
    return super.saveWith(withRelations);
  }

  static getRelated(): any {
    return {
      category: {type: Category, key: 'categoryId'},

    };
  }

  getRelated() {
    return ItemSub.getRelated();
  }
/*
  assign(relations: { category?: Category; }) {
    return super.assign(relations);
  }
*/
  static model(properties?: ItemValues): ItemSub {
    return super.model(ItemSub, properties);
  }

  static collection(models?: ItemValues[]): ItemCollectionSub {
    return super.collection(ItemCollectionSub, models);
  }

  collection(models?: ItemValues[]): ItemCollectionSub {
    return ItemSub.collection(models);
  }

  static filter(filter?: ItemFilter): ItemFilter {
    return super.filter(filter);
  }

  filter(filter?: ItemFilter): ItemFilter {
    return ItemSub.filter(filter);
  }

  getModelClass(){ return ItemSub; }

  static getModelClass(){ return ItemSub; }

  getCollectionClass(){ return ItemCollectionSub; }

  static getCollectionClass(){ return ItemCollectionSub; }


  // asynchronous methods.
  static findAll(filter: ItemFilter = {}): Promise<ItemCollectionSub> {
    return super.findAll(ItemSub, filter);
  }

  static findOne(filter: ItemFilter = {}): Promise<ItemSub> {
    return super.findOne(ItemSub, filter);
  }

  // synchronous methods.
  static getAll(filter: ItemFilter = {}): ItemCollectionSub {
    return super.getAll(ItemSub, filter);
  }

  static getOne(filter: ItemFilter = {}): ItemSub {
    return super.getOne(ItemSub, filter);
  }

  toString(){
    return `${this.name}`.replace(/undefined/g, '').replace(/null/g, '').replace(/false/g, '');
  }

  static getPropertyDefinitions(): any {
    return {"id":{"type":"number"},"name":{"type":"string"},"price":{"type":"number"},"category":{"type":"Category","key":"categoryId"}};
  }

  getPropertyDefinitions(): any {
    return ItemSub.getPropertyDefinitions();
  }

}

export class ItemCollection extends ModelCollection<ItemSub> {

  constructor(){
    super();
    super.init(this, ItemCollection);
    return this;
  }

  findBy(filter: ItemFilter = {}) {
    return super.findBy(filter);
  }

  // support Array.find method
  find(predicate: (value: ItemSub, index: number, obj: ItemCollectionSub) => boolean, thisArg?: any): ItemSub | undefined;
  find(filter?: ItemFilter): Promise<void>;
  // pretty method for findBy
  find(filter: any = {}): any {
    if(filter instanceof Function){
      return super.find(filter);
    }
    return this.findBy(filter);
  }

  getBy(filter: ItemFilter = {}) {
    return super.getBy(filter);
  }

  // pretty method for getBy
  get(filter: ItemFilter = {}) {
    return this.getBy(filter);
  }

  save() {
    return super.save();
  }

  saveWith(withRelations: ItemWith) {
    return super.saveWith(withRelations);
  }

  getModelClass(){ return ItemSub; }

  static getModelClass(){ return ItemSub; }

  getCollectionClass(){ return ItemCollectionSub; }

  static getCollectionClass(){ return ItemCollectionSub; }

}