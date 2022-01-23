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

function janein(para){
  if(para === 1){
    return "Ja"
  }else return "Nein"
}

function terminlösen(e){
  e.preventDefault();
  sql = "DELETE FROM prunfung_termin_verb WHERE Prufung_ID = '"+this.getAttribute("data-prufID")+"' AND Termin_ID = '"+this.getAttribute("data-terminID")+"'"
  db.query(sql, function(err, results){
    if(err) throw err;
  });
  dialogs.alert("Prüfung wurde vom Termin gelöst. Bitte Seite neu Laden zum aktualisieren(strg + r)")
  this.parentElement.parentElement.remove();



  sql2 = "DELETE FROM prufung_termin WHERE NOT EXISTS(SELECT 1 FROM prunfung_termin_verb WHERE prunfung_termin_verb.Termin_ID = prufung_termin.Termin_ID)"
  db.query(sql2, function(err, results){
    if(err) throw err;
    if(results["affectedRows"]>0){
      dialogs.alert("Termin wurde gelöscht")
    }
  });



}

function prufungsUbersicht(){
  tk = document.querySelector("#tabellenkörper");
  sql = "SELECT * FROM prufungen, prunfung_termin_verb, prufung_termin WHERE prufungen.Prufung_ID = prunfung_termin_verb.Prufung_ID AND prunfung_termin_verb.Termin_ID = prufung_termin.Termin_ID ORDER BY Datum, Beginn, prufung_termin.Termin_ID, Prufung_Name"
  db.query(sql, function(err, results){
    if(err) throw err;
      results.forEach((result)=>{
        const zeile = document.createElement("tr");

        var spalte = document.createElement("td");
        var text = document.createTextNode(result["Prufung_ID"])
        spalte.appendChild(text);
        zeile.appendChild(spalte);
        spalte = document.createElement("td");
        text = document.createTextNode(result["Prufung_Name"])
        spalte.appendChild(text);
        zeile.appendChild(spalte);
        spalte = document.createElement("td");
        text = document.createTextNode(returnWeekdayString(result["Datum"])+" "+transformDateToHTML(result["Datum"]))
        spalte.appendChild(text);
        zeile.appendChild(spalte);
        spalte = document.createElement("td");
        text = document.createTextNode(result["Beginn"])
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
        text = document.createTextNode(result["Bemerkung"])
        spalte.appendChild(text);
        zeile.appendChild(spalte);
        spalte = document.createElement("td");
        text = document.createTextNode(result["Hilfsmittel"])
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
        text = document.createTextNode(result["Termin_ID"])
        spalte.appendChild(text);
        zeile.appendChild(spalte);
        spalte = document.createElement("td");
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
        spalte = document.createElement("td");
          console.log("ngsl", results2);
          var text2 = "";
          for(result of results2){
            text2 = text2 + result["Bezeichnung"]+" "
          }
        text = document.createTextNode(text2);
        spalte.appendChild(text);
        zeile.appendChild(spalte);
      });

        tk.appendChild(zeile)
      });
    });

  sql2 = "SELECT * FROM prufungen WHERE NOT EXISTS (SELECT 1 FROM prunfung_termin_verb WHERE prufungen.Prufung_ID = prunfung_termin_verb.Prufung_ID) ORDER BY Standardsemester, Prufung_Name"
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
  spalte.appendChild(text);
  zeile.appendChild(spalte);
  spalte = document.createElement("td");
  text = document.createTextNode("k.A.")
  spalte.appendChild(text);
  zeile.appendChild(spalte);
  spalte = document.createElement("td");
  text = document.createTextNode("k.A.")
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
  text = document.createTextNode(result["Bemerkung"])
  spalte.appendChild(text);
  zeile.appendChild(spalte);
  spalte = document.createElement("td");
  text = document.createTextNode(result["Hilfsmittel"])
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
