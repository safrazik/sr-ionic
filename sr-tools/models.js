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