var data = [];
var gPlots=[];
var rangos=[];
var graphIndex = 0;
var initDate = new Date();
var balanceInfo;
var auxPlot;
var inicioEjeX;
var finEjeX;

(function(window){
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart)  {
      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        var pt = patient.read();
        var obv = smart.patient.api.fetchAll({
                    type: 'Observation',
                    query: {
                      code: {
                        $or: [
                          'http://loinc.org|' + '8462-4', //Diastolic blood pressure TAD
                          'http://loinc.org|' + '8480-6', //Systolic blood pressure TAS
                          'http://loinc.org|' + '8867-4', //heart_rate
                          'http://loinc.org|' + '2710-2', //oxygen_saturation
                          'http://loinc.org|' + '9279-1', //respiratory_rate
                          'http://loinc.org|' + '8328-7', //Axillary temperature
                          'http://loinc.org|' + '60985-9', //PVC
                          'http://loinc.org|' + '8478-0', //Mean Arterial pressure TAM
                          ]
                      }
                    }
                  });
        var meds =   smart.patient.api.fetchAll({type: 'MedicationAdministration'});

        $.when(pt, obv, meds).fail(onError);

        $.when(pt, obv, meds).done(function (patient,obv, meds) {
          obv.forEach(function(obv){
            getSignosVitales(obv);
          });
          meds.forEach(function(meds){
          });
          prepareHTML(patient);
          prepareData();
        });
      }else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };
  
  function prepareHTML(pt){
    $("#loading").hide();
    var bHTML = [];
    var headerHTML = [];
    var signosVitalesBody='<div class="row flex-nowrap"><div class="col-lg-3" id="vsSelect"></div><div class="col-lg-9" id="vsGraph"></div></div></div>';
    bHTML+='<div class="accordion" id="accordion">';
    var vsHTML = makeCollapse('vsSection','signosVitales','Gráfica de signos vitales',signosVitalesBody);
    var catHTML = makeCollapse('cateteresSection','cateteres','Catéteres, sondas y tubos',null);
    var dvHTML = makeCollapse('valDiscSection','valoresDiscretos','Valores discretos de constantes vitales',null);
    var ventHTML = makeCollapse('ventSection','ventilacion','Ventilación',null);
    var hemoHTML = makeCollapse('hemoSection','hemo','Hemodinámica',null);
    var neuroHTML = makeCollapse('neuroSection','neuro','Neuromonitorización y valoración neurológica',null);
    var bhHTML = makeCollapse('bhSection','balanceHidrico','Balance Hídrico',null);
    var medHTML = makeCollapse('medSection','medicacion','Medicación',null);
    bHTML+=vsHTML+'</div>'+catHTML+'</div>'+'</div>'+dvHTML+'</div>'+'</div>'+ventHTML+'</div>'+'</div>'+hemoHTML+
          '</div>'+'</div>'+neuroHTML+'</div>'+'</div>'+bhHTML+'</div>'+'</div>'+medHTML+'</div>'+'</div>'+'</div>';
    $("#contenedor").html(bHTML);

    headerHTML.push("<div class='media'>");
    if (pt.gender === "male")
      headerHTML.push("<img class='align-selft-start mr-3'  width='125px' height='125px' src='./src/images/mpatient.png' alt='logo male patient'>");
    else if (pt.gender === "female") 
      headerHTML.push("<img class='img-fluid align-selft-start mr-3' width='125px' height='125px' src='./src/images/fpatient.png' alt='logo female patient'>");
    headerHTML.push("<div class='container-fluid'><div class='media-body'><h5 class='mt-0'>Datos demográficos</h5>");
    headerHTML.push("<div class='row flex-nowrap'><div class='col-md-4'><b>Nombre y apellidos:</b> "+getPatientName(pt)+"</div></div>");
    headerHTML.push(getPatientDetail(pt));
    headerHTML.push("</div></div>");
    $("#patient_name").append(headerHTML.join(" "));
    $("header").show();
  }

  function getPatientName(pt) {
    if (pt.name) {
      var names;
        for(let i=0;i<pt.name.length;i++){
          if(pt.name[i].use == 'official'){
            names = pt.name[i].given+" "+pt.name[i].family;
          }
        }
        if(typeof names != 'undefined'){
          return names;
        }
        else{
          return "anonymous";
        }
    } else {
      return "anonymous";
    }
  }

  function getPatientDetail(pt) {
    if (pt.name) {
      var details = pt.name.map(function (name) {
        return '<div class="row flex-nowrap"><div class="col-sm-4"><b>ID:</b>' + pt.id + '</div>'+
        '<div class="col-sm-3"><b>Género:</b>' + pt.gender + '</div>'+
        '<div class="col-sm-5"><b>Fecha de nacimiento:</b>' + pt.birthDate+ '</div></div></div>';
      });
      return details[0];
    } else {
      return "no data";
    }
  }

  function searchDemographics(){
    $.getJSON("https://esjcast.github.io/esjcast_resources/json/demographics.json", function(json){
      getDemographics(json);
    })
    .fail(function(){
      alert("Error al cargar los datos demográficos");
    })
  }

  function searchCateteres(){
    $.getJSON("https://esjcast.github.io/esjcast_resources/json/cateteres.json", function(json){
      getCateteres(json);
    })
    .fail(function(){
      alert("Error al cargar los datos de catéteres");
    })
  }
  
  function searchVentilacion(){
    $.getJSON("https://esjcast.github.io/esjcast_resources/json/ventilacion.json", function(json){
      getVentilacion(json);
    })
    .fail(function(){
      alert("Error al cargar los datos de ventilación");
    })
  }
  
  function searchHemo(){
    $.getJSON("https://esjcast.github.io/esjcast_resources/json/hemo.json", function(json){
      getHemo(json);
    })
    .fail(function(){
      alert("Error al cargar los datos de hemodinámica");
    })
  }
  
  function searchNeuro(){
    $.getJSON("https://esjcast.github.io/esjcast_resources/json/neuro.json", function(json){
      getNeuro(json);
    })
    .fail(function(){
      alert("Error al cargar los datos de neuromonitorización");
    })
  }
  
  function searchBalHid(){
    $.getJSON("https://esjcast.github.io/esjcast_resources/json/balHid.json", function(json){
      getBalHid(json);
    })
    .fail(function(){
      alert("Error al cargar los datos de balance hídrico");
    })
  }
  
  function searchMedicacion(){
    $.getJSON("https://esjcast.github.io/esjcast_resources/json/medicacion.json", function(json){
      getMedicacion(json);
    })
    .fail(function(){
      alert("Error al cargar los datos de medicación");
    })
  }

  function getDemographics(json){
    var jsHTML = [];
    balanceInfo = json.RECORD_DATA.DEMOGRAPHICS.BALANCE_HIDRICO;

    var v1 = "<div class='container-fluid'><div class='row flex-nowrap align-items-center'><div class='col-md-9'><span class='d-block p-2 bg-dark text-white'><ul class='list-inline'>";
    var v2 = "<li class='list-inline-item balHid'>D&iacute;as UCI:</li><li class='list-inline-item balHid' id='diasBH'></li>";
    var v3 = "<li class='list-inline-item' id='bhFechaAyer'> BH Ayer - Ingresos:</li><li class='list-inline-item' id='bhAyerIngresos'>ml</li>";
    var v4 = "<li class='list-inline-item'>Egresos:</li><li class='list-inline-item' id='bhAyerEgresos'>ml</li>";
    var v5 = "<li class='list-inline-item'>Total:</li><li class='list-inline-item balHid' id='bhAyerTotal'>ml</li>";
    var v6 = "<li class='list-inline-item'>| BH desde ingreso en UCI - Ingresos:</li><li class='list-inline-item ingresos' id='bhUciIngresos'>ml</li>";
    var v7 = "<li class='list-inline-item'>Egresos:</li><li class='list-inline-item egresos' id='bhUciEgresos'>ml</li>";
    var v8 = "<li class='list-inline-item'>Total:</li><li class='list-inline-item balHid' id='bhUciTotal'>ml</li></ul></span></div>";
    var v9 = "<div class='col-md-3'><div class='input-group date'><input type='text' class='form-control'><div class='input-group-addon'>";
    var v10 = "<span class='fa fa-calendar'></span></div></div></div></div></div>"
    jsHTML.push(v1,v2,v3,v4,v5,v6,v7,v8, v9, v10);
    $("#diasBH").html(json.RECORD_DATA.DEMOGRAPHICS.ICU_DAYS);
    $("#balHid").html(jsHTML.join(""));
    $("#balHid").show();
    actualizarDatosBalance(initDate);
    $('.datepicker').datepicker();
  }
  
  function getSignosVitales(observation) {
    let codingCode = [], fecha, valor = [], display = [], seq = [], unidades = [], fechaFormateada, y, m, d, h, min, showInd=1, auxCode = 0;
    if(observation.status == 'final'){
      fecha = new Date(observation.effectiveDateTime);
      if(observation.code.text == 'Blood pressure'){
        observation.component.forEach(function(component){
          codingCode.push(component.code.coding[0].code);
          valor.push(component.valueQuantity.value);
          unidades.push(component.valueQuantity.unit)
        });
      }
      else{
        observation.code.coding.forEach(function(code){
          if(auxCode != code.code){
            codingCode.push(code.code);
            auxCode=code.code;
          }
        });
        valor.push(observation.valueQuantity.value);
        unidades.push(observation.valueQuantity.unit);
      }

      y = addZeros(fecha.getFullYear());
      m = addZeros(fecha.getMonth()+1);
      d = addZeros(fecha.getDate());
      h = addZeros(fecha.getHours());
      min = addZeros(fecha.getMinutes());
      fechaFormateada = y + "-" + m + "-" + d + " " + h + ":" + min;

      codingCode.forEach(function(code){
        switch (code)
        {
          case '2710-2':
            display = 'Saturación O2 ';
            seq = 1;
            break;
          case '8328-7':
            display = 'Temperatura ';
            seq = 2;
            break;
          case '9279-1':
            display = 'Frecuencia respiratoria ';
            seq = 3;
            break;
          case '8867-4':
            display = 'Frecuencia cardíaca ';
            seq = 4;
            break;
          case '60985-9':
            display = 'PVC ';
            seq = 5;
            break; 
          case '8480-6':
            display = 'TAS ';
            seq = 6;
            break;
          case '8462-4':
            display = 'TAD ';
            seq = 7;
            break;
          case '8478-0':
            display = 'TAM ';
            seq = 8;
            break;
          default:
            display = '';
            seq = -1;
            showInd = 0; 
        }
        if(showInd != 0){
          data.push(new timeline(code,seq,display,valor,fechaFormateada,unidades[0],showInd));  
        }
      });
    }
  }
  
  function getCateteres(json){
    initDate = new Date(2018,06,31,0,0,0,0);
    var bHTML = [];
    if(json.RESULTADOS.N > 0){
		bHTML.push("<div class='container-fluid'><div class='row flex-nowrap'><div class='col-no-gutter blank'></div>");
      //Dibuja las horas
      for(var i = 0; i < 25; i++){
        var bRight = (i==23)?"":" border-right:none;";
			var mLeft = (i==0)?"margin-left:-10px;":""; //formally 122px
        var hour = i + 8;
        if(hour >= 24){
          hour = hour - 24;
        }
			bHTML.push("<div class='col-no-gutter cell-hour' style = '",mLeft,bRight,"'>",hour,":00","</div>");
      }
    bHTML.push("</div>");
      //Comprueba cual es el primer día
      var fecha_json = convertir_fecha(json.RESULTADOS.PARAMETROS[0].FECHA);
      var fecha_inicio = new Date(initDate.getFullYear(),initDate.getMonth(),initDate.getDate(),8,0);
      //Controlar el cambio de dia para mostrar datos entre las 00:00 y 08:00. INC000002211154
      if(initDate.getHours() < 8){
        fecha_inicio = new Date(initDate.getFullYear(),initDate.getMonth(),initDate.getDate()-1,8,0);
      }
      var fecha_fin = sumar_horas_fecha(23.99,fecha_inicio);
      var fecha_ahora = new Date();
      var identificadores = new Array();
      var localizacion = new Array();
      var tipo = new Array();
      var evolucion = new Array(new Array(),new Array());
      var ci = 0;
      for(var j = 0; j < json.RESULTADOS.N; j++){
        var existe = false;
        for (var i = 0; i < identificadores.length; i++){
          if (json.RESULTADOS.PARAMETROS[j].IDENTIFICACION == identificadores[i]){
            existe = true;
          }
        }
        if (!existe){
          identificadores[ci] = json.RESULTADOS.PARAMETROS[j].IDENTIFICACION;
          localizacion[ci] = json.RESULTADOS.PARAMETROS[j].LOCALIZACION;
          tipo[ci] = tipo_sonda(json.RESULTADOS.PARAMETROS[j].EVENTO);
          ci++;
        }
      }
      var evolucion = new Array(ci);
      for (var j = 0; j < ci; j++){
        evolucion[j] = new Array(24);
        for (var i = 0; i < 24; i++){
          evolucion[j][i] = undefined;
        }
      }
      var id = 0;
      var idl = 0;
      for(var j = 0; j < json.RESULTADOS.N; j++){
        var fecha_json = convertir_fecha(json.RESULTADOS.PARAMETROS[j].FECHA);
        for (var i = 0; i < identificadores.length; i++){
          if (json.RESULTADOS.PARAMETROS[j].IDENTIFICACION == identificadores[i]){
            idl = id;
            id = i;
          }
        }
        if (fecha_json < fecha_inicio){
          if (json.RESULTADOS.PARAMETROS[j].MODO == 1){
            evolucion[id][0] = parseInt((fecha_inicio.getTime() - fecha_json.getTime()) / (1000 * 3600));
          }else if (json.RESULTADOS.PARAMETROS[j].MODO == 2){
            evolucion[id][0] = 0;
          }
        }
        if (fecha_json <= fecha_fin && fecha_json >= fecha_inicio){
          if (json.RESULTADOS.PARAMETROS[j].MODO == 1){
            //Controlar el cambio de dia para mostrar datos entre las 00:00 y 08:00. INC000002211154
            if(initDate.getHours() < 8){
              evolucion[id][cuadrante(initDate.getDate()-1,json.RESULTADOS.PARAMETROS[j].FECHA)] = 1;
            }else{
              evolucion[id][cuadrante(initDate.getDate(),json.RESULTADOS.PARAMETROS[j].FECHA)] = 1;
            }
          }else if (json.RESULTADOS.PARAMETROS[j].MODO == 2){
            //Controlar el cambio de dia para mostrar datos entre las 00:00 y 08:00. INC000002211154
            if(initDate.getHours() < 8){
              evolucion[id][cuadrante(initDate.getDate()-1,json.RESULTADOS.PARAMETROS[j].FECHA)] = NaN;
            }else{
              evolucion[id][cuadrante(initDate.getDate(),json.RESULTADOS.PARAMETROS[j].FECHA)] = NaN;
            }
          }
        }
        idl++;
        id = idl;
      }
      for (var j = 0; j < localizacion.length; j++){
        var pintar = false;
        if (evolucion[j][0] > 0){
          pintar = true; //Si el primer valor es fecha de retirada se muestra el cateter
        }else{
          for (var i = 0; i < 24; i++){
            if (i > 0 && evolucion[j][i] != undefined){
              pintar = true;
            }
          }
        }
        if (pintar){
				bHTML.push("<div class='row flex-nowrap'>");
				bHTML.push("<div class='col-no-gutter titles'>"+tipo[j]+" ("+localizacion[j]+")</div>");
          var cells = new Array();
          for(var i = 0; i < 24 ;i++){
            if (i > 0 && evolucion[j][i] == undefined){ evolucion[j][i] = evolucion[j][i-1]+1; }
            var bRight = (i==23)?"":" border-right:none;";
            var tiempo = Math.ceil(evolucion[j][i]/24);
            if (isNaN(tiempo) || sumar_horas_fecha(i,fecha_inicio) > fecha_ahora){ tiempo = "-"; }
					cells.push("<div class='col-no-gutter cell' style='"+bRight+"'>"+tiempo+"</div>");
          }
          bHTML.push(cells.join(""))
				bHTML.push("</div>");
        }
      }//end for (var j=0;j<localizacion.length; j++)
    }//end if(json.RESULTADOS.N > 0)
    //Muestra la tabla
/*   var catBody = document.createElement("div");
  catBody.setAttribute("class","card-body"); */
  $('#cateteres-body').html(bHTML.join("")+"</div>");
  }
  
  function getVentilacion(json){
    var ventHTML = [];
    var ventSubLength = json.RECORD_DATA.VENT_SUB.length;
    var sampleLength = json.RECORD_DATA.SAMPLE_QUAL.length;
    var gasometriaLength = json.RECORD_DATA.GASOMETRIA.length;
    if(ventSubLength > 0 || sampleLength > 0 || gasometriaLength > 0){
		ventHTML.push("<div class='container-fluid'><div class='row flex-nowrap'><div class='col-no-gutter blank'></div>");
      for(var i = 0; i<25; i++){
        var bRight = (i == 23)?"":" border-right:none;";
			var mLeft = (i == 0)?"margin-left:-10px;":""; //formerly 122px
        var hour = i + 8;
        if(hour >= 24){
          hour = hour - 24;
        }
			ventHTML.push("<div class='col-no-gutter cell-hour' style = '",mLeft,bRight,"'>",hour,":00","</div>");
      }//end for(var i = 0; i <25; i++)
		ventHTML.push("</div>");
  
       if(ventSubLength > 0){
        for(var x = 0; x < ventSubLength; x++){
				ventHTML.push("<div class='row flex-nowrap'>");
          var unidades = "";
          if (json.RECORD_DATA.VENT_SUB[x].UOM != "")
            unidades = "("+json.RECORD_DATA.VENT_SUB[x].UOM+")";
				ventHTML.push("<div class='col-no-gutter titles'>",json.RECORD_DATA.VENT_SUB[x].NAME," ",unidades,"</div>");
  
          var cells = new Array();
          var hovers = new Array();
          for(var j = 0; j < 24;j++){
            var bRight = (j==23)?"":" border-right:none;";
					cells.push("<div class='col-no-gutter cell' style='"+bRight+"'>&nbsp;</div>");
            hovers.push("");
          }//end for(var j = 0; j < 24;j++) 
  
          var resultsLength = json.RECORD_DATA.VENT_SUB[x].RESULTS.length;
          if(resultsLength > 0){
            for(var z = 0; z < resultsLength;z++){
              var resultDate = new Date();
              resultDate.setISO8601(json.RECORD_DATA.VENT_SUB[x].RESULTS[z].EVENT_DT_TM);
              var hour = resultDate.getHours() - 8;
              if(hour < 0){
                hour = hour + 24
              }
              if(z == 0){
                var prevHour = hour;
              }
              if(prevHour != hour){
                resultDate.setISO8601(json.RECORD_DATA.VENT_SUB[x].RESULTS[z-1].EVENT_DT_TM)
                var bRight = (prevHour==23)?"":" border-right:none;";
  
                if(valueCheck(json.RECORD_DATA.VENT_SUB[x].RESULTS[z-1].RESULT_VAL) == true){
                  if(json.RECORD_DATA.VENT_SUB[x].SEQUENCE ==10){
									cells[prevHour] = "<div class='col-no-gutter cell' style='"+bRight+"'>"+json.RECORD_DATA.VENT_SUB[x].RESULTS[z-1].RESULT_VAL.substr(0,4)+"</div>";
                    hovers[prevHour] += json.RECORD_DATA.VENT_SUB[x].RESULTS[z-1].EVENT_DT_TM_DISP+"<br/><b>"+json.RECORD_DATA.VENT_SUB[x].NAME+"</b> : "+json.RECORD_DATA.VENT_SUB[x].RESULTS[z-1].RESULT_VAL+"<br/>";
                  }else{
								cells[prevHour] = "<div class='col-no-gutter cell-img' style='"+bRight+"'>&nbsp;</div>";
                  hovers[prevHour] += "<b>"+json.RECORD_DATA.VENT_SUB[x].NAME+"</b> : "+json.RECORD_DATA.VENT_SUB[x].RESULTS[z-1].RESULT_VAL+"<br/>";
                  }
                }else{
								cells[prevHour] = "<div class='col-no-gutter cell' style='"+bRight+"'>"+json.RECORD_DATA.VENT_SUB[x].RESULTS[z-1].RESULT_VAL+"</div>";
                  if(json.RECORD_DATA.VENT_SUB[x].SEQUENCE ==10){
                    hovers[prevHour] += json.RECORD_DATA.VENT_SUB[x].RESULTS[z-1].EVENT_DT_TM_DISP+"<br/>";
                  }
                }
                
                prevHour = hour;
              }//end if(prevHour != hour)
    
              if(z == (resultsLength - 1)){
                resultDate.setISO8601(json.RECORD_DATA.VENT_SUB[x].RESULTS[z].EVENT_DT_TM)
                var bRight = (prevHour==23)?"":" border-right:none;";
  
                if(valueCheck(json.RECORD_DATA.VENT_SUB[x].RESULTS[z].RESULT_VAL) == true){
                  if(json.RECORD_DATA.VENT_SUB[x].SEQUENCE ==10){
									cells[prevHour] = "<div class='col-no-gutter cell' style = '"+bRight+"'>"+json.RECORD_DATA.VENT_SUB[x].RESULTS[z].RESULT_VAL.substr(0,4)+"</div>";
                    hovers[prevHour] += json.RECORD_DATA.VENT_SUB[x].RESULTS[z].EVENT_DT_TM_DISP+"<br/><b>"+json.RECORD_DATA.VENT_SUB[x].NAME+"</b> : "+json.RECORD_DATA.VENT_SUB[x].RESULTS[z].RESULT_VAL+"<br/>";
                  }else{
								cells[prevHour] = "<div class='col-no-gutter cell-img' style='"+bRight+"'>&nbsp;</div>";
                  hovers[prevHour] += "<b>"+json.RECORD_DATA.VENT_SUB[x].NAME+"</b> : "+json.RECORD_DATA.VENT_SUB[x].RESULTS[z].RESULT_VAL+"<br/>";
                  }
                }else{
								cells[prevHour] = "<div class='col-no-gutter cell' style='"+bRight+"'>"+json.RECORD_DATA.VENT_SUB[x].RESULTS[z].RESULT_VAL+"</div>";
                  if(json.RECORD_DATA.VENT_SUB[x].SEQUENCE ==10){
                    hovers[prevHour] += json.RECORD_DATA.VENT_SUB[x].RESULTS[z].EVENT_DT_TM_DISP+"<br/>";
                  }
                }
              
              }//end if(z == (resultsLength - 1))
            } //for(var z = 0; z < resultsLength;z++)
    
            var hoverLength = json.RECORD_DATA.VENT_HOVER.length ;
            if(hoverLength > 0){
              for(var y = 0; y < hoverLength;y++){
                var hoverResultLength = json.RECORD_DATA.VENT_HOVER[y].RESULT_QUAL.length;
                for(var z = 0; z < hoverResultLength; z++){
                  var resultDate = new Date();
                  resultDate.setISO8601(json.RECORD_DATA.VENT_HOVER[y].RESULT_QUAL[z].EVENT_DT_TM);
                  var hour = resultDate.getHours() - 8;
                  if(hour < 0){
                    hour = hour + 24
                  }
                  hovers[hour] += "<b>"+json.RECORD_DATA.VENT_HOVER[y].EVENT_NAME+":</b> "+json.RECORD_DATA.VENT_HOVER[y].RESULT_QUAL[z].RESULT_VAL+" "+json.RECORD_DATA.VENT_HOVER[y].RESULT_QUAL[z].UOM+"<br/>";
                }
              }
            }//end if(hoverLength > 0 )
            for(var y = 0; y < 24; y++){
              if(hovers[y] > ""){
              cells[y]=[cells[y].slice(0,35)," data-toggle='tooltip' data-placement='top' title='",hovers[y],"'",cells[y].slice(35)].join('');
              }else{
                cells[y] += hovers[y];
              }
            }//end for(var y = 0; y < 24; y++)
          }//end if(resultsLength > 0)
          ventHTML.push(cells.join(""));
				ventHTML.push("</div>");
        }//end for(var x = 0; x < ventSubLength; x++)
      }else{
        ventHTML.push("No se encontraron resultados");
      }//end if(ventSubLength > 0){
    
  
      if(sampleLength > 0){
			ventHTML.push("<div class='row flex-nowrap'><div class='col-no-gutter main-title'>Gasometr&iacute;a</div></div>");

        var cells = new Array();
        var hovers = new Array();
  
        for(var j = 0; j < 24;j++){
          var bRight = (j==23)?"":" border-right:none;";
				cells.push("<div class='col-no-gutter cell' style = '"+bRight+"'>&nbsp;</div>");
          hovers.push("");
        }
  
        for(var i = 0;i < sampleLength;i++){
          var resultDate = new Date();
          resultDate.setISO8601(json.RECORD_DATA.SAMPLE_QUAL[i].EVENT_DT_TM);
          var hour = resultDate.getHours() - 8;
          if(hour < 0){
            hour = hour + 24
          }
          if(i == 0){
            var prevHour = hour;
          }
          if(prevHour != hour){
            var bRight = (prevHour==23)?"":" border-right:none;";
					cells[prevHour] = "<div class='col-no-gutter cell-img' style = '"+bRight+"'>&nbsp;</div>";
            hovers[prevHour] = "<b>"+json.RECORD_DATA.SAMPLE_QUAL[i-1].EVENT_NAME+":</b> "+json.RECORD_DATA.SAMPLE_QUAL[i-1].TYPE+"<br/>";
            prevHour = hour;
          }
          if(i == (sampleLength - 1)){
            var bRight = (prevHour==23)?"":" border-right:none;";
					cells[prevHour] = "<div class='col-no-gutter cell-img' style = '"+bRight+"'>&nbsp;</div>";
            hovers[prevHour] = "<b>"+json.RECORD_DATA.SAMPLE_QUAL[i].EVENT_NAME+":</b> "+json.RECORD_DATA.SAMPLE_QUAL[i].TYPE+"<br/>";
          }
  
          var gasLength = json.RECORD_DATA.SAMPLE_QUAL[i].GAS_QUAL.length ;
          if(gasLength > 0){
            for(var x = 0; x < gasLength;x++){
              var gasResultLength = json.RECORD_DATA.SAMPLE_QUAL[i].GAS_QUAL[x].RESULT_QUAL.length;
              for(var z = 0; z < gasResultLength; z++){
                var resultDate = new Date();
                resultDate.setISO8601(json.RECORD_DATA.SAMPLE_QUAL[i].GAS_QUAL[x].RESULT_QUAL[z].EVENT_DT_TM);
                var hour = resultDate.getHours() - 8;
                if(hour < 0){
                  hour = hour + 24
                }
                hovers[hour] += "<b>"+json.RECORD_DATA.SAMPLE_QUAL[i].GAS_QUAL[x].EVENT_NAME+":</b> "+json.RECORD_DATA.SAMPLE_QUAL[i].GAS_QUAL[x].RESULT_QUAL[z].RESULT_VAL+" "+json.RECORD_DATA.SAMPLE_QUAL[i].GAS_QUAL[x].RESULT_QUAL[z].UOM+"<br/>";
              }
            }
          }
        }//end for(var i = 0;i < sampleLength; i++)
        for(var x = 0; x < 24; x++){
          if(hovers[x] > ""){
          cells[x]=[cells[x].slice(0,35)," data-toggle='tooltip' data-placement='top' title='",hovers[x],"'",cells[x].slice(35)].join('');
          }else{
            cells[x] += hovers[x];
          }
        }
        ventHTML.push(cells.join(""))
			ventHTML.push("</div>");
      }//end if(sampleLength > 0 )
  
      //CRQ000000479879 Volcar en el apartado de ventilación la gasometría (pO2(T), pCO2(t), pH(T), cHCO3-(P,st)c)
      if(gasometriaLength > 0){
        for(var x = 0; x < gasometriaLength; x++){
				ventHTML.push("<div class='row flex-nowrap'>");
          var unidades = "";
          if (json.RECORD_DATA.GASOMETRIA[x].UOM != "")
            unidades = "("+json.RECORD_DATA.GASOMETRIA[x].UOM+")";
				ventHTML.push("<div class='col-no-gutter titles'>",json.RECORD_DATA.GASOMETRIA[x].EVENT_NAME," ",unidades,"</div>");
          var cells = new Array();
          var hovers = new Array();
          for(var j = 0; j < 24;j++){
            var bRight = (j==23)?"":" border-right:none;";
					cells.push("<div class='col-no-gutter cell' style = '"+bRight+"'>&nbsp;</div>");
            hovers.push("");
          }//end for(var j = 0; j < 24;j++)
          var resultsLength = json.RECORD_DATA.GASOMETRIA[x].RESULT_QUAL.length;
          if(resultsLength > 0){
            for(var z = 0; z < resultsLength;z++){
              var resultDate = new Date();
              resultDate.setISO8601(json.RECORD_DATA.GASOMETRIA[x].RESULT_QUAL[z].EVENT_DT_TM);
              var hour = resultDate.getHours() - 8;
              if(hour < 0){
                hour = hour + 24
              }
              if(z == 0){
                var prevHour = hour;
              }
              if(prevHour != hour){
                resultDate.setISO8601(json.RECORD_DATA.GASOMETRIA[x].RESULT_QUAL[z-1].EVENT_DT_TM)
                var bRight = (prevHour==23)?"":" border-right:none;";
                if(valueCheck(json.RECORD_DATA.GASOMETRIA[x].RESULT_QUAL[z-1].RESULT_VAL) == true){
                  if(json.RECORD_DATA.GASOMETRIA[x].SEQUENCE == 10){
									cells[prevHour] = "<div class='col-no-gutter cell' style = '"+bRight+"'>"+json.RECORD_DATA.GASOMETRIA[x].RESULT_QUAL[z-1].RESULT_VAL.substr(0,4)+"</div>";
                    hovers[prevHour] += json.RECORD_DATA.GASOMETRIA[x].RESULT_QUAL[z-1].EVENT_DT_TM_DISP+"<br/><b>"+json.RECORD_DATA.GASOMETRIA[x].EVENT_NAME+"</b> : "+json.RECORD_DATA.GASOMETRIA[x].RESULT_QUAL[z-1].RESULT_VAL+"<br/>";
                  }else{
									cells[prevHour] = "<div class='col-no-gutter cell-img' style = '"+bRight+"'>&nbsp;</div>";
                    hovers[prevHour] += "<b>"+json.RECORD_DATA.GASOMETRIA[x].EVENT_NAME+"</b> : "+json.RECORD_DATA.GASOMETRIA[x].RESULT_QUAL[z-1].RESULT_VAL+"<br/>";
                  }
                }else{
								cells[prevHour] = "<div class='col-no-gutter cell' style = '"+bRight+"'>"+json.RECORD_DATA.GASOMETRIA[x].RESULT_QUAL[z-1].RESULT_VAL+"</div>";
                  if(json.RECORD_DATA.GASOMETRIA[x].SEQUENCE == 10){
                    hovers[prevHour] += json.RECORD_DATA.GASOMETRIA[x].RESULT_QUAL[z-1].EVENT_DT_TM_DISP+"<br/>";
                  }
                }
                prevHour = hour;
              }//end if(prevHour != hour)
  
              if(z == (resultsLength - 1)){
                resultDate.setISO8601(json.RECORD_DATA.GASOMETRIA[x].RESULT_QUAL[z].EVENT_DT_TM)
                var bRight = (prevHour==23)?"":" border-right:none;";
                if(valueCheck(json.RECORD_DATA.GASOMETRIA[x].RESULT_QUAL[z].RESULT_VAL) == true){
                  if(json.RECORD_DATA.GASOMETRIA[x].SEQUENCE ==10){
									cells[prevHour] = "<div class='col-no-gutter cell' style = '"+bRight+"'>"+json.RECORD_DATA.GASOMETRIA[x].RESULT_QUAL[z].RESULT_VAL.substr(0,4)+"</div>";
                    hovers[prevHour] += json.RECORD_DATA.GASOMETRIA[x].RESULT_QUAL[z].EVENT_DT_TM_DISP+"<br/><b>"+json.RECORD_DATA.GASOMETRIA[x].EVENT_NAME+"</b> : "+json.RECORD_DATA.GASOMETRIA[x].RESULT_QUAL[z].RESULT_VAL+"<br/>";
                  }else{
								cells[prevHour] = "<div class='col-no-gutter cell-img' style = '"+bRight+"'>&nbsp;</div>";
                  hovers[prevHour] += "<b>"+json.RECORD_DATA.GASOMETRIA[x].EVENT_NAME+"</b> : "+json.RECORD_DATA.GASOMETRIA[x].RESULT_QUAL[z].RESULT_VAL+"<br/>";
                  }
                }else{
								cells[prevHour] = "<div class='col-no-gutter cell' style = '"+bRight+"'>"+json.RECORD_DATA.GASOMETRIA[x].RESULT_QUAL[z].RESULT_VAL+"</div>";
                  if(json.RECORD_DATA.GASOMETRIA[x].SEQUENCE == 10){
                    hovers[prevHour] += json.RECORD_DATA.GASOMETRIA[x].RESULT_QUAL[z].EVENT_DT_TM_DISP+"<br/>";
                  }
                }
              }//end if(z == (resultsLength - 1))
            } //for(var z = 0; z < resultsLength;z++)
            var hoverLength = json.RECORD_DATA.VENT_HOVER.length ;
            if(hoverLength > 0){
              for(var y = 0; y < hoverLength;y++){
                var hoverResultLength = json.RECORD_DATA.VENT_HOVER[y].RESULT_QUAL.length;
                for(var z = 0; z < hoverResultLength; z++){
                  var resultDate = new Date();
                  resultDate.setISO8601(json.RECORD_DATA.VENT_HOVER[y].RESULT_QUAL[z].EVENT_DT_TM);
                  var hour = resultDate.getHours() - 8;
                  if(hour < 0){
                    hour = hour + 24
                  }
                  hovers[hour] += "<b>"+json.RECORD_DATA.VENT_HOVER[y].EVENT_NAME+":</b> "+json.RECORD_DATA.VENT_HOVER[y].RESULT_QUAL[z].RESULT_VAL+" "+json.RECORD_DATA.VENT_HOVER[y].RESULT_QUAL[z].UOM+"<br/>";
                }
              }
            }//end if(hoverLength > 0 )
            for(var y = 0; y < 24; y++){
              if(hovers[y] > ""){
              cells[y]=[cells[y].slice(0,35)," data-toggle='tooltip' data-placement='top' title='",hovers[y],"'",cells[y].slice(35)].join('');
              }else{
                cells[y] += hovers[y];
              }
            }//end for(var y = 0; y < 24; y++)
          }//end if(resultsLength > 0) 
          ventHTML.push(cells.join(""));
				ventHTML.push("</div>");
        }//end for(var x = 0; x < gasometriaLength; x++)
      }//end if(gasometriaLength > 0){ 
    }else{
      ventHTML.push("No se encontraron resultados");
    }//end if(ventSubLength > 0 || sampleLength > 0)
  
	$('#ventilacion-body').html(ventHTML.join("")+"</div>");

    $(function(){
      $('[data-toggle="tooltip"]').tooltip({html:true})
    })
  }
  
  function getHemo(json){
    var hemoHTML = [];
    //create the time headers
    if(json.RECORD_DATA.SWAN_QUAL.length > 0 || json.RECORD_DATA.MIN_QUAL.length > 0 || json.RECORD_DATA.VENOUS_QUAL.length > 0){
		hemoHTML.push("<div class='container-fluid'><div class='row flex-nowrap'><div class='col-no-gutter blank'></div>");
      for(var i = 0;i<25;i++){
        var bRight = (i==23)?"":" border-right:none;";
			var mLeft = (i==0)?"margin-left:-10px;":""; //formerly 122px
        var hour = i + 8;
        if(hour >= 24){
          hour = hour - 24;
        }
			hemoHTML.push("<div class='col-no-gutter cell-hour' style = '",mLeft,bRight,"'>",hour,":00","</div>");
      }
		hemoHTML.push("</div>");
      if(json.RECORD_DATA.SWAN_QUAL.length > 0){
        var hemoLength = json.RECORD_DATA.SWAN_QUAL.length;
			hemoHTML.push("<div class='row flex-nowrap'><div class='col-no-gutter main-title'>Swan-Ganz</div></div>");
  
        for(var i = 0;i < hemoLength;i++){
				hemoHTML.push("<div class='row flex-nowrap'>");
				hemoHTML.push("<div class='col-no-gutter titles'>",json.RECORD_DATA.SWAN_QUAL[i].EVENT_NAME,"</div>");
          var cells = new Array();
          for(var j = 0; j < 24;j++){
            var bRight = (j==23)?"":" border-right:none;";
					cells.push("<div class='col-no-gutter cell' style = '"+bRight+"'>&nbsp;</div>");
          }
          var resultsLength = json.RECORD_DATA.SWAN_QUAL[i].RESULT_QUAL.length;
          for(var j = 0;j < resultsLength;j++){
            var resultDate = new Date();
            resultDate.setISO8601(json.RECORD_DATA.SWAN_QUAL[i].RESULT_QUAL[j].EVENT_DT_TM);
            var hour = resultDate.getHours() - 8;
            if(hour < 0){
              hour = hour + 24
            }
            if(j == 0){
              var prevHour = hour;
            }
            if(prevHour != hour){
              var bRight = (prevHour==23)?"":" border-right:none;";
              if(valueCheck(json.RECORD_DATA.SWAN_QUAL[i].RESULT_QUAL[j-1].RESULT_VAL) == true){
							var title = json.RECORD_DATA.SWAN_QUAL[i].RESULT_QUAL[j-1].RESULT_VAL+"</br>";
							var hoverLength = jsonData.SWAN_QUAL[i].RESULT_QUAL[j-1].HOVER_QUAL.length;
                if(hoverLength > 0){
                  for(var z = 0;z < hoverLength;z++){
									title += "<b>"+json.RECORD_DATA.SWAN_QUAL[i].RESULT_QUAL[j-1].HOVER_QUAL[z].EVENT_NAME+"</b>: "+json.RECORD_DATA.SWAN_QUAL[i].RESULT_QUAL[j-1].HOVER_QUAL[z].RESULT_VAL+" "+json.RECORD_DATA.SWAN_QUAL[i].RESULT_QUAL[j-1].HOVER_QUAL[z].UOM+"</span><br/>";								
                  }
                }
							cells[prevHour] = "<div class='col-no-gutter cell-img' data-toggle='tooltip' data-placement='top' title='",title,"' style = '"+bRight+"'>&nbsp;</div>";
              }else{
							cells[prevHour] = "<div class='col-no-gutter cell' style = '"+bRight+"'>"+json.RECORD_DATA.SWAN_QUAL[i].RESULT_QUAL[j-1].RESULT_VAL+"</div>";
                var hoverLength = json.RECORD_DATA.SWAN_QUAL[i].RESULT_QUAL[j-1].HOVER_QUAL.length;
                if(hoverLength > 0){
                  for(var z = 0;z < hoverLength;z++){
									var title="<b>"+json.RECORD_DATA.SWAN_QUAL[i].RESULT_QUAL[j-1].HOVER_QUAL[z].EVENT_NAME+"</b>: "+json.RECORD_DATA.SWAN_QUAL[i].RESULT_QUAL[j-1].HOVER_QUAL[z].RESULT_VAL+" "+json.RECORD_DATA.SWAN_QUAL[i].RESULT_QUAL[j-1].HOVER_QUAL[z].UOM+"</span><br/>";
									cells[prevHour]=[cells[prevHour].slice(0,31)," data-toggle='tooltip' data-placement='top' title='",title,"'",cells[prevHour].slice(31)].join('');
                  }
                }
              }
              prevHour = hour;
            }//end if(prevHour != hour)
  
            if(j == (resultsLength - 1)){
              var bRight = (prevHour==23)?"":" border-right:none;";
              if(valueCheck(json.RECORD_DATA.SWAN_QUAL[i].RESULT_QUAL[j].RESULT_VAL) == true){
							var title = json.RECORD_DATA.SWAN_QUAL[i].RESULT_QUAL[j].RESULT_VAL+"</br>";
                var hoverLength = json.RECORD_DATA.SWAN_QUAL[i].RESULT_QUAL[j].HOVER_QUAL.length;
                if(hoverLength > 0){
                  for(var z = 0;z < hoverLength;z++){
									title +=  "<b>"+json.RECORD_DATA.SWAN_QUAL[i].RESULT_QUAL[j].HOVER_QUAL[z].EVENT_NAME+"</b>: "+json.RECORD_DATA.SWAN_QUAL[i].RESULT_QUAL[j].HOVER_QUAL[z].RESULT_VAL+" "+json.RECORD_DATA.SWAN_QUAL[i].RESULT_QUAL[j].HOVER_QUAL[z].UOM+"</span><br/>";
                  }
                }
							cells[prevHour] = "<div class='col-no-gutter cell-img' data-toggle='tooltip' data-placement='top' title='",title,"' style = '"+bRight+"'>&nbsp;</div>";
              }else{
							cells[prevHour] = "<div class = 'col-no-gutter cell' style = '"+bRight+"'>"+json.RECORD_DATA.SWAN_QUAL[i].RESULT_QUAL[j].RESULT_VAL+"</div>";
                var hoverLength = json.RECORD_DATA.SWAN_QUAL[i].RESULT_QUAL[j].HOVER_QUAL.length;
                if(hoverLength > 0){
                  for(var z = 0;z < hoverLength;z++){
									var title =  "<b>"+json.RECORD_DATA.SWAN_QUAL[i].RESULT_QUAL[j].HOVER_QUAL[z].EVENT_NAME+"</b>: "+json.RECORD_DATA.SWAN_QUAL[i].RESULT_QUAL[j].HOVER_QUAL[z].RESULT_VAL+" "+json.RECORD_DATA.SWAN_QUAL[i].RESULT_QUAL[j].HOVER_QUAL[z].UOM+"</span><br/>";
									cells[prevHour]=[cells[prevHour].slice(0,31)," data-toggle='tooltip' data-placement='top' title='",title,"'",cells[prevHour].slice(31)].join('');
                  }
                }
              }
            }//end if(j == (resultsLength - 1))
          }//end for(var j = 0;j < resultsLength; j++)
          hemoHTML.push(cells.join(""))
				hemoHTML.push("</div>");
        }//end for(var i = 0;i < hemoLength; i++)
      }//end if(json.RECORD_DATA.SWAN_QUAL.length > 0 )
  
      if(json.RECORD_DATA.MIN_QUAL.length > 0){
        var hemoLength = json.RECORD_DATA.MIN_QUAL.length;
			hemoHTML.push("<div class='row flex-nowrap'><div class='col-no-gutter main-title'>PICCO2/VIGILEO</div></div>");
        for(var i = 0;i < hemoLength;i++){
				hemoHTML.push("<div class='row flex-nowrap'>");
				hemoHTML.push("<div class='col-no-gutter titles'>",json.RECORD_DATA.MIN_QUAL[i].EVENT_NAME,"</div>");
          var cells = new Array();
          for(var j = 0; j < 24;j++){
            var bRight = (j==23)?"":" border-right:none;";
					cells.push("<div class='col-no-gutter cell' style='"+bRight+"'>&nbsp;</div>");
          }
          var resultsLength = json.RECORD_DATA.MIN_QUAL[i].RESULT_QUAL.length;
          for(var j = 0;j < resultsLength;j++){
            var resultDate = new Date();
            resultDate.setISO8601(json.RECORD_DATA.MIN_QUAL[i].RESULT_QUAL[j].EVENT_DT_TM);
            var hour = resultDate.getHours() - 8;
            if(hour < 0){
              hour = hour + 24
            }
            if(j == 0){
              var prevHour = hour;
            }
            if(prevHour != hour){
              var bRight = (prevHour==23)?"":" border-right:none;";
              if(valueCheck(json.RECORD_DATA.MIN_QUAL[i].RESULT_QUAL[j-1].RESULT_VAL) == true){
							var title = json.RECORD_DATA.MIN_QUAL[i].RESULT_QUAL[j-1].RESULT_VAL+"</br>";
                var hoverLength = json.RECORD_DATA.MIN_QUAL[i].RESULT_QUAL[j-1].HOVER_QUAL.length;
                if(hoverLength > 0){
                  for(var z = 0;z < hoverLength;z++){
									title += "<b>"+json.RECORD_DATA.MIN_QUAL[i].RESULT_QUAL[j-1].HOVER_QUAL[z].EVENT_NAME+":</b> "+json.RECORD_DATA.MIN_QUAL[i].RESULT_QUAL[j-1].HOVER_QUAL[z].RESULT_VAL+" "+json.RECORD_DATA.MIN_QUAL[i].RESULT_QUAL[j-1].HOVER_QUAL[z].UOM+"<br/>";
                  }
                }
							cells[prevHour] = "<div class='col-no-gutter cell-img' data-toggle='tooltip' data-placement='top' title='",title,"' style = '"+bRight+"'>&nbsp;</div>";
              }else{
							cells[prevHour] = "<div class='col-no-gutter cell' style = '"+bRight+"'>"+json.RECORD_DATA.MIN_QUAL[i].RESULT_QUAL[j-1].RESULT_VAL+"</div>";
                var hoverLength = json.RECORD_DATA.MIN_QUAL[i].RESULT_QUAL[j-1].HOVER_QUAL.length;
                if(hoverLength > 0){
                  for(var z = 0;z < hoverLength;z++){
									var title = "<b>"+json.RECORD_DATA.MIN_QUAL[i].RESULT_QUAL[j-1].HOVER_QUAL[z].EVENT_NAME+":</b> "+json.RECORD_DATA.MIN_QUAL[i].RESULT_QUAL[j-1].HOVER_QUAL[z].RESULT_VAL+" "+json.RECORD_DATA.MIN_QUAL[i].RESULT_QUAL[j-1].HOVER_QUAL[z].UOM+"<br/>";
									cells[prevHour]=[cells[prevHour].slice(0,31)," data-toggle='tooltip' data-placement='top' title='",title,"'",cells[prevHour].slice(31)].join('');
                  }
                }
              }
              prevHour = hour;
            }//end if(prevHour != hour)
            if(j == (resultsLength - 1)){
              var bRight = (prevHour==23)?"":" border-right:none;";
              if(valueCheck(json.RECORD_DATA.MIN_QUAL[i].RESULT_QUAL[j].RESULT_VAL) == true){
							var title = json.RECORD_DATA.MIN_QUAL[i].RESULT_QUAL[j].RESULT_VAL+"</br>";
                var hoverLength = json.RECORD_DATA.MIN_QUAL[i].RESULT_QUAL[j].HOVER_QUAL.length;
                if(hoverLength > 0){
                  for(var z = 0;z < hoverLength;z++){
									title += "<b>"+json.RECORD_DATA.MIN_QUAL[i].RESULT_QUAL[j].HOVER_QUAL[z].EVENT_NAME+":</b> "+json.RECORD_DATA.MIN_QUAL[i].RESULT_QUAL[j].HOVER_QUAL[z].RESULT_VAL+" "+json.RECORD_DATA.MIN_QUAL[i].RESULT_QUAL[j].HOVER_QUAL[z].UOM+"<br/>";
                  }
                }
							cells[prevHour] = "<div class='col-no-gutter cell-img' data-toggle='tooltip' data-placement='top' title='",title,"' style = '"+bRight+"'>&nbsp;</div>";
              }else{
							cells[prevHour] = "<div class = 'col-no-gutter cell' style = '"+bRight+"'>"+json.RECORD_DATA.MIN_QUAL[i].RESULT_QUAL[j].RESULT_VAL+"</div>";
                var hoverLength = json.RECORD_DATA.MIN_QUAL[i].RESULT_QUAL[j].HOVER_QUAL.length;
                if(hoverLength > 0){
                  for(var z = 0;z < hoverLength;z++){
									var title = "<b>"+json.RECORD_DATA.MIN_QUAL[i].RESULT_QUAL[j].HOVER_QUAL[z].EVENT_NAME+":</b> "+json.RECORD_DATA.MIN_QUAL[i].RESULT_QUAL[j].HOVER_QUAL[z].RESULT_VAL+" "+json.RECORD_DATA.MIN_QUAL[i].RESULT_QUAL[j].HOVER_QUAL[z].UOM+"<br/>";
									cells[prevHour]=[cells[prevHour].slice(0,31)," data-toggle='tooltip' data-placement='top' title='",title,"'",cells[prevHour].slice(31)].join('');
                  }
                }
              }
            }//end if(j == (resultsLength - 1))
          }//end for(var j = 0;j < resultsLength; j++)
          hemoHTML.push(cells.join(""))
				hemoHTML.push("</div>");
        }//end for(var i = 0;i < hemoLength; i++)
      }//end if(json.RECORD_DATA.MIN_QUAL.length > 0 )
  
      if(json.RECORD_DATA.VENOUS_QUAL.length > 0){
        var hemoLength = json.RECORD_DATA.VENOUS_QUAL.length;
			hemoHTML.push("<div class='row flex-nowrap'><div class='col-no-gutter main-title'>Otros Parametros</div></div>");
        for(var i = 0;i < hemoLength;i++){
				hemoHTML.push("<div class='row flex-nowrap'>");
				hemoHTML.push("<div class='col-no-gutter titles'>",json.RECORD_DATA.VENOUS_QUAL[i].EVENT_NAME,"</div>");
          var cells = new Array();
          for(var j = 0; j < 24;j++){
            var bRight = (j==23)?"":" border-right:none;";
					cells.push("<div class='col-no-gutter cell' style = '"+bRight+"'>&nbsp;</div>");
          }
          var resultsLength = json.RECORD_DATA.VENOUS_QUAL[i].RESULT_QUAL.length;
  
          for(var j = 0;j < resultsLength;j++){
            var resultDate = new Date();
            resultDate.setISO8601(json.RECORD_DATA.VENOUS_QUAL[i].RESULT_QUAL[j].EVENT_DT_TM);
            var hour = resultDate.getHours() - 8;
            if(hour < 0){
              hour = hour + 24
            }
            if(j == 0){
              var prevHour = hour;
            }
            if(prevHour != hour){
              var bRight = (prevHour==23)?"":" border-right:none;";
              if(valueCheck(json.RECORD_DATA.VENOUS_QUAL[i].RESULT_QUAL[j-1].RESULT_VAL) == true){
							cells[prevHour] = "<div class='col-no-gutter cell-img' data-toggle='tooltip' data-placement='top' title='",json.RECORD_DATA.VENOUS_QUAL[i].RESULT_QUAL[j-1].RESULT_VAL,"' style = '"+bRight+"'>&nbsp;</div>";
              }else{
						cells[prevHour] = "<div class='col-no-gutter cell' style = '"+bRight+"'>"+json.RECORD_DATA.VENOUS_QUAL[i].RESULT_QUAL[j-1].RESULT_VAL+"</div>";
              }
              prevHour = hour;
            }
            if(j == (resultsLength - 1)){
              var bRight = (prevHour==23)?"":" border-right:none;";
              if(valueCheck(json.RECORD_DATA.VENOUS_QUAL[i].RESULT_QUAL[j].RESULT_VAL) == true){
							cells[prevHour] = "<div class='col-no-gutter cell-img' data-toggle='tooltip' data-placement='top' title='",json.RECORD_DATA.VENOUS_QUAL[i].RESULT_QUAL[j].RESULT_VAL,"' style = '"+bRight+"'>&nbsp;</div>";
              }else{
							cells[prevHour] = "<div class = 'col-no-gutter cell' style = '"+bRight+"'>"+json.RECORD_DATA.VENOUS_QUAL[i].RESULT_QUAL[j].RESULT_VAL+"</div>";
              }
            }
          }//end for(var j = 0;j < resultsLength; j++)
          hemoHTML.push(cells.join(""))
				hemoHTML.push("</div>");
        }//end for(var i = 0;i < hemoLength; i++)
      }//end if(json.RECORD_DATA.VENOUS_QUAL.length > 0 )
    }else{
      hemoHTML.push("No se encontraron resultados");
    }//end if(json.RECORD_DATA.SWAN_QUAL.length > 0 || json.RECORD_DATA.MIN_QUAL.length > 0 || json.RECORD_DATA.VENOUS_QUAL.length > 0)
    
    $(function(){
      $('[data-toggle="tooltip"]').tooltip({html:true})
    })
    
  $('#hemo-body').html(hemoHTML.join("")+"</div>");

  }
  
  function getNeuro(json){
    var neuroHTML = [];
	neuroHTML.push("<div class='container-fluid'><div class='row flex-nowrap'><div class='col-no-gutter blank' ></div>");
    if(json.RECORD_DATA.QUAL.length > 0){
      for(var i = 0;i<25;i++){
        var bRight = (i==23)?"":" border-right:none;";
			var mLeft = (i==0)?"margin-left:-10px;":""; //formerly 122px
        var hour = i + 8;
        if(hour >= 24){
          hour = hour - 24;
        }
			neuroHTML.push("<div class='col-no-gutter cell-hour' style = '",mLeft,bRight,"'>",hour,":00","</div>");
      }
  
		neuroHTML.push("</div>");
      var neuroLength = json.RECORD_DATA.QUAL.length;
      for(var i = 0;i < neuroLength;i++){
			neuroHTML.push("<div class='row flex-nowrap'>");
			neuroHTML.push("<div class='col-no-gutter titles'>",json.RECORD_DATA.QUAL[i].EVENT_NAME,"</div>");
        var cells = new Array();
        var hovers = new Array();
        for(var j = 0; j < 24;j++){
          var bRight = (j==23)?"":" border-right:none;";
				cells.push("<div class='col-no-gutter cell' style = '"+bRight+"'>&nbsp;</div>");
          hovers.push("");
        }
        var resultsLength = json.RECORD_DATA.QUAL[i].RESULT_QUAL.length;
        for(var j = 0;j < resultsLength;j++){
          var resultDate = new Date();
          resultDate.setISO8601(json.RECORD_DATA.QUAL[i].RESULT_QUAL[j].EVENT_DT_TM);
          var hour = resultDate.getHours() - 8;
          if(hour < 0){
            hour = hour + 24
          }
          if(j == 0){
            var prevHour = hour;
          }
          if(prevHour != hour){
            var bRight = (prevHour==23)?"":" border-right:none;";
            if(valueCheck(json.RECORD_DATA.QUAL[i].RESULT_QUAL[j-1].RESULT_VAL) == true){
						var title = json.RECORD_DATA.QUAL[i].RESULT_QUAL[j-1].RESULT_VAL+"</br>";
              var hoverLength = json.RECORD_DATA.QUAL[i].RESULT_QUAL[j-1].HOVER_QUAL.length;
              if(hoverLength > 0){
                for(var z = 0;z < hoverLength;z++){
								title += "<b>"+json.RECORD_DATA.QUAL[i].RESULT_QUAL[j-1].HOVER_QUAL[z].EVENT_NAME+":</b> "+json.RECORD_DATA.QUAL[i].RESULT_QUAL[j-1].HOVER_QUAL[z].RESULT_VAL+" "+json.RECORD_DATA.QUAL[i].RESULT_QUAL[j-1].HOVER_QUAL[z].UOM+"<br/>";
                }
              }
						cells[prevHour] = "<div class='col-no-gutter cell-img' data-toggle='tooltip' data-placement='top' title='",title,"' style = '"+bRight+"'>&nbsp;</div>";
              prevHour = hour;
            }else{
						cells[prevHour] = "<div class='col-no-gutter cell' style = '"+bRight+"text-align: center;float:left;'>"+json.RECORD_DATA.QUAL[i].RESULT_QUAL[j-1].RESULT_VAL+"</div>";
              var hoverLength = json.RECORD_DATA.QUAL[i].RESULT_QUAL[j-1].HOVER_QUAL.length;
              if(hoverLength > 0){
                for(var z = 0;z < hoverLength;z++){
								hovers[prevHour] += "</br><b>"+json.RECORD_DATA.QUAL[i].RESULT_QUAL[j-1].HOVER_QUAL[z].EVENT_NAME+":</b> "+json.RECORD_DATA.QUAL[i].RESULT_QUAL[j-1].HOVER_QUAL[z].RESULT_VAL+" "+json.RECORD_DATA.QUAL[i].RESULT_QUAL[j-1].HOVER_QUAL[z].UOM+"<br/>";
                }
              }
              prevHour = hour;
            }//end if(valueCheck(json.RECORD_DATA.QUAL[i].RESULT_QUAL[j-1].RESULT_VAL) == true)
          }//end if(prevHour != hour)
          if(j == (resultsLength - 1)){
            var bRight = (prevHour==23)?"":" border-right:none;";
            if(valueCheck(json.RECORD_DATA.QUAL[i].RESULT_QUAL[j].RESULT_VAL) == true){
						cells[prevHour] = "<div class='col-no-gutter cell' data-toggle='tooltip' data-placement='top' title='",json.RECORD_DATA.QUAL[i].RESULT_QUAL[j-1].RESULT_VAL,"' style = 'border:1px solid gray;"+bRight+"text-align: center;float:left;background-image:url(./src/images/4022_16.png);background-repeat:no-repeat;background-position:center;'>&nbsp;</div>";
              var hoverLength = json.RECORD_DATA.QUAL[i].RESULT_QUAL[j].HOVER_QUAL.length;
              if(hoverLength > 0){
							cells[prevHour]=[cells[prevHour].slice(0,22)," data-toggle='tooltip' data-placement='top' title='",json.RECORD_DATA.QUAL[i].RESULT_QUAL[j].RESULT_VAL,"'",cells[prevHour].slice(22)].join('');
                for(var z = 0;z < hoverLength;z++){
								hovers[prevHour] += "</br><b>"+json.RECORD_DATA.QUAL[i].RESULT_QUAL[j].HOVER_QUAL[z].EVENT_NAME+":</b> "+json.RECORD_DATA.QUAL[i].RESULT_QUAL[j].HOVER_QUAL[z].RESULT_VAL+" "+json.RECORD_DATA.QUAL[i].RESULT_QUAL[j].HOVER_QUAL[z].UOM+"<br/>";
                }
              }
            }else{
						cells[prevHour] = "<div class='col-no-gutter cell' style='border:1px solid gray;"+bRight+"text-align:center;float:left;'>"+json.RECORD_DATA.QUAL[i].RESULT_QUAL[j].RESULT_VAL+"</div>";
              var hoverLength = json.RECORD_DATA.QUAL[i].RESULT_QUAL[j].HOVER_QUAL.length;
              if(hoverLength > 0){
                for(var z = 0;z < hoverLength;z++){
                  hovers[prevHour] += "<b>"+json.RECORD_DATA.QUAL[i].RESULT_QUAL[j].HOVER_QUAL[z].EVENT_NAME+":</b> "+json.RECORD_DATA.QUAL[i].RESULT_QUAL[j].HOVER_QUAL[z].RESULT_VAL+" "+json.RECORD_DATA.QUAL[i].RESULT_QUAL[j].HOVER_QUAL[z].UOM+"<br/>";
                }
                cells[prevHour] += "</div>"
              }//end if(hoverLength > 0)
            }//end if(valueCheck(json.RECORD_DATA.QUAL[i].RESULT_QUAL[j].RESULT_VAL) == true)
          }//end if(j == (resultsLength - 1))
        }//end for(var j = 0;j < resultsLength; j++)
        for(var y = 0; y < 24; y++){
          if(hovers[y] > ""){
            cells[y]=[cells[y].slice(0,22)," data-toggle='tooltip' data-placement='top' title='",hovers[y],"'",cells[y].slice(22)].join('');
          }else{
            cells[y] += hovers[y];
          }
        }//end for(var y = 0; y < 24; y++)
        neuroHTML.push(cells.join(""))
			neuroHTML.push("</div>");
      }//end for(var i = 0;i < neuroLength; i++)
    }else{
      neuroHTML.push("No se encontraron resultados");
    }//end if(json.RECORD_DATA.QUAL.length > 0 )
  $('#neuro-body').html(neuroHTML.join("")+"</div>");

  }
  
  function getBalHid(json){
    var IOHTML = [];
    if(json.RECORD_DATA.IN_QUAL.length > 0 || json.RECORD_DATA.OUT_QUAL.length > 0){
		IOHTML.push("<div class='container-fluid'><div class='row flex-nowrap'><div class='col-no-gutter blank'></div>");
      for(var i = 0;i<25;i++){
        var bRight = (i==23)?"":" border-right:none;";
        var mLeft = (i==0)?"margin-left:-10px;":"";
        var hour = i + 8;
        if(hour >= 24){
          hour = hour - 24;
        }
			IOHTML.push("<div class='col-no-gutter cell-hour' style = '",mLeft,bRight,"'>",hour,":00","</div>");
      }
      IOHTML.push("</div>");
      var ioLength = json.RECORD_DATA.IN_QUAL.length;
    IOHTML.push("<div class='row flex-nowrap'><div class='col-no-gutter main-title-lg'><b>Entradas</b></div>");
      var in_totals = new Array();
      for(var j = 0; j < 24;j++){
          var bRight = (j==23)?"":" border-right:none;";
          var mLeft = (j==0)?"margin-left:2px;":"";
				IOHTML.push("<div class='col-no-gutter cell' id = 'totalIN"+j+"' style = '"+bRight+"'>&nbsp;</div>");
          in_totals[j] = 0;
      }
		IOHTML.push("<div class='col-no-gutter' align-self-end'><button class='btn btn-sm float-right' type='button' data-toggle='collapse' data-target='#intakeSub' aria-expanded='false' aria-controls='intakeSub' style='margin-left:10px;'>+</button></div></div>");
      IOHTML.push("<div class='collpase' id = 'intakeSub'><div class='card card-body'>"); 
  
      for(var i = 0;i < ioLength;i++){
        var uom = [];
        if(json.RECORD_DATA.IN_QUAL[i].DAY_QUAL[0].UOM != "DND"){
          uom.push(" (",json.RECORD_DATA.IN_QUAL[i].DAY_QUAL[0].UOM,")");
        }
			IOHTML.push("<div class='row flex-nowrap'><div class='col-no-gutter sub-titles'>",json.RECORD_DATA.IN_QUAL[i].DISPLAY,uom.join(""),"</div>");
        var cells = new Array();
        for(var j = 0; j < 24;j++){
          var bRight = (j==23)?"":" border-right:none;";
				cells.push("<div class='col-no-gutter sub-cell' style='"+bRight+"'>&nbsp;</div>");
        }
        var resultLength = json.RECORD_DATA.IN_QUAL[i].DAY_QUAL.length;
        for(var j = 0;j < resultLength;j++){
            var resultDate = new Date();
            resultDate.setISO8601(json.RECORD_DATA.IN_QUAL[i].DAY_QUAL[j].IO_DT_EVAL);
            var hour = resultDate.getHours() - 8;
            if(hour < 0){
              hour = hour + 24
            }
            if(j == 0){
              var prevHour = hour;
              var hourTotal = 0;
            }
            if(prevHour == hour){
              hourTotal = hourTotal + Number(json.RECORD_DATA.IN_QUAL[i].DAY_QUAL[j].TOTAL.replace(",","."));
            }else{
              var bRight = (prevHour==23)?"":" border-right:none;";
						cells[prevHour] = "<div class='col-no-gutter sub-cell' style='"+bRight+"'>"+hourTotal.toFixed()+"</div>";
              in_totals[prevHour] = in_totals[prevHour] + hourTotal;
              prevHour = hour;
              hourTotal = Number(json.RECORD_DATA.IN_QUAL[i].DAY_QUAL[j].TOTAL.replace(",","."));
            }
            if(j == (resultLength - 1)){
              var bRight = (prevHour==23)?"":" border-right:none;";
              in_totals[prevHour] = in_totals[prevHour] + hourTotal;
						cells[prevHour] = "<div class='col-no-gutter sub-cell' style='"+bRight+"'>"+hourTotal.toFixed()+"</div>";
            }
          }//end for(var j = 0;j < resultLength; j++)   
        IOHTML.push(cells.join(""));
        IOHTML.push("</div>");
      }//end for(var i = 0;i < ioLength; i++) 
		IOHTML.push("<div class='row flex-nowrap'><div class='col-no-gutter sub-titles-lg'>Entradas acumuladas</div>");
      for(var j = 0; j < 24;j++){
        var bRight = (j==23)?"":" border-right:none;";
			IOHTML.push("<div id ='entradas"+j+"' class='col-no-gutter sub-cell' style = '"+bRight+"'>&nbsp;</div>");
      }
      IOHTML.push("</div></div></div></div>");
  
      var ioLength = json.RECORD_DATA.OUT_QUAL.length;
    IOHTML.push("<div class='container-fluid'><div class='row flex-nowrap'><div class='col-no-gutter main-title-lg'><b>Salidas</b></div>");
      var out_totals = new Array();
      //INICIO-CODIGO-MODIFICADO-IVAN
      var diuresis = new Array();
      var drenajes = new Array(); //CRQ000000471396 - 20032017 Drenajes
      //FIN-CODIGO-MODIFICADO-IVAN
  
      for(var j = 0; j < 24;j++){
        var bRight = (j==23)?"":" border-right:none;";
			IOHTML.push("<div id ='totalOUT"+j+"' class='col-no-gutter cell' style = '"+bRight+"'>&nbsp;</div>");
        out_totals[j] = 0;
        //INICIO-CODIGO-MODIFICADO-IVAN
        diuresis[j] = 0;
        //FIN-CODIGO-MODIFICADO-IVAN
        drenajes[j] = 0; //CRQ000000471396 - 20032017 Drenajes
      }//end for(var j = 0; j < 24;j++)
  
		IOHTML.push("<div class='col-no-gutter' align-self-end'><button class='btn btn-sm float-right' type='button' data-toggle='collapse' data-target='#outputSub' aria-expanded='false' aria-controls='outputSub' style='margin-left:10px;'>+</button></div></div>");
      IOHTML.push("<div class='collpase' id = 'outputSub'><div class='card card-body'>");
  
      for(var i = 0;i < ioLength;i++){
        var uom = [];
        if(json.RECORD_DATA.OUT_QUAL[i].DAY_QUAL[0].UOM != "DND"){
          uom.push(" (",json.RECORD_DATA.OUT_QUAL[i].DAY_QUAL[0].UOM,")");
        }
			IOHTML.push("<div class='row flex-nowrap'><div class='col-no-gutter sub-titles'>",json.RECORD_DATA.OUT_QUAL[i].DISPLAY,uom.join(""),"</div>");
        var cells = new Array();
        for(var j = 0; j < 24;j++){
          var bRight = (j==23)?"":" border-right:none;";
				cells.push("<div class='col-no-gutter sub-cell' style = '"+bRight+"'>&nbsp;</div>");
        }
        var resultLength = json.RECORD_DATA.OUT_QUAL[i].DAY_QUAL.length;
        for(var j = 0;j < resultLength;j++){
          var resultDate = new Date();
          resultDate.setISO8601(json.RECORD_DATA.OUT_QUAL[i].DAY_QUAL[j].IO_DT_EVAL);
          var hour = resultDate.getHours() - 8;
          if(hour < 0){
            hour = hour + 24
          }
          if(j == 0){
            var prevHour = hour;
            var hourTotal = 0;
          }
          if(prevHour == hour){
            //INC000002226497 - 11052017 No sumar el acumulado individual por drenaje de la misma hora
            if (json.RECORD_DATA.OUT_QUAL[i].EVENT_CD == 0){
              hourTotal = Number(json.RECORD_DATA.OUT_QUAL[i].DAY_QUAL[j].TOTAL.replace(",","."));
            //CRQ000000508090 - 08032018 No sumar las fugas y características líquido drenado porque son string
            }else if (json.RECORD_DATA.OUT_QUAL[i].EVENT_CD == 51754327 //Fugas
              || json.RECORD_DATA.OUT_QUAL[i].EVENT_CD == 37827196){  //Características líquido drenado
              hourTotal = json.RECORD_DATA.OUT_QUAL[i].DAY_QUAL[j].TOTAL;
            }else{
              hourTotal = hourTotal + Number(json.RECORD_DATA.OUT_QUAL[i].DAY_QUAL[j].TOTAL.replace(",","."));
            }
          }else{ //if(prevHour == hour){
            var bRight = (prevHour==23)?"":" border-right:none;";
            //CRQ000000508090 - 08032018 La función hourTotal.toFixed() falla si hourTotal es un string como es el caso de fugas y características líquido drenado
            if (json.RECORD_DATA.OUT_QUAL[i].EVENT_CD == 51754327 //Fugas
              || json.RECORD_DATA.OUT_QUAL[i].EVENT_CD == 37827196){ //Características líquido drenado
						cells[prevHour] = "<div class='col-no-gutter sub-cell' style = '"+bRight+"'>"+hourTotal+"</div>";
            }else{
						cells[prevHour] = "<div class='col-no-gutter sub-cell' style = '"+bRight+"'>"+hourTotal.toFixed()+"</div>";
            }
            //CRQ000000471396 - 24032017 No sumo para salidas acumuladas los valores de los acumulados de drenajes 24h
            //CRQ000000508090 - 08032018 También excluyo las fugas y características líquido drenado porque son string
            if (json.RECORD_DATA.OUT_QUAL[i].EVENT_CD > 0 //Acumulado-Dranaje
              && json.RECORD_DATA.OUT_QUAL[i].EVENT_CD != 51754327 //Fugas
              && json.RECORD_DATA.OUT_QUAL[i].EVENT_CD != 37827196){ //Características líquido drenado
              out_totals[prevHour] = out_totals[prevHour] + hourTotal;
            }
            //INICIO-CODIGO-MODIFICADO-IVAN
            if (json.RECORD_DATA.OUT_QUAL[i].DISPLAY.substr(0,8).toLowerCase()=="diuresis"){
              diuresis[prevHour] = diuresis[prevHour] + hourTotal;
            }
            //FIN-CODIGO-MODIFICADO-IVAN
            //CRQ000000471396 - 20032017 Drenajes
            if (json.RECORD_DATA.OUT_QUAL[i].EVENT_CD == 34555444) //Evacuacion
            {
              drenajes[prevHour] = drenajes[prevHour] + hourTotal;
            }
            prevHour = hour;
            //CRQ000000508090 - 08032018 Las fugas y características líquido drenado porque son string
            //hourTotal = Number(json.RECORD_DATA.OUT_QUAL[i].DAY_QUAL[j].TOTAL.replace(",","."));
            if (json.RECORD_DATA.OUT_QUAL[i].EVENT_CD == 51754327 //Fugas
              || json.RECORD_DATA.OUT_QUAL[i].EVENT_CD == 37827196){ //Características líquido drenado
              hourTotal = json.RECORD_DATA.OUT_QUAL[i].DAY_QUAL[j].TOTAL;
            }else{
              hourTotal = Number(json.RECORD_DATA.OUT_QUAL[i].DAY_QUAL[j].TOTAL.replace(",","."));
            }
          }//end if(prevHour == hour)
          if(j == (resultLength - 1)){
            var bRight = (prevHour==23)?"":" border-right:none;";
            //CRQ000000508090 - 08032018 La función hourTotal.toFixed() falla si hourTotal es un string como es el caso de fugas y características líquido drenado
            if (json.RECORD_DATA.OUT_QUAL[i].EVENT_CD == 51754327 //Fugas
              || json.RECORD_DATA.OUT_QUAL[i].EVENT_CD == 37827196){ //Características líquido drenado
						cells[prevHour] = "<div class='col-no-gutter sub-cell' style = '"+bRight+"'>"+hourTotal+"</div>";
            }else{
						cells[prevHour] = "<div class='col-no-gutter sub-cell' style = '"+bRight+"'>"+hourTotal.toFixed()+"</div>";
            }
            //INICIO-CODIGO-MODIFICADO-IVAN
            if (json.RECORD_DATA.OUT_QUAL[i].DISPLAY.substr(0,8).toLowerCase()=="diuresis"){
              diuresis[prevHour] = diuresis[prevHour] + hourTotal;
            }
            //FIN-CODIGO-MODIFICADO-IVAN
            //CRQ000000471396 - 20032017 Drenajes
            if (json.RECORD_DATA.OUT_QUAL[i].EVENT_CD == 34555444) //Evacuacion
            {
              drenajes[prevHour] = drenajes[prevHour] + hourTotal;
            }
            //CRQ000000471396 - 24032017 No sumo para salidas acumuladas los valores de los acumulados de drenajes 24h
            //CRQ000000508090 - 08032018 También excluyo las fugas y características líquido drenado porque son texto
            if (json.RECORD_DATA.OUT_QUAL[i].EVENT_CD > 0 //Acumulado-Dranaje
              && json.RECORD_DATA.OUT_QUAL[i].EVENT_CD != 51754327 //Fugas
              && json.RECORD_DATA.OUT_QUAL[i].EVENT_CD != 37827196){ //Características líquido drenado
              out_totals[prevHour] = out_totals[prevHour] + hourTotal;
            }
          }//end if(j == (resultLength - 1))
        }//end for(var j = 0;j < resultLength; j++)
        IOHTML.push(cells.join(""))
      }//end for(var i = 0;i < ioLength; i++)
		IOHTML.push("</div><div class='row flex-nowrap'><div class='col-no-gutter sub-titles-lg'>Diuresis acumulada</div>");
      for(var j = 0; j < 24;j++){
        var bRight = (j==23)?"":" border-right:none;";
			IOHTML.push("<div id ='diuresis"+j+"' class='col-no-gutter sub-cell' style = '"+bRight+"'>&nbsp;</div>");
      }
      IOHTML.push("</div>");
      //CRQ000000471396 - 20032017 Drenajes acumulado
		IOHTML.push("<div class='row flex-nowrap'><div class='col-no-gutter sub-titles-lg'>Drenajes acumulados</div>");
      for(var j = 0; j < 24;j++){
        var bRight = (j==23)?"":" border-right:none;";
			IOHTML.push("<div id ='drenajes"+j+"' class='col-no-gutter sub-cell' style = '"+bRight+"'>&nbsp;</div>");
      }
      IOHTML.push("</div>");
		IOHTML.push("<div class='row flex-nowrap'><div class='col-no-gutter sub-titles-lg'>Salidas acumuladas</div>");
      for(var j = 0; j < 24;j++){
        var bRight = (j==23)?"":" border-right:none;";
			IOHTML.push("<div id ='salidas"+j+"' class='col-no-gutter sub-cell' style='"+bRight+"'>&nbsp;</div>");
      } 
      IOHTML.push("</div></div></div></div>");
  
		IOHTML.push("<div class='container-fluid'><div class='row flex-nowrap'><div class='col-no-gutter main-title-lg'><b>Balance</b></div><div class='col-no-gutter blank-lg'></div>");
		IOHTML.push("<div class='col-no-gutter' align-self-end'><button class='btn btn-sm float-right' type='button' data-toggle='collapse' data-target='#balance' aria-expanded='false' aria-controls='balance' style='margin-left:10px;'>+</button></div></div>");
      IOHTML.push("<div class='collpase' id = 'balance'><div class='card card-body'>"); 
		IOHTML.push("<div class='row flex-nowrap'><div class='col-no-gutter sub-titles-lg'>Balance</div>");
      for(var j = 0; j < 24;j++){
        var bRight = (j==23)?"":" border-right:none;";
			IOHTML.push("<div id ='totalBAL"+j+"' class='col-no-gutter sub-cell' style = '"+bRight+"'>&nbsp;</div>");
      }
      IOHTML.push("</div>");
		IOHTML.push("<div class='row flex-nowrap'><div class='col-no-gutter sub-titles-lg'>Balance acumulado</div>");
      for(var j = 0; j < 24;j++){
        var bRight = (j==23)?"":" border-right:none;";
			IOHTML.push("<div id ='totalACCUM"+j+"' class='col-no-gutter sub-cell' style = '"+bRight+"'>&nbsp;</div>");
      }
      IOHTML.push("</div>");
      IOHTML.push("</div></div></div>"); 
  
		$('#balanceHidrico-body').html(IOHTML.join("")+"</div>");

      var accumBalance = 0;
      var balance = 0;
      //INICIO-CODIGO-MODIFICADO-IVAN
      var entradas=0;
      var salidas=0;
      var diuresis_t=0;
      //FIN-CODIGO-MODIFICADO-IVAN
      var drenajes_t=0; //CRQ000000471396 - 20032017 Drenajes
      for(var x = 0;x < 24;x++){
        if(in_totals[x] != 0){
          document.getElementById("totalIN"+x).innerHTML = in_totals[x].toFixed();
        }
        if(out_totals[x] != 0){
          document.getElementById("totalOUT"+x).innerHTML = out_totals[x].toFixed();
        }
        if(in_totals[x] > 0 || out_totals[x] > 0){
          balance = in_totals[x] - out_totals[x];
          //INICIO-CODIGO-MODIFICADO-IVAN
          entradas = entradas + in_totals[x];
          salidas = salidas + out_totals[x];
          diuresis_t = diuresis_t + diuresis[x];
          drenajes_t = drenajes_t + drenajes[x]; //CRQ000000471396 - 20032017 Drenajes
          document.getElementById("entradas"+x).innerHTML = entradas.toFixed();
          document.getElementById("salidas"+x).innerHTML = salidas.toFixed();
          document.getElementById("diuresis"+x).innerHTML = diuresis_t.toFixed();
          document.getElementById("drenajes"+x).innerHTML = drenajes_t.toFixed();
          document.getElementById("totalBAL"+x).innerHTML = balance.toFixed();
          accumBalance = accumBalance + (in_totals[x]- out_totals[x]);
          document.getElementById("totalACCUM"+x).innerHTML = accumBalance.toFixed();
          //FIN-CODIGO-MODIFICADO-IVAN
        }
      }//end for(var x = 0;x < 24;x++)
    }else{
      IOHTML.push("No se encontraron resultados");
		$('#balanceHidrico-body').html(IOHTML.join("")+"</div>");

    }//end if(json.RECORD_DATA.IN_QUAL.length > 0 || json.RECORD_DATA.OUT_QUAL.length > 0)
  }
  
  function getMedicacion(json){
    var medsHTML = [];
    //create the time headers
    if(json.RECORD_DATA.QUAL.length > 0){
      //INICIO-CODIGO-MODIFICADO-IVAN
		medsHTML.push("<div class='container-fluid'><div class='row flex-nowrap'><div class='col-no-gutter blank'>");
		medsHTML.push("<div class='col-no-gutter leyenda' id='admin'>admin</div>");//verde
		medsHTML.push("<div class='col-no-gutter leyenda' id='perdidas'>perdidas</div>");//rojo
		medsHTML.push("<div class='col-no-gutter leyenda' id='atrasado'>atrasado</div>")//gris
		medsHTML.push("<div class='col-no-gutter leyenda' id='futura'>futura</div>"); //azul
      medsHTML.push("</div>");
  
      var fecha_i_cal = new Date(initDate.getFullYear(),initDate.getMonth(),initDate.getDate(),8,0);
      var fecha_f_cal = new Date(initDate.getFullYear(),initDate.getMonth(),initDate.getDate()+1,19,59);
      //Controlar el cambio de dia para mostrar datos entre las 00:00 y 08:00. INC000002211154
      if(initDate.getHours() < 8){
        fecha_i_cal = new Date(initDate.getFullYear(),initDate.getMonth(),initDate.getDate()-1,8,0);
        fecha_f_cal = new Date(initDate.getFullYear(),initDate.getMonth(),initDate.getDate(),19,59);
      }
      //FIN-CODIGO-MODIFICADO-IVAN
      for(var i = 0; i < 25; i++){
        var bRight = (i == 23)?"":" border-right:none;";
        var hour = i + 8;
          if(hour >= 24){
          hour = hour - 24;
        }
			medsHTML.push("<div class='col-no-gutter cell-hour' style = '",bRight,"'>",hour,":00","</div>");
      }
      medsHTML.push("</div>");
      var medsLength = json.RECORD_DATA.QUAL.length;
      //loop through each med
      for(var i = 0; i < medsLength; i++){
        //INICIO-CODIGO-MODIFICADO-IVAN
        //Calcula las fechas de inicio e interrupcion del farmaco de modo que si la fecha inicial y final no esta en el rango de visualizacion el farmaco no se muestra
        var fecha_i_f = convertir_fecha(json.RECORD_DATA.QUAL[i].STARTDT);
        var fecha_f_f = convertir_fecha(json.RECORD_DATA.QUAL[i].STOPDT);
        var verdad_fi;
        var verdad_ff;
        if (fecha_i_f <= fecha_f_cal){verdad_fi = true;}else{verdad_fi = false;}
        if (fecha_f_f >= fecha_i_cal || isNaN(fecha_f_f)){verdad_ff = true;}else{verdad_ff = false;}
        var verdad = verdad_fi && verdad_ff;
  
        if (verdad){
          medsHTML.push("<div class='row flex-nowrap'>");
				medsHTML.push("<div class='col-no-gutter titles' id='med'>",json.RECORD_DATA.QUAL[i].ORDERED_AS,"</div>");
          //FIN-CODIGO-MODIFICADO-IVAN
          var cells = new Array();
          var contenido = new Array();
          var tip = new Array();
          var color = new Array();
          var ritmo = new Array();
          for(var j = 0; j < 24; j++){
            var bRight = (j == 23) ? "" : " border-right:none;";
					cells.push("<div class='col-no-gutter cell' style = '" + bRight + "'>&nbsp;</div>");
          }
          var taskLength = json.RECORD_DATA.QUAL[i].TSKQUAL.length;
          var adminLength = json.RECORD_DATA.QUAL[i].ADMQUAL.length;
  
          //Recorre las dosis administradas
          var cuad=0;
          for(var j = 0; j < adminLength; j++){
            //Controlar el cambio de dia para mostrar datos entre las 00:00 y 08:00. INC000002211154
            if(initDate.getHours() < 8){
              cuad = cuadrante(initDate.getDate()-1,json.RECORD_DATA.QUAL[i].ADMQUAL[j].ADMINDT);
            }else{
              cuad = cuadrante(initDate.getDate(),json.RECORD_DATA.QUAL[i].ADMQUAL[j].ADMINDT);
            }
  
            if (ritmo[cuad] == undefined){ritmo[cuad] = false;}
            if (tip[cuad] == undefined){tip[cuad] = "<b><u>Cambios en la administracion:</u></b><br/>";}
            color[cuad] = (json.RECORD_DATA.QUAL[i].ADMQUAL[j].MISSED == 1)?"background-color: rgb(209,181,181);":"background-color: rgb(146,190,139);";
            if(json.RECORD_DATA.QUAL[i].ADMQUAL[j].ADMINDOSE > 0 && json.RECORD_DATA.QUAL[i].ADMQUAL[j].ADMINUNIT != "ml"){
                contenido[cuad] = json.RECORD_DATA.QUAL[i].ADMQUAL[j].ADMINDOSE;
                tip[cuad] = tip[cuad]+"Dosis administrada: "+json.RECORD_DATA.QUAL[i].ADMQUAL[j].ADMINDOSE+" "+json.RECORD_DATA.QUAL[i].ADMQUAL[j].ADMINUNIT+" ("+json.RECORD_DATA.QUAL[i].ADMQUAL[j].ADMINDT+")<br/>";
              }
            if (json.RECORD_DATA.QUAL[i].ADMQUAL[j].ADMINDOSE > 0 && json.RECORD_DATA.QUAL[i].ADMQUAL[j].ADMINUNIT == "ml" && contenido[cuad] == undefined){
              contenido[cuad] = json.RECORD_DATA.QUAL[i].ADMQUAL[j].ADMINDOSE;
              tip[cuad] = tip[cuad]+"Volumen administrado: "+json.RECORD_DATA.QUAL[i].ADMQUAL[j].ADMINDOSE+" "+json.RECORD_DATA.QUAL[i].ADMQUAL[j].ADMINUNIT+" ("+json.RECORD_DATA.QUAL[i].ADMQUAL[j].ADMINDT+")<br/>";
            }
          }//end for(var j = 0;j < adminLength; j++)
  
          //Recorre las dosis pautadas
          var inicio = true;
          for(var j = 0; j < taskLength; j++){
            //Controlar el cambio de dia para mostrar datos entre las 00:00 y 08:00. INC000002211154
            if(initDate.getHours() < 8){
              cuad = cuadrante(initDate.getDate()-1,json.RECORD_DATA.QUAL[i].TSKQUAL[j].TASKDT);
            }else{
              cuad = cuadrante(initDate.getDate(),json.RECORD_DATA.QUAL[i].TSKQUAL[j].TASKDT);
            }
            if (tip[cuad] == undefined){tip[cuad] = "";}
            if (inicio == true){tip[cuad] = tip[cuad] + "<b><u>Dosis pautadas:</u></b><br/>"; inicio = false;}
            color[cuad] = (json.RECORD_DATA.QUAL[i].TSKQUAL[j].TASKCDF == "OVERDUE")?"background-color: rgb(221,221,221)":"background-color: rgb(140,168,251)";
            if (json.RECORD_DATA.QUAL[i].STRENGTH_DOSE == ""){
              contenido[cuad] = json.RECORD_DATA.QUAL[i].VOLUME_DOSE;
              tip[cuad] = tip[cuad] + json.RECORD_DATA.QUAL[i].VOLUME_DOSE + " " + json.RECORD_DATA.QUAL[i].VOLUME_UNIT + " (" + json.RECORD_DATA.QUAL[i].TSKQUAL[j].TASKDT + ")<br/>";
            }else{
              contenido[cuad] = json.RECORD_DATA.QUAL[i].STRENGTH_DOSE;
              tip[cuad] = tip[cuad] + json.RECORD_DATA.QUAL[i].STRENGTH_DOSE + " " + json.RECORD_DATA.QUAL[i].STRENGTH_UNIT + " (" + json.RECORD_DATA.QUAL[i].TSKQUAL[j].TASKDT + ")<br/>";
            }
          }//end for(var j = 0;j < taskLength; j++)
          //Dibuja la tabla
          for(var j = 0; j < 24; j++){
            var contenido_texto = "";
            var tip_texto = "";
            var color_texto = "";
            if (contenido[j] != undefined){contenido_texto = contenido[j];}
            if (tip[j] != undefined){tip_texto = "<b><u>" + json.RECORD_DATA.QUAL[i].MEDNAME + "</u></b><br/>" + tip[j];}
            if (color[j] != undefined){color_texto = color[j];}
					cells[j] = "<div class='col-no-gutter cell' data-toggle='tooltip' data-placement='top' title='"+tip_texto+"' style = '"+bRight+color_texto+"'>" + contenido_texto + "</div>";
             //+ tip_texto;
          }//end for(var j = 0; j < 24;j++)
          medsHTML.push(cells.join(""))
          medsHTML.push("</div>");
        }//end if (verdad)
      }//end for(var i = 0;i < medsLength; i++)
    }else{
      medsHTML.push("No se encontraron resultados");
    }//end if(json.RECORD_DATA.QUAL.length > 0)

	$('#medicacion-body').html(medsHTML.join("")+"</div>");
  
    $(function(){
      $('[data-toggle="tooltip"]').tooltip({html:true})
    })
  }
  
  function timeline(codigo, seq, display, yValor, xValor, unidades, show){
    this.codigo=codigo;
    this.seq=seq;
    this.display=display;
    this.yValor=yValor;
    this.xValor=xValor;
    this.unidades=unidades;
    this.show_ind=show
  }

  function makeCollapse(target, id, title,card_body){
    var htmlArray = [];
    htmlArray.push('<div class="card">');
    htmlArray.push('<div class="card-header" id='+id+'>');
    htmlArray.push('<h6 class="mb-0">');
    htmlArray.push('<button class="btn btn-link" type="button" data-toggle="collapse" data-target="#'+target+'" aria-expanded="true" aria-controls="collapseOne">');
    htmlArray.push(title,'</button></h6></div>');
    htmlArray.push('<div id="'+target+'" class="collapse show" aria-labelledby="'+id+'" data-parent="#accordion">');
    htmlArray.push('<div class="card-body" id="'+id+'-body">');
    if(card_body!=null)
      htmlArray.push(card_body);
    htmlArray.push('</div>');
    return htmlArray.join("");
  }
  
  function prepareData()
  {
    data.sort(compare);
    console.log(data);

    if(data.length>0){
      var vsData = [], prevSeq = -1, vsSeq = -1, vsShapes = ['filledCircle','filledCircle','filledDiamond','filledCircle','diamond','downVee','upVee','filledCircle'],
      shownSeries = false,shownLabel = false,
      vsColors = [
      'rgb(12,185,206)',//Saturacion
      'rgb(228,26,28)',//Temperatura otica 255,74,0
      'rgb(0,255,0)',//Frecuencia respiratoria
      'rgb(244,164,98)',//FC
      'rgb(0,100,28)',//PVC
      'rgb(228,26,28)',//PAS
      'rgb(228,26,28)',//PAD
      'rgb(16,68,4)',//
      'rgb(0,0,100)',//
      'rgb(0,0,0)'
      ],
      axisColor = [false,false,false,false,false,false];
      for(var i=0;i<data.length;i++)
      {
        var tamano = 4;
    
        if(prevSeq!=data[i].seq)
        {
          var lineInd = true;
          if(data[i].seq === 4){//FC
            var axis = "y3axis";
            axisColor[2] = true;
          }else if(data[i].seq === 1){//Saturacion
            var axis = "y5axis";
            axisColor[4] = true;
          }else if (data[i].seq === 2){ //Temperatura
            var axis = "y2axis";
            axisColor[1] = true;
          }else if (data[i].seq === 5){//PVC
            var axis = "y4axis";
            lineInd = false;
            tamano = 8;
            axisColor[3] = true;
          }else if (data[i].seq === 6 || data[i].seq === 7 || data[i].seq === 8){//TAS-TAD-TAM
            var axis = "yaxis";
            lineInd = false;
            axisColor[0] = true;
          }else if (data[i].seq === 3){//FR
            var axis = "y6axis";
            lineInd = false;
            tamano = 10;
            axisColor[5] = true;
          }
    
          vsData.push([[]]);
          vsSeq++;
          prevSeq = data[i].seq;
    
          if (data[i].show_ind == 1){
            shownSeries = true;
            shownLabel = true;
          }
    
          vsData[vsSeq].push({xaxis:'x2axis',yaxis: axis, minY:parseFloat(data[i].yValor),maxY:parseFloat(data[i].yValor),
          lineWidth:2, showLine: lineInd, show:shownSeries,showLabel:shownLabel,label:data[i].display+data[i].unidades,
          color:vsColors[(parseInt(data[i].seq)-1)%(vsColors.length)],
          markerOptions:{show:true,size:tamano,style:vsShapes[(parseInt(data[i].seq)-1)%(vsShapes.length)], shadow: true},
          pointLabels:{show:false}});
        }
        console.log(vsData);
        vsData[vsSeq][0].push([data[i].xValor,data[i].yValor,data[i].display+data[i].unidades]);
        vsData[vsSeq][1].minY = (vsData[vsSeq][1].minY > parseFloat(data[i].yValor))?parseFloat(data[i].yValor):vsData[vsSeq][1].minY;
        vsData[vsSeq][1].maxY = (vsData[vsSeq][1].maxY < parseFloat(data[i].yValor))?parseFloat(data[i].yValor):vsData[vsSeq][1].maxY;
        vsData[vsSeq][1].seq = data[i].seq;
      }
    
      let dtMin=data[0].xValor;
      let dtMax=data[0].xValor;
    
      for(let i = 0; i<data.length;i++)
      {
        let v = data[i].xValor;
        dtMin = (v<dtMin) ? v : dtMin;
        dtMax = (v>dtMax) ? v : dtMax;
      }
      let endDate=new Date();
      let startDate=new Date();
      endDate.setISO8601(dtMax);
      startDate.setISO8601(dtMin);
    
      inicioEjeX=startDate;
      finEjeX=endDate;
    
      let yAxis = {show:true, min:0, max:250, ticks:[0,25,50,75,100,125,150,175,200,225,250],useSeriesColor: axisColor[0], tickOptions:{fontSize:12, mark:'outside', showGridline:true, formatString:'%#d'}, pad:0};//TAS-TAD
      let y2Axis = {show:true, min:32, max:42, ticks:[32,33,34,35,36,37,38,39,40,41,42],useSeriesColor: axisColor[1],  tickOptions:{fontSize:12, mark:'outside', showGridline:true, formatString:'%#d'}, pad:0};//Temperatura
      let y3Axis = {show:true, min:0, max:220, ticks:[0,22,44,66,88,110,132,154,176,198,220],useSeriesColor: axisColor[2],tickOptions:{fontSize:12, mark:'outside', showGridline:true, formatString:'%#d'}, pad:0};//FC
      let y4Axis = {show:true, min:-20, max:30, ticks:[-15,-10,-5,0,5,10,15,20,25,30,35], useSeriesColor:axisColor[3], tickOptions:{fontSize:12, mark:'outside', showGridline:true, formatString:'%#d'}, pad:0};//PVC
      let y5Axis = {show:true, min:80, max:100, ticks:[80,82,84,86,88,90,92,94,96,98,100],useSeriesColor: axisColor[4],tickOptions:{fontSize:12, mark:'outside', showGridline:true, formatString:'%#d'}, pad:0};//Saturacion
      let y6Axis = {show:true, min: 0, max: 50, ticks:[0,5,10,15,20,25,30,35,40,45,50], useSeriesColor: axisColor[5], tickOptions:{fontSize:12, mark:'outside', showGridline:true, formatString:' %#d'}, pad:0};//FR
      
      let xAxis = {show:true, autoscaleOnZoom:false, useSeriesColor:false, renderer:$.jqplot.DateAxisRenderer, labelRenderer:$.jqplot.CanvasAxisLabelRenderer, tickOptions:{fontSize:12,mark:'outside',showGridline:true}, ticksInterval: '1 day', useDST:false, autoscale:false, pad:1, min:startDate.getTime(), max:endDate.getTime()};
    
      if (vsData.length>0 && vsData[0].length>0){
        gPlots.push(dibujaGrafica('vsGraph','vsSelect','gPlots['+gPlots.length+']',vsData, xAxis, [yAxis, y2Axis, y3Axis, y4Axis, y5Axis, y6Axis]));
      }
    }//if (data.length>0)
   
    searchDemographics();
    searchCateteres();
    searchVentilacion();
    searchHemo();
    searchNeuro();
    searchBalHid();
    searchMedicacion();
  }
  
  function dibujaGrafica(iId, iSelect, assignedTo, iDataSeries, iXAxisObj, iYAxisObj)
  {
  var tPlot = null, shownData = [], sSeries = [], bSeries = [], bHTML = [], sCnt = 0, oneShown = false;
  bHTML.push("<div class='container-fluid'>");
    for (let i=0;i<iDataSeries.length;i++,sCnt++){
      shownData.push(iDataSeries[i][0]);
      sSeries.push(iDataSeries[i][1]);
      if (iDataSeries[i][1].show)
        oneShown = true;
      if (iSelect && iId) {
        if (iDataSeries[i][1] && iDataSeries[i][1].color && iDataSeries[i][1].markerOptions){
          bSeries.push({size:8,color:iDataSeries[i][1].color,style:iDataSeries[i][1].markerOptions.style});
        }
        bHTML.push("<div class='row flex-nowrap'><div class='col-md-2'><div class='btns'><div onclick=\"selectSeries(this,",10,",",assignedTo,");\" id='");
        bHTML.push(iSelect,"btn_",sCnt);
        bHTML.push("' class='btn ",((iDataSeries[i][1].show)?"series-on":"series-off"),"'>");
        bHTML.push("<canvas class='buttons' id='",iSelect,"canvas_",sCnt,"'></canvas>");
        bHTML.push("</div><span>&nbsp;&nbsp;&nbsp;",iDataSeries[i][1].label,"<span id='minMax",iId,"_",sCnt,"'></span></span></div></div></div>");
      }
    }
  
    bHTML.push("<div class='row'>");
    bHTML.push("<div class='col-sm-9 rangos'><b>Rangos de Normalidad</b></div></div>");
    bHTML.push("<div class='row'>");
    bHTML.push("<div class='col-sm-3 rangos'><input type='radio' id='inicial' name='button' value='inicial' checked='checked' onclick=\"seleccionaRangos(this);\">Inicial</div>");
    bHTML.push("<div class='col-sm-3 rangos'><input type='radio' id='sat' name='button' value='sat' onclick =\"seleccionaRangos(this);\">O2</div>");
    bHTML.push("<div class='col-sm-3 rangos'><input type='radio' id='temp' name='button' value='temp' onclick=\"seleccionaRangos(this);\">Tª</div></div>");
    bHTML.push("<div class='row'>");
    bHTML.push("<div class='col-sm-3 rangos'><input type='radio' id='fr' name='button' value='fr' onclick=\"seleccionaRangos(this);\">FR</div>");
    bHTML.push("<div class='col-sm-3 rangos'><input type='radio' id='fc' name='button' value='fc' onclick=\"seleccionaRangos(this);\">FC</div>");
    bHTML.push("<div class='col-sm-3 rangos'><input type='radio' id='pvc' name='button' value='pvc' onclick=\"seleccionaRangos(this);\">PVC</div></div>");
    bHTML.push("<div class='row'>");
    bHTML.push("<div class='col-sm-3 rangos'><input type='radio' id='tas' name='button' value='tas' onclick=\"seleccionaRangos(this);\">TAS</div>");
    bHTML.push("<div class='col-sm-3 rangos'><input type='radio' id='tad' name='button' value='tad' onclick=\"seleccionaRangos(this);\">TAD</div>");
    bHTML.push("<div class='col-sm-3 rangos'><input type='radio' id='tam' name='button' value='tam' onclick=\"seleccionaRangos(this);\">TAM</div></div>");
  
    if (!oneShown){
      sSeries[0].show = true;
    }
  
    /* create buttons */
    if (iSelect && assignedTo) {
      $("#"+iSelect).html(bHTML.join(""));
      /* adding images to buttons */
      for (var i=0; i < bSeries.length; i++){
        var cObj = document.getElementById(iSelect+"canvas_"+i);
        if (navigator.userAgent.search("MSIE") >= 0)
          G_vmlCanvasManager.initElement(cObj);
        var context = cObj.getContext('2d');
        var bMarker = new $.jqplot.MarkerRenderer(bSeries[i]);
        bMarker.draw(10,12,context,{});
        bMarker.drawLine([0,12],[19,12],context, false, bSeries[i]);
        }
      }
      
    /* plotting graph */
    var opciones= {
      graphName:'chart1',			
      seriesDefaults:{neighborThreshold:0},
      cursor:{
        showTooltip:false
      },
      axes: {
        xaxis:null,
        x2axis:iXAxisObj,
        yaxis:iYAxisObj[0],
        y2axis:iYAxisObj[1],
        y3axis:iYAxisObj[2],
        y4axis:iYAxisObj[3],
        y5axis:iYAxisObj[4],
        y6axis:iYAxisObj[5]
      },
      highlighter: {
        sizeAdjust: 10,
        tooltipAxes: 'yx',
        tooltipLocation: 'nw',
        fadeTooltip: true,
        tooltipFadeSpeed: "slow",
        useAxesFormatters: true,
        formatString: ["<b>%5:</b>&nbsp;%s<br/><b>Fecha/Hora de Resultado:</b>&nbsp;%s%1%2%3%4"].join("")
      },
      legend:{show: false},
      series:sSeries
    };
  
    var arrayRangos=[];
    var rangoNormalidad = new parametro(140,60, 'rgba(228,26,28, 0.4)', 'yaxis','inicial');
    shownData.push(rangoNormalidad.rangoSuperior,rangoNormalidad.rangoInferior);
    sSeries.push(rangoNormalidad.opciones,rangoNormalidad.opciones)	
    
    for(var i=0;i<iDataSeries.length;i++){
      var rango=instanciaRangos(sSeries[i]);
      shownData.push(rango.rangoSuperior,rango.rangoInferior);
      sSeries.push(rango.opciones,rango.opciones);
      arrayRangos.push(rango);
    }
  
    rangos=arrayRangos;
  
    opciones.fillBetween={series1:arrayRangos.length,series2:arrayRangos.length+1,color: "rgba(228,26,28, 0.2)"}
    tPlot = $.jqplot(iId, shownData, opciones);
    auxPlot=tPlot;
  return tPlot;
  }
  
  function parametro(rangoSup, rangoInf, color, ejeY, id)
  {
    this.rangoSuperior = [[inicioEjeX, rangoSup], [finEjeX, rangoSup]];
    this.rangoInferior = [[inicioEjeX, rangoInf], [finEjeX, rangoInf]];
    this.opciones = {xaxis: 'x2axis', yaxis: ejeY, showLine: true, lineWidth:2, show:false, showLabel:false, color:color, markerOptions:{show:false}, pointLabels:{show:false}}
    this.id = id; //Identificador del rango
  }
  
  function instanciaRangos(opciones)
  {
    var rango;
    if(opciones.yaxis=='y5axis'){
      rango = new parametro(100,90,'rgba(12,185,206, 0.4)', 'y5axis','sat'); //Saturacion O2
    }
    else if(opciones.yaxis=='y2axis'){
      rango = new parametro(38,35,'rgba(228,26,28, 0.4)', 'y2axis','temp'); //Temperatura
    }
    else if(opciones.yaxis=='y6axis'){
      rango = new parametro(25,12,'rgba(0,255,0, 0.4)', 'y6axis','fr'); //Frec. respiratoria
    }
    else if(opciones.yaxis=='y3axis'){
      rango = new parametro(120,60,'rgba(244,164,98, 0.4)', 'y3axis','fc'); //Frec. Cardiaca
    }
    else if(opciones.yaxis=='y4axis'){
      rango = new parametro(12,-4,'rgba(0,100,28, 0.4)', 'y4axis','pvc'); //Frec. respiratoria
    }
    else if(opciones.markerOptions.style=='downVee'){
      rango = new parametro(140,90,'rgba(228,26,28, 0.4)', 'yaxis','tas'); //TAS
    }
    else if(opciones.markerOptions.style=='upVee'){
      rango = new parametro(85,50,'rgba(228,26,28, 0.4)', 'yaxis','tad'); //TAD
    } 
    else if((opciones.markerOptions.style=='filledCircle') && (opciones.yaxis=='yaxis')){
      rango = new parametro(80,60,'rgba(151,0,0, 0.4)', 'yaxis','tam'); //TAM
    }
    return rango;
  }
  
  function compare(a,b) {
    if (a.seq < b.seq)
      return -1;
    if (a.seq > b.seq)
      return 1;
    return 0;
  }
  
  function tipo_sonda(evento){
    var tipo="";
    if(evento==33853309||evento==33854426){tipo="Sonda Vesical";}
    if(evento==33854842||evento==33855533){tipo="Sonda Enteral";}
    /*Incluido a raiz de INC000002231350*/
    if(evento==43434437||evento==43434619){tipo="Sonda Incontinencia Fecal";}
    if(evento==16226221||evento==10136104){tipo="Cat.Ven.Periferico";}
    if(evento==16228097||evento==10136110){tipo="Cat.Ven.Cen.Ins.Per.";}
    if(evento==16228187||evento==10136116){tipo="Cat.Ven.Central";}
    if(evento==16225989||evento==10136122){tipo="Cat.Ven.Swan-Ganz";}
    if(evento==42344337||evento==42345723){tipo="Cat.Ven.Mar.Endo.";}
    if(evento==16225280||evento==16225348){tipo="Cat.Arterial";}
    if(evento==16225420||evento==16225513){tipo="Cat.Art.Bal.Con.Int.";}
    if(evento==16198170||evento==16198217){tipo="Cat.Ana.Con.Paravertebral";}
    if(evento==16198257||evento==16198378){tipo="Cat.Ana.Con.Blo.Plexo";}
    if(evento==34302821||evento==34305734){tipo="Cat.Ana.Con.Incisional";}
    if(evento==16204020||evento==16204113){tipo="Cat.Neo.Periferico";}
    if(evento==16204145||evento==16204221){tipo="Cat.Neo.Epicutaneo";}
    if(evento==16204835||evento==16205035){tipo="Cat.Neo.Central";}
    if(evento==16205559||evento==16205634){tipo="Cat.Neo.Umbilical";}
    if(evento==23413842||evento==23414282){tipo="Cat.Intraoseo";}
    if(evento==16197690||evento==10576252){tipo="Cat.Subcutaneo";}
    if(evento==16207606||evento==16202742){tipo="Cat.Epidural";}
    if(evento==14253213||evento==14253253){tipo="Cat.Ventricular";}
    /*Incluido a raiz de INC000002231350*/
    if(evento==34312991||evento==34313344){tipo="Cat.Ventricular";}
    if(evento==34281496||evento==39560741){tipo="Cat.Dial.Hemodialisis";}
    if(evento==34282273||evento==34282512){tipo="Cat.Dial.Peritoneal";}
    if(evento==14253269||evento==14253187){tipo="Cat.Intraparenquimatoso";}
    /*Incluido a raiz de INC000002231350*/
    if(evento==34313528||evento==34313731){tipo="Cat.Intraparenquimatoso";}
    if(evento==34162987||evento==34164581){tipo="Tubo Endotraqueal";}
    return tipo;
  }
  
  function convertir_fecha(fecha){
    var dia = parseInt(fecha.substr(0,2),10);
    var mes = parseInt(fecha.substr(3,2),10)-1;
    var anno = parseInt(fecha.substr(6,4),10);
    var hora = parseInt(fecha.substr(11,2),10);
    var minuto = parseInt(fecha.substr(14,2),10);
    var fecha_m = new Date(anno,mes,dia,hora,minuto);
    return fecha_m;
  }
  
  function sumar_horas_fecha (h, fecha){
    var fecha_m=new Date(fecha.getTime() + (h * 3600 * 1000));
    return fecha_m
  }
  
  function cuadrante(dia_actual,fecha){
    var dia = parseInt(fecha.substr(0,2),10);
    var hora = parseInt(fecha.substr(11,2),10);
    if (dia == dia_actual){
      hora = hora - 8;
      if (hora < 0){hora = 0;}
    }else{
      hora = hora + 16
      if (hora > 24){hora = 24;}
    }
    return hora;
  }
  
  function valueCheck(value){
      if(isNaN(value) == true && value != "+" && value != "-"){
        if(value.length > 5){
          return true;
        }else{
          return false;
        }
      }else{
        return false;
      }
  }

  function addZeros(i){
    if (i < 10) {
      i = "0" + i;
    }
    return i;
  }

