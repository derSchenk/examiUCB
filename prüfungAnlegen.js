var Dialogs = require('dialogs');
var dialogs = Dialogs(opts={});
const { jsPDF } = require("jspdf"); // will automatically load the node version
var fs = require('fs');
var feiertagejs = require('feiertagejs');

var $ = require( "jquery" );
var dt      = require( 'datatables.net' )( window, $ );
var buttons = require( 'datatables.net-buttons' )( window, $ );

const Mark = require('mark.js');




const liststudsem = document.querySelector('#liststudsem');
const listanwesen = document.querySelector('#listanwesen');
const buttonAddStudsem = document.querySelector('#buttonaddstudsem');
const inputStudsem = document.querySelector('#inputliststudseminput')
const dataliststudsem = document.querySelector('#dataliststudsem')
const buttonAddAnwesen = document.querySelector('#buttonaddanwesen');
const inputAnwesen = document.querySelector('#inputlistanweseninput');
const datalistanwesen = document.querySelector('#datalistanwesen');
const submitButton = document.querySelector('#buttonAddPruf');

const inputprufname = document.querySelector('#inputlistprufinput');
const inputteilnehmer = document.querySelector('#teilnehmer');
const inputPrufStatus = document.querySelector('#prüfungsstatus');
const inputPrufart = document.querySelector('#prüfungsart');
const inputStandardsemester = document.querySelector('#standardsemester');
const inputStudsemSelect = document.querySelector('#dataliststudsem');
const inputAnwesenSelect = document.querySelector('#datalistanwesen');
const inputBemerkungen = document.querySelector('#bemerkungen');
const inputHilfsmittel = document.querySelector('#hilfsmittel');
const inputpflichtcheck = document.querySelector('#pflichtprufcheck');
const inputDauer = document.querySelector('#Dauer');

const formulare = document.querySelectorAll('.formular')

const inputlöschen = document.querySelector('#löschen')
const alleElemente = document.querySelector('#alleElemente')
const buttonLöschen = document.querySelector('#buttonLöschen')

const bachelor = document.querySelector('#BM');
var prufer = document.querySelector('#verantwortlicher');
const suche = document.querySelector("#suche")

const ausblenden = document.querySelector("#ausblenden")
const prüfungsgruppelist = document.querySelector("#prüfungsgruppelist")
const prüfungsgruppe = document.querySelector("#prüfungsgruppe")
const checkneugroup = document.querySelector("#checkneugroup")
const checkneugroup2 = document.querySelector("#checkpgneu")

const listprufungen = document.querySelector('#listprufungen');
const prufungInput = document.querySelector('#inputlistprufinput2');
const buttonAdd = document.querySelector('#buttonaddpruf');
const datalistPruf = document.querySelector('#datalistpruf');
const prufgroupedit = document.querySelector("#prufgroupedit");
const buttongroupedit = document.querySelector("#buttongroupedit")

//Datenbankverbindung herstellen---------------

  const mysql = require('mysql');
	const db = mysql.createConnection({
			host: "localhost",
			user: "root",
			password: "",
			database: "verwaltungssoftware"
	});

		db.connect(function(err){
			if(err) throw err;
			console.log("Verbindung zur Datenbank hergestellt.")
		});

//----------------------------------------------------------







//Sonstige globale Variablen------------------
var alleStudsems = [];
var alleAnwesen = [];
var primaryKey = "";
var allePrufungen = [];
//--------------------------------------------

//Laden der Vorschläge für die Studsems--------------------
var sql = 'SELECT * FROM studiengangssemester ORDER BY Studiengang, Semesternummer ASC';
db.query(sql, function(err, results){
	if(err) throw err;
	//console.log(results);
  results.forEach(result => {
  	const nOption = document.createElement('option');
  	nOption.value =result["Studiengang"].toLowerCase().trim() +" "+ result["Semesternummer"]+"   ["+result["Studiengangssemester_ID"]+"]";
    alleStudsems.push(result["Studiengang"].toLowerCase().trim() +" "+ result["Semesternummer"]+"   ["+result["Studiengangssemester_ID"]+"]");
  	liststudsem.appendChild(nOption);
  });
});

//-----------------------------------------------------------------
//Laden der Vorschläge für die Anwesende--------------------
var sql = 'SELECT * FROM anwesende ORDER BY Nachname, Vorname ASC';
db.query(sql, function(err, results){
	if(err) throw err;
	//console.log(results);
  results.forEach(result => {
  	const nOption = document.createElement('option');
  	nOption.value = result["Nachname"].toLowerCase().trim()+", "+result["Vorname"].toLowerCase().trim()+" ["+result["Anwesende_ID"]+"]";
    alleAnwesen.push(result["Nachname"].toLowerCase().trim()+", "+result["Vorname"].toLowerCase().trim()+" ["+result["Anwesende_ID"]+"]");
  	listanwesen.appendChild(nOption);
  });
});


