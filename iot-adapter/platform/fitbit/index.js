const { google } = require("googleapis");
const docs = require('@googleapis/docs')
const fitbit = require("./fitbitEtlService");
const fs = require("fs");

const commonServices = require("common-services");
const { DeviceAssignationService, CommunicationService, HealthDataService,Constants} = commonServices;
const deviceAssignationService= new DeviceAssignationService();
const healthDataService = new HealthDataService();
const communicationService = CommunicationService.getCommunicationServiceInstance();

const hl7HealthDataMapper = {
    "pulseoximeter": [fitbit.createSpO2Resource,fitbit.createPulseResource],
    "bpm": [fitbit.createSysResource,fitbit.createDiaResource],
    "thermo": [fitbit.createBodyTempResource],
    "activity": [fitbit.createCaloriesBurnedResource]
}

const scopes = ["https://www.googleapis.com/auth/drive"];

const auth = new docs.auth.GoogleAuth({
    keyFilename: '../credentials-service.json',
    // Scopes can be specified either as an array or as a single, space-delimited string.
    scopes: scopes[0]
});
const drive = google.drive({ version: "v3", auth });

// This is a simple sample script for retrieving the file list.
let CSV_FOLDER = "1PSgC9RWj0A7osNqMIUdyLTSx825IAGNX"
drive.files.list(
    {
        pageSize: 10,
        fields: "nextPageToken, files(id, name)",
        q: `'${CSV_FOLDER}' in parents`
    },
    (err, res) => {
        if (err) return console.log("The API returned an error: " + err);
        const patientsHealthFiles = res.data.files;
        searchForPatientsHealthData(patientsHealthFiles,()=>{
            console.log("HealthData Lookup Completed!")
        })
    }
);

function searchForPatientsHealthData(patientsHealthFiles, callback){
    const patientHealthFiles = patientsHealthFiles.shift();
    getPatientData(patientHealthFiles,()=>{
        if(patientsHealthFiles.length>0){
            return searchForPatientsHealthData(patientsHealthFiles, callback);
        }
        callback();
    })
}

function getPatientData(patientFolder, callback){

        console.log(patientFolder.name)
        drive.files.list({
            pageSize: 10,
            fields: 'nextPageToken, files(id, name)',
            q: `'${patientFolder.id}' in parents and mimeType=\'text/csv\'`
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const patientFiles = res.data.files;

            const patientFilesHealthDataLookup =  (patientFiles, callback)=>{
                const patientFile = patientFiles.shift();
                console.log(`${patientFile.name} (${patientFile.id})`);

                const deviceTypeDataExtractors = patientFile.name.substring(0,patientFile.name.indexOf("."));

                if (!hl7HealthDataMapper[deviceTypeDataExtractors]) {
                    console.error(`${deviceTypeDataExtractors} not recognized`);
                    //continue lookup
                    if (patientFiles.length > 0) {
                        return patientFilesHealthDataLookup(patientFiles, callback)
                    }
                    callback();
                }

                let name = patientFolder.name + '_' + patientFile.name;
                downloadFile(patientFile.id, name, auth).then(data=>{
                    const HL7observationPerType = {patientNumber: patientFolder.name, observations: [], deviceId: data[0]['Source_Data']};

                    hl7HealthDataMapper[deviceTypeDataExtractors].forEach(dataExtractor=>{
                        for (let i = 0; i < data.length; i++) {
                            HL7observationPerType.observations.push(dataExtractor(patientFolder.name, data[i]));
                        }
                    })
                    //console.log(HL7observationPerType);
                    matchDataWithExistingAssignedDevices(HL7observationPerType, ()=>{
                        if(patientFiles.length>0){
                            return patientFilesHealthDataLookup(patientFiles, callback)
                        }
                        callback();
                    });
                });
            }

            if (patientFiles.length) {
                return patientFilesHealthDataLookup(patientFiles, callback)
            }
            console.log(`No health data files found for patient with TP Number ${patientFolder.name}`);
            callback();

        });
}

function matchDataWithExistingAssignedDevices(HL7observationPerType, callback) {
    deviceAssignationService.getAssignedDevices((err, assignedDevices) => {
        if (err) {
            throw err;
        }

        //console.log(assignedDevices);
        let patientAssignedDevices = assignedDevices.filter((assignedDevice) => {
            return HL7observationPerType.deviceId === assignedDevice.deviceId && assignedDevice.trialParticipantNumber === HL7observationPerType.patientNumber
        })

        //console.log(patientAssignedDevices);

        const saveObservations = (patientAssignedDevices, callback) =>{
            console.log("--",patientAssignedDevices);
            let patientAssignedDevice = patientAssignedDevices.shift();
            healthDataService.saveObservation(HL7observationPerType.observations, (err, data)=> {
                if(err){
                    console.log(err.message);
                }
                communicationService.sendMessage(patientAssignedDevice.patientDID, {
                    operation: Constants.MESSAGES.HCO.NEW_HEALTHDATA,
                    sReadSSI: data.sReadSSI,
                    message: "Your new data is available now!"
                });
                if (patientAssignedDevice.hasOwnProperty("clinicalSiteDID")) {
                    communicationService.sendMessage(patientAssignedDevice.clinicalSiteDID, {
                        operation: Constants.MESSAGES.HCO.NEW_HEALTHDATA,
                        sReadSSI: data.sReadSSI,
                        deviceId: patientAssignedDevice.deviceId,
                        trialParticipantNumber: patientAssignedDevice.trialParticipantNumber,
                        trial: patientAssignedDevice.trial,
                        message: "Your new data is available now!"
                    });
                }

                if(patientAssignedDevices.length > 0){
                    return saveObservations(patientAssignedDevices, callback);
                }
                callback();
            });
        }
        if(patientAssignedDevices.length>0){
            return saveObservations(patientAssignedDevices, callback);
        }
        callback();

    })
}

async function downloadFile(realFileId, name, auth) {

    const drive = google.drive({version: 'v3', auth});

    try {
        const file = await drive.files.get({
            fileId: realFileId,
            alt: 'media',
        });
        let bufferString = file.data;
        let arr = bufferString.split('\n');
        let jsonObj = [];
        let headers = arr[0].split(',');
        let test = [];
        for(let i = 0; i <headers.length; i++){
            let some = headers[i].replace(/"/g, '');
            some = some.replace(/ /g, '_');
            some = some.replace(/\(/g, '');
            some = some.replace(/\)/g, '');
            some = some.replace(/\//g, '_');
            some = some.replace(/-/g, '_');
            some = some.replace(/\./g, '_');
            some = some.replace(/:/g, '_');
            test.push(some)
        }

        headers = test;
        for(let i = 1; i < arr.length-1; i++) {
            let data = arr[i].split(',');
            let obj = {};
            for(var j = 0; j < data.length; j++) {
                obj[headers[j]] = data[j].replace(/"/g, '');
            }
            jsonObj.push(obj);
        }

        return jsonObj
    } catch (err) {
        throw err;
    }
}