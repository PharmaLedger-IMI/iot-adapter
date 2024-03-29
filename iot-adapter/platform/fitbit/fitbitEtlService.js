const moment = require('moment');


const buildSpO2Resource = (patientId, data) => {
    // console.log(data.Date_US)
    const effectiveDateTime = moment(data.Date_non_US.trim(), 'DD/MM/YYYY HH:mm');
    const identifier = `patient/${patientId}/observation/spo2/${effectiveDateTime.unix()}`;
    const resource = {
      sk: patientId,
      identifier: [
        {
          use: 'secondary',
          value: identifier
        }
      ],
      code: {
        coding: [{
          system: "http://loinc.org",
          code: "20564-1"
        }],
        text: "SpO2"
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      effectiveDateTime: effectiveDateTime.toISOString(),
      valueQuantity: {
        value:data.SpO2,
        unit: "%",
        system: "http://unitsofmeasure.org",
        code: "%"
      }
    };
    return resource;
  }
  const buildBodyTempResource = (patientId, data) => {
    // console.log(data.Date_US)
    const effectiveDateTime = moment(data.Date_non_US.trim(), 'DD/MM/YYYY HH:mm');
    const identifier = `patient/${patientId}/observation/bodytemp/${effectiveDateTime.unix()}`;
    const resource = {
      sk: patientId,
      identifier: [
        {
          use: 'secondary',
          value: identifier
        }
      ],
      code: {
        coding: [{
          system: "http://loinc.org",
          code: "8310-5"
        }],
        text: "Body temperature"
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      effectiveDateTime: effectiveDateTime.toISOString(),
      valueQuantity: {
        value:data.Temperature_C,
        unit: "Cel",
        system: "http://unitsofmeasure.org",
        code: "Cel"
      }
    };
    return resource;
  }
  const buildPulseResource = (patientId, data) => {
    // console.log(data.Date_US)
    const effectiveDateTime = moment(data.Date_non_US.trim(), 'DD/MM/YYYY HH:mm');
    const identifier = `patient/${patientId}/observation/pulse/${effectiveDateTime.unix()}`;
    const resource = {
      sk: patientId,
      identifier: [
        {
          use: 'secondary',
          value: identifier
        }
      ],
      code: {
        coding: [{
          system: "http://loinc.org",
          code: "8889-8"
        }],
        text: "Heart rate"
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      effectiveDateTime: effectiveDateTime.toISOString(),
      valueQuantity: {
        value:data.Pulse,
        unit: "bpm",
        system: "http://unitsofmeasure.org",
        code: "bpm"
      }
    };
    return resource;
  }
  
  
  const buildSystolicBloodPressureResource = (patientId, data) => {
    const effectiveDateTime = moment(data.Date_non_US.trim(), 'DD/MM/YYYY HH:mm');
    const identifier = `patient/${patientId}/observation/bpsys/${effectiveDateTime.unix()}`;
    const resource = {
      sk: patientId,
      identifier: [
        {
          use: 'secondary',
          value: identifier
        }
      ],
      code: {
        coding: [{
          system: "http://loinc.org",
          code: "8480-6"
        }
        ],
        text: "Systolic Blood Pressure"
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      effectiveDateTime: effectiveDateTime.toISOString(),
      valueQuantity: {
        value: data.Systolic,
        unit: "mmHg",
        system: "http://unitsofmeasure.org",
        code: "mmHg"
      }
    };
    return resource;
  }
  
  const buildDiasystolicBloodPressureResource = (patientId, data) => {
    const effectiveDateTime = moment(data.Date_non_US.trim(), 'DD/MM/YYYY HH:mm');
    const identifier = `patient/${patientId}/observation/bpdia/${effectiveDateTime.unix()}`;
    const resource = {
      sk: patientId,
      identifier: [
        {
          use: 'secondary',
          value: identifier
        }
      ],
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: "8462-4"
          }
        ],
        text: "Diastolic Blood Pressure"
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      effectiveDateTime: effectiveDateTime.toISOString(),
      valueQuantity: {
        value: data.Diastolic,
        unit: "mmHg",
        system: "http://unitsofmeasure.org",
        code: "mmHg"
      }
    };
    return resource;
  }
  const buildCaloriesBurnedResource = (patientId, data) => {
    const effectiveDateTime = moment(data.Date_non_US.trim(), 'DD/MM/YYYY HH:mm');
    const identifier = `patient/${patientId}/observation/calburned/${effectiveDateTime.unix()}`;
    const resource = {
      sk: patientId,
      identifier: [
        {
          use: 'secondary',
          value: identifier
        }
      ],
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: "41981-2"
          }
        ],
        text: "Calories burned"
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      effectiveDateTime: effectiveDateTime.toISOString(),
      valueQuantity: {
        value: data.Calories_Burned,
        unit: "kcal",
        system: "http://unitsofmeasure.org",
        code: "kcal"
      }
    };
    return resource;
  }
  const buildPatientResource = (patientID) => {
    const resource = {
      sk: patientId,
      name: [{ use: 'official', family: "XXXXXXX", given: "XXXXXXX" }],
      identifier: [
        {
          use: 'official',
          type: {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v2-0203",
                code: "MR"
              }
            ]
          },
          value: patientId
        },
        {
          use: 'official',
          type: {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v2-0203",
                code: "RI"
              }
            ]
          },
          value: patientId
        },
      ]
    };
    return resource;
  }