function bearbeitePG(e){
  e.preventDefault();
  var checker = false;
  for(prufung of Array.from(datalistPruf.children)){

    if(prufung.selected){
      checker = true;
      break;
    }
  }

  if(prufgroupedit.value.trim() === ""){
    dialogs.alert("Bezeichnung der Prüfung darf nicht leer sein.")
    return
  }
  if(checkneugroup2.checked){
    if(datalistPruf.children.length > 0 && checker){
      console.log("so soll es sein")
      sql = "INSERT INTO prufungsgruppe (Bezeichnung) VALUES ('"+prufgroupedit.value.trim().toLowerCase()+"')"
      db.query(sql, function(err, results){
      	if(err) throw err;
        var prufungen = datalistPruf.children;
        Array.from(prufungen).forEach(prufung =>{
          if(prufung.selected){
            var sql2 = "UPDATE prufungen SET Prufungsgruppen_ID = '"+results["insertId"]+"' WHERE Prufung_ID = '"+extractID2(prufung)+"'"
            db.query(sql2, function(err, results){
            	if(err) throw err;
              var sql098 = "DELETE FROM prufungsgruppe WHERE Prufungsgruppen_ID NOT IN (SELECT Prufungsgruppen_ID FROM prufungen WHERE Prufungsgruppen_ID IS NOT NULL)"
              db.query(sql098, function(err, results){
                console.log(results)
                if(err) throw err;
              })
            })
          }
        })
        dialogs.alert("Prüfungsgruppe erfolgreich hinzugefügt. Lade Seite neu...");
        setTimeout(() => {
          location.reload();
        }, 2000);
      });
    }else dialogs.alert("Es muss mindestens eine Prüfung zur neuen Gruppe hinzugefügt werden. Keine Eintragung vorgenommen")
  }else{
        var prufungen = datalistPruf.children;
        Array.from(prufungen).forEach(prufung =>{
          if(prufung.selected){
            var sql2 = "UPDATE prufungen SET Prufungsgruppen_ID = '"+extractID(prufgroupedit.value)+"' WHERE Prufung_ID = '"+extractID2(prufung)+"'"
            db.query(sql2, function(err, results){
            	if(err) throw err;
              var sql098 = "DELETE FROM prufungsgruppe WHERE Prufungsgruppen_ID NOT IN (SELECT Prufungsgruppen_ID FROM prufungen WHERE Prufungsgruppen_ID IS NOT NULL)"
              db.query(sql098, function(err, results){
                console.log(results)
                if(err) throw err;
              })
            })
          }else {
            var sql2 = "UPDATE prufungen SET Prufungsgruppen_ID = NULL WHERE Prufung_ID = '"+extractID2(prufung)+"'"
            db.query(sql2, function(err, results){
            	if(err) throw err;
              var sql098 = "DELETE FROM prufungsgruppe WHERE Prufungsgruppen_ID NOT IN (SELECT Prufungsgruppen_ID FROM prufungen WHERE Prufungsgruppen_ID IS NOT NULL)"
              db.query(sql098, function(err, results){
                console.log(results)
                if(err) throw err;
              })
            })
          }
        })
        dialogs.alert("Prüfungsgruppe erfolgreich hinzugefügt/geändert. Lade Seite neu...");
        setTimeout(() => {
          location.reload();
        }, 2000);
      // });
  }

}
buttongroupedit.addEventListener("click", bearbeitePG)

//-----------------------------------------------------------------

function addPrufung(e) {
  e.preventDefault();
  var eingabe = prufungInput.value;
  var checker = true;
  var vorhanden = datalistPruf.children;
  if (vorhanden.length > 0) {
    Array.from(vorhanden).forEach(function(item) {
      if (item.value.localeCompare(eingabe) == 0) {
        checker = false;
      }
    });
  }
  console.log(prufungInput)
  if (checker == true && eingabe.length > 0 && allePrufungen.includes(eingabe)) {
    const neueOption = document.createElement('option');
    neueOption.value = eingabe;
    neueOption.selected = true;
    const neuerText = document.createTextNode(eingabe);
    neueOption.appendChild(neuerText);
    datalistPruf.appendChild(neueOption);
    }
  prufungInput.value = "";
}
buttonAdd.addEventListener('click', addPrufung, false);








function addprufgroup(e){
    e.preventDefault()

    while(datalistPruf.firstChild){
      datalistPruf.firstChild.remove();
    }

    sql = "SELECT * FROM prufungen WHERE Prufungsgruppen_ID = '"+extractID(prufgroupedit.value)+"'"
  db.query(sql, function(err, results) {
    if (err) throw err;
    console.log(results)
    results.forEach(result => {
      if(result["Prüfungsart"] !== "Hausarbeit"){
        var inhalt = result["Prufung_Name"].toLowerCase().trim() + " | " + result["Standardsemester"] + " | " + result["Prüfungsstatus"] + " [T.: " + result["Teilnehmerzahl"] + "]" + " [D.: " + result["Dauer"] + "]" + " [ID.: " + result["Prufung_ID"] + "]" + " [PP.: " + (result["Pflichtprüfung"] === 1 ? "J" : "N") + "]";
        var vorhanden = datalistPruf.children;
        var checker = true;
        if (vorhanden.length > 0) {
          Array.from(vorhanden).forEach(function(item) {
            if (item.value.localeCompare(inhalt) == 0) {
              checker = false;
            }
          });
        }

        if (checker === true) {
          const neueOption = document.createElement('option');
          neueOption.value = inhalt;
          neueOption.selected = true;
          const neuerText = document.createTextNode(inhalt);
          neueOption.appendChild(neuerText);
          datalistPruf.appendChild(neueOption);
        }
      }
    });
  });
}
prufgroupedit.addEventListener('change', addprufgroup )
prufgroupedit.addEventListener('focus', emptyinput);


function emptyinput(e){
  e.preventDefault()
  e.target.value = "";
}











//Verschieben Studsem von Input zu Select--------------------------

function addStudsem(e){
	e.preventDefault();
	var eingabe = inputStudsem.value;
	eingabe = eingabe.trim().toLowerCase();

	var checker = true;
	var vorhanden = dataliststudsem.children;
    if(vorhanden.length > 0){
		Array.from(vorhanden).forEach(function(item){
			if(item.value.localeCompare(eingabe)==0){
				checker = false;
			}
		});
	}

	if(checker==true && eingabe.length > 0 && alleStudsems.includes(eingabe)){
		const neueOption = document.createElement('option');
		neueOption.value = eingabe;
		neueOption.selected = true;
		const neuerText = document.createTextNode(eingabe);
		neueOption.appendChild(neuerText);
		dataliststudsem.appendChild(neueOption);
	}
	inputStudsem.value = "";
}

