export declare type date = Date;
export interface IPredicate {
}
export interface INumberPredicate extends IPredicate {
    $eq?: number;
    $ne?: number;
    $lt?: number;
    $lte?: number;
    $gt?: number;
    $gte?: number;
    $not?: Predicate.Number;
    $in?: number[];
    $nin?: number[];
}
export interface IBooleanPredicate extends IPredicate {
    $eq?: boolean;
    $ne?: boolean;
    $not?: Predicate.Boolean;
}
export interface IStringPredicate extends IPredicate {
    $eq?: string;
    $ne?: string;
    $contains?: string;
    $startswith?: string;
    $endswith?: string;
    $not?: Predicate.String;
    $in?: string[];
    $nin?: string[];
}
export interface IDatePredicate extends IPredicate {
    $eq?: date;
    $ne?: date;
    $lt?: date;
    $lte?: date;
    $gt?: date;
    $gte?: date;
    $not?: Predicate.Date;
    $in?: date[];
    $nin?: date[];
}
export interface ModelFilterBase<T> {
    $and?: T[];
    $or?: T[];
    $nor?: T[];
    $not?: T;
}
export interface ModelFilter {
    $skip?: number;
    $limit?: number;
}
export interface ModelSort {
    id?: SortModifier;
}
export interface ModelWith {
}
export interface ModelOptions {
    skip?: number;
    limit?: number;
    sort?: ModelSort;
    with?: ModelWith;
}
export interface ModelValues {
}
export declare type ModelProperty = 'id';
export declare module Predicate {
    type Boolean = boolean | IBooleanPredicate;
    type Number = number | INumberPredicate;
    type String = string | IStringPredicate;
    type Date = date | IDatePredicate;
}
export declare type SortModifier = -1 | 1;
export declare type FieldFlag = 0 | 1;
export declare class Filter {
    static sortResults(res: any[], property: any, desc?: boolean): any[];
}
