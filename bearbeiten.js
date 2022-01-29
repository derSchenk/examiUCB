var Dialogs = require('dialogs');
var dialogs = Dialogs(opts={});
var PdfPrinter = require('pdfmake');
var printer = new PdfPrinter();
var fs = require('fs');
const mysql = require('mysql');


const listanwesen = document.querySelector('#listanwesen');
const buttonAddAnwesen = document.querySelector('#buttonaddanwesen');
const inputAnwesen = document.querySelector('#inputlistanweseninput');
const datalistanwesen = document.querySelector('#datalistanwesen');
const liststudsem = document.querySelector('#liststudsem');
const buttonAddStudsem = document.querySelector('#buttonaddstudsem');
const inputStudsem = document.querySelector('#inputliststudseminput')
const dataliststudsem = document.querySelector('#dataliststudsem')
const buttonUpdate = document.querySelector('#buttonAddPruf');

const prufName = document.querySelector("#prufName");
const prufDauer = document.querySelector("#prufDauer");
const prufArt = document.querySelector("#prüfungsart");
const teilnehmer = document.querySelector("#teilnehmer");
const prüfungsstatus = document.querySelector("#prüfungsstatus");
const standardsemester = document.querySelector("#standardsemester")
const pflichtprufcheck = document.querySelector("#pflichtprufcheck")
const bemerkungen = document.querySelector("#bemerkungen")
const hilfsmittel = document.querySelector("#hilfsmittel")

var alleAnwesen = [];
var alleStudsems = [];

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


  var vorher;
  function changeTeilnehmer(e){
    if(prufDauer.value != "0"){
      vorher = prufDauer.value;
    }
    if(prufArt.value == "Hausarbeit"){
      prufDauer.value = "0"
    } else {
      prufDauer.value = vorher;
      }
  }

prufArt.addEventListener("change", changeTeilnehmer);





  function loadDataPruf(id){

    console.log(id)
    const sql = "SELECT * FROM prufungen WHERE prufungen.Prufung_ID = '"+id+"'";
    db.query(sql, function(err, results){
    	if(err) throw err;
      console.log(results)
      prufName.value = results[0]["Prufung_Name"];
      prufDauer.value = results[0]["Dauer"];
      prufArt.value = results[0]["Prüfungsart"];
      teilnehmer.value = results[0]["Teilnehmerzahl"]
      prüfungsstatus.value = results[0]["Prüfungsstatus"]
      standardsemester.value = results[0]["Standardsemester"];
      if(results[0]["Pflichtprüfung"] === 1){
        pflichtprufcheck.checked = true
      } else pflichtprufcheck.checked = false
      hilfsmittel.value = results[0]["Hilfsmittel"];
      bemerkungen.value = results[0]["Bemerkung"]


    })

  }


fs.readFile('bearbeitenID.txt', 'utf8' , (err, id) => {
  if (err) throw err;


  var sql = "SELECT * FROM prufungen, prufunganwesendeverbindung, anwesende WHERE prufungen.Prufung_ID = '"+id+"' AND prufungen.Prufung_ID = prufunganwesendeverbindung.Prufung_ID AND prufunganwesendeverbindung.Anwesende_ID = anwesende.Anwesende_ID"
  db.query(sql, function(err, results){
  	if(err) throw err;
    results.forEach((result) => {
      var eingabe = result["Nachname"]+", "+result["Vorname"]+" ["+result["Anwesende_ID"]+"]"


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
    })
  })


  var sql2 = "SELECT * FROM prufungen, prufungstudsemverbindung, studiengangssemester WHERE prufungen.Prufung_ID = '"+id+"' AND prufungen.Prufung_ID = prufungstudsemverbindung.Prufung_ID AND prufungstudsemverbindung.Studiengangssemester_ID = studiengangssemester.Studiengangssemester_ID"
  db.query(sql2, function(err, results){
  	if(err) throw err;

    results.forEach((result) => {
      console.log(result)
      var eingabe = result["Studiengang"]+" "+result["Semesternummer"]+"   ["+result["Studiengangssemester_ID"]+"]"
      console.log(eingabe)

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
    })
  })
  buttonUpdate.setAttribute("data-id", id);
  loadDataPruf(id);
  hatTermin(id);
})



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