buttonAddStudsem.addEventListener('click', addStudsem, false);

//------------------------------------------------------------------------
//laden der Prüfungsgruppen

function loadgroups(){
  const sql = "SELECT * FROM prufungsgruppe"
  db.query(sql, function(err, results){
    if(err) throw err;
    results.forEach(result => {
    	const nOption = document.createElement('option');
    	nOption.value = result["Bezeichnung"].toLowerCase().trim()+" ["+result["Prufungsgruppen_ID"]+"]";
    	prüfungsgruppelist.appendChild(nOption);
    });
  })
}
loadgroups();

function ladePrufungen(){
  prufungInput.value = "";
  var sql = 'SELECT * FROM prufungen WHERE prufungen.Prufungsgruppen_ID IS NULL';
  db.query(sql, function(err, results) {
    if (err) throw err;
    //console.log(results);
    results.forEach(result => {
      if(result["Prüfungsart"] !== "Hausarbeit"){
        const nOption = document.createElement('option');
        var inhalt = result["Prufung_Name"].toLowerCase().trim() + " | " + result["Standardsemester"] + " | " + result["Prüfungsstatus"] + " [T.: " + result["Teilnehmerzahl"] + "]" + " [D.: " + result["Dauer"] + "]" + " [ID.: " + result["Prufung_ID"] + "]" + " [PP.: " + (result["Pflichtprüfung"] === 1 ? "J" : "N") + "]";
        nOption.value = inhalt;
        allePrufungen.push(inhalt);
        listprufungen.appendChild(nOption);
      }
    });
  });
}
ladePrufungen();

function checkboxneugroup(){
  prüfungsgruppe.value = ""
  if(!this.checked){
    prüfungsgruppe.setAttribute("list", "prüfungsgruppelist");
    prüfungsgruppe.setAttribute("placeholder", "zu bestehender Prüfungsgruppe hinzufügen")
    prüfungsgruppe.setAttribute("title", "zu bestehender Prüfungsgruppe hinzufügen")
  }else{
    prüfungsgruppe.setAttribute("title", "Bezeichnung der neuen Prüfungsgruppe. Zu dieser wird die neue Prüfung automatisch hinzugefügt")
    prüfungsgruppe.removeAttribute("list");
    prüfungsgruppe.setAttribute("placeholder", "Bezeichnung der neuen Prüfungsgruppe eingeben")
  }
}
checkneugroup.addEventListener("change", checkboxneugroup);


function checkboxneugroup2(){
  prufgroupedit.value = ""
  while(datalistPruf.firstChild){
    datalistPruf.firstChild.remove();
  }
  if(!this.checked){
    prufgroupedit.setAttribute("list", "prüfungsgruppelist");
    prufgroupedit.setAttribute("placeholder", "Prüfungsgruppe zum Bearbeiten wählen")
    prufgroupedit.setAttribute("title", "Prüfungsgruppe zum Bearbeiten wählen")
  }else{
    prufgroupedit.setAttribute("title", "Bezeichnung der neuen Prüfungsgruppe.")
    prufgroupedit.removeAttribute("list");
    prufgroupedit.setAttribute("placeholder", "Bezeichnung der neuen Prüfungsgruppe eingeben")
  }
}
checkneugroup2.addEventListener("change", checkboxneugroup2);

//Verschieben Anwesenden von Input zu Select--------------------------

function addAnwesen(e){
	e.preventDefault();
	var eingabe = inputAnwesen.value;
	eingabe = eingabe.trim().toLowerCase();

	var checker = true;
	var vorhanden = datalistanwesen.children;
    if(vorhanden.length > 0){
		Array.from(vorhanden).forEach(function(item){
			if(item.value.localeCompare(eingabe)==0){
				checker = false;
			}
		});
	}

	if(checker==true && eingabe.length > 0 && alleAnwesen.includes(eingabe)){
		const neueOption = document.createElement('option');
		neueOption.value = eingabe;
		neueOption.selected = true;
		const neuerText = document.createTextNode(eingabe);
		neueOption.appendChild(neuerText);
		datalistanwesen.appendChild(neueOption);
	}
	inputAnwesen.value = "";
}

buttonAddAnwesen.addEventListener('click', addAnwesen, false);

//------------------------------------------------------------------------
//Formular-Datenspeicher--------------------------------------------------
var bezeichnungPruf = "";
var teilnehmer;
var prufungsstatus;
var prufungsart;
var standardsemester;
var studiengangssemester = [];
var anwesende = [];
var bemerkungen;
var hilfsmittel;
var checkboxpflicht;
//------------------------------------------------------------------------
//Ändern der Zeit auf 0 wenn Hausarbeit gewählt---------------------------
var vorher;
function changeTeilnehmer(e){
  if(inputDauer.value != "0"){
    vorher = inputDauer.value;
  }
  if(inputPrufart.value == "Hausarbeit"){
    inputDauer.value = "0"
  } else {
    inputDauer.value = vorher;
    }
}

inputPrufart.addEventListener("change", changeTeilnehmer);
//------------------------------------------------------------------------



