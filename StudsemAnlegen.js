var Dialogs = require('dialogs');
var dialogs = Dialogs(opts={});

var inputStudiengang = document.querySelector('#studiengang');
var inputSemester = document.querySelector('#semester');
var buttonEintragen1 = document.querySelector('#buttonEintragen1')
const formulare1 = document.querySelectorAll('.formular')

const inputlöschen1 = document.querySelector('#löschen1')
const alleElemente1 = document.querySelector('#alleElemente1')
const buttonLöschen1 = document.querySelector('#buttonLöschen1')
var abkürzung1 = document.querySelector('#abkürzung')


//----------Formular-Datenspeicher---------
var studiengang;
var semester;


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
  if (inputStudiengang.value.trim() != "" && inputSemester.value.trim() != "" && abkürzung1.value.trim() != ""){
    studiengang = inputStudiengang.value.trim().toLowerCase();
    semester = inputSemester.value.trim();

    //Formulardatenspeicher in Datenbank prufungen schreiben
    var sql = "INSERT INTO studiengangssemester (Studiengang, Semesternummer, Abkurzung) VALUES ('"+studiengang+"','"+semester+"','"+abkürzung1.value.trim().toUpperCase()+"');";
    db.query(sql, function(err, results){
    	if(err) throw err;
    });
    dialogs.alert(studiengang+" "+semester+" hinzugefügt")
    setTimeout(() => {
      dialogs.cancel();
    }, 2000)
    //Fomular leeren, damit nicht doppelt hinzugefügt wird.
    formulare1[4].reset()

  }else {dialogs.alert("Studiengang und Semesternummer benötigt");}
}
buttonEintragen1.addEventListener('click', loadFormData, false)

function loadElements(e){
  e.preventDefault();
  while (alleElemente1.firstChild) {
    alleElemente1.firstChild.remove()
  }
  var sql = 'SELECT * FROM studiengangssemester ORDER BY Studiengang, Semesternummer ASC';
  db.query(sql, function(err, results){
  	if(err) throw err;
  	//console.log(results);
    results.forEach(result => {
    	const nOption = document.createElement('option');
    	nOption.value =result["Studiengang"] +" "+ result["Semesternummer"]+"   ["+result["Studiengangssemester_ID"]+"]";
      //alleStudsems.push(result["Nachname"] +" "+ result["Vorname"]+" ["+result["Anwesende_ID"]+"]");
    	alleElemente1.appendChild(nOption);
    });
  });
}
inputlöschen1.addEventListener('focus', loadElements, false);

function deleteElement(e){
  e.preventDefault();
  if(inputlöschen1.value.trim() != ""){
    dialogs.confirm("Soll das Studiengangssemester wirklich gelöscht werden? Es können Abhängigkeiten bestehen.", ok => {
      if(ok === true){
        var toDelete1 = inputlöschen1.value.split("[");
        toDelete = toDelete1[1].split("]");
        toDelete = toDelete[0];
        console.log(toDelete);
        var sql = "DELETE FROM studiengangssemester WHERE Studiengangssemester_ID='"+toDelete+"';";
        db.query(sql, function(err, results){
        	if(err) throw err;
          var sql2 = "DELETE FROM studiengangssemester_belegung WHERE Belegungs_ID NOT IN (SELECT Belegungs_ID FROM studsembelegungverbindung)"
          db.query(sql2, function(err, results){
            if(err) throw err;
            dialogs.alert(toDelete1[0]+" gelöscht.");
            setTimeout(() => {
              dialogs.cancel();
            }, 2000)
          });


          });
        inputlöschen1.value = "";
      }
    })

    } else dialogs.alert("Kein Element gewählt")

  }

buttonLöschen1.addEventListener("click", deleteElement, false);
inputlöschen1.addEventListener('focus', emptyinput);

function emptyinput(e){
  e.preventDefault()
  e.target.value = "";
}
