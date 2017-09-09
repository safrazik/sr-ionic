import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app.module';

import {DataHandler, LokiDataProvider} from 'sackets';

import {Item, Category} from 'models';

// import {fixtures} from './data-fixtures';

var localDataProvider = new LokiDataProvider({
	env: 'BROWSER',
	adapter: null,
});

LokiDataProvider.setFixtures(()=> {
	let fixtures: any = {};
	fixtures.Category = Category.collection([
		{id: 1, name: 'Electronics'},
		{id: 2, name: 'Furnitures'},
		{id: 3, name: 'Electrical'}
	]);
	fixtures.Item = Item.collection([
		{id: 20, name: 'iPhone', category: fixtures.Category.at(0)},
		{id: 21, name: 'Chair', categoryId: 2},
		{id: 22, name: 'Table', category: fixtures.Category.at(1)},
	]);
	return fixtures;
});

DataHandler.setDataProvider(localDataProvider);
DataHandler.setSyncDataProvider(localDataProvider);

DataHandler.initialize().then(()=> {
	platformBrowserDynamic().bootstrapModule(AppModule);
}).catch(alert);
