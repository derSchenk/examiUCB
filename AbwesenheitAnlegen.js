const inputTyp = document.querySelector("#typ");
const inputObjekt = document.querySelector("#objekt");
const inputVonDate = document.querySelector("#vonDate");
const inputBisDate = document.querySelector("#bisDate");
const inputTage = document.querySelector("#tage");
const inputVonSlot = document.querySelector("#vonSlot");
const inputBisSlot = document.querySelector("#bisSlot");
const datalisteObjekte = document.querySelector("#objektliste")

const buttonEintragen = document.querySelector('#buttonEintragen')
const formulare = document.querySelectorAll('.formular')

const inputlöschen = document.querySelector('#löschen')
const alleElemente = document.querySelector('#alleElemente')
const buttonLöschen = document.querySelector('#buttonLöschen')


//--------------------------------------------
function checkSlot(e) {
  e.preventDefault();
  if (parseInt(inputBisSlot.value) < parseInt(inputVonSlot.value)) {
    inputBisSlot.value = inputVonSlot.value;

  }
}

function checkSlot2(e) {
  e.preventDefault();
  if (parseInt(inputBisSlot.value) < parseInt(inputVonSlot.value)) {
    inputVonSlot.value = inputBisSlot.value;

  }
}
inputVonSlot.addEventListener("change", checkSlot, false);
inputBisSlot.addEventListener("change", checkSlot2, false);

function checkDate2(e) {
  e.preventDefault();
  inputBisDate.setAttribute("min", inputVonDate.value);
  // var date1 = new Date(inputVonDate.value);
  // var date2 = new Date(inputBisDate.value);
  // if(date1 > date2){
  // inputBisDate.value = inputVonDate.value;
  // }

}

inputVonDate.addEventListener("change", checkDate2, false);
// inputBisDate.addEventListener("change", checkDate2, false);
console.log("this is: " + typeof inputBisDate.value);
//--------------------------------------------
//https://stackoverflow.com/questions/492994/compare-two-dates-with-javascript
//stackoverflow.com/questions/9989382/how-can-i-add-1-day-to-current-date
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

db.connect(function(err) {
  if (err) throw err;
  console.log("Verbindung zur Datenbank hergestellt.")
});

//
loadAnwesende();

function loadAnwesende() {
  while (datalisteObjekte.firstChild) {
    datalisteObjekte.firstChild.remove()
  }
  var sql = 'SELECT * FROM anwesende ORDER BY Nachname, Vorname ASC';
  db.query(sql, function(err, results) {
    if (err) throw err;
    //console.log(results);
    results.forEach(result => {
      const nOption = document.createElement('option');
      nOption.value = result["Nachname"] + " " + result["Vorname"] + " [" + result["Anwesende_ID"] + "]";
      datalisteObjekte.appendChild(nOption);
    });
  });
}

function loadStudsems() {
  while (datalisteObjekte.firstChild) {
    datalisteObjekte.firstChild.remove()
  }
  var sql = 'SELECT * FROM studiengangssemester ORDER BY Studiengang, Semesternummer ASC';
  db.query(sql, function(err, results) {
    if (err) throw err;
    //console.log(results);
    results.forEach(result => {
      const nOption = document.createElement('option');
      nOption.value = result["Studiengang"] + " " + result["Semesternummer"] + " [" + result["Studiengangssemester_ID"] + "]";
      datalisteObjekte.appendChild(nOption);
    });
  });
}

function loadObjects(e) {
  e.preventDefault()
  inputObjekt.value = "";
  if (inputTyp.value == "Anwesender") {
    loadAnwesende();
  } else loadStudsems()
}

inputTyp.addEventListener('change', loadObjects, false);






