/*********************************************************************************************
* Mostrar datos de un paciente
*********************************************************************************************/
function displayPatient(pt) {
  if (pt.gender === "male") {
    $("#patient_name").append('<img src="img/mpatient.png" width="35" height="35" alt="logo male patient">');
  } else if (pt.gender === "female") {
    $("#patient_name").append('<img src="img/fpatient.png" width="35" height="35" alt="logo female patient">');
  }
  $("#patient_name").append("<span>" + getPatientName(pt) + " |</span>" + "<span> " + getPatientDetail(pt) + "</span>");
}

function getPatientName(pt) {
  if (pt.name) {
    var names = pt.name.map(function (name) {
      return name.given.join(" ") + " " + name.family.join(" ");
    });
    return names.join(" / ");
  } else {
    return "anonymous";
  }
}

function getPatientDetail(pt) {
  if (pt.name) {
    var details = pt.name.map(function (name) {
      return 'id:<b>' + pt.id + ' </b>genero:<b>' + pt.gender + ' </b>fechaNacimineto:<b>' + pt.birthDate + '</b>';
    });
    return details.join(" / ");
  } else {
    return "no data";
  }
}

/*********************************************************************************************
* Mostrar calendario
*********************************************************************************************/

/* function displayCalendar(){
  var node = document.createElement('div');
  node.setAttribute('id','calendario');
  document.getElementById('patient_name').appendChild(node);
  bHTML=[];
  bHTML.push('<div class="input-group date" data-provide="datepicker"><div class="col-2"><input type="text" class="form-control"><div class="input-group-addon">'+
  '<span class="glyphicon glyphicon-calendar"></span></div></div></div>');
  $('#calendario').html(bHTML.join(""));
  $('.datepicker').datepicker({
    autoclose: true,
    todayHighlight: true,
    immediateUpdates: true
  });
} */

/*********************************************************************************************
* Mostrar datos de la medicación de un paciente
*********************************************************************************************/
function seachPrescription() {
  //A more advanced query: search for active Prescriptions, including med details
  smart.patient.api.fetchAllWithReferences({ type: "MedicationOrder" }, ["MedicationOrder.medicationReference"]).then(function (results, refs) {
    results.forEach(function (prescription) {
      if (prescription.medicationCodeableConcept) {
        displayMedication(prescription.medicationCodeableConcept.coding);
      } else if (prescription.medicationReference) {
        var med = refs(prescription, prescription.medicationReference);
        displayMedication(med && med.code.coding || []);
      }
    });
  });
}

function displayMedication(medCodings) {
  $("#med_list").innerHTML += "<li> " + getMedicationName(medCodings) + "</li>";
}

function getMedicationName(medCodings) {
  var coding = medCodings.find(function (c) {
    return c.system == "http://www.nlm.nih.gov/research/umls/rxnorm";
  });
  return coding && coding.display || "Unnamed Medication(TM)"
}

/*********************************************************************************************
* Mostrar datos de las observaciones de un paciente
*********************************************************************************************/
function seachObservation() {
  smart.patient.api.fetchAll({ type: "Observation" }).then(function (results, refs) {
    results.forEach(function (observation) {
      displayObservation(observation);
    });
  });
}

function displayObservation(observation) {
  $("#obs_list").append("<li> " + observation.code.text + "</li>");
}


/*********************************************************************************************
* Mostrar datos de las observaciones de un paciente ALTURA
*********************************************************************************************/

//client.search().forResource(Observation.class)
//.where(new TokenClientParam("code").exactly().systemAndCode("http://loinc.org", "8302-2"))

//client.search().forResource(Observation.class)
//.where(new TokenClientParam("category").exactly().systemAndCode("http://hl7.org/fhir/observation-category", "vital-signs"))

//http://10.36.139.50/baseDstu2/Observation?patient=smart-1186747&category=http://hl7.org/fhir/observation-category|vital-signs&_format=json&_pretty=true