//Formulardaten laden und in die Datenbank schreiben--------------------------
function loadFormData(e){
  e.preventDefault();
  //Formulardaten in Formulardaten-Speicher schreiben
  if (inputprufname.value.trim() != ""){
    bezeichnungPruf = inputprufname.value.trim().toLowerCase();
    teilnehmer = inputteilnehmer.value;
    prufungsstatus = inputPrufStatus.value;
    prufungsart = inputPrufart.value;
    standardsemester = inputStandardsemester.value;
    checkboxpflicht = inputpflichtcheck.checked;
    var dauer = inputDauer.value;

    if (checkboxpflicht === true){
      checkboxpflicht = 1;
    } else checkboxpflicht = 0;

    var temp = inputStudsemSelect.children;
    Array.from(temp).forEach(function(item){
      if(item.selected == true && !studiengangssemester.includes(item.value)){
        studiengangssemester.push(item.value);
      }
    });

    temp = inputAnwesenSelect.children;
    Array.from(temp).forEach(function(item){
      if(item.selected == true && !anwesende.includes(item.value)){
        anwesende.push(item.value);
      }
    });

    var bemerkungen = inputBemerkungen.value.trim();
    var hilfsmittel = inputHilfsmittel.value.trim();


    prufer = prufer.value.split(" [")[0].trim();




    //Formulardatenspeicher in Datenbank prufungen schreiben
    var sql = "INSERT INTO prufungen (Prufung_Name, Teilnehmerzahl, Standardsemester, Prüfungsstatus, Bemerkung, Hilfsmittel, Prüfungsart, Pflichtprüfung, Dauer, B_M, Verantwortlicher) VALUES ('"+bezeichnungPruf+"','"+teilnehmer+"','"+standardsemester+"','"+prufungsstatus+"','"+bemerkungen+"','"+hilfsmittel+"','"+prufungsart+"','"+checkboxpflicht+"','"+dauer+"','"+bachelor.value+"', '"+prufer.toLowerCase()+"')";
    db.query(sql, function(err, results){
    	if(err) throw err;
    	primaryKey = results["insertId"]; //sql Insert query liefert Primärschlüssel der einfügten Prüfung zurück
      console.log(primaryKey)
      anwesende.forEach(function(item){  //Extrahiere den Primärschlüssel der gewählten Answesenden aus String
        item = item.split('[');
        item = item[1].split(']');
        item = item[0];
        var sql2 = "INSERT INTO prufunganwesendeverbindung (Prufung_ID, Anwesende_ID) VALUES ('"+primaryKey+"','"+item+"');";
        db.query(sql2, function(err, results){
        	if(err) throw err;
        });});
      studiengangssemester.forEach(function(item){//Extrahiere den Primärschlüssel der gewählten Studsems aus Strings
        item = item.split('[');
        item = item[1].split(']');
        item = item[0];
        var sql3 = "INSERT INTO prufungstudsemverbindung (Prufung_ID, Studiengangssemester_ID) VALUES ('"+primaryKey+"','"+item+"');";
        db.query(sql3, function(err, results){
        	if(err) throw err;
        });
      });

      if(prüfungsgruppe.value.trim() !== ""){
        if(checkneugroup.checked){
          const sql534 = "INSERT INTO prufungsgruppe (Bezeichnung) VALUES ('"+prüfungsgruppe.value.trim()+"')"
          db.query(sql534, function(err, results){
          	if(err) throw err;
            const sql309 = "UPDATE prufungen SET Prufungsgruppen_ID = '"+results["insertId"]+"' WHERE Prufung_ID = '"+primaryKey+"'"
            db.query(sql309, function(err, results){
            	if(err) throw err;
            });
          });
        }else{
          const sql309 = "UPDATE prufungen SET Prufungsgruppen_ID = '"+extractID(prüfungsgruppe.value)+"' WHERE Prufung_ID = '"+primaryKey+"'"
          db.query(sql309, function(err, results){
            if(err) throw err;
          });
        }
      }

    });
    dialogs.alert(bezeichnungPruf + " hinzugefügt. Seite lädt neu...")
    setTimeout(()=>{
      location.reload()
    }, 1000)
    //Fomular leeren, damit nicht doppelt hinzugefügt wird.
  //   while (dataliststudsem.firstChild) {
  //     dataliststudsem.firstChild.remove()
  // }
  //   while (datalistanwesen.firstChild) {
  //       datalistanwesen.firstChild.remove()
  //   }
  //   formulare[0].reset()

  }else {dialogs.alert("Bezeichnung der Prüfung benötigt");}
}
submitButton.addEventListener('click', loadFormData, false)

function extractID(item){
  var temp = item.split("[");
  var temp = temp[1].split("]");
  return temp[0];
}
function extractID2(item){
  var temp = item.textContent.split("[ID.: ");
  var temp = temp[1].split("]");
  return temp[0];
}
//--------------------------------------------------------------------------------
function loadElements(e){
  e.preventDefault();
  while (alleElemente.firstChild) {
    alleElemente.firstChild.remove()
  }
  var sql = 'SELECT * FROM prufungen ORDER BY Prufung_Name ASC';
  db.query(sql, function(err, results){
  	if(err) throw err;
  	//console.log(results);
    results.forEach(result => {
    	const nOption = document.createElement('option');
    	nOption.value =result["Prufung_Name"] +" | "+ result["Standardsemester"]+" | "+result["Prüfungsstatus"]+"   ["+result["Prufung_ID"]+"]";
      //alleStudsems.push(result["Nachname"] +" "+ result["Vorname"]+" ["+result["Anwesende_ID"]+"]");
    	alleElemente.appendChild(nOption);
    });
  });
}
inputlöschen.addEventListener('focus', loadElements, false);