//----------------------------------------------------------
function loadFormData(e) {
  try {
    e.preventDefault();
    if (inputObjekt.value.trim() == "" || inputVonDate.value == "") {
      dialogs.alert("Objekt und Start-Datum müssen gewählt sein");
      return;
    }

    if (inputBisDate.value == "") {
      inputBisDate.value = inputVonDate.value;
      if (inputTage.value.trim() == "") {
        inputTage.value = "1 2 3 4 5 6 7";
      }
    }

    if (inputTage.value == "") {
      inputTage.value = "1 2 3 4 5";
    }

    var dateOne = new Date(inputVonDate.value);
    var dateTwo = new Date(inputBisDate.value);

    if (dateOne > dateTwo) {
      dialogs.alert("Das Start-Datum muss kleiner-gleich dem End-Datum sein");
      inputBisDate.value = inputVonDate.value;
      return;
    }

    var days = inputTage.value.trim().split(" ");

    for (item of days) {
      if (item != "1" && item != "2" && item != "3" && item != "4" && item != "5" && item != "6" && item != "7") {
        dialogs.alert("Kein gültige Eingabe der Wochentage");
        return;
      }
    }

    var timeslots = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];

    for (var i = parseInt(inputVonSlot.value) - 1; i <= parseInt(inputBisSlot.value) - 1; i++) {
      timeslots[i] = 1;
    }

    console.log(days);

    var p;
    for (var i = dateOne; i <= dateTwo; i.setDate(i.getDate() + 1)) {

      if (i.getDay() == 0) {
        p = 7;
      } else p = i.getDay();

      var month = i.getMonth() + 1
      var tage = i.getDate();
      if (month < 10) {
        month = "0" + month;
      }
      if (tage < 10) {
        tage = "0" + tage;
      }
      var datumFull = i.getFullYear() + "-" + month + "-" + tage;

      //https://stackoverflow.com/questions/41015307/sql-server-if-exists-then-1-else-2
      try {
        var objektID = inputObjekt.value.trim().split("[");
        var objektID = objektID[1].split("]");
        var objektID = objektID[0];
      } catch {
        dialogs.alert("Hoppla, möglicherweise liegt das Objekt nicht in der Form '...[ID]' vor. Bitte die eckigen Klammern mit der ID nicht entfernen.");
        return;
      }

      if (inputTyp.value == "Anwesender") {
        var sql = "INSERT INTO anwesende_belegung (Datum, TS1, TS2, TS3, TS4, TS5, TS6, TS7, TS8, TS9, TS10, TS11, TS12, TS13, TS14, TS15, TS16, TS17, TS18, TS19, TS20, TS21) VALUES ('" + datumFull + "','" + timeslots[0] + "','" + timeslots[1] + "','" + timeslots[2] + "','" + timeslots[3] + "','" + timeslots[4] + "','" + timeslots[5] + "','" + timeslots[6] + "','" + timeslots[7] + "','" + timeslots[8] + "','" + timeslots[9] + "','" + timeslots[10] + "','" + timeslots[11] + "','" + timeslots[12] + "','" + timeslots[13] + "','" + timeslots[14] + "','" + timeslots[15] + "','" + timeslots[16] + "','" + timeslots[17] + "','" + timeslots[18] + "','" + timeslots[19] + "','" + timeslots[20] + "')"

      } else var sql = "INSERT INTO studiengangssemester_belegung (Datum, TS1, TS2, TS3, TS4, TS5, TS6, TS7, TS8, TS9, TS10, TS11, TS12, TS13, TS14, TS15, TS16, TS17, TS18, TS19, TS20, TS21) VALUES ('" + datumFull + "','" + timeslots[0] + "','" + timeslots[1] + "','" + timeslots[2] + "','" + timeslots[3] + "','" + timeslots[4] + "','" + timeslots[5] + "','" + timeslots[6] + "','" + timeslots[7] + "','" + timeslots[8] + "','" + timeslots[9] + "','" + timeslots[10] + "','" + timeslots[11] + "','" + timeslots[12] + "','" + timeslots[13] + "','" + timeslots[14] + "','" + timeslots[15] + "','" + timeslots[16] + "','" + timeslots[17] + "','" + timeslots[18] + "','" + timeslots[19] + "','" + timeslots[20] + "')"

      if (days.includes(String(p))) {
        console.log(i.getDate());

        console.log(sql);
        db.query(sql, function(err, results) {
          try {
            if (err) throw err;
          } catch {
            dialogs.alert("Hoppla, das Objekt konnte nicht in die Datenbank eingetragen werden ");
            console.log(err);
            return;
          }

          var primaryKey = results["insertId"];

          if (inputTyp.value == "Anwesender") {
            var sql2 = "INSERT INTO anwesendebelegungverbindung (Anwesende_ID, Belegungs_ID) VALUES ('" + objektID + "','" + primaryKey + "')";
          } else var sql2 = "INSERT INTO studsembelegungverbindung (Studiengangssemester_ID, Belegungs_ID) VALUES ('" + objektID + "','" + primaryKey + "')";

          console.log(sql2);
          db.query(sql2, function(err2, results2) {
            try {
              if (err2) throw err2;
              dialogs.alert("Abwesenheit erfolgreich eingetragen")
            } catch {
              dialogs.alert("Möglicherweise existiert dieses Objekt nicht oder ein anderer Fehler ist aufgetreten");
              console.log(err2);
              return
            }



          })
        });
      }
    }
  } catch {
    dialogs.alert("Ein unbekanner Fehler ist aufgetreten");
  }

}

buttonEintragen.addEventListener("click", loadFormData, false);




// //----Berechne KW + Day aus Date
// function dateTokw3(i){
// //https://die-aktuelle-kalenderwoche.de/kalenderwochen-in-javascript
//   var date = i;
//   var day = date.getDay();
//   if(day == 0){   //Amerikanische Wochen starten mit Sonntag
//     day = day + 7;
//   }
// var currentThursday = new Date(date.getTime() +(3-((date.getDay()+6) % 7)) * 86400000);
// // At the beginnig or end of a year the thursday could be in another year.
// var yearOfThursday = currentThursday.getFullYear();
// // Get first Thursday of the year
// var firstThursday = new Date(new Date(yearOfThursday,0,4).getTime() +(3-((new Date(yearOfThursday,0,4).getDay()+6) % 7)) * 86400000);
// // +1 we start with week number 1
// // +0.5 an easy and dirty way to round result (in combinationen with Math.floor)
// var weekNumber = Math.floor(1 + 0.5 + (currentThursday.getTime() - firstThursday.getTime()) / 86400000/7);
//
// var kwunddate = [];
// kwunddate.push(weekNumber);
// kwunddate.push(day);
//
// return kwunddate;
// }
