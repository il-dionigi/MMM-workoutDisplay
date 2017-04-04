from __future__ import print_function
from datetime import datetime, timedelta
from apiclient import discovery
from apiclient.http import MediaIoBaseDownload
from httplib2 import Http
from oauth2client import file, client, tools

import csv
import time
import httplib2
import os
import oauth2client
import sys
import json
import io

# GOOGLE DRIVE INIT

SCOPES = 'https://www.googleapis.com/auth/drive'

store = file.Storage(os.getcwd() + '\\modules\\MMM-workoutDisplay\\data\\storage.json')
creds = store.get()
if not creds or creds.invalid:
	flow = client.flow_from_clientsecrets(os.getcwd() + '\\modules\\MMM-workoutDisplay\\data\\client_id.json', SCOPES)
	creds = tools.run_flow(flow, store)

drive_service = discovery.build('drive', 'v3', http=creds.authorize(Http()))

# GOOGLE DRIVE FUNCTIONS

# def check_for_update(lastUpdate):
# 	response = drive_service.files().list(q="modifiedTime > '" + lastUpdate + "'",
#                                     spaces='drive',
#                                     fields='nextPageToken, files(id, name)',
#                                     pageToken=page_token).execute()

# 	if (updateStatus == True):
# 		return True
# 	else:
# 		return False

def download_file(file_id, mimeType, filename):
	if "google-apps" in mimeType:
		# skip google files
		return False
	request = drive_service.files().get_media(fileId=file_id)
	fh = io.FileIO(rawPath, 'wb')
	downloader = MediaIoBaseDownload(fh, request)
	done = False
	while done is False:
		status, done = downloader.next_chunk()
		return True
	return False

# END OF GOOGLE DRIVE INIT

def print_json(type, message):
	print(json.dumps({'type': type, 'message': message}))
	sys.stdout.flush()

commands = sys.argv[1].split('|')

request = commands[0]
file_id = commands[1]
updateTime = commands[2]

## dd/mm/yyyy format
todayRaw = time.time()
tomorrowRaw = time.localtime(todayRaw + 24*3600) 
today = time.strftime("%Y-%m-%d")
tomorrow = time.strftime("%Y-%m-%d", tomorrowRaw)

class exercise(object):
	def __init__(self):
		self.__name = None
		self.__sets = []
		self.__size = 0

	def newExercise(self, newName):
		self.__name = newName
		self.__sets = []
		self.__size = 0

	def size(self):
		return self.__size
	
	def name(self):
		return self.__name

	def addSet(self, reps, weight):
		if (len(self.__sets) == 0):
			newSet = [1, reps, weight]
			self.__sets.append(newSet)
			self.__size += 1
		elif (self.__sets[len(self.__sets) - 1][2] != weight or self.__sets[len(self.__sets) - 1][1] != reps):
			newSet = [1, reps, weight]
			self.__sets.append(newSet)
			self.__size += 1			
		else:
			self.__sets[len(self.__sets) - 1][0] += 1

	def getSet(self, setNum):
		return self.__sets[setNum]

class dailyWorkout(object):
	def __init__(self, date):
		self.__date = date
		self.__exercises = []
		self.__numExercises = 0

	def newDay(self, date):
		self.__date = date
		self.__exercises = []
		self.__numExercises = 0

	def addExercise(self, exercise):
		newExercise = exercise
		self.__exercises.append(newExercise)
		self.__numExercises += 1
	
	def getDate(self):
		return self.__date

	def getExercise(self, num):
		return self.__exercises[num]

	def getNumberOfExercises(self):
		return self.__numExercises

fileName = 'rawWorkouts.csv'

localDir = os.getcwd() + '\\modules\\MMM-workoutDisplay\\data\\'
rawPath = localDir + fileName
formattedPath = localDir + 'formattedWorkouts.csv'

# GOOGLE DRIVE UPDATE CHECK

# response = drive_service.files().list(q="'" + file_id + "' in parents and modifiedTime > '" + updateTime + "'",
#                                     spaces='drive',
#                                     fields='nextPageToken, files(id, name)',
#                                     pageToken=None).execute()
response = drive_service.files().list(q="'" + file_id + "' in parents and modifiedTime > '" + updateTime + "-07:00'",
                                    spaces='drive',
                                    fields='nextPageToken, files(id, name)',
                                    pageToken=None).execute()
for file in response.get('files', []):
	print_json("ERROR", file.get('name'))
	download_file(file.get('id'), 'text/csv', rawPath)
	request = 'UPDATE_FILE'
	break

#

if request == 'UPDATE_FILE':

	with open(rawPath, "r") as gymNotesFile:
		gymNotesReader = csv.reader(gymNotesFile)
		curTime = today
		workoutNum = 0
		workoutSchedule = []
		workoutSchedule.append(dailyWorkout(curTime))
		workoutList = []
		curExercise = exercise()
		for row in gymNotesReader:
			if len (row) != 0 and row[0] >= curTime and row[0] != 'Date':
				if (row[0] != curTime):
					if (curExercise.size() != 0): # Add previous exercise to schedule
						workoutSchedule[workoutNum].addExercise(curExercise)
					curExercise = exercise()
					curTime = row[0]
					workoutSchedule.append(dailyWorkout(curTime))
					workoutNum += 1
				if (curExercise.name() != row[1]):
					if (curExercise.size() != 0): # Add previous exercise to schedule
						workoutSchedule[workoutNum].addExercise(curExercise)
					
					curExercise = exercise()
					curExercise.newExercise(row[1])
					curExercise.addSet(row[4], row[3])
				else:
					curExercise.addSet(row[4], row[3])
		if curExercise.size() > 0:
			workoutSchedule[workoutNum].addExercise(curExercise)

	gymNotesFile.close()

	with open(formattedPath, 'wb') as csvfile:		
		workoutWriter = csv.writer(csvfile, delimiter=',',  quotechar='|', quoting=csv.QUOTE_MINIMAL)
		curTime = datetime.strptime(today, "%Y-%m-%d")
		for workout in workoutSchedule:
			while curTime != datetime.strptime(workout.getDate(), "%Y-%m-%d"):
				workoutWriter.writerow([curTime.strftime("%Y-%m-%d"), "0"])
				curTime = curTime + timedelta(days=1)

			workoutWriter.writerow([workout.getDate(), workout.getNumberOfExercises()])
			for i in range(workout.getNumberOfExercises()):
				lift = workout.getExercise(i)
				for setNum in range(lift.size()):
					liftSet = lift.getSet(setNum)
					workoutWriter.writerow([lift.name(), liftSet[2], liftSet[1], liftSet[0]])
			
			curTime = curTime + timedelta(days=1)			

	csvfile.close()
	request = 'UPDATE_DAY'

if request == 'UPDATE_DAY':

	lastExercise = ""
	numExercises = None

	with open(formattedPath, "r") as csvFile:
		workoutReader = csv.reader(csvFile)
		curTime = today
		for row in workoutReader:
			if len (row) != 0 and row[0] == curTime:
				print_json("NumExercises", row[1])
				numExercises = int(row[1])
#				todayFound = True
#			elif numExercises >= 0:
			elif (row[0] != tomorrow):
				if (row[0] != lastExercise):
					numExercises -= 1
				lastExercise = row[0]
				print_json("Exercise", row[0])
				print_json("Weight", row[1])
				print_json("Sets", row[2])
				print_json("Reps", row[3])
			else:
				break
				
	csvFile.close()