function deleteElement(e){
  e.preventDefault();
  if(inputlöschen.value.trim() != ""){
  dialogs.confirm("Prüfung wirklich löschen? Es können Abhängigkeiten bestehen.", ok => {
    if(ok === true){
      var toDelete1 = inputlöschen.value.split("[");
      toDelete = toDelete1[1].split("]");
      toDelete = toDelete[0];
      console.log(toDelete);
      var sql = "DELETE FROM prufungen WHERE Prufung_ID='"+toDelete+"';";
      db.query(sql, function(err, results){
      	if(err) throw err;

        var sql2 = "DELETE FROM prufung_termin WHERE Termin_ID NOT IN (SELECT Termin_ID FROM prunfung_termin_verb)"
        db.query(sql2, function(err, results){
          if(err) throw err;
          dialogs.alert(toDelete1[0]+" gelöscht. Seite lädt neu...");
          setTimeout(()=>{
            location.reload()
          }, 1000)
        });

        var sql098 = "DELETE FROM prufungsgruppe WHERE Prufungsgruppen_ID NOT IN (SELECT Prufungsgruppen_ID FROM prufungen WHERE Prufungsgruppen_ID IS NOT NULL)"
        db.query(sql098, function(err, results){
          if(err) throw err;
        })


        setTimeout(()=>{
          location.reload()
        }, 1000)
        });

    }
  })


    // var sql2 = "DELETE FROM studiengangssemester_belegung WHERE Grund = '"+toDelete+"'"
    // db.query(sql2, function(err, results){
    //   if(err) throw err;
    // });
    } else dialogs.alert("Kein Element gewählt")

  }

buttonLöschen.addEventListener("click", deleteElement, false);
inputlöschen.addEventListener('focus', emptyinput);



function returnWeekdayString(datum){
  if(datum.getDay() == 0){
    return "So,"
  }else if(datum.getDay() == 1){
    return "Mo,"
  }else if(datum.getDay() == 2){
    return "Di,"
  }else if(datum.getDay() == 3){
    return "Mi,"
  }else if(datum.getDay() == 4){
    return "Do,"
  }else if (datum.getDay() == 5){
    return "Fr,"
  } else if (datum.getDay() == 6){
    return "Sa,"
  }
}

function transformDateToHTML(datum){
  var day = datum.getDate();
  var month = datum.getMonth()+1;
  if(day < 10){
    day = "0"+day;
  }
  if(month < 10){
    month = "0"+month;
  }
  datumstring = day+'.'+month+'.'+datum.getFullYear();
  return datumstring
}

function transformDateToHTML2(datum){
  var day = datum.getDate();
  var month = datum.getMonth()+1;
  if(day < 10){
    day = "0"+day;
  }
  if(month < 10){
    month = "0"+month;
  }
  datumstring = datum.getFullYear()+'-'+month+'-'+day
  return datumstring
}



function janein(para){
  if(para === 1){
    return "Ja"
  }else return "Nein"
}



function terminlösen(e){
  e.preventDefault();
  dialogs.confirm("Prüfung wirklich vom Termin lösen?", ok =>{
    console.log(ok)
    if(ok === true){
      var sql = "DELETE FROM prunfung_termin_verb WHERE Prufung_ID = '"+this.getAttribute("data-prufID")+"' AND Termin_ID = '"+this.getAttribute("data-terminID")+"'"
      db.query(sql, function(err, results){
        if(err) throw err;
      });
      // var sql2 = "DELETE FROM studiengangssemester_belegung WHERE Grund = '"+this.getAttribute("data-prufID")+"'"
      // db.query(sql2, function(err, results){
      //   if(err) throw err;
      // });
      // dialogs.alert("Prüfung wurde vom Termin gelöst. Seite wird neu geladen...")
      // this.parentElement.parentElement.remove();



      var sql2 = "DELETE FROM prufung_termin WHERE Termin_ID NOT IN (SELECT Termin_ID FROM prunfung_termin_verb)"
      db.query(sql2, function(err, results){
        if(err) throw err;
      });

      dialogs.alert("Termin erfolgreich gelöst. Seite lädt neu...");
      setTimeout(()=>{
        location.reload()
      }, 1000)
    }

  });

}

