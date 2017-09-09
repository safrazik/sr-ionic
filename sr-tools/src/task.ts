var fs = require('fs');

var tasks = {};
function runTask(task, params){
	params = params || [];
	if(task == 'all'){
		for(var t in tasks){
			runTask(t, []);
		}
		return;
	}
	if(!tasks[task]){
		console.log('The task "' + task + '" not found');
		return;
	}
	var taskModule = require(tasks[task]);
	if(!taskModule.run){
		console.log('"run" method not found in task "' + task + '"');
		return;
	}
	console.log('Running the task "' + task + '"...');
	taskModule.run.apply(null, params);
}

var tasksDir = './tasks';
var task = process.argv[2] || 'all';
var params = [];
if(task){
	params = process.argv.concat([]);
	params.splice(0, 3);
}

fs.readdir(tasksDir, function (err, files) {
    if (err) {
        console.error('Could not read the directory "' + tasksDir + '" : ' + err);
        process.exit(1);
    }
    for (var i = 0; i < files.length; i++) {
        if(files[i].substr(-3) != '.js'){
        	continue;
        }
        var taskName = files[i].replace('.js', '');
        tasks[taskName] = tasksDir + '/' + files[i];
    }

    runTask(task, params);
});