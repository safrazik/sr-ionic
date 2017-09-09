import {ItemCollection as ItemCollectionBase} from './base/index';

export class ItemCollection extends ItemCollectionBase {
	constructor(){
		super();
		super.init(this, ItemCollection);
		return this;
	}
}