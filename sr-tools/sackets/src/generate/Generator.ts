// import * as fs from 'fs';
// import * as path from 'path';
var fs = require('fs');
var path = require('path');

var templateDir = path.resolve(__dirname + '/../../templates');

var modelsDir: string;
var modelsMeta: any;
export function generate(params: {models: any; path: string; }){
	modelsMeta = params.models;
	modelsDir = params.path;
	var baseBarrelContent = '';
	var modelsBarrelContent = '';

	if (!fs.existsSync(modelsDir)){
    	fs.mkdirSync(modelsDir);
	}
	if (!fs.existsSync(modelsDir + '/base')){
    	fs.mkdirSync(modelsDir + '/base');
	}

	for(var modelName in modelsMeta){
		// var modelKey = camelCaseToDash(modelName);
		var modelKey = modelName;
		baseBarrelContent += 'export * from \'./' + modelKey + '\';' + addLine(1);
		modelsBarrelContent += 'export * from \'./' + modelKey + '\';' + addLine(1);
		modelsBarrelContent += 'export * from \'./' + modelKey + 'Collection\';' + addLine(2);
		generateModel(modelName, modelKey, modelsMeta[modelName], modelsMeta);
	}
	fs.writeFile(modelsDir + '/base/index.ts', baseBarrelContent, function(err: any) {
	    if(err) {
	        console.log(err);
	        return;
	    }
	    console.log('base barrel file was saved!');
	});
	fs.writeFile(modelsDir + '/index.ts', modelsBarrelContent, function(err: any) {
	    if(err) {
	        console.log(err);
	        return;
	    }
	    console.log('models barrel file was saved!');
	});
}

