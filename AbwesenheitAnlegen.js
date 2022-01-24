const inputTyp = document.querySelector("#typ");
const inputTyp2 = document.querySelector("#typ2");
const inputObjekt = document.querySelector("#objekt");
const inputObjekt2 = document.querySelector("#objekt2");
const inputVonDate = document.querySelector("#vonDate");
const inputBisDate = document.querySelector("#bisDate");
const inputTage = document.querySelector("#tage");
const inputVonSlot = document.querySelector("#vonSlot");
const inputBisSlot = document.querySelector("#bisSlot");
const datalisteObjekte = document.querySelector("#objektliste")
const datalisteObjekte2 = document.querySelector("#objektliste2")
const datalisteObjekte3 = document.querySelector("#objektliste3")

const buttonEintragen = document.querySelector('#buttonEintragen')
const formulare = document.querySelectorAll('.formular')

const inputlöschen = document.querySelector('#löschen')
const alleElemente = document.querySelector('#alleElemente')
const buttonLöschen = document.querySelector('#buttonLöschen')
var optionList = document.querySelector("#vorhandeneAbwesenheiten");


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
loadAnwesende2();
loadAbwesenheiten();

function elementLöschen(e){
  e.preventDefault();
  var sql;
  if(optionList.value == ""){
    dialogs.alert("Kein Objekt gewählt")
    return
  }
  if (inputTyp2.value == "Anwesender") {
    sql = "DELETE FROM anwesende_belegung WHERE Belegungs_ID='"+optionList.value+"'"
  } else sql = "DELETE FROM studiengangssemester_belegung WHERE Belegungs_ID='"+optionList.value+"'"
  db.query(sql, function(err, results) {
    if(err) throw err;
  });
  dialogs.alert("Element erfolgreich gelöscht")
  inputObjekt2.value = "";
  while (vorhandeneAbwesenheiten.firstChild) {
    vorhandeneAbwesenheiten.firstChild.remove()
  }
  loadAbwesenheiten()
}
buttonLöschen.addEventListener("click", elementLöschen)



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


function loadAnwesende2() {
  while (datalisteObjekte2.firstChild) {
    datalisteObjekte2.firstChild.remove()
  }
  var sql = 'SELECT * FROM anwesende ORDER BY Nachname, Vorname ASC';
  db.query(sql, function(err, results) {
    if (err) throw err;
    //console.log(results);
    results.forEach(result => {
      const nOption = document.createElement('option');
      nOption.value = result["Nachname"] + " " + result["Vorname"] + " [" + result["Anwesende_ID"] + "]";
      datalisteObjekte2.appendChild(nOption);
    });
  });
}


function loadStudsems2() {
  while (datalisteObjekte2.firstChild) {
    datalisteObjekte2.firstChild.remove()
  }
  var sql = 'SELECT * FROM studiengangssemester ORDER BY Studiengang, Semesternummer ASC';
  db.query(sql, function(err, results) {
    if (err) throw err;
    //console.log(results);
    results.forEach(result => {
      const nOption = document.createElement('option');
      nOption.value = result["Studiengang"] + " " + result["Semesternummer"] + " [" + result["Studiengangssemester_ID"] + "]";
      datalisteObjekte2.appendChild(nOption);
    });
  });
}

function loadObjects2(e) {
  loadAbwesenheiten();
  e.preventDefault()
  inputObjekt2.value = "";
  if (inputTyp2.value == "Anwesender") {
    loadAnwesende2();
  } else loadStudsems2()
}

inputTyp2.addEventListener('change', loadObjects2, false);






function objektIDabfragen2(){
  try {
    var objektID = inputObjekt2.value.trim().split("[");
    var objektID = objektID[1].split("]");
    var objektID = objektID[0];
    return objektID;
  } catch {
    //dialogs.alert("Hoppla, möglicherweise liegt das Objekt nicht in der Form '...[ID]' vor. Bitte die eckigen Klammern mit der ID nicht entfernen.");
    //return;
  }
}


