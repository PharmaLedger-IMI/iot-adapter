const commonServices = require("common-services")
const { DPService, CommunicationService, StudiesService, HealthDataService, PermissionedHealthDataService} = commonServices;
const dpService = DPService.getDPService();
const studiesService = new StudiesService();
const healthDataService= new HealthDataService();
const permissionedHealthDataService = new PermissionedHealthDataService();
const Constants = commonServices.Constants;


function create_dp(message) {
    dpService.mount(message.sReadSSI, (err, mountedDPermission) => {
        if (err) {
            console.log(err);
        }
        console.log(mountedDPermission);
    });
}


function dp_updated_add(message) {

    dpService.mount(message.dpUID, (err, mountedDPermission) => {
        if (err) {
            console.log(err);
        }
        let matches = mountedDPermission.matches; 
        let match = matches.filter(m => m.studyUID === message.studyUID)[0];
        let matchTPNumber = match.patient.patientTPNumber;
        let studyUID = match.studyUID;

        studiesService.getStudy(studyUID, (err, studyFullData)=>{
            if (err) {
                console.log(err);
            }
            let researcherDID = studyFullData.researcherDID;
            let requestedDataTypes = studyFullData.data;

            let PermissionState = {
                operation: Constants.MESSAGES.RESEARCHER.ADD_PARTICIPANTS_TO_STUDY,
                participant: match.patient,
                studyUID: match.studyUID,
                dpermissionStartSharingDate: match.dpermissionStartSharingDate,
                dpermission: match.dpermission
            }
            let communicationService = CommunicationService.getCommunicationServiceInstance();
            communicationService.sendMessage(researcherDID, PermissionState);
            console.log("ADD: New permission sent to the researcher.");
        })
    });
}

function generate_anonymize_data(message){

    let participants_withPermission = [];
    let TPNumbers = [];
    let collectedObservations = [];
    researcherDID = message.senderIdentity

    studiesService.getStudy(message.ssi, (err, study_info)=> {
        if (err){
            console.log(err);
        }
        if (study_info.participants) participants_withPermission = study_info.participants.filter(p => p.dpermission===true);
        TPNumbers = participants_withPermission.map(p => p.participantInfo.patientTPNumber);
        let requestedDataTypes = study_info.data

        healthDataService.getAllObservations((err, allPatientsObservations)=>{
            if (err){
                return console.log(err);
            }
            participants_withPermission.forEach(tp => {
                requestedDataTypes.forEach(datatype => {
                    allPatientsObservations.forEach(patientObservations => {
                        patientObservations.observations.forEach(observation => {
                            let patientTPNumber = observation.subject.reference.slice(8);
                            let observationDataType = observation.code.text;
                            if (patientTPNumber === tp.participantInfo.patientTPNumber &&  observationDataType === datatype) {
                                observation.subject.reference = tp.participantInfo.patientDID;
                                observation.studyUID = message.ssi;
                                observation.objectId = "N/A";
                                observation.sk = "N/A";
                                observation.identifier = "N/A";
                                collectedObservations.push(observation)
                            }
                        });
                    });
                });
            });

            permissionedHealthDataService.saveObservation(collectedObservations, (err, savedData)=> {
                if (err){
                    console.log(err);
                }
                let state = {
                    operation: Constants.MESSAGES.RESEARCHER.ANONYMIZED_DATA,
                    permissionedDataDSUSSI: savedData.sReadSSI
                }
                let communicationService = CommunicationService.getCommunicationServiceInstance();
                communicationService.sendMessage(researcherDID, state);
                console.log("Generated %d anonymized observations for this study.", savedData.length);
                console.log("Total %d patients with permission for this study.", participants_withPermission.length);
            });

        });
    });
}

function dp_updated_remove(message) {

    dpService.mount(message.dpUID, (err, mountedDPermission) => {
        if (err) {
            console.log(err);
        }
        let matches = mountedDPermission.matches; 
        let match = matches.filter(m => m.studyUID === message.studyUID)[0];
        let studyUID = match.studyUID;
        studiesService.getStudy(studyUID, (err, studyFullData)=>{
            if (err) {
                console.log(err);
            }
            let researcherDID = studyFullData.researcherDID;
            let communicationService = CommunicationService.getCommunicationServiceInstance();
            let data = {
                operation: Constants.MESSAGES.RESEARCHER.REMOVE_PARTICIPANTS_FROM_STUDY,
                participant: match.patient,
                studyUID: match.studyUID,
                dpermissionStopSharingDate: match.dpermissionStopSharingDate,
                dpermission: match.dpermission
            }
            communicationService.sendMessage(researcherDID, data);
            console.log("REMOVE: Updating the D Permission in the researcher SSAPP");
        })
    });
}

function dp_updated_reject(message) {

    dpService.mount(message.dpUID, (err, mountedDPermission) => {
        if (err) {
            console.log(err);
        }
        let matches = mountedDPermission.matches; 
        let match = matches.filter(m => m.studyUID === message.studyUID)[0];
        let studyUID = match.studyUID;
        studiesService.getStudy(studyUID, (err, studyFullData)=>{
            if (err) {
                console.log(err);
            }
            let researcherDID = studyFullData.researcherDID;
            let communicationService = CommunicationService.getCommunicationServiceInstance();
            let data = {
                operation: Constants.MESSAGES.RESEARCHER.REJECT_PARTICIPANTS_FROM_STUDY,
                participant: match.patient,
                studyUID: match.studyUID,
                dpermissionRejectedDate: match.dpermissionRejectedDate,
                dpermission: match.dpermission
            }
            communicationService.sendMessage(researcherDID, data);
            console.log("REJECT: Updating the D Permission in the researcher SSAPP");
        })
    });
}



module.exports = {
    "create_dp": create_dp,
    "dp_updated_add": dp_updated_add,
    "dp_updated_remove": dp_updated_remove,
    "dp_updated_reject": dp_updated_reject,
    "generate_anonymize_data": generate_anonymize_data
}
