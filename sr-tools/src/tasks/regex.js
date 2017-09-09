var str = ''
+ '<link href="build/one.css" rel="stylesheet">'
+ '<link href="build-2.0/two.css" rel="stylesheet">'
+ '';

var regex = /"build/;

var regexScripts = [/\<script(.*?)src=(["|'])build[^\/]*?\//g, '<script$1src=$2build-{VERSION}/'];
var regexStylesheets = [/\<link(.*?)href=(["|'])build[^\/]*?\//g, '<link$1href=$2build-{VERSION}/'];

var regexAssets = [/url\s*?\(\s*?(['|"])?..\/assets[^\/]*?\//g, 'url($1../assets-{VERSION}/'];

var regexBuildFolder = [/^build.+/, 'build-{VERSION}'];
var regexAssetsFolder = [/^assets.+/, 'assets-{VERSION}'];

console.log(str.match(regex));