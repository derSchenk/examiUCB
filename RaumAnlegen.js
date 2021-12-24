
const inputRaum = document.querySelector('#raum');
const inputExtras = document.querySelector('#extras')
const inputKapazität = document.querySelector('#Kapazität');
const inputKategorie = document.querySelector("#selectroomcat")
const buttonEintragen = document.querySelector('#buttonEintragen')
const formulare = document.querySelectorAll('.formular')

const inputlöschen = document.querySelector('#löschen')
const alleElemente = document.querySelector('#alleElemente')
const buttonLöschen = document.querySelector('#buttonLöschen')


//----------Formular-Datenspeicher---------
var raum;
var kapazität;
var kategorie;
var extras;


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
  if (inputRaum.value.trim() != "" && inputKapazität.value != ""){
    raum = inputRaum.value.trim().toLowerCase();
    kapazität = inputKapazität.value;
    kategorie = inputKategorie.value;
    extras = inputExtras.value;

    //Formulardatenspeicher in Datenbank prufungen schreiben
    var sql = "INSERT INTO raum (Bezeichnung, Kategorie, Kapazität, Extras) VALUES ('"+raum+"','"+kategorie+"','"+kapazität+"','"+extras+"');";
    db.query(sql, function(err, results){
    	if(err) throw err;
    });
    dialogs.alert(raum+" hinzugefügt")
    //Fomular leeren, damit nicht doppelt hinzugefügt wird.
    formulare[0].reset()

  }else {dialogs.alert("Raumbezeichnung und Kapazität benötigt");}
}
buttonEintragen.addEventListener('click', loadFormData, false)

function loadElements(e){
  e.preventDefault();
  while (alleElemente.firstChild) {
    alleElemente.firstChild.remove()
  }
  var sql = 'SELECT * FROM raum ORDER BY Bezeichnung ASC';
  db.query(sql, function(err, results){
  	if(err) throw err;
  	//console.log(results);
    results.forEach(result => {
    	const nOption = document.createElement('option');
    	nOption.value =result["Bezeichnung"] +" | "+ result["Kategorie"]+" | Kap.: "+ result["Kapazität"]+"   ["+result["Raum_ID"]+"]";
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
    var sql = "DELETE FROM raum WHERE Raum_ID='"+toDelete+"';";
    db.query(sql, function(err, results){
    	if(err) throw err;
    	dialogs.alert(toDelete1[0]+" gelöscht.");

      });
    } else dialogs.alert("Kein Element gewählt")
    inputlöschen.value = "";
  }

buttonLöschen.addEventListener("click", deleteElement, false);
