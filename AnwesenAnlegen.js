var Dialogs = require('dialogs');
var dialogs = Dialogs(opts={});

const inputvorname = document.querySelector('#vorname');
const inputnachname = document.querySelector('#nachname');
const buttonEintragen = document.querySelector('#buttonEintragen')
const formulare = document.querySelectorAll('.formular')

const inputlöschen = document.querySelector('#löschen')
const alleElemente = document.querySelector('#alleElemente')
const buttonLöschen = document.querySelector('#buttonLöschen')


//----------Formular-Datenspeicher---------
var vorname;
var nachname;
//--------------------------------------------

//Sonstige globale Variablen------------------
//--------------------------------------------

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
function loadFormData(e){
  e.preventDefault();
  //Formulardaten in Formulardaten-Speicher schreiben
  if (inputnachname.value.trim() != "" && inputvorname.value.trim() != ""){
    vorname = inputvorname.value.trim().toLowerCase();
    nachname = inputnachname.value.trim().toLowerCase();

    //Formulardatenspeicher in Datenbank prufungen schreiben
    var sql = "INSERT INTO anwesende (Vorname, Nachname) VALUES ('"+vorname+"','"+nachname+"');";
    db.query(sql, function(err, results){
    	if(err) throw err;
    });
    dialogs.alert(vorname+" "+nachname+" hinzugefügt")
    //Fomular leeren, damit nicht doppelt hinzugefügt wird.
    formulare[0].reset()

  }else {dialogs.alert("Vor- und Nachname benötigt")}
}
buttonEintragen.addEventListener('click', loadFormData, false);



function loadElements(e){
  e.preventDefault();
  while (alleElemente.firstChild) {
    alleElemente.firstChild.remove()
  }
  var sql = 'SELECT * FROM anwesende ORDER BY Nachname, Vorname ASC';
  db.query(sql, function(err, results){
  	if(err) throw err;
  	//console.log(results);
    results.forEach(result => {
    	const nOption = document.createElement('option');
    	nOption.value =result["Nachname"] +" "+ result["Vorname"]+" ["+result["Anwesende_ID"]+"]";
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
    var sql = "DELETE FROM anwesende WHERE Anwesende_ID='"+toDelete+"';";
    db.query(sql, function(err, results){
    	if(err) throw err;
    	dialogs.alert(toDelete1[0]+" gelöscht.");

      });
    } else dialogs.alert("Kein Element gewählt")
    inputlöschen.value = "";
  }

buttonLöschen.addEventListener("click", deleteElement, false);