function dateHausarbeiten(e){
  e.preventDefault();
  console.log("knopfparenchild ", this.parentElement.parentElement.firstChild)
  if(this.parentElement.parentElement.firstChild.value === ""){
    dialogs.alert("Bitte Datum und Uhrzeit eingeben. Falls Abgabe ganztägig möglich, bitte 23:59 Uhr eintragen")
    return;
  }
  var datum = this.parentElement.parentElement.firstChild.value


  if(new Date(datum) < new Date()){
    dialogs.alert("Termin liegt in der Vergangenheit. Keine Eintragung vorgenommen");
    return;
  }

  datum = datum.split("T");

  var thisdate = new Date(datum[0]);
  if(feiertagejs.isHoliday(thisdate, 'RP')){
    console.log(feiertagejs.getHolidayByDate(thisdate, 'RP'))
    dialogs.confirm("Dieser Tag könnte ein Feiertag sein: " + feiertagejs.getHolidayByDate(thisdate, 'RP').name+"\n Trotzdem eintragen?", ok => {
      if(ok === true){
        var update = datum[0]+"T"+datum[1];
        var sqlxyz = "UPDATE prufungen SET Letzter_Termin = '"+update+"' WHERE prufungen.Prufung_ID = '"+this.getAttribute("data-prufid")+"'";
        db.query(sqlxyz, function(err, results2) {
          if(err) throw err
        });

        sql = "INSERT INTO prufung_termin (Beginn, Datum, TS1, TS2, TS3, TS4, TS5, TS6, TS7, TS8, TS9, TS10, TS11, TS12, TS13, TS14, TS15, TS16, TS17, TS18, TS19, TS20, TS21) VALUES ('" + datum[1] + "','" + datum[0] + "','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0')"
        var tempthis = this;
        db.query(sql, function(err, results){
          console.log(this);
          if(err) throw err;
          console.log(results)

          sql2 = "INSERT INTO prunfung_termin_verb (Prufung_ID, Termin_ID) VALUES ('"+tempthis.getAttribute("data-prufid")+"','"+results["insertId"]+"')"
          db.query(sql2, function(err, results){
            if(err) throw err;
            dialogs.alert("Termin erfolgreich der Hausarbeit zugeordnet. Seite wird neu geladen...")
            tempthis.parentElement.parentElement.firstChild.setAttribute("readonly", "readonly");
            tempthis.remove();
            setTimeout(()=>{
              location.reload()
            }, 1000)
          })
        });
      }
    })
  }else{
    var update = datum[0]+"T"+datum[1];
    var sqlxyz = "UPDATE prufungen SET Letzter_Termin = '"+update+"' WHERE prufungen.Prufung_ID = '"+this.getAttribute("data-prufid")+"'";
    db.query(sqlxyz, function(err, results2) {
      if(err) throw err
    });

    sql = "INSERT INTO prufung_termin (Beginn, Datum, TS1, TS2, TS3, TS4, TS5, TS6, TS7, TS8, TS9, TS10, TS11, TS12, TS13, TS14, TS15, TS16, TS17, TS18, TS19, TS20, TS21) VALUES ('" + datum[1] + "','" + datum[0] + "','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0','0')"
    var tempthis = this;
    db.query(sql, function(err, results){
      console.log(this);
      if(err) throw err;
      console.log(results)

      sql2 = "INSERT INTO prunfung_termin_verb (Prufung_ID, Termin_ID) VALUES ('"+tempthis.getAttribute("data-prufid")+"','"+results["insertId"]+"')"
      db.query(sql2, function(err, results){
        if(err) throw err;
        dialogs.alert("Termin erfolgreich der Hausarbeit zugeordnet. Seite wird neu geladen...")
        tempthis.parentElement.parentElement.firstChild.setAttribute("readonly", "readonly");
        tempthis.remove();
        setTimeout(()=>{
          location.reload()
        }, 1000)
      })
    });
  }


}

function bearbeitPruf(e){

  var content = this.getAttribute("data-prufID");
  localStorage["editID"] = content;
  // fs.writeFile('bearbeitenID.txt', content, err => {
  //   if (err) {
  //     console.error(err)
  //     return
  //   }
    //file written successfully
    window.open("bearbeiten.html");
    dialogs.alert("Ein Prüfung wurde möglicherweise geändert. Bitte auf 'OK' klicken zum aktualisieren", ok => {
      location.reload()
    })
  // })


}