function generateModel(modelName: string, modelKey: string, modelMeta: any, modelsMeta: any){
	var modelSubTemplate = fs.readFileSync(templateDir + '/model-sub.ts.template', 'utf8');
	var collectionSubTemplate = fs.readFileSync(templateDir + '/collection-sub.ts.template', 'utf8');
	var modelBaseTemplate = fs.readFileSync(templateDir + '/model.ts.template', 'utf8');
	var tmp: any = {ModelName: modelName, ModelKey: modelKey, imports: ''};

	var classContent = parseTemplate(modelSubTemplate, tmp);
	var modelClassFile = modelsDir + '/' + modelKey + '.ts';
	if(fs.existsSync(modelClassFile)){
		console.log('EXISTS: ' + modelName + ' model sub class');
	}
	else {
		fs.writeFile(modelClassFile, classContent, {flag: 'wx'}, function(err: any) {
			if(err){
				console.log(err);
				return;
			}
			console.log(modelName + ' model sub class file created');
		});
	}

	var classContent = parseTemplate(collectionSubTemplate, tmp);
	if(fs.existsSync(modelClassFile)){
		console.log('EXISTS: ' + modelName + ' model sub class');
	}
	var collectionClassFile = modelsDir + '/' + modelKey + 'Collection.ts';
	if(fs.existsSync(collectionClassFile)){
		console.log('EXISTS: ' + modelName + ' collection sub class');
	}
	else {
		fs.writeFile(collectionClassFile, classContent, {flag: 'wx'}, function(err: any) {
			if(err){
				console.log(err);
				return;
			}
			console.log(modelName + ' collection sub class file created');
		});
	}

	tmp.ModelFilterDefinitions = '';
	tmp.ModelSortDefinitions = '';
	tmp.ModelWithDefinitions = '';
	tmp.ModelValueDefinitions = '';
	tmp.ModelValueOptionalDefinitions = '';
	tmp.ModelPropertyDefinitions = '';

	tmp.ModelRelationsDefinitions = '';
	tmp.relatedDefinitions = '';
	tmp.relatedAssociations = '';
	tmp.relatedPropertyNames = '';
	tmp.ModelToString = '';
	tmp.propertyMetaDefinitions = '';

	// tmp.ModelFilterDefinitions = 'xxxfirstName?: Predicate.String;\nlastName?: Predicate.String';
	var count = 0; var relatedPropertyCount = 0; var dataPropertyCount = 0;
	var importedDataTypes: any = {};

	var sqlDefinitions = ['id INT(11) AUTO_INCREMENT PRIMARY KEY']; // @TODO
	let modelMetaNormalized: any = {};
	for(var propName in modelMeta){
		var propMeta = modelMeta[propName];
		if(propName == '_meta'){
			continue;
		}
		if(propName == 'toString'){
			for(var p in modelMeta){
				propMeta = propMeta.replace(new RegExp(p, 'g'), '${this.' + p + '}');
			}
			// tmp.ModelToString = 'toString(){' + addLine(1) + addTab(2) + /* BEGIN */ 'var str = `' + propMeta + '`;' + addLine(1) + addTab(2) + "if(str === 'undefined' || str === 'null' || str === 'false'){" + addLine(1) + addTab(3) + "return '';" + addLine(1) + addTab(2) + "}" + addLine(1) + addTab(2) + 'return str;' /*END*/ + addLine(1) + addTab(1) + '}';
			tmp.ModelToString = 'toString(){' + addLine(1) + addTab(2) + /* BEGIN */ 'return `' + propMeta + "`.replace(/undefined/g, '').replace(/null/g, '').replace(/false/g, '');" /*END*/ + addLine(1) + addTab(1) + '}';
			continue;
		}
		if(typeof propMeta === 'string'){
			propMeta = {type: propMeta};
		}
		if(propMeta.type.substr(-2) == '[]'){
			propMeta.many = true;
			propMeta.type = propMeta.type.replace('[]', '');
		}
		if(propMeta.type.substr(-('Collection'.length)) == 'Collection'){
			propMeta.many = true;
			propMeta.collectionType = propMeta.type;
			propMeta.type = propMeta.type.replace('Collection', '');
		}
		var related = modelsMeta[propMeta.type];
		if(related){
			if(!propMeta.many && propMeta.key !== false){
				propMeta.key = propName + 'Id';
			}
			for(var invProperty in related){
				if(related[invProperty] == modelName || related[invProperty].type == modelName){
					propMeta.inverseProperty = propMeta.inverseProperty || invProperty;
					if(related[invProperty].key !== false){
						propMeta.inverseKey = propMeta.inverseKey || related[invProperty].key || invProperty + 'Id';
					}
					break;
				}
			}
		}
		// console.log(propMeta);
		// console.log(isRelated);
		var predicateType = capitalizeFirstLetter(propMeta.type.toLowerCase());
		var dataType = propMeta.type == 'date' ? 'Date' : propMeta.type;

		var popFields = function(propName: string, propMeta: any, dataType: any, related = false){
			var method = related ? 'Relation' : 'Value';
			var returnTypeDisplay = dataType;
			if(propMeta && propMeta.many){
				returnTypeDisplay += (related ? 'Collection' : '[]');
			}
			tmp.ModelValueDefinitions += addTab(1) + 'get ' + propName + '(): ' + returnTypeDisplay + ' {' + addLine(1) + addTab(2) + 'return super.get' + method + '(\'' + propName + '\');' + addLine(1) + addTab(1) + '}' + addLine(1);
			if(propName != 'id'){ // id should be readonly
				tmp.ModelValueDefinitions += addTab(1) + 'set ' + propName + '(' + propName + ': ' + returnTypeDisplay + ') {' + addLine(1) + addTab(2) + 'super.set' + method + '(\'' + propName + '\', ' + propName + ');' + addLine(1) + addTab(1) + '}' + addLine(2);
			}


			tmp.ModelValueOptionalDefinitions += addTab(1) + propName + '?: ' + returnTypeDisplay + ';' + addLine(1);
			tmp.ModelPropertyDefinitions += (count == 0 ? '' : ' | ') + '\'' + propName + '\'';
			if(!related){
				var sqlPropName = camelCaseToUnderscore(propName);
				var sqlTypeDefMap: any = {
					'string': 'VARCHAR(255)',
					'boolean': 'INT(1)',
					'number': 'INT(11)',
					'date': 'DATETIME',
				};
				var sqlTypeDef = sqlTypeDefMap[dataType] || sqlTypeDefMap['string'];
				sqlDefinitions.push(sqlPropName + ' ' + sqlTypeDef);
			}
			count ++;
		}
		var popSortWith = function(propName: string, predicateType: any) {
			tmp.ModelFilterDefinitions += addTab(1) + propName + '?: Predicate.' + predicateType + ';' + addLine(1);
			tmp.ModelSortDefinitions += addTab(1) + propName + '?: SortModifier;' + addLine(1);
		}
		if(related){
			if(!importedDataTypes[dataType]){
				tmp.imports += 'import {' + dataType + '} from \'../index\';' + addLine(1);
				importedDataTypes[dataType] = true;
			}
			if(propMeta.many && !importedDataTypes[dataType + 'Collection']){
				tmp.imports += 'import {' + dataType + 'Collection' + '} from \'../index\';' + addLine(1);
				importedDataTypes[dataType + 'Collection'] = true;
			}
			tmp.relatedDefinitions += addTab(3) + propName + ': {type: ' + dataType
				+ (propMeta.key ? ", key: '" + propMeta.key + "'" : '')
				+ (propMeta.inverseProperty ? ", inverseProperty: '" + propMeta.inverseProperty + "'" : '')
				+ (propMeta.inverseKey ? ", inverseKey: '" + propMeta.inverseKey + "'" : '')
				+ (propMeta.many ? ', many: true' : '')
				+ (propMeta.collectionType ? ', collectionType: ' + propMeta.collectionType : '')
			+ '},' + addLine(1);
			tmp.relatedAssociations += ' ' + propName + '?: ' + dataType + (propMeta.many ? 'Collection' : '') + '; ';
			// tmp.relatedPropertyNames += (relatedPropertyCount == 0 ? '' : ' | ') + '\'' + propName + '\'';
			tmp.ModelWithDefinitions += addTab(1) + propName + '?: boolean;' + addLine(1);
			// tmp.ModelRelationsDefinitions += addTab(1) + 'get ' + propName + '(): ' + dataType + ' {' + addLine(1) + addTab(2) + 'return super.getRelation(\'' + propName + '\');' + addLine(1) + addTab(1) + '}' + addLine(1);
			// tmp.ModelRelationsDefinitions += addTab(1) + 'set ' + propName + '(' + propName + ': ' + dataType + ') {' + addLine(1) + addTab(2) + 'super.setRelation(\'' + propName + '\', ' + propName + ');' + addLine(1) + addTab(1) + '}' + addLine(2);

			if(propMeta.key){
				popFields(propMeta.key, {}, 'number', false);
				popSortWith(propMeta.key, 'Number');
			}

			relatedPropertyCount++;
		}
		else {
			popSortWith(propName, predicateType);
			// tmp.ModelValueDefinitions += addTab(1) + propName + ': ' + dataType + ';' + addLine(1);
			dataPropertyCount++;
		}

		popFields(propName, propMeta, dataType, related);

		modelMetaNormalized[propName] = propMeta;

	}

	tmp.propertyMetaDefinitions = JSON.stringify(modelMetaNormalized);

	console.log('BEGIN sqlDefinitions');
	console.log(sqlDefinitions.join(',\n'));
	console.log('END sqlDefinitions');
	var classContent = parseTemplate(modelBaseTemplate, tmp);
	var modelFileName = modelKey + '.ts';
	fs.writeFile(modelsDir + '/base/' + modelFileName, classContent, function(err: any) {
	    if(err) {
	        console.log(err);
	        return;
	    }
	    console.log(tmp.ModelName + ' base class file was saved!');
	});

}

