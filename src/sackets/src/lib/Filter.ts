export type date = Date;

export interface IPredicate {
	// $exists?: boolean;
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
    // initialize?: (object: T) => number;
}

export interface ModelValues {
}

export type ModelProperty = 'id';

export module Predicate {
	export type Boolean = boolean | IBooleanPredicate;
	export type Number = number | INumberPredicate;
	export type String = string | IStringPredicate;
	export type Date = date | IDatePredicate;
}

export type SortModifier = -1 | 1;
export type FieldFlag = 0 | 1;

// export var _filters = true; // hack to prevent output from being empty

export class Filter {
	static sortResults(res: any[], property: any, desc = false){
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
}