
const inputRaum = document.querySelector('#raum');
const inputExtras = document.querySelector('#extras')
const inputKapazität = document.querySelector('#Kapazität');
const inputKategorie = document.querySelector("#selectroomcat")
const buttonEintragen3 = document.querySelector('#buttonEintragen3')
const formulare3 = document.querySelectorAll('.formular')

const inputlöschen3 = document.querySelector('#löschen3')
const alleElemente3 = document.querySelector('#alleElemente3')
const buttonLöschen3 = document.querySelector('#buttonLöschen3')
const abkürzung = document.querySelector('#abkürzung')


//----------Formular-Datenspeicher---------
var raum;
var kapazität;
var kategorie;
var extras;


//--------------------------------------------

//Sonstige globale Variablen------------------
//--------------------------------------------

//Datenbankverbindung herstellen---------------

  // const mysql = require('mysql');
	// const db = mysql.createConnection({
	// 		host: "localhost",
	// 		user: "root",
	// 		password: "",
	// 		database: "verwaltungssoftware"
	// });
  //
	// 	db.connect(function(err){
	// 		if(err) throw err;
	// 		console.log("Verbindung zur Datenbank hergestellt.")
	// 	});

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
    setTimeout(() => {
      dialogs.cancel();
    }, 2000)
    //Fomular leeren, damit nicht doppelt hinzugefügt wird.
    formulare3[0].reset()

  }else {dialogs.alert("Raumbezeichnung und Kapazität benötigt");}
}
buttonEintragen3.addEventListener('click', loadFormData, false)

function loadElements(e){
  e.preventDefault();
  while (alleElemente3.firstChild) {
    alleElemente3.firstChild.remove()
  }
  var sql = 'SELECT * FROM raum ORDER BY Bezeichnung ASC';
  db.query(sql, function(err, results){
  	if(err) throw err;
  	//console.log(results);
    results.forEach(result => {
    	const nOption = document.createElement('option');
    	nOption.value =result["Bezeichnung"] +" | "+ result["Kategorie"]+" | Kap.: "+ result["Kapazität"]+"   ["+result["Raum_ID"]+"]";
      //alleStudsems.push(result["Nachname"] +" "+ result["Vorname"]+" ["+result["Anwesende_ID"]+"]");
    	alleElemente3.appendChild(nOption);
    });
  });
}
inputlöschen3.addEventListener('focus', loadElements, false);

function deleteElement(e){
  e.preventDefault();
  if(inputlöschen3.value.trim() != ""){
    dialogs.confirm("Soll dieser Raum wirlich gelöscht werden? Es können Abhängigkeiten bestehen.", ok => {
      if(ok === true){
        var toDelete1 = inputlöschen3.value.split("[");
        toDelete = toDelete1[1].split("]");
        toDelete = toDelete[0];
        console.log(toDelete);
        var sql = "DELETE FROM raum WHERE Raum_ID='"+toDelete+"';";
        db.query(sql, function(err, results){
        	if(err) throw err;
        	dialogs.alert(toDelete1[0]+" gelöscht.");
          setTimeout(() => {
            dialogs.cancel();
          }, 2000)

          });
        inputlöschen3.value = "";
      }
    })
    } else dialogs.alert("Kein Element gewählt")

  }

buttonLöschen3.addEventListener("click", deleteElement, false);


inputlöschen3.addEventListener('focus', emptyinput);

function emptyinput(e){
  e.preventDefault()
  e.target.value = "";
}