function loadAbwesenheiten(){
  while (vorhandeneAbwesenheiten.firstChild) {
    vorhandeneAbwesenheiten.firstChild.remove()
  }

  // e.preventDefault();
  var objektID = objektIDabfragen2();
  console.log(objektID);
  var sql;
  if(inputTyp2.value === "Anwesender"){
    if(inputObjekt2.value === ""){
      sql = "SELECT * FROM anwesende_belegung, anwesendebelegungverbindung, anwesende WHERE anwesende.Anwesende_ID = anwesendebelegungverbindung.Anwesende_ID AND anwesendebelegungverbindung.Belegungs_ID = anwesende_belegung.Belegungs_ID ORDER BY Nachname, Vorname"
    } else sql = "SELECT * FROM anwesende_belegung, anwesendebelegungverbindung, anwesende WHERE anwesende.Anwesende_ID = '"+objektID+"' AND anwesende.Anwesende_ID = anwesendebelegungverbindung.Anwesende_ID AND anwesendebelegungverbindung.Belegungs_ID = anwesende_belegung.Belegungs_ID ORDER BY Nachname, Vorname"
  } else{

    if(inputObjekt2.value === ""){
      sql = "SELECT * FROM studiengangssemester, studsembelegungverbindung, studiengangssemester_belegung WHERE studiengangssemester.Studiengangssemester_ID = studsembelegungverbindung.Studiengangssemester_ID AND studsembelegungverbindung.Belegungs_ID =  studiengangssemester_belegung.Belegungs_ID ORDER BY Studiengang, Semesternummer"
    } else sql = "SELECT * FROM studiengangssemester, studsembelegungverbindung, studiengangssemester_belegung WHERE studiengangssemester.Studiengangssemester_ID = '"+objektID+"' AND studiengangssemester.Studiengangssemester_ID = studsembelegungverbindung.Studiengangssemester_ID AND studsembelegungverbindung.Belegungs_ID = studiengangssemester_belegung.Belegungs_ID ORDER BY Studiengang, Semesternummer"
  }
  db.query(sql, function(err, results) {
    if(err) throw err;
    for(result of results){
      var text;
      if(inputTyp2.value === "Anwesender"){
      text = result["Nachname"]+" "+result["Vorname"]+"  |  " + dateToString(result["Datum"]) + " bis " + dateToString(result["DatumBis"]) + "  |  Wochentage: " + result["Wochentage"] + "  |  Uhrzeit: " + getTime(parseInt(result["vonTime"])) + " - " + getTime(parseInt(result["bisTime"])+1);
    } else text = result["Studiengang"]+" "+result["Semesternummer"]+"  |  " + dateToString(result["Datum"]) + " bis " + dateToString(result["DatumBis"]) + "  |  Wochentage: " + result["Wochentage"] + "  |  Uhrzeit: " + getTime(parseInt(result["vonTime"])) + " - " + getTime(parseInt(result["bisTime"])+1);
      var option = document.createElement("option");
      option.value = result["Belegungs_ID"];
      var textknoten = document.createTextNode(text);
      option.appendChild(textknoten);

      optionList.appendChild(option);
    }
  });
}

inputObjekt2.addEventListener("change", loadAbwesenheiten)


function loadObjects(e) {

  e.preventDefault()
  inputObjekt.value = "";
  if (inputTyp.value == "Anwesender") {
    loadAnwesende();
  } else loadStudsems()
}

inputTyp.addEventListener('change', loadObjects, false);


function weekdayabfragen(i){
var p;
  if (i.getDay() == 0) {
    p = 7;
  } else p = i.getDay();
return p;
}


function dateToString(i){

  if(i instanceof Date){


    var month = i.getMonth() + 1
    var tage = i.getDate();
    if (month < 10) {
      month = "0" + month;
    }
    if (tage < 10) {
      tage = "0" + tage;
    }
    return i.getFullYear() + "-" + month + "-" + tage;
  }
}


function objektIDabfragen(){
  try {
    var objektID = inputObjekt.value.trim().split("[");
    var objektID = objektID[1].split("]");
    var objektID = objektID[0];
    return objektID;
  } catch {
    dialogs.alert("Hoppla, möglicherweise liegt das Objekt nicht in der Form '...[ID]' vor. Bitte die eckigen Klammern mit der ID nicht entfernen.");
    //return;
  }
}


function sqlabfragen(datumVon, datumBis, timeslots, daysnew){
  var sql;
  if (inputTyp.value == "Anwesender") {
    sql = "INSERT INTO anwesende_belegung (Datum, DatumBis, TS1, TS2, TS3, TS4, TS5, TS6, TS7, TS8, TS9, TS10, TS11, TS12, TS13, TS14, TS15, TS16, TS17, TS18, TS19, TS20, TS21, Wochentage, vonTime, bisTime) VALUES ('" + datumVon + "','" + datumBis + "','" + timeslots[0] + "','" + timeslots[1] + "','" + timeslots[2] + "','" + timeslots[3] + "','" + timeslots[4] + "','" + timeslots[5] + "','" + timeslots[6] + "','" + timeslots[7] + "','" + timeslots[8] + "','" + timeslots[9] + "','" + timeslots[10] + "','" + timeslots[11] + "','" + timeslots[12] + "','" + timeslots[13] + "','" + timeslots[14] + "','" + timeslots[15] + "','" + timeslots[16] + "','" + timeslots[17] + "','" + timeslots[18] + "','" + timeslots[19] + "','" + timeslots[20] + "','"+daysnew+"','"+inputVonSlot.value+"','"+inputBisSlot.value+"')"

  } else sql = "INSERT INTO studiengangssemester_belegung (Datum, DatumBis, TS1, TS2, TS3, TS4, TS5, TS6, TS7, TS8, TS9, TS10, TS11, TS12, TS13, TS14, TS15, TS16, TS17, TS18, TS19, TS20, TS21, Wochentage, vonTime, bisTime) VALUES ('" + datumVon + "','" + datumBis + "','" + timeslots[0] + "','" + timeslots[1] + "','" + timeslots[2] + "','" + timeslots[3] + "','" + timeslots[4] + "','" + timeslots[5] + "','" + timeslots[6] + "','" + timeslots[7] + "','" + timeslots[8] + "','" + timeslots[9] + "','" + timeslots[10] + "','" + timeslots[11] + "','" + timeslots[12] + "','" + timeslots[13] + "','" + timeslots[14] + "','" + timeslots[15] + "','" + timeslots[16] + "','" + timeslots[17] + "','" + timeslots[18] + "','" + timeslots[19] + "','" + timeslots[20] + "','"+daysnew+"','"+inputVonSlot.value+"','"+inputBisSlot.value+"')"
  return sql;
}


