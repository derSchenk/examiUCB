var Dialogs = require('dialogs');
var dialogs = Dialogs(opts={});

var inputStudiengang = document.querySelector('#studiengang');
var inputSemester = document.querySelector('#semester');
var buttonEintragen = document.querySelector('#buttonEintragen')
const formulare = document.querySelectorAll('.formular')

const inputlöschen = document.querySelector('#löschen')
const alleElemente = document.querySelector('#alleElemente')
const buttonLöschen = document.querySelector('#buttonLöschen')


//----------Formular-Datenspeicher---------
var studiengang;
var semester;


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
  if (inputStudiengang.value.trim() != "" && inputSemester.value.trim() != ""){
    studiengang = inputStudiengang.value.trim().toLowerCase();
    semester = inputSemester.value.trim();

    //Formulardatenspeicher in Datenbank prufungen schreiben
    var sql = "INSERT INTO studiengangssemester (Studiengang, Semesternummer) VALUES ('"+studiengang+"','"+semester+"');";
    db.query(sql, function(err, results){
    	if(err) throw err;
    });
    dialogs.alert(studiengang+" "+semester+" hinzugefügt")
    //Fomular leeren, damit nicht doppelt hinzugefügt wird.
    formulare[0].reset()

  }else {dialogs.alert("Studiengang und Semesternummer benötigt");}
}
buttonEintragen.addEventListener('click', loadFormData, false)

function loadElements(e){
  e.preventDefault();
  while (alleElemente.firstChild) {
    alleElemente.firstChild.remove()
  }
  var sql = 'SELECT * FROM studiengangssemester ORDER BY Studiengang, Semesternummer ASC';
  db.query(sql, function(err, results){
  	if(err) throw err;
  	//console.log(results);
    results.forEach(result => {
    	const nOption = document.createElement('option');
    	nOption.value =result["Studiengang"] +" "+ result["Semesternummer"]+"   ["+result["Studiengangssemester_ID"]+"]";
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
    var sql = "DELETE FROM studiengangssemester WHERE Studiengangssemester_ID='"+toDelete+"';";
    db.query(sql, function(err, results){
    	if(err) throw err;
    	dialogs.alert(toDelete1[0]+" gelöscht.");

      });
    } else dialogs.alert("Kein Element gewählt")
    inputlöschen.value = "";
  }

buttonLöschen.addEventListener("click", deleteElement, false);