const buildDeviceResource = (deviceInfo) => {
  const resource = {
    sk: deviceInfo.deviceId,
    identifier: [
      {
        use: 'official',
        type: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v2-0203",
              code: "SNO"
            }
          ]
        },
        value: deviceInfo.deviceId
      }
    ],
    serialNumber: deviceInfo.serialNumber,
    status: "Active",
    modelNumber: deviceInfo.modelNumber,
    manufacturer: "Fitbit",
    deviceName: [
      {
        "name": deviceInfo.name,
        "type": "manufacturer-name"
      }
    ]
  };
  return resource;
}

const buildStepsResource = (patientId, data) => {
  const effectiveDateTime = moment(data.Date_non_US.trim(), 'DD/MM/YYYY HH:mm');
  const identifier = `patient/${patientId}/observation/steps/${effectiveDateTime.unix()}`;
  const resource = {
    sk: patientId,
    identifier: [
      {
        use: 'secondary',
        value: identifier
      }
    ],
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "55423-8",
          display : "Number of steps in unspecified time Pedometer"
        }
      ],
      text: "Steps"
    },
    subject: {
      reference: `Patient/${patientId}`
    },
    effectiveDateTime: effectiveDateTime.toISOString(),
    valueQuantity: {
      value: data.Steps,
      unit: "per activity",
      system: "http://unitsofmeasure.org",
      code: "per activity"
    }
  };
  return resource;
}

const buildDistanceResource = (patientId, data) => {
  const effectiveDateTime = moment(data.Date_non_US.trim(), 'DD/MM/YYYY HH:mm');
  const identifier = `patient/${patientId}/observation/distance/${effectiveDateTime.unix()}`;
  const resource = {
    sk: patientId,
    identifier: [
      {
        use: 'secondary',
        value: identifier
      }
    ],
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "41953-1"
        }
      ],
      text: "Distance"
    },
    subject: {
      reference: `Patient/${patientId}`
    },
    effectiveDateTime: effectiveDateTime.toISOString(),
    valueQuantity: {
      value: data.Distance_in_Meters,
      unit: "meters",
      system: "http://unitsofmeasure.org",
      code: "meters"
    }
  };
  return resource;
}

const buildDurationActivityResource = (patientId, data) => {
  const effectiveDateTime = moment(data.Date_non_US.trim(), 'DD/MM/YYYY HH:mm');
  const identifier = `patient/${patientId}/observation/duration/${effectiveDateTime.unix()}`;
  const resource = {
    sk: patientId,
    identifier: [
      {
        use: 'secondary',
        value: identifier
      }
    ],
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "55411-3"
        }
      ],
      text: "Duration"
    },
    subject: {
      reference: `Patient/${patientId}`
    },
    effectiveDateTime: effectiveDateTime.toISOString(),
    valueQuantity: {
      value: data.Duration_in_Minutes,
      unit: "minutes",
      system: "http://unitsofmeasure.org",
      code: "minutes"
    }
  };
  return resource;
}

  module.exports = {
    createSysResource: buildSystolicBloodPressureResource,
    createStepsResource:buildStepsResource,
    createDistanceResource:buildDistanceResource,
    createDurationActivityResource:buildDurationActivityResource,
    createDiaResource: buildDiasystolicBloodPressureResource,
    createSpO2Resource: buildSpO2Resource,
    createPulseResource: buildPulseResource,
    createBodyTempResource: buildBodyTempResource,
    createCaloriesBurnedResource: buildCaloriesBurnedResource,
    createPatientResource: buildPatientResource,
    createDeviceResource: buildDeviceResource
  }

