/*********************************************************************************************
* Mostrar datos de todos los pacientes
*********************************************************************************************/
function displayPatientItem(patient) {
  //patient_list.innerHTML += "<a href='grafica.html?" + patient.id + "'><li data-value='" + patient.id + "'> " + getPatientDetails(patient) + "</li></a>";
  //patient_list.innerHTML += "<div class='row' value='" + patient.id + "'> " + getPatientDetails(patient) + "</div>";

  $("#listaPacientes .container").append("<div class='row' id='" + patient.id + "'>" + getPatientDetails(patient) + "</div>");
  $("#listaPacientes .container .row").click(function () {
    showModal($(this).attr('id'));
  });
}

function getPatientDetails(patient) {
  if (patient.name) {
    var details = patient.name.map(function (name) {
      return '<div class="col-sm-4">' + name.given.join(" ") + ' ' + name.family.join(" ") + '</div>'
        + '<div class="col-sm-3">' + patient.id + '</div>'
        + '<div class="col-sm-2">' + patient.gender + '</div>'
        + '<div class="col-sm-3">' + patient.birthDate + '</div>';
    });
    return details.join(" / ")
  } else {
    return "anonymous";
  }
}

function showModal(id) {
  localStorage.setItem("patientId", id);
  $("#myModal").css('display', 'block');;
}


/*********************************************************************************************
* INICIO
*********************************************************************************************/
// Viene de demo.settings.js
var demo = {
  serviceUrl: "http://10.36.139.50:80/baseDstu2"
  //serviceUrl: "http://localhost:4002/baseDstu2"
  //,patientId: "smart-1627321"
};

// Create a FHIR client (server URL, patient id in `demo`)
var smart = FHIR.client(demo), pt = smart.patient;

// buscar todos los paciente
smart.api.fetchAll({ 
  type: "Patient",
  sort: 'name'
}).then(function (results, refs) {
    results.forEach(function (patient) {
      //console.log(JSON.stringify(patient));
      displayPatientItem(patient);
    });
  });

//var patient_list = document.getElementById('patient_list');
var patient_list = document.getElementById('patient_list');

/*********************************************************************************************
* Ventana de selección de mpage para abrir en el contexto de paciente
*********************************************************************************************/
// When the user clicks on <span> (x), close the modal
$(".close").on("click", function () {
  $("#myModal").hide();
});

//Ocultar la ventena myModal al pulsar fuera de la ventana
$(window).click(function (e) {
  //alert(e.target.id); // gives the element's ID 
  //alert(e.target.className); // gives the elements class(es)
  if (e.target.id == "myModal") {
    $("#myModal").hide();
  }
});

// When the user clicks on the button Aceptar, open mpage
$("#btnAceptar").on("click", function () {
  var mpageSeleccionada = $("input:checked").val();
  $("#myModal").hide();
  console.log("mapage1 seleccionada=" + mpageSeleccionada);

  if (mpageSeleccionada == "calc") {
    window.open("http://10.148.48.5/visores/smart/calc");
  }
  if (mpageSeleccionada == "grafica") {
    window.open(mpageSeleccionada + ".html");
  }

});