function sql2abfragen(objektID, primaryKey){
  if (inputTyp.value == "Anwesender") {
    var sql2 = "INSERT INTO anwesendebelegungverbindung (Anwesende_ID, Belegungs_ID) VALUES ('" + objektID + "','" + primaryKey + "')";
  } else var sql2 = "INSERT INTO studsembelegungverbindung (Studiengangssemester_ID, Belegungs_ID) VALUES ('" + objektID + "','" + primaryKey + "')";
  return sql2;
}


function datenbank(sql, objektID){
  db.query(sql, function(err, results) {
    try {
      if (err) throw err;
    } catch {
      dialogs.alert("Hoppla, das Objekt konnte nicht in die Datenbank eingetragen werden ");
      console.log(err);
      return;
    }

    var primaryKey = results["insertId"];


    sql2 = sql2abfragen(objektID, primaryKey);

    console.log(sql2);
    db.query(sql2, function(err2, results2) {
      try {
        if (err2) throw err2;
      } catch {
        dialogs.alert("Möglicherweise existiert dieses Objekt nicht oder ein anderer Fehler ist aufgetreten");
        console.log(err2);
        return
      }
    })
  });
}

function getTime(number) { //Die Funktion liefert einen String mit der zum Timeslot korespondierenden Uhrzeit zurück.
  var time;
  if (number === 1) {
    time = "09:00";
  } else if (number === 2) {
    time = "09:30";
  } else if (number === 3) {
    time = "10:00";
  } else if (number === 4) {
    time = "10:30";
  } else if (number === 5) {
    time = "11:00";
  } else if (number === 6) {
    time = "11:30";
  } else if (number === 7) {
    time = "12:00";
  } else if (number === 8) {
    time = "12:30";
  } else if (number === 9) {
    time = "13:00";
  } else if (number === 10) {
    time = "13:30";
  } else if (number === 11) {
    time = "14:00";
  } else if (number === 12) {
    time = "14:30";
  } else if (number === 13) {
    time = "15:00";
  } else if (number === 14) {
    time = "15:30";
  } else if (number === 15) {
    time = "16:00";
  } else if (number === 16) {
    time = "16:30";
  } else if (number === 17) {
    time = "17:00";
  } else if (number === 18) {
    time = "17:30";
  } else if (number === 19) {
    time = "18:00";
  } else if (number === 20) {
    time = "18:30";
  } else if (number === 21) {
    time = "19:00";
  } else if(number === 22){
    time = "19:30"
  }
  return time;
}

//----------------------------------------------------------
function loadFormData(e) {

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


    var daysnew = inputTage.value.trim();
    if(!daysnew.includes("1") && !daysnew.includes("2") && !daysnew.includes("3") && !daysnew.includes("4") && !daysnew.includes("5") &&!daysnew.includes("6") &&!daysnew.includes("7")){
      dialogs.alert("Ungültige Eingabe der Wochentage")
      return;
    }



    var timeslots = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];

    for (var i = parseInt(inputVonSlot.value) - 1; i <= parseInt(inputBisSlot.value) - 1; i++) {
      timeslots[i] = "1";
    }


    var objektID = objektIDabfragen();


      var datumVon = dateToString(dateOne);
      var datumBis = dateToString(dateTwo);
      var sql = sqlabfragen(datumVon, datumBis, timeslots, daysnew);
      datenbank(sql, objektID);

    dialogs.alert("Abwesenheit erfolgreich eingetragen")


}

buttonEintragen.addEventListener("click", loadFormData, false);





function deleteOldies(){
  var thisdate = new Date();
  thisdate.setDate(thisdate.getDate()-31);
  console.log("Oldies gelöscht bis: ",thisdate);
  var sql = "DELETE FROM anwesende_belegung WHERE anwesende_belegung.DatumBis < '"+dateToString(thisdate)+"'"
  db.query(sql, function(err, results) {
  });
  var sql2 = "DELETE FROM studiengangssemester_belegung WHERE studiengangssemester_belegung.DatumBis < '"+dateToString(thisdate)+"'"
  db.query(sql2, function(err, results) {
  });
}
deleteOldies();