function extractID(item){
  var temp = item.value.split("[");
  var temp = temp[1].split("]");
  return temp[0];
}


function updatePruf(e){
  e.preventDefault();
  if(prufName.value.trim() === ""){
    dialogs.alert("Bezeichnung der Prüfung darf nicht leer sein. Keine Änderung vorgenommen");
    return;
  }
  dialogs.confirm("Prüfung wirklich ändern?", ok =>{
    if(ok === true){
      sql = "UPDATE prufungen SET Prufung_Name = '"+prufName.value.trim().toLowerCase()+"', Teilnehmerzahl = '"+teilnehmer.value+"', Standardsemester = '"+standardsemester.value+"', Prüfungsstatus = '"+prüfungsstatus.value+"', Bemerkung = '"+bemerkungen.value.trim()+"', Hilfsmittel = '"+hilfsmittel.value.trim()+"', Pflichtprüfung = '"+(pflichtprufcheck.checked ? 1 : 0)+"', Prüfungsart = '"+prufArt.value+"', Dauer = '"+prufDauer.value+"' WHERE Prufung_ID = '"+this.getAttribute("data-id")+"'"
      console.log("sql: ", sql)
      db.query(sql, function(err, results){
        if(err) throw err;

      })

      studsems = dataliststudsem.children;
      anwesende = datalistanwesen.children;
      Array.from(studsems).forEach((studsem) => {
        if(!studsem.selected){
          sql2 = "DELETE FROM prufungstudsemverbindung WHERE Prufung_ID = '"+this.getAttribute("data-id")+"' AND Studiengangssemester_ID = '"+extractID(studsem)+"'"
          db.query(sql2, function(err, results){
            if(err) throw err;

          })
        }else{
          var this2 = this;
          sql6 = "SELECT 1 FROM prufungstudsemverbindung WHERE Prufung_ID = '"+this.getAttribute("data-id")+"' AND Studiengangssemester_ID = '"+extractID(studsem)+"'";
          db.query(sql6, function(err, results){
            if(err) throw err;
            if(results.length === 0){
              sql7 = "INSERT INTO prufungstudsemverbindung (Prufung_ID, Studiengangssemester_ID) VALUES ('"+this2.getAttribute("data-id")+"', '"+extractID(studsem)+"')";
              db.query(sql7, function(err, results){
                if(err) throw err;

              })
            }
        })
      }
    })


      Array.from(anwesende).forEach((anweseder) => {
        if(!anweseder.selected){
          sql3 = "DELETE FROM prufunganwesendeverbindung WHERE Prufung_ID = '"+this.getAttribute("data-id")+"' AND Anwesende_ID = '"+extractID(anweseder)+"'";
          db.query(sql3, function(err, results){
            if(err) throw err;
          })
        }else{
          var this2 = this;
          sql4 = "SELECT 1 FROM prufunganwesendeverbindung WHERE Prufung_ID = '"+this.getAttribute("data-id")+"' AND Anwesende_ID = '"+extractID(anweseder)+"'";
          db.query(sql4, function(err, results){
            if(err) throw err;
            if(results.length === 0){
              sql5 = "INSERT INTO prufunganwesendeverbindung (Prufung_ID, Anwesende_ID) VALUES ('"+this2.getAttribute("data-id")+"', '"+extractID(anweseder)+"')";
              db.query(sql5, function(err, results){
                if(err) throw err;

              })
            }

          })
        }
      })


    dialogs.alert("Prüfung erfolgreich geändert.")
    setTimeout(() => {
      window.close();
    }, 1000)
    }
  })



}


buttonUpdate.addEventListener("click", updatePruf);








function hatTermin(id){
  var sql = "SELECT 1 FROM prunfung_termin_verb WHERE prunfung_termin_verb.Prufung_ID = '"+id+"'"
  db.query(sql, function(err, results){
    if(err) throw err;
    if(results.length > 0){
      dialogs.alert("Diese Prüfung hat bereits einen Termin und ist deswegen nur eingeschränkt bearbeitbar.")
      const nochange = document.querySelectorAll(".nochange");
      console.log(nochange);
      for(item of nochange){
        item.setAttribute("hidden", "hidden")
      }
    }
  })
}