//CRQ000000521204 Cálculos en funcón de la fecha seleccionada
//Los datos están almaceados en balanceInfo que se inicializa en la carga de CERN_DEMO_BANNER_O1
//function actualizarDatosBalance(dateString){
function actualizarDatosBalance(fechaBusqueda){
	var bh_ayer_ingresos = 0;
  var bh_ayer_egresos = 0;
  var bh_ayer_total = 0;
  var bh_uci_ingresos = 0;
  var bh_uci_egresos = 0;
  var bh_uci_total = 0;
  var fechaAux = new Date(fechaBusqueda.getTime()); //Creamos nueva fecha con el valor recibido
  fechaAux.setDate(fechaBusqueda.getDate() - 1); //Restamos un día a la fechaBusqueda

  //Creamos la fecha en formato añoMesDia con dos dígitos tanto mes como día para comparar con GRUPO.
  var fechaHoy = parseInt(fechaBusqueda.getYear() + ("0" + (fechaBusqueda.getMonth() + 1)).slice(-2) + ("0" + fechaBusqueda.getDate()).slice(-2));
  var fechaAyer = parseInt(fechaAux.getYear() + ("0" + (fechaAux.getMonth() + 1)).slice(-2) + ("0" + fechaAux.getDate()).slice(-2));

  // Valores del record guardado en balanceInfo
	// <ITEM>
  //  <GRUPO type="STRING" length="8"><![CDATA[20180531]]></GRUPO>
  //  <INGRESO type="INT" value="3236"/>
  //  <EGRESO type="INT" value="1655"/>
  // </ITEM>

  for (var i = 0; i < balanceInfo.length; i++) {
  	if(parseInt(balanceInfo[i].GRUPO) <= fechaHoy){
			bh_uci_ingresos = bh_uci_ingresos + +balanceInfo[i].INGRESO;
			bh_uci_egresos = bh_uci_egresos + +balanceInfo[i].EGRESO;
		}
  	if(parseInt(balanceInfo[i].GRUPO) == fechaAyer){
 			bh_ayer_ingresos = bh_ayer_ingresos + +balanceInfo[i].INGRESO
			bh_ayer_egresos = bh_ayer_egresos + +balanceInfo[i].EGRESO;
		}
  }
  bh_uci_total = bh_uci_ingresos - bh_uci_egresos;
  bh_ayer_total = bh_ayer_ingresos - bh_ayer_egresos;

  //Actualizar valores del DOM. Se visualiza en la barra superior.
  $("#bhAyerIngresos").text(bh_ayer_ingresos + 'ml');
  $("#bhAyerEgresos").text(bh_ayer_egresos + 'ml');
  $("#bhAyerTotal").text(bh_ayer_total + 'ml');

  $("#bhUciIngresos").text(bh_uci_ingresos + 'ml');
  $("#bhUciEgresos").text(bh_uci_egresos + 'ml');
  $("#bhUciTotal").text(bh_uci_total + 'ml');
  $("#bhFechaAyer").text('BH ' + fechaAyer.toString().substr(6,2) + '/' + fechaAyer.toString().substr(4,2) + '/' + fechaAyer.toString().substr(0,4) + ' - Ingresos:');
}

})(window);

