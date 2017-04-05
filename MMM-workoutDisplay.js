Module.register('MMM-workoutDisplay',{

	exerciseList: {
		totExercises: "",
		eSpan: "",
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
		}, 6*60*60*1000);
		Log.log("End of start");
	},
	
	updateWorkout: function() {
		Log.log("Updating");
		this.exerciseList['todaysWorkout'] = "";
		this.exerciseList['eSpan'] = "";
		this.exerciseList['totExercises'] = "";
		this.sendSocketNotification('UPDATE', 'UPDATE_DAY' + '|' + this.config['folderID'] + '|' + this.driveData['updateTime']);
	},

	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("table");
		wrapper.id = "workout-table"
		wrapper.className = "small";

		var message = document.createElement("tr");
		var messageInfo = document.createElement("th");

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
			var titleHead = document.createElement("tbody");
			var titleRow = document.createElement("tr");
			titleRow.id = "workout-header";			
			var title1 = document.createElement("td");
			title1.innerHTML = "Exercise";
			title1.className = "workout-header-key";
			titleRow.appendChild(title1);
			var title2 = document.createElement("td");
			title2.innerHTML = "Weight";
			title2.className = "workout-header-key";
			titleRow.appendChild(title2);
			var title3 = document.createElement("td");
			title3.innerHTML = "Sets";
			title3.className = "workout-header-key";
			titleRow.appendChild(title3);
			var title4 = document.createElement("td");
			title4.innerHTML = "Reps";
			title4.className = "workout-header-key";
			titleRow.appendChild(title4);
			titleHead.appendChild(titleRow);
			wrapper.appendChild(titleHead);

			var myLifts = this.exerciseList['todaysWorkout'].split(',');
			var myLiftsLen = this.exerciseList['eSpan'].split(',');
			var lastLift = ""
			var eNum = 0;

			for (var i = 0; i < myLifts.length; i++) {
				var eSeg = i % 4;
				switch (eSeg) {
					case 0:
						var e = document.createElement("tr");
						
						if (myLifts[i] != lastLift)
						{
						var eName = document.createElement("td");
						eName.className = "workout-info";
						eName.id = "workout-info-name";
							eName.innerHTML = myLifts[i];
							eName.rowSpan = myLiftsLen[eNum];
							eNum++;
							lastLift = myLifts[i];
						e.appendChild(eName);
						}
						
						var eWeight = document.createElement("td");
						eWeight.className = "workout-info";
						eWeight.id = "workout-info-weight";
						var eReps = document.createElement("td");
						eReps.className = "workout-info";
						eReps.id = "workout-info-reps";
						var eSets = document.createElement("td");
						eSets.className = "workout-info";
						eSets.id = "workout-info-sets";
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
			Log.log('Updating Dom');
			this.loaded = true;
			this.driveData['updateTime'] = payload;
			this.updateDom(this.fadeSpeed);
		}
		else if (notification === "NumExercises") {
			this.exerciseList['totExercises'] = payload.message;
		}		
		else if (notification === "Span") {
			if (this.exerciseList['eSpan'] !== "") {
				this.exerciseList['eSpan'] += ',';
			}
			this.exerciseList['eSpan'] += payload.message;
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