function searchObservationSignosVitales() {
  smart.patient.api.fetchAll({
    type: 'Observation',
    query: {
      code: {
        $or: ['http://loinc.org|' + '3141-9', //weight
        'http://loinc.org|' + '8302-2', //height
        'http://loinc.org|' + '8462-4', //Diastolic blood pressure TAD
        'http://loinc.org|' + '8480-6', //Systolic blood pressure TAS
        'http://loinc.org|' + '8867-4', //heart_rate
        'http://loinc.org|' + '2710-2', //oxygen_saturation
        'http://loinc.org|' + '9279-1', //respiratory_rate
        'http://loinc.org|' + '8328-7', //Axillary temperature
          //'http://loinc.org|' + '0000', //
        ]
      }
    },
    sort: 'effectiveDateTime'
  }).then(
      function (results, refs) {
        if ( results.length > 0){
          $("#resultadosSignosVitales").append('<table class="table thead-dark">' +
          '<thead>' +
            '<tr>' +
              '<th scope="col">code.coding.system</th>' +
              '<th scope="col">code.coding.code</th>' +
              '<th scope="col">code.coding.display</th>' +
              '<th scope="col">effectiveDateTime</th>' +
              '<th scope="col">valueQuantity.value</th>' +
              '<th scope="col">valueQuantity.unit</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody id="obs_list_grafica">');
          results.forEach(function (observation) {
            displayObservationSignosVitales(observation);
            arraySignosVitales.push(observation.code.text);
          });
          $("#resultadosSignosVitales").append("</tbody></table>");
        }else{
          $("#resultadosSignosVitales").append("<p>No hay resultados de signos vitales</p>");
        }
      },
      function (failData) {
        $("#resultadosSignosVitales").append("<p>Error al recuperar los datos en la función searchObservationSignosVitales</p>");
        console.log("Error al recuperar los datos en la función searchObservationSignosVitales");
      }
    );
}

function displayObservationSignosVitales(observation) {
  let codingSystem;
  let codingCode;
  let codingDisplay;
  observation.code.coding.forEach(function (observationCodeCoding) {
    codingSystem = observationCodeCoding.system;
    codingCode = observationCodeCoding.code;
    codingDisplay = observationCodeCoding.display;
  });

  $("#obs_list_grafica").append("<tr>" +
  "<td>" + codingSystem + "</td>" + 
  "<td>" + codingCode + "</td>" +
  "<td>" + codingDisplay + "</td>" +                                  
  "<td>" + observation.effectiveDateTime + "</td>" + 
  "<td>" + observation.valueQuantity.value + "</td>" + 
  "<td>" + observation.valueQuantity.unit + "</td>" +
  "</tr>");
}

/*********************************************************************************************
* Mostrar datos de las observaciones de un paciente ALTURA
*********************************************************************************************/
function seachObservationAltura() {
  smart.patient.api.fetchAll({
    type: 'Observation',
    query: {
      code: {
        $or: ['http://loinc.org|8302-2']
      }
    }
  }).then(function (results, refs) {
    results.forEach(function (observation) {
      displayObservationAltura(observation);
    });
  });
}

function displayObservationAltura(observation) {
  $("#obs_altura").append("<li> " + observation.code.coding.code + " " + observation.code.text + " " 
  + observation.valueQuantity.value + observation.valueQuantity.unit + "</li>");
}


/*********************************************************************************************
* INICIO
*********************************************************************************************/
var patient_id;
var arraySignosVitales = [];

//Recoger variable pasada desde index.html al pulsar en un paciente de la lista
if (localStorage.getItem("patientId")) {
  patient_id = localStorage.getItem("patientId");
  // after setting remember to remove it, if it's not required
  localStorage.removeItem("patientId");
}

var demo = {
  serviceUrl: "http://10.36.139.50:80/baseDstu2",
  //serviceUrl: "http://localhost:4002/baseDstu2",
  patientId: patient_id
  //patientId: "smart-1186747"
};

// Create a FHIR client (server URL, patient id in `demo`)
var smart = FHIR.client(demo), pt = smart.patient;

// Create a patient banner by fetching + rendering demographics
smart.patient.read().then(function (pt) {
  displayPatient(pt);
  //displayCalendar();
});

//seachPrescription();
//seachObservation();
//seachObservationAltura();
searchObservationSignosVitales();
