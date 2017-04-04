Module.register('MMM-workoutDisplay',{

	exerciseList: {
		totExercises: "",
		todaysWorkout: ""
	},

	driveData: {
		updateTime: "2012-04-06T00:00"
	},

	// Default module config.
	defaults: {
		folderID: ""
	},

	getStyles: function () {
		return ['MMM-workoutDisplay.css'];
	},

	start: function() {
		Log.log('Starting module: ' + this.name)
		
		this.fadeSpeed = 2000;
		
		this.loaded = false;
		Log.log("Sending socket notification");
		//this.sendSocketNotification('UPDATE', 'UPDATE_FILE' + '|' + this.config['folderID'] + '|' + this.driveData['updateTime']);
		this.sendSocketNotification('UPDATE', 'UPDATE_DAY' + '|' + this.config['folderID'] + '|' + this.driveData['updateTime']);
		
		var self = this;
		setInterval(function() {
			Log.log("Updating workout");
			self.updateWorkout();
		}, 20*1000);
		//12*60*60*1000);
		Log.log("End of start");
	},
	
	updateWorkout: function() {
		Log.log("Updating");
		this.exerciseList['todaysWorkout'] = "";
		this.exerciseList['totExercises'] = "";
		this.sendSocketNotification('UPDATE', 'UPDATE_DAY' + '|' + this.config['folderID'] + '|' + this.driveData['updateTime']);
	},

	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("table");
		wrapper.className = "small";

		var message = document.createElement("tr");
		var messageInfo = document.createElement("th");

		Log.log("Filename is: ");
		Log.log(this.config.fileName);

		if (!this.loaded) {
			wrapper.innerHTML = "Loading today's workout...";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (this.config.fileName === "") {
			messageInfo.innerHTML = "Please link a workout-csv";
			message.appendChild(messageInfo);
			wrapper.appendChild(message);
			return wrapper;
		}
		else if (this.exerciseList['totExercises'] === "0")
		{
			messageInfo.innerHTML = "Rest day, no gym!";
			message.appendChild(messageInfo);
			wrapper.appendChild(message);
			return wrapper;
		}
		else
		{
			var titleHead = document.createElement("thead");
			titleHead.id = 'table-key';			
			var titleRow = document.createElement("tr");
			var title1 = document.createElement("td");
			title1.innerHTML = "Exercise";
			titleRow.appendChild(title1);
			var title2 = document.createElement("td");
			title2.innerHTML = "Weight"
			titleRow.appendChild(title2);
			var title3 = document.createElement("td");
			title3.innerHTML = "Sets"
			titleRow.appendChild(title3);
			var title4 = document.createElement("td");
			title4.innerHTML = "Reps"
			titleRow.appendChild(title4);
			titleHead.appendChild(titleRow);
			wrapper.appendChild(titleHead);

			var myLifts = this.exerciseList['todaysWorkout'].split(',');

			for (var i = 0; i < myLifts.length; i++) {
				var eSeg = i % 4;
				switch (eSeg) {
					case 0:
						var e = document.createElement("tr");
						var eName = document.createElement("td");
						var eWeight = document.createElement("td");
						var eReps = document.createElement("td");
						var eSets = document.createElement("td");
						eName.innerHTML = myLifts[i];
						e.appendChild(eName);
						break;
					case 1:
						eWeight.innerHTML = myLifts[i];
						e.appendChild(eWeight);
						break;
					case 2:
			 			eReps.innerHTML = myLifts[i];
			 			e.appendChild(eSets);
						break;
					case 3:
			 			eSets.innerHTML = myLifts[i];
			 			e.appendChild(eReps);
						break;
					default:
				}
				wrapper.appendChild(e);
			}
			return wrapper;
		}
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === "ERROR") {
			Log.log(payload.message)
		}
		else if (notification === "UPDATE") {
			Log.log('Updating Dom - time was ' + payload);
			this.loaded = true;
			this.driveData['updateTime'] = payload;
			this.updateDom(this.fadeSpeed);
		}
		else if (notification === "NumExercises") {
			Log.log(this.exerciseList['totExercises']);
			this.exerciseList['totExercises'] = payload.message;
			Log.log(this.exerciseList['totExercises']);
			
			Log.log(this.exerciseList['todaysWorkout']);
		}
		else if (notification === "fileID")
		{
			this.driveData['fileID'] = payload.message;
		}
		else {
			if (this.exerciseList['todaysWorkout'] !== "") {
				this.exerciseList['todaysWorkout'] += ',';
			}
			this.exerciseList['todaysWorkout'] += payload.message;
		}
	},
});