function prufungsUbersicht(){


  tk = document.querySelector("#tabellenkörper");
  sql = "SELECT * FROM prufungen, prunfung_termin_verb, prufung_termin WHERE prufungen.Prufung_ID = prunfung_termin_verb.Prufung_ID AND prunfung_termin_verb.Termin_ID = prufung_termin.Termin_ID ORDER BY Datum, Beginn, prufung_termin.Termin_ID, Prufung_Name"
  console.log(sql)
  db.query(sql, function(err, results){
    if(err) throw err;
      results.forEach((result)=>{
        const zeile = document.createElement("tr");

        var spalte = document.createElement("td");
        var text = document.createTextNode(result["Prufung_ID"])
        spalte.appendChild(text);
        zeile.appendChild(spalte);
        spalte = document.createElement("td");
        spalte.innerHTML = "&#9998;"
        spalte.addEventListener("click", bearbeitPruf)
        spalte.setAttribute("title","Prüfung bearbeiten");
        spalte.setAttribute("data-prufID", result["Prufung_ID"]);
        spalte.classList.add("bearbeitenbutton");
        text = document.createTextNode(result["Prufung_Name"])
        var text2 = document.createTextNode(" ("+result["B_M"].substring(0,1)+".)");
        spalte.appendChild(text);
        spalte.appendChild(text2);
        zeile.appendChild(spalte);
        spalte = document.createElement("td");
        text = document.createTextNode(returnWeekdayString(result["Datum"])+" "+transformDateToHTML(result["Datum"]))
        spalte.appendChild(text);
        zeile.appendChild(spalte);
        spalte = document.createElement("td");

        //Berechne ende
        var tempdate = new Date();
        tempdate.setHours(0);
        tempdate.setMinutes(0);
        tempdate.setSeconds(0);
        var starthours = result["Beginn"].split(":")[0];
        var startminutes = result["Beginn"].split(":")[1];
        if(starthours[0] === "0"){
          starthours = starthours.slice(1);
        }
        if(startminutes[0] === "0"){
          startminutes = startminutes.slice(1);
        }
        tempdate.setMinutes(parseInt(startminutes));
        tempdate.setHours(parseInt(starthours));
        tempdate.setMinutes(tempdate.getMinutes()+parseInt(result["Dauer"]));

        var endminutes = tempdate.getMinutes();
        var endhours = tempdate.getHours();

        if(endminutes < 10){
          endminutes = "0"+endminutes;
        }
        if(endhours < 10){
          endhours = "0"+endhours;
        }

        var endtime = " - "+endhours+":"+endminutes;
        //






        text = document.createTextNode(result["Beginn"] + (result["Prüfungsart"] !== "Hausarbeit" ? endtime : ""))
        spalte.appendChild(text);
        zeile.appendChild(spalte);
        spalte = document.createElement("td");
        text = document.createTextNode(result["Dauer"])
        spalte.appendChild(text);
        zeile.appendChild(spalte);
        spalte = document.createElement("td");
        text = document.createTextNode(result["Teilnehmerzahl"])
        spalte.appendChild(text);
        zeile.appendChild(spalte);
        spalte = document.createElement("td");
        text = document.createTextNode(result["Standardsemester"])
        spalte.appendChild(text);
        zeile.appendChild(spalte);
        spalte = document.createElement("td");
        text = document.createTextNode(result["Prüfungsstatus"])
        spalte.appendChild(text);
        zeile.appendChild(spalte);
        spalte = document.createElement("td");
        spalte.classList.add("kleinerText");
        text = document.createTextNode(result["Bemerkung"].slice(0,99)+(result["Bemerkung"].length > 100 ? "[...]" : ""))
        spalte.setAttribute("title", result["Bemerkung"]);
        spalte.appendChild(text);
        zeile.appendChild(spalte);
        spalte = document.createElement("td");
        spalte.classList.add("kleinerText");
        text = document.createTextNode(result["Hilfsmittel"].slice(0,99)+(result["Hilfsmittel"].length > 100 ? "[...]" : ""))
        spalte.setAttribute("title", result["Hilfsmittel"]);
        spalte.appendChild(text);
        zeile.appendChild(spalte);
        spalte = document.createElement("td");
        text = document.createTextNode(result["Prüfungsart"])
        spalte.appendChild(text);
        zeile.appendChild(spalte);
        spalte = document.createElement("td");
        text = document.createTextNode(janein(result["Pflichtprüfung"]))
        spalte.appendChild(text);
        zeile.appendChild(spalte);
        spalte = document.createElement("td");
        text = document.createTextNode((result["Prufungsgruppen_ID"] === null ? "" : result["Prufungsgruppen_ID"]))
        spalte.appendChild(text);
        zeile.appendChild(spalte);
        spalte = document.createElement("td");
        text = document.createTextNode(result["Termin_ID"])
        spalte.appendChild(text);
        zeile.appendChild(spalte);
        spalte = document.createElement("td");
        spalte.style.textAlign = "center"
        var knopf = document.createElement("button")
        knopf.setAttribute("data-prufID", result["Prufung_ID"]);
        knopf.setAttribute("data-terminID", result["Termin_ID"]);
        knopf.setAttribute("title", "Prüfung von Termin lösen?")
        knopf.addEventListener("click", terminlösen);
        knopf.classList.add("löschknopf");
        text = document.createTextNode("x")
        knopf.appendChild(text);
        spalte.appendChild(knopf);
        zeile.appendChild(spalte);

        sql3 = "SELECT raum.Bezeichnung FROM prufung_termin, prufung_termin_raumverb, raum WHERE prufung_termin.Termin_ID = '"+result["Termin_ID"]+"' AND prufung_termin.Termin_ID = prufung_termin_raumverb.Termin_ID AND prufung_termin_raumverb.Raum_ID = raum.Raum_ID"
        db.query(sql3, function(err, results2){
          var spalte = document.createElement("td");
          for(result2 of results2){

            var text = document.createTextNode(result2["Bezeichnung"])
            var br = document.createElement("br");
            var nobr = document.createElement("nobr");
            nobr.appendChild(text)
            spalte.appendChild(nobr);
            spalte.appendChild(br);
          }
          zeile.appendChild(spalte)
      });

        tk.appendChild(zeile)
      });
    });




sql2 = "SELECT * FROM prufungen WHERE NOT EXISTS (SELECT 1 FROM prunfung_termin_verb WHERE prufungen.Prufung_ID = prunfung_termin_verb.Prufung_ID) ORDER BY Prufungsgruppen_ID DESC, Prufung_Name"
  db.query(sql2, function(err, results){
    if(err) throw err;
for (result of results){
    const zeile = document.createElement("tr");

  var spalte = document.createElement("td");
  var text = document.createTextNode(result["Prufung_ID"])
  spalte.appendChild(text);
  zeile.appendChild(spalte);


  spalte = document.createElement("td");
  text = document.createTextNode(result["Prufung_Name"])
  var text2 = document.createTextNode(" ("+result["B_M"].substring(0,1)+".)");
  spalte.addEventListener("click", bearbeitPruf)
  spalte.setAttribute("title","Prüfung bearbeiten");
  spalte.innerHTML = "&#9998;"
  spalte.setAttribute("data-prufID", result["Prufung_ID"]);
  spalte.classList.add("bearbeitenbutton");
  spalte.appendChild(text);
  spalte.appendChild(text2);
  zeile.appendChild(spalte);


  spalte = document.createElement("td");
  if(result["Prüfungsart"] !== "Hausarbeit"){
    console.log("Letzter_Termin: ", result)
    if(result["Letzter_Termin"] === null){
      text = document.createTextNode("k.A.")
      spalte.appendChild(text);
    } else{
      var divi = document.createElement("div");
      text = document.createTextNode(returnWeekdayString(new Date(result["Letzter_Termin"].split("T")[0]))+" "+transformDateToHTML(new Date(result["Letzter_Termin"].split("T")[0])))
      divi.appendChild(text);
      divi.setAttribute("title", "Vorheriger Termin der Prüfung (obsolet)")
      divi.classList.add("abgelaufen")
      spalte.appendChild(divi);
    }
  }else{
    var input =  document.createElement("input");
    input.setAttribute("type", "datetime-local");
    input.classList.add("datetimeHausarbeit");
    spalte.appendChild(input);

    var knopf = document.createElement("button")
    knopf.setAttribute("data-prufID", result["Prufung_ID"]);
    knopf.setAttribute("title", "Neuer Termin setzen")
    knopf.addEventListener("click", dateHausarbeiten);
    knopf.classList.add("dateknopf");
    text = document.createTextNode("+")
    knopf.appendChild(text);
    var container = document.createElement("div")
    container.appendChild(knopf)
    container.style.textAlign = "center"
    spalte.appendChild(container);
    if(result["Letzter_Termin"] !== null){
      var divi = document.createElement("div");
      text = document.createTextNode(returnWeekdayString(new Date(result["Letzter_Termin"].split("T")[0]))+" "+transformDateToHTML(new Date(result["Letzter_Termin"].split("T")[0])))
      divi.appendChild(text);
      divi.classList.add("hausarbeitdatum")
      spalte.appendChild(divi);
      divi.setAttribute("title", "Vorheriger Termin der Prüfung (obsolet)")
      divi.classList.add("abgelaufen")
    }



  }
  zeile.appendChild(spalte);


  spalte = document.createElement("td");
  if(result["Letzter_Termin"] === null){
    text = document.createTextNode("k.A.")
    spalte.appendChild(text);
  } else{
    var divi = document.createElement("div");
    text = document.createTextNode(result["Letzter_Termin"].split("T")[1])
    divi.appendChild(text);
    spalte.setAttribute("title", "Vorheriger Termin der Prüfung (obsolet)")
    divi.classList.add("abgelaufen")
    spalte.appendChild(divi)
  }
  zeile.appendChild(spalte);
  spalte = document.createElement("td");
  text = document.createTextNode(result["Dauer"])
  spalte.appendChild(text);
  zeile.appendChild(spalte);
  spalte = document.createElement("td");
  text = document.createTextNode(result["Teilnehmerzahl"])
  spalte.appendChild(text);
  zeile.appendChild(spalte);
  spalte = document.createElement("td");
  text = document.createTextNode(result["Standardsemester"])
  spalte.appendChild(text);
  zeile.appendChild(spalte);
  spalte = document.createElement("td");
  text = document.createTextNode(result["Prüfungsstatus"])
  spalte.appendChild(text);
  zeile.appendChild(spalte);
  spalte = document.createElement("td");
  spalte.classList.add("kleinerText");
  text = document.createTextNode(result["Bemerkung"].slice(0,99)+(result["Bemerkung"].length > 100 ? "[...]" : ""))
  spalte.setAttribute("title", result["Bemerkung"]);
  spalte.appendChild(text);
  zeile.appendChild(spalte);
  spalte = document.createElement("td");
  spalte.classList.add("kleinerText");
  text = document.createTextNode(result["Hilfsmittel"].slice(0,99)+(result["Hilfsmittel"].length > 100 ? "[...]" : ""))
  spalte.setAttribute("title", result["Hilfsmittel"]);
  spalte.appendChild(text);
  zeile.appendChild(spalte);
  spalte = document.createElement("td");
  text = document.createTextNode(result["Prüfungsart"])
  spalte.appendChild(text);
  zeile.appendChild(spalte);
  spalte = document.createElement("td");
  text = document.createTextNode(janein(result["Pflichtprüfung"]))
  spalte.appendChild(text);
  zeile.appendChild(spalte);
  spalte = document.createElement("td");
  text = document.createTextNode((result["Prufungsgruppen_ID"] === null ? "" : result["Prufungsgruppen_ID"]))
  spalte.appendChild(text);
  zeile.appendChild(spalte);
  spalte = document.createElement("td");
  text = document.createTextNode("k.A.")
  spalte.appendChild(text);
  zeile.appendChild(spalte);
  spalte = document.createElement("td");
  text = document.createTextNode("")
  spalte.appendChild(text);
  zeile.appendChild(spalte);
  spalte = document.createElement("td");
  text = document.createTextNode("k.A.")
  spalte.appendChild(text);
  zeile.appendChild(spalte);

  tk.appendChild(zeile)


}

    });




}
prufungsUbersicht();