/* Helper function for drawChoiceGraph and drawCtrGraph function (onclick event for each button) */
function selectSeries (iBtn, mSelected, plot){
  var p = plot;
  var numSelected = 0;
  for (var i=0;i<p.series.length;i++){
    if (p.series[i].show)
      numSelected++;
  }
  if (p != null){
    if (iBtn != null && iBtn != ""){
      var idSplit = iBtn.id.split("_");
      var index = idSplit[1];
      if (!p.series[index].show && numSelected != mSelected){
        iBtn.className = "btn series-on";
        p.series[index].show = true;
      }
      else if (p.series[index].show){
        iBtn.className = "btn series-off";
        p.series[index].show = false;
      }
    }
      /* updating all graphs so that changes on one graph can be reflected on the others */
      p.redraw();
    }
  return true;
}

function seleccionaRangos (obj)
{
  var numDatos=auxPlot.series.length;
  
  if($(obj).attr('id')=="sat")
  {
    this.dibujaRangos(numDatos,'sat');			
  }
  else if($(obj).attr('id')=="temp")
  {
    this.dibujaRangos(numDatos,'temp');			
  }
  else if($(obj).attr('id')=="fr")
  {
    this.dibujaRangos(numDatos, 'fr');			
  }
  else if($(obj).attr('id')=="fc")
  {
    this.dibujaRangos(numDatos,'fc');			
  }
  else if($(obj).attr('id')=="pvc")
  {
    this.dibujaRangos(numDatos,'pvc');			
  }
  else if($(obj).attr('id')=="tas")
  {
    this.dibujaRangos(numDatos,'tas');			
  }
  else if($(obj).attr('id')=="tad")
  {
    this.dibujaRangos(numDatos,'tad');			
  }
  else if($(obj).attr('id')=="tam")
  {
    this.dibujaRangos(numDatos,'tam');			
  }
  else if($(obj).attr('id')=="inicial")
  {
    this.dibujaRangos(numDatos,'inicial');			
  }
  auxPlot.redraw();
}

function dibujaRangos (datosTotales, id)
{
  for(var i=0;i<rangos.length;i++){
    if(id==rangos[i].id){
      for(var j=0;j<datosTotales-rangos.length*2-2;j++){
        auxPlot.series[j].show=false;
        auxPlot.series[i].show=true;
        auxPlot.fillBetween.series1=rangos.length+i*2+2;
        auxPlot.fillBetween.series2=rangos.length+i*2+3;
        auxPlot.fillBetween.color="rgba(228,26,28, 0.2)";
        auxPlot.fillBetween.fill=true;
      }
      break;
    }
    else if(id=="inicial"){
      for(var j=0;j<rangos.length;j++){
        auxPlot.series[j].show=true;
      }
      auxPlot.fillBetween.series1=rangos.length;
      auxPlot.fillBetween.series2=rangos.length+1;
      auxPlot.fillBetween.color="rgba(228,26,28, 0.2)";
      auxPlot.fillBetween.fill=true;
    }
    else{
      auxPlot.series[i].show=false;	
      auxPlot.fillBetween.fill=false;
    }
  }
}

$(window).resize(function() {
	let plot = auxPlot;
	if (auxPlot){
    auxPlot.destroy();
    auxPlot = plot;
    auxPlot.replot();
  }
});

