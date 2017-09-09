import {CategoryCollection as CategoryCollectionBase} from './base/index';

export class CategoryCollection extends CategoryCollectionBase {
	constructor(){
		super();
		super.init(this, CategoryCollection);
		return this;
	}

	findContaining(text: string){
		return this.find({name: {$contains: text}});
	}
}