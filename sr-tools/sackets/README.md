# sackets


`sackets` is an easy to use and highly extendable typed mongo db like query based *TypeScript* ActiveRecord library for browser and node js with code generation

----------


## Quick Start

- Install with npm

```
npm install sackets --save
```

- Create a `models.js` (or `models.json` if you prefer json) file for meta information of your models similar to the following
```javascript
module.exports = {
    "Item": {
        "id": "number", // required
        "name": "string",
        "price": "number",
        "category": "Category", // belongs to
        "toString": "name" // string representation of Item object
    },
    "Category": {
        "id": "number",
        "name": "string",
        "items": "ItemCollection", // has many
        "toString": "name"
    }
};
```

- Create a `modelsgen.js` file in your project with the following content

```javascript
var generator = require('sackets/generator');
var models = require('./models'); // get the model meta created above
var path = require('path');

generator.generate({
    models: models,
    path: path.resolve(__dirname + '/app/models'), // the path where code will be generated.
});
```

- Run modelsgen script with node

```
node modelsgen.js
```

- Files will be generated as following

```javascript
- app
    - models
        - base
            - Category.ts // Generated every time overwriting the existing. Contains generated code based on the meta information
            - Item.ts
            - index.ts
        - Category.ts // Generated first time only, if not exists. Contains your custom code
        - CategoryCollection.ts
        - Item.ts
        - ItemCollection.ts
        - index.ts // barrel file exporting all the models
```

- Place your custom code in `app/models/Item.ts` for single item queries or in `app/models/ItemCollection.ts` for item collection queries

```typescript
// app/models/ItemCollection.ts
import {ItemCollection as ItemCollectionBase} from './base/index';
import {Category} from './Category';

export class ItemCollection extends ItemCollectionBase {
    findExpensiveByCategory(category: Category){
        return this.find({
            categoryId: category.id,
            price: {$gt: 100},
            $sort: {price: -1}
        }); // typed query filter
    }
}
```

- Use the code in your components or services

```typescript
import {Item, Category} from 'app/models/index';

class MyComponent {
    category = Category.model({id: 20});
    items = Item.collection();
    constructor(){
        this.items.findExpensiveByCategory(category).then(()=> {
            // now `this.items` collection has expensive items
            console.log(this.items);
        }).catch((err: any)=> {
            console.log(err);
        });
    }
}
```

> **Note:**
>
>  Unlike other frameworks, sackets self-fills the object(s) which makes it a perfect data handling library for data binding frameworks like Angular.

```html
<ul>
    <li *ngFor="let item of items">
        {{ item.name }} {{ item.price }}
    </li>
</ul>
```