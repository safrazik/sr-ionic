var fs = require('fs');
var path = require('path');

var baseDir = path.resolve('../..');
let wwwDir = path.resolve(baseDir + '/www');

export function run(version: number){
    if(!version){
        console.log('Please specify a version. e.g: npm run task version 1.2');
        return;
    }
    let indexFile = wwwDir + '/index.html';
    var indexContent = fs.readFileSync(indexFile, 'utf8');
    let versionedIndexContent = indexContent;

    var directoriesToBeRenamed = ['assets', 'build'];

    for(let folder of directoriesToBeRenamed){
        versionedIndexContent = versionedIndexContent.replace(new RegExp('(src|href)=(["|\'])' + folder + '[^/]*?/', 'g'), '$1=$2' + folder + '-' + version + '/');
    }

    var files = fs.readdirSync(wwwDir);
    for (let file of files) {
        var stats = fs.statSync(wwwDir + '/' + file);
        var isDirectory = stats.isDirectory();
        if(!isDirectory){
            continue;
        }
        for(let directoryToBeRenamed of directoriesToBeRenamed){
            if(file.indexOf(directoryToBeRenamed) === 0){
                var newDirectory = wwwDir + '/' + directoryToBeRenamed + '-' + version;
                fs.renameSync(wwwDir + '/' + file, newDirectory);
                console.log(directoryToBeRenamed + ' directory was renamed: ' + newDirectory);
            }
        }
    }

    var mainCssFile = wwwDir + '/build-' + version + '/main.css';
    var cssFileContent = fs.readFileSync(mainCssFile, 'utf8');

    var versionedCssContent = cssFileContent;
    versionedCssContent = versionedCssContent.replace(new RegExp('url\s*?\\(\s*?([\'|"])?../assets[^/]*?/', 'g'), 'url($1../assets-' + version + '/');

    fs.writeFileSync(mainCssFile, versionedCssContent);
    console.log('CSS FILE was written: ' + mainCssFile);

    fs.writeFileSync(indexFile, versionedIndexContent);
    console.log('INDEX FILE was written: ' + indexFile);

}