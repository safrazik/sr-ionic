var generator = require('./sackets/generator');
var models = require('./models');
var path = require('path');

// console.log(path.resolve(__dirname + '/app/models'));

generator.generate({
	models: models,
	path: path.resolve(__dirname + '/../src/models'),
});

