var NodeHelper = require('node_helper');
var PythonShell = require('python-shell');

module.exports = NodeHelper.create({

    // Override socketNotificationReceived method.
	socketNotificationReceived: function(notification, payload) {
		console.log("Entered helper");
        if (notification === 'UPDATE') {
			this.runPython(payload);
		}
	},
	
	runPython: function(action) {
		const self = this;
		const fileName = 'WorkoutDisplay.py';
		console.log('Running ' + fileName);
        console.log('Action ' + action);
		const wordPyShell = new PythonShell(fileName, {mode: 'json', scriptPath: 'modules/MMM-workoutDisplay/data', args: [action]});
		
		wordPyShell.on('message', function (message) {
            console.log(message);
			self.sendSocketNotification(message.type, message);
		});
		
		wordPyShell.end(function (err) {
			if (err) throw err;
			var d = new Date();
			var datestring = d.getFullYear() + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2) 
				+ "T" + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
			self.sendSocketNotification("UPDATE", datestring);
			console.log('Finished getting data');
		});
	}
});