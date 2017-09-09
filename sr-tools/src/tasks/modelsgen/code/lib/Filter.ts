type date = Date;

interface IPredicate {
	// $exists?: boolean;
}

interface INumberPredicate extends IPredicate {
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

interface IBooleanPredicate extends IPredicate {
	$eq?: boolean;
	$ne?: boolean;
	$not?: Predicate.Boolean;
}

interface IStringPredicate extends IPredicate {
	$eq?: string;
	$ne?: string;
	$contains?: string;
	$startswith?: string;
	$endswith?: string;
	$not?: Predicate.String;
	$in?: string[];
	$nin?: string[];
}

interface IDatePredicate extends IPredicate {
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

interface ModelFilter {
	id?: Predicate.Number;
	$and?: this[];
	$or?: this[];
	$nor?: this[];
}

interface ModelSort {
    id?: SortModifier;
}

interface ModelWith {
}

interface ModelOptions {
    skip?: number;
    limit?: number;
    sort?: ModelSort;
    with?: ModelWith;
    // initialize?: (object: T) => number;
}

interface ModelValues {
    id?: number;
}

type ModelProperty = 'id';

export {ModelFilter, ModelOptions, ModelSort, ModelWith, ModelValues, ModelProperty};

export module Predicate {
	export type Boolean = boolean | IBooleanPredicate;
	export type Number = number | INumberPredicate;
	export type String = string | IStringPredicate;
	export type Date = date | IDatePredicate;
}

export type SortModifier = -1 | 1;
export type FieldFlag = 0 | 1;

export var _filters = true; // hack