function parseTemplate(template: string, vars: any){
	var content = template;
	for(var key in vars){
		content = content.replace(new RegExp('<tmp.' + key + '>', 'g'), vars[key]);
	}
	return content;
}

function addTab(count: number){
	return new Array( count + 1 ).join('  ');
}

function addLine(count: number){
	return new Array( count + 1 ).join('\n');
}

function camelCaseToDash(str: string) {
    return str.replace( /([a-z])([A-Z])/g, '$1-$2' ).toLowerCase();
}

function camelCaseToUnderscore(str: string) {
    return str.replace( /([a-z])([A-Z])/g, '$1_$2' ).toLowerCase();
	// return str.replace(/\.?([A-Z]+)/g, function (x,y){return "_" + y.toLowerCase()}).replace(/^_/, "");
}

function capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}


/**
 * Look ma, it's cp -R.
 * @param {string} src The path to the thing to copy.
 * @param {string} dest The path to the new copy.
 */
var copyRecursiveSync = function(src: string, dest: string) {
  var exists = fs.existsSync(src);
  if(!exists){
  	console.log('file/folder not exists "' + src + '"');
  	return;
  }
  var stats = exists && fs.statSync(src);
  var isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
  	if(!fs.existsSync(dest)){
	    fs.mkdirSync(dest);
	}
    fs.readdirSync(src).forEach(function(childItemName: string) {
      copyRecursiveSync(path.join(src, childItemName),
                        path.join(dest, childItemName));
    });
  } else {
  	var content = fs.readFileSync(src, 'utf8');
  	fs.writeFileSync(dest, content);
    // fs.linkSync(src, dest);
  }
}