function deleteOldies(){
  var thisdate = new Date();

  console.log("Oldies gelöscht bis: ", thisdate);
  var sql = "DELETE FROM prufung_termin WHERE prufung_termin.Datum < '"+transformDateToHTML2(thisdate)+"'"
  db.query(sql, function(err, results) {
  });
}
deleteOldies();



var instance = new Mark(document.querySelector("#tablePruf tbody"));
function searchTable(){
  instance.unmark();
  instance.mark(suche.value.trim())

  var zeilen = document.querySelectorAll("#tablePruf tbody tr")
  for(zeile of zeilen){
    if(ausblenden.checked){
      if(!zeile.textContent.toLowerCase().includes(suche.value.toLowerCase().trim())){
        zeile.setAttribute("hidden", "hidden")
      }else{
        zeile.removeAttribute("hidden");
      }
    } else zeile.removeAttribute("hidden");
  }
}

suche.addEventListener("keyup", searchTable);
ausblenden.addEventListener("change", searchTable);




// Default export is a4 paper, portrait, using millimeters for units
// function downloadPDFWithjsPDF() {
//   const doc = new jsPDF({
//     orientation: "landscape",
//     unit: "mm"
//   });
//
//   doc.html(document.querySelector('#tablePruf'), {
//     callback: function (doc) {
//       doc.save('test.pdf');
//     },
//     margin: [0, 10000, 20,0],
//     x: 0,
//     y: 0,
//   });
// }



function toPDF(){

     window.open("plan.html");

}
document.querySelector("#pdf").addEventListener("click", toPDF);


var test = new Date();
test.setMinutes(test.getMinutes()+90);
console.log(test)
