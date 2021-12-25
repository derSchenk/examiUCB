var Dialogs = require('dialogs');
var dialogs = Dialogs(opts={});

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

//-----------------------------------------------------------------
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

    bemerkungen = inputBemerkungen.value.trim();
    hilfsmittel = inputHilfsmittel.value.trim();

    //Formulardatenspeicher in Datenbank prufungen schreiben
    var sql = "INSERT INTO prufungen (Prufung_Name, Teilnehmerzahl, Standardsemester, Prüfungsstatus, Bemerkung, Hilfsmittel, Prüfungsart, Pflichtprüfung, Dauer) VALUES ('"+bezeichnungPruf+"','"+teilnehmer+"','"+standardsemester+"','"+prufungsstatus+"','"+bemerkungen+"','"+hilfsmittel+"','"+prufungsart+"','"+checkboxpflicht+"','"+dauer+"');";
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


    });
    dialogs.alert(bezeichnungPruf + " hinzugefügt")
    //Fomular leeren, damit nicht doppelt hinzugefügt wird.
    while (dataliststudsem.firstChild) {
      dataliststudsem.firstChild.remove()
  }
    while (datalistanwesen.firstChild) {
        datalistanwesen.firstChild.remove()
    }
    formulare[0].reset()

  }else {dialogs.alert("Bezeichnung der Prüfung benötigt");}
}
submitButton.addEventListener('click', loadFormData, false)
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
    var toDelete1 = inputlöschen.value.split("[");
    toDelete = toDelete1[1].split("]");
    toDelete = toDelete[0];
    console.log(toDelete);
    var sql = "DELETE FROM prufungen WHERE Prufung_ID='"+toDelete+"';";
    db.query(sql, function(err, results){
    	if(err) throw err;
    	dialogs.alert(toDelete1[0]+" gelöscht.");

      });
    } else dialogs.alert("Kein Element gewählt")
    inputlöschen.value = "";
  }

buttonLöschen.addEventListener("click", deleteElement, false);
