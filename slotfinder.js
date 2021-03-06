var Dialogs = require('dialogs');
var dialogs = Dialogs(opts = {});
const lodash = require("lodash");
const mysql = require('mysql');
var feiertagejs = require('feiertagejs');

const formular = document.querySelectorAll('#formular');
const buttonSend = document.querySelector('input[type="submit"]');
const buttonAdd = document.querySelector('#buttonaddpruf');
const buttonAdd2 = document.querySelector('#buttonaddpruf2');
const prufungInput = document.querySelector('#inputlistprufinput');
const datalistPruf = document.querySelector('#datalistpruf');
const listprufungen = document.querySelector('#listprufungen');
const kategorie = document.querySelector("#selectroomcat");
const raumgrid = document.querySelector("#raumgrid");
const minutes = document.querySelector("#ZeitPrufung");
const raumkat = document.querySelector('#selectroomcat')

const drags = document.querySelectorAll(".dragable");
const dnd = document.querySelector(".dnd");
const dragcontainer = document.querySelectorAll(".newdrag");
const datumInput2 = document.querySelector("#kws");

const buttonEintragen = document.querySelector("#buttonEintragen")

const prüfungsgruppelist = document.querySelector("#prüfungsgruppelist")
const prüfungsgruppeinput = document.querySelector('#prüfungsgruppe')

const savedate = document.querySelector("#savedate");

const testbutton = document.querySelector("#test");

const kapübesicht = document.querySelector("#animation");
const vondatum = document.querySelector("#vondatum");
const bisdatum = document.querySelector("#bisdatum");
const kapbutton = document.querySelector("#kapbutton");
const kaptable = document.querySelector("#kaptable tbody");



//----------Formular-Datenspeicher--------- //Unnutz
var prufungen;
var roomcat;
var time;
var kalenderwochen = [];
var days = [];
//--------------------------------------------

//Sonstige globale Variablen------------------
var allePrufungen = [];
var dragID = 1;
//--------------------------------------------

const datumInput = document.querySelector("#kws");




//Datenbankverbindung herstellen---------------


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

//----------------------------------------------------------


function setDate(){

  var saved = new Date(localStorage['savedDate']);
  var today = new Date();
  if(saved > today){
    today = saved;
  }

  if(today.getDay() === 0){
    today.setDate(today.getDate()+1)
  }
  if(today.getDay() === 6){
    today.setDate(today.getDate()+2)
  }
  datumInput2.value = transformDateToHTML(today);

}
setDate();


function dateskapübersicht(){
   vondatum.value = datumInput2.value;
   var toDate = new Date(datumInput2.value);
   toDate.setDate(toDate.getDate()+21);
   bisdatum.value = transformDateToHTML(toDate);
}
kapübesicht.addEventListener("mouseenter", dateskapübersicht);





function savethisdate(){
  localStorage['savedDate'] = datumInput2.value;
}
savedate.addEventListener("click", savethisdate);



function loadgroups(){
  const sql = "SELECT * FROM prufungsgruppe"
  db.query(sql, function(err, results){
    if(err) throw err;
    results.forEach(result => {
    	const nOption = document.createElement('option');
    	nOption.value = result["Bezeichnung"].toLowerCase().trim()+" ["+result["Prufungsgruppen_ID"]+"]";
    	prüfungsgruppelist.appendChild(nOption);
    });
  })
}
loadgroups();


//Laden der Vorschläge für die Prüfungen--------------------
function ladeVorschläge(){
  prufungInput.value = "";
  var sql = 'SELECT * FROM prufungen WHERE Prufung_ID NOT IN (SELECT Prufung_ID FROM prunfung_termin_verb)';
  db.query(sql, function(err, results) {
    if (err) throw err;
    //console.log(results);
    results.forEach(result => {
      if(result["Prüfungsart"] !== "Hausarbeit"){
        const nOption = document.createElement('option');
        var inhalt = result["Prufung_Name"].toLowerCase().trim() + " | " + result["Standardsemester"] + " | " + result["Prüfungsstatus"] + " [T.: " + result["Teilnehmerzahl"] + "]" + " [D.: " + result["Dauer"] + "]" + " [ID.: " + result["Prufung_ID"] + "]" + " [PP.: " + (result["Pflichtprüfung"] === 1 ? "J" : "N") + "]";
        nOption.value = inhalt;
        allePrufungen.push(inhalt);
        listprufungen.appendChild(nOption);
      }
    });
  });
}
ladeVorschläge();




function removeduplicates2(arr){
  var arrNew = [];
  for(a of arr){
    if(arrNew.indexOf(a) === -1 && a !== 0){
      arrNew.push(a)
    }
  }
  return arrNew;
}

function übersicht(paraDatum, callback){

    const drops = document.querySelectorAll(".insidediv");              //greife alle Timeslots
    var freieRäume = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];       //Setze zunächst alle Zeitfenster auf besetzt (Bsp: Wenn freieRäume[0] == 0, dann sind um 9:00 keine Räume frei, wenn freieRäume[1] == 13, dann sind um 9:30 13 Räume frei...)
    var capRäume =  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];        //daraus folgt, dass die zur Verfügung stehende Kapazität zunächts auch 0 ist
    var räume = [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]];
    var länge = calcTimeSlots();                                        //berechne die die aus der Dauer der Prüfung hervorgehende Anzahl an benötigten Timeslots. Dauert die Prüfung 90 Minuten, müssen 4 Timeslot (3 + 1 Pufferslot zur nächsten Prüfung = 4)


    for(drop of drops){       //durchlaufe Slot für Slot und...
      var checker = true;     //Gehe zunächst davon auf dass dieser Slot frei ist, solange nichts anderes bewiesen
      var droplauf = drop;    //Erstelle einen Prüfer und setze ihn am Slot an
      for(var i = 0; i < länge; i++){  //Lasse den Prüfer weiterlaufen zu den nächsten Timeslots die auch noch für die Prüfung benötigt werden. Wenn eine Prüfung 4 Timeslots dauert muss sowohl der Slot selbts als auch die nächsten 3 anderen überprüft werden ob...
        try{
          if(drop.hasAttribute("data-empfehlung") || droplauf.getAttribute("data-state") === "oc"){    //...sie besetzt sind (oc == occupied) oder ob sich der drop außerhalb des zulässigen Bereichs befindet (Wenn die Prüfung 120 Minuten (entspricht 5 Timeslots) dauert, darf Sie natürlich nicht um 19:00 beginnen.). Timeslot hat dann das Attribute data-empfehlung="verboten"
            checker = false;  //wenn dies der Fall ist der Timeslot nicht frei
            break;
          }
          droplauf = droplauf.nextSibling; //Lass den Prüfer zum nächsten Slot wandern.
        } catch{console.log("letzte können nicht gelesen werden")}     //ist drop beim letzen Timeslot angekommen hat er keinen nextSibling, der Prüfer läft also in Leere. Dies gibt einen Fehler
      }
      if(checker){ //Wenn Checker immernoch true, dann ist der Slot wirklich Frei
        freieRäume[parseInt(drop.getAttribute("data-this"))-1] += 1;       //Zähle den Counter an der Stelle des zum Slot korespondierenden Zeitfensters hoch
        capRäume[parseInt(drop.getAttribute("data-this"))-1] += parseInt(drop.getAttribute("data-cap")); //Rechne auch die Kapazität des Raumes drauf
        räume[parseInt(drop.getAttribute("data-this"))-1].push(drop.getAttribute("data-parent")+" (Kap: "+drop.getAttribute("data-cap")+")")
      }
    }

    for(var i = 20; i > (freieRäume.length-1)-(calcTimeSlots()-1); i--){
      freieRäume[i] = 0; //Setze die freien Räume außerhalb des zulässigen Bereiches auf 0 [RELIKT? Prüfen ob noch nötig]
    }

    var freieRäumeCopy = freieRäume.slice();   //Kopiere Array freieRäume (.slice() kopiert das Array wirklich ansstatt nur einen zweiten Verweis auf das alte Array zu setzen)
    console.log(freieRäume);
    var sortedCopy = removeduplicates2(freieRäumeCopy.sort((a, b) => a - b)).reverse();   //Sortiere dieses Array, drehe es um und entferne Duplikate. Die größte Anzahl an Räumen steht nun an Index 0, die kleinster am letzten Index
    console.log(sortedCopy);


    var arrmaped = [];  //In diesem Array sollen für jedes Zeitfenster die die maximale Anzahl an Räumen, der maximalen zur verfügungstehenden Kapaziät zugeordnet werden. BSP.: [[12, 345], [3, 43], [4, 34]...]
    for(f in freieRäume){       //Hinweis: Bei einer for(item OF ...)-Schleife ist item das Objekt selbst, während bei einer for(item IN ...)-Schleife item der Index des Objekts ist. Weiß nicht ob das bei anderen Programmiersprachen auch so ist.
      var arrPair = [];  //Array für Paare
      arrPair.push(freieRäume[f]);
      arrPair.push(capRäume[f]); //Paar hnzufügen
      arrmaped.push(arrPair.slice()); //Echte Kopie von arrPair in arrmaped einfügen
    }


    //Hier soll zu der höchsten Anzahl an freien Räumen am Tag, die höchste Anzahl an Kapazität zugeordnet werden. Beispiel: An einem Tag sind beträgt die maximale Anzahl an Räumen 5. Jedoch sind um 9:30 fünf Räume mit einer Kap. von 100 Personen aber um 12:30 sind es 5 Räume mit 40 Personen. Wir wollen dann das Paar [5, 100] nicht das Paar [5, 40]. Dieses Vorgang für alle
    var maxNumbers = [];
    for(a in sortedCopy){    //Laufe das sortierte Array mit der Anzahl an freien Räumen ab. Gößter Wert ist in Index 0
      maxNumbers.push(0);
      for(b of arrmaped){
        if(b[0] === sortedCopy[a]){
          if(b[1] > maxNumbers[maxNumbers.length-1]){
            maxNumbers[maxNumbers.length-1] = b[1];
          }
        }
      }
    }

    console.log("maxN", maxNumbers);
    for(var i = 0; i <= 20; i++){
      arrmaped[i].unshift(getTime(i+1) + " - ")
    }

    //Erstelle Zeile in Kapazitätstabelle
    var row = document.createElement("tr");
    var zelleDate = document.createElement("td");
    zelleDate.setAttribute("data-date", paraDatum);
    zelleDate.addEventListener("click", gotothisdate);
    zelleDate.classList.add("datadate");
    var text = document.createTextNode(paraDatum);
    var nbr = document.createElement("nobr");
    nbr.appendChild(text);
    zelleDate.appendChild(nbr);
    zelleDate.setAttribute("title", "Im Slotfinder öffnen")
    var zelleState = document.createElement("td");


    if(sortedCopy.length === 0){
      zelleState.style.backgroundColor = "#f7665e";
      text = document.createTextNode("voll");
      zelleState.appendChild(text);

      var zelleRäume = document.createElement("td");
      text = document.createTextNode("0");
      zelleRäume.appendChild(text);

      var zelleMaxKap = document.createElement("td");
      text = document.createTextNode("0");
      zelleMaxKap.appendChild(text);
    } else {

      if(maxNumbers[0] < getTeilnehmer()){
        zelleState.style.backgroundColor = "#ED8D66";
        text = document.createTextNode("gering");
      }else{
        zelleState.style.backgroundColor = "#95f0b6";
        text = document.createTextNode("frei");
      }

      zelleState.appendChild(text);

      var zelleRäume = document.createElement("td");
      //text = document.createTextNode(sortedCopy[0].toString());

      text = document.createTextNode(String(Math.max(...sortedCopy)) +"R | "+ String(maxNumbers[0])+ "K");
      zelleRäume.appendChild(text);

      var zelleMaxKap = document.createElement("td");
//      text = document.createTextNode(maxNumbers[0].toString());
      zelleMaxKap = createNiceSlots(arrmaped.join("K | ").replaceAll("- ,", "- ").replaceAll(",", "R ") + "K", zelleMaxKap, räume);
      // text = document.createTextNode("...");
      // zelleMaxKap.appendChild(text);
    }

    row.appendChild(zelleDate);
    row.appendChild(zelleState);
    row.appendChild(zelleRäume);
    row.appendChild(zelleMaxKap);
    kaptable.appendChild(row);
    callback();
}


function createNiceSlots(string, div, räume){
  var strArr = string.split(" | ");
  var div1 = document.createElement("div");
  div1.classList.add("fatherNiceSlot")
  var div2 = document.createElement("div");
  div2.classList.add("fatherNiceSlot")
  var div3 = document.createElement("div");
  div3.classList.add("fatherNiceSlot")
  for(var i = 0; i <= 6; i++){
    var innerDiv = document.createElement("div");
    innerDiv.classList.add("niceSlot");
    var nbr = document.createElement("nobr");
    var text = document.createTextNode(strArr[i]);
    nbr.appendChild(text);
    innerDiv.setAttribute("title", räume[i].join(" | "))
    innerDiv.appendChild(nbr);
    div1.appendChild(innerDiv);
  }
  for(var i = 7; i <= 13; i++){
    var innerDiv = document.createElement("div");
    innerDiv.classList.add("niceSlot");
    var nbr = document.createElement("nobr");
    var text = document.createTextNode(strArr[i]);
    nbr.appendChild(text);
    innerDiv.setAttribute("title", räume[i].join(" | "))
    innerDiv.appendChild(nbr);
    div2.appendChild(innerDiv);
  }
  for(var i = 14; i <= 20; i++){
    var innerDiv = document.createElement("div");
    innerDiv.classList.add("niceSlot");
    var nbr = document.createElement("nobr");
    var text = document.createTextNode(strArr[i]);
    nbr.appendChild(text);
    innerDiv.setAttribute("title", räume[i].join(" | "))
    innerDiv.appendChild(nbr);
    div3.appendChild(innerDiv);
  }
  div.appendChild(div1);
  div.appendChild(div2);
  div.appendChild(div3);
  return div;
}

function gotothisdate(e){
  e.preventDefault();
  datumInput2.value = this.getAttribute("data-date");
  setVisible(e);
}

// const body= document.querySelector("body");


window.addEventListener("load", setVisible);







//-----------------------------------------------------------------

function transformDateToHTML(datum){
  var day = datum.getDate();
  var month = datum.getMonth()+1;
  if(day < 10){
    day = "0"+day;
  }
  if(month < 10){
    month = "0"+month;
  }
  datumstring = datum.getFullYear()+'-'+month+'-'+day;
  return datumstring
}


const plus = document.querySelector("#plus");
function addDate(){

  if(datumInput2.value == ""){
    setDate()
  }
  var datum = new Date(datumInput2.value)
  if(datum.getDay() == 5){
    datum.setDate(datum.getDate()+3);
  } else datum.setDate(datum.getDate()+1);

  datumInput2.value = transformDateToHTML(datum);
}
plus.addEventListener("click", addDate);


const minus = document.querySelector("#minus");
function subDate(){
  if(datumInput2.value == ""){
    setDate();
  }
  var datum = new Date(datumInput2.value)
  if(datum.getDay() == 1){
    datum.setDate(datum.getDate()-3);
  } else datum.setDate(datum.getDate()-1);
  datumInput2.value = transformDateToHTML(datum);
}
minus.addEventListener("click", subDate);


//------------------------------------------------------------


function setVisible(e) {
  //Das Panel (Mit Papierkorb und Tokenquelle) soll erst sichbar sein, sobald auf "Slot suchen" gedrückt wird
  //hierfür hidden entfernen und display eigenschaft (flex, table-cell) hinzufügen. Display direkt ins CSS-Sheet zuschreiben ist nicht möglich, da dann hidden nicht mehr funktioniert
  e.preventDefault();
  dnd.removeAttribute("hidden");
  dnd.style.display = "table-cell";
  dnd2 = document.querySelector(".newdrag .dnd")
  dnd2.textContent = calcTimeSlots();
  dragcontainer.forEach((item) => {
    item.removeAttribute("hidden")
    item.style.display = "flex"
  })
  buttonEintragen.removeAttribute("hidden");


  loadRooms(undefined, function(){
    console.log("Funktion wurde ausgeführt.")
    ladeBelegungen(undefined, function(){
      console.log("aber hatschi")
      schonPrufung(undefined, function(){
        console.log("auch diese Funktion wurde ausgeührt...buh")
        ladeVerplanteAnwesende(undefined, function(){
          console.log("keine Ahnung ob das klappt")
          loadRoomBelegung(function(){
            console.log("alles Mist hier")
            setzeVerboteneDrops(function(){
              console.log("verbote wurde gesetzt.")
            })
          })
        })
      });
    })
  });
  checkDate();
  //Statt hidden könnte auch Display = none gesetzt werden? Besser?
}

buttonSend.addEventListener('click', setVisible, false);
//---------------------------------------------------

function deleteRooms(callback){
  while(raumgrid.firstChild){
    raumgrid.firstChild.remove();
  }
  dialogs.cancel();
  callback()
}

function deleteRooms2(callback){
  while(raumgrid.firstChild){
    raumgrid.firstChild.remove();
  }
  dialogs.cancel();

}


function doSomething(datum, callback){
  console.log(datum);
  loadRooms(datum, function(){
    console.log("Funktion wurde ausgeführt.")
    ladeBelegungen(datum, function(){
      console.log("aber hatschi")
      schonPrufung(datum, function(){
        console.log("auch diese Funktion wurde ausgeührt...buh")
        ladeVerplanteAnwesende(datum, function(){
          console.log("keine Ahnung ob das klappt")
          loadRoomBelegung(function(){
            console.log("alles Mist hier")
            setzeVerboteneDrops(function(){
              console.log("Verbotene wurden gesetzt");
              übersicht(datum, function(){
                console.log("es geht nicht")
                deleteRooms(function(){
                  console.log("Jetzt sollten die Räume wieder gelöscht werden aber...")
                  callback();
                })
              });
            })
          })
        })
      });
    })
  });
}



function übersichtbutton(e) {
  //Das Panel (Mit Papierkorb und Tokenquelle) soll erst sichbar sein, sobald auf "Slot suchen" gedrückt wird
  //hierfür hidden entfernen und display eigenschaft (flex, table-cell) hinzufügen. Display direkt ins CSS-Sheet zuschreiben ist nicht möglich, da dann hidden nicht mehr funktioniert
    e.preventDefault();

  kaptable.innerHTML = "";



  // dnd.removeAttribute("hidden");
  // dnd.style.display = "table-cell";
  // dnd2 = document.querySelector(".newdrag .dnd")
  // dnd2.textContent = calcTimeSlots();
  // dragcontainer.forEach((item) => {
  //   item.removeAttribute("hidden")
  //   item.style.display = "flex"
  // })
  // buttonEintragen.removeAttribute("hidden");

  var startDate = new Date(vondatum.value);
  var endDate = new Date(bisdatum.value);
  var data = [];

  for(var i = startDate; i <= endDate; i.setDate(i.getDate()+1)){

    if(feiertagejs.isHoliday(i, "RP") || i.getDay() === 0 || i.getDay() === 6){
      continue;
    }


    data.push(transformDateToHTML(i));
  }


  var xlauf = 0;
  var loopArray = function(arr) {
      doSomething(arr[xlauf],function(){
          // set x to next item
          xlauf++;

          // any more items in array? continue loop
          if(xlauf < arr.length) {
              loopArray(arr);
          }
      });
  }

  loopArray(data);



}
kapbutton.addEventListener("click", übersichtbutton);





//Verschieben der Prüfung von Input zu Select--------------------------

function addPrufung(e) {
  e.preventDefault();
  var eingabe = prufungInput.value;
  var checker = true;
  var vorhanden = datalistPruf.children;
  if (vorhanden.length > 0) {
    Array.from(vorhanden).forEach(function(item) {
      if (item.value.localeCompare(eingabe) == 0) {
        checker = false;
      }
    });
  }

  if (checker == true && eingabe.length > 0 && allePrufungen.includes(eingabe)) {
    const neueOption = document.createElement('option');
    neueOption.value = eingabe;
    neueOption.selected = true;
    const neuerText = document.createTextNode(eingabe);
    neueOption.appendChild(neuerText);
    datalistPruf.appendChild(neueOption);

    var dauer = eingabe.split("[D.: ");
    dauer = dauer[1].split("] [ID.");
    // if (dauer[0] != "null") {
      if (parseInt(dauer[0]) >= parseInt(minutes.value)) {
        minutes.value = dauer[0];
      }
    // }
    var sql = "SELECT * FROM prufungen WHERE Prufung_ID = '"+extractID(datalistPruf.lastChild)+"' AND Prufungsgruppen_ID <> 'null'"
    db.query(sql, function(err, results) {
      if (err) throw err;
      if(results.length > 0){
        dialogs.confirm("Diese Prüfung gehört einer Prüfungsgruppe an. Möchten Sie die anderen Prüfungen auch laden?", ok =>{
          if(ok === true){
            var sql2 ="SELECT * FROM prufungen WHERE Prufungsgruppen_ID = '"+results[0]["Prufungsgruppen_ID"]+"' AND Prufung_ID NOT IN (SELECT Prufung_ID FROM prunfung_termin_verb)"
            addprufgroup(1, sql2);
          }
        })
      }
    })
  }
  prufungInput.value = "";
  deleteRooms2();

}

buttonAdd.addEventListener('click', addPrufung, false);



function addprufgroup(e, sql){
  if(sql === undefined){
    e.preventDefault();
    sql = "SELECT * FROM prufungen WHERE Prufungsgruppen_ID = '"+extractIDString(prüfungsgruppeinput.value)+"' AND Prufung_ID NOT IN (SELECT Prufung_ID FROM prunfung_termin_verb)"
  }
  db.query(sql, function(err, results) {
    if (err) throw err;
    console.log(results)
    results.forEach(result => {
      if(result["Prüfungsart"] !== "Hausarbeit"){
        var inhalt = result["Prufung_Name"].toLowerCase().trim() + " | " + result["Standardsemester"] + " | " + result["Prüfungsstatus"] + " [T.: " + result["Teilnehmerzahl"] + "]" + " [D.: " + result["Dauer"] + "]" + " [ID.: " + result["Prufung_ID"] + "]" + " [PP.: " + (result["Pflichtprüfung"] === 1 ? "J" : "N") + "]";
        var vorhanden = datalistPruf.children;
        var checker = true;
        if (vorhanden.length > 0) {
          Array.from(vorhanden).forEach(function(item) {
            if (item.value.localeCompare(inhalt) == 0) {
              checker = false;
            }
          });
        }

        if (checker === true) {
          const neueOption = document.createElement('option');
          neueOption.value = inhalt;
          neueOption.selected = true;
          const neuerText = document.createTextNode(inhalt);
          neueOption.appendChild(neuerText);
          datalistPruf.appendChild(neueOption);

          var dauer = inhalt.split("[D.: ");
          dauer = dauer[1].split("] [ID.");
          // if (dauer[0] != "null") {
            if (parseInt(dauer[0]) >= parseInt(minutes.value)) {
              minutes.value = dauer[0];
            }
          // }
        }
      }
    });
  })
  prüfungsgruppeinput.value = "";
  deleteRooms2()

}
buttonAdd2.addEventListener("click", addprufgroup)



function extractIDString(item){
  var temp = item.split("[");
  var temp = temp[1].split("]");
  return temp[0];
}





var vorher;

function changeRaumkat() {
  if (raumkat.value != "- Kein Raum benötigt -") {
    vorher = raumkat.value;
  }
  if (minutes.value == 0) {
    raumkat.value = "- Kein Raum benötigt -";
  } else raumkat.value = vorher;
  deleteRooms2();

}
minutes.addEventListener('change', changeRaumkat)


//Verhinderungen abfragen-------------------------------------------------------------
//Wird noch nicht verwendet. Kommentare folgen, sobald genutzt
// var exam = "algebrastat";
// sql = "SELECT anwesende.Nachname, anwesende_belegung.jahr, anwesende_belegung.tag, anwesende_belegung.kw, anwesende_belegung.tslot FROM prufungen, prufunganwesendeverbindung, anwesende, anwesendebelegungverbindung, anwesende_belegung WHERE prufungen.Prufung_Name = '" + exam + "' AND prufungen.Prufung_ID = prufunganwesendeverbindung.Prufung_ID AND prufunganwesendeverbindung.Anwesende_ID = anwesende.Anwesende_ID AND anwesende.Anwesende_ID = anwesendebelegungverbindung.Anwesende_ID AND anwesendebelegungverbindung.Belegungs_ID = anwesende_belegung.Belegungs_ID"
// sql2 = "SELECT studiengangssemester.Studiengang, studiengangssemester_belegung.jahr, studiengangssemester_belegung.tag, studiengangssemester_belegung.kw, studiengangssemester_belegung.tslot FROM prufungen, prufungstudsemverbindung, studiengangssemester, studsembelegungverbindung, studiengangssemester_belegung WHERE prufungen.Prufung_Name = '" + exam + "' AND prufungen.Prufung_ID = prufungstudsemverbindung.Prufung_ID AND prufungstudsemverbindung.Studiengangssemester_ID = studiengangssemester.Studiengangssemester_ID AND studiengangssemester.Studiengangssemester_ID = studsembelegungverbindung.Studiengangssemester_ID AND studsembelegungverbindung.Belegungs_ID = studiengangssemester_belegung.Belegungs_ID"
// var verhinderungen = [];
// var verhinderungen2 = [];
// db.query(sql, function(err, results) {
//   if (err) throw err;
//   verhinderungen2 = results;
// });
// db.query(sql2, function(err, results) {
//   if (err) throw err;
//   verhinderungen = results;
//   verhinderungen = verhinderungen.concat(verhinderungen2);
//   console.log(verhinderungen);
// });
//---------------------------------------

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
  }
  return time;
}



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



function loadRooms(datumIn, callback) { //Funktion erstellt das Grid für das Drag'n'Drop
console.log("Funktion loadRooms wurde aufgerufen")
  if(datumIn === undefined){
    datumIn = datumInput2.value;
  }


  while (raumgrid.firstChild) { //Falls das Grid durch vorherige Abfrage bereits gefüllt. Lösche diese Einträge.
    raumgrid.firstChild.remove()
  }

  //Oberer Teilnehmer: siehe unterer Teilnehmer-Counter für Erläuterungen (weiter unten)
  const capcounterOuter = document.createElement("div");
  capcounterOuter.classList.add("outsidediv")
  const seitlicherPlatzhalter = document.createElement("div"); //...erstelle ein Div (seitlicher Tabellenkopf) für die Kategorie und für die Kapazität
  seitlicherPlatzhalter.className = "nameDivTwo";
  const datum = document.createTextNode(returnWeekdayString(new Date(datumIn))+" "+datumIn);
  seitlicherPlatzhalter.appendChild(datum);
  seitlicherPlatzhalter.setAttribute("data-datum", datumIn);
  capcounterOuter.appendChild(seitlicherPlatzhalter);
  for (var i = 1; i <= 21; i++) {
    const capcounterInner = document.createElement("div");
    capcounterInner.classList.add("capcounterInner");
    var neededCap = getTeilnehmer() //wird später berechnet durch funktion
    const neuerText = document.createTextNode(String(neededCap))
    var newspan = document.createElement("span");
    newspan.appendChild(neuerText);
    newspan.classList.add("space");
    capcounterInner.appendChild(newspan);
    capcounterOuter.appendChild(capcounterInner);
  }
  capcounterOuter.classList.add("capcounterOuter");
  raumgrid.appendChild(capcounterOuter);

  //------Erstelle Timsolt-Divs für das Grid
  var rooms = [];
  var sql3 = "SELECT * FROM raum WHERE Kategorie='" + kategorie.value + "' ORDER BY Kapazität, Bezeichnung ASC;" //Datenbankabfrage nach allen Räumen, der vom User gewählten Raumkategorie.
  db.query(sql3, function(err, results) { //Ergebnise werden in Array results zurückgeliefert
    if (err) throw err;
    results.forEach(function(item) { //Für jede Ergebnis...
      const outsidediv = document.createElement('div'); //...erstelle ein Outer-Div an das später die Div's für die Timeslots angehangen werde
      outsidediv.classList.add("outsidediv");
      outsidediv.classList.add("roomdiv")
      console.log("erledigt")
      outsidediv.setAttribute("data-room",item["Bezeichnung"])
      const divName = document.createElement("div"); //...erstelle ein Div (seitlicher Tabellenkopf) für die Kategorie und für die Kapazität
      divName.className = "nameDiv";
      divName.setAttribute("title", item["Extras"]);
      const bez = document.createTextNode(item["Bezeichnung"] + " | Kap: " + item["Kapazität"]); //Erstelle einen Textknoten mit Bezeichnung und Kapazität des Raumes
      divName.appendChild(bez); // Hänge Textknoten an Tabellenkopf Div
      outsidediv.appendChild(divName);
      for (var i = 1; i <= 21; i++) { //Der Tag ist in 21 Timeslots unterteilt. Erstelle diese.
        const neuerText = document.createTextNode(getTime(i)); //Erstelle einen Textnknoten mit der zum Timeslot korrespondieren Uhrzeit -> siehe getTime()
        const newSpan = document.createElement("span");
        newSpan.removeAttribute("draggable"); //Text ist von default aus draggable (ist hier nicht gewünscht). Funktioniert aber irgendwie nicht --> klären
        newSpan.appendChild(neuerText);
        const insidediv = document.createElement('div'); //Erstelle ein inner-div (Timeslot)
        insidediv.appendChild(newSpan); //Hänge diesem den Text (Uhrzeit an);
        insidediv.className = "insidediv dropable";
        insidediv.id = item["Bezeichnung"] + "_" + i;
        insidediv.setAttribute("data-this", i.toString()); //Benutzerdefinierte Attribute beginnen in HTML immer mit data-...
        insidediv.setAttribute("data-prev", (i - 1).toString()); //wird eigentlich nicht benötigt
        insidediv.setAttribute("data-next", (i + 1).toString()); //wird eigentlich nicht benötigt
        insidediv.setAttribute("data-cap", item["Kapazität"]); //Jedes Timeslot-Div bekommt die Kapazität des Raumes als Attribut zugeordnet
        insidediv.setAttribute("data-parent", item["Bezeichnung"]); //...ebenso wie die Bezeichnung des Raums
        insidediv.setAttribute("data-state", "free"); // gibt an ob Timeslot belegt oder frei. Default: free
        outsidediv.appendChild(insidediv); //hänge Timeslot-Div an Outerdiv
      }

      raumgrid.appendChild(outsidediv); //hänge Outerdiv (für einen Raum) ans Griddiv für alle Räume
      raumgrid.removeAttribute("hidden");
    })

    //Unterer Teilnehmer-Counter. Prinzipiell wie die Timeslot divs nur mit anderen Klassen.-------------------------------------
    const capcounterOuter2 = document.createElement("div"); //Erstelle äußerer Container
    capcounterOuter2.classList.add("outsidediv")
    const seitlicherPlatzhalter2 = document.createElement("div"); //...erstelle ein Div (seitlicher Tabellenkopf) für die Damit Seitenabstann gleich wie oben bei Kategorie und  Kapazität
    seitlicherPlatzhalter2.className = "nameDiv";
    capcounterOuter2.appendChild(seitlicherPlatzhalter2);
    for (var i = 1; i <= 21; i++) { //Erstelle 21 Counter-divs
      const capcounterInner2 = document.createElement("div");
      capcounterInner2.classList.add("capcounterInner2");
      var neededCap2 = getTeilnehmer() //Funktion liefert Summe aller Teilnehmer der gewählten Klausuren
      const neuerText2 = document.createTextNode(String(neededCap2)) //schreibe die Summe der Teilnehmer in Counter-Div
      var newspan2 = document.createElement("span");
      newspan2.appendChild(neuerText2);
      newspan2.classList.add("space2");
      capcounterInner2.appendChild(newspan2);
      capcounterOuter2.appendChild(capcounterInner2); //Hänge Counter-Div an äußeren Container
    }
    capcounterOuter2.classList.add("capcounterOuter2");
    raumgrid.appendChild(capcounterOuter2); //Hänge äußeren Container an Raumgrid

    console.log("Funktion loadRooms wurde ausgeführt")

callback(null);
empfehlung(0)
  });
  //----------------------------------------------------------------------------




}



//----------DRAG AND DROP-----------------------------------------------------

function setzeVerboteneDrops(callback){
  //Diese Funktion itteriert durch alle Timeslot-Divs und gibt den letzten Timeslots das Attibut data-empfehlung="veboten ",
  //Dauert ein Prüfung zb. 4 Timeslots lang, kann der Token der Prüfung nicht auf die letzten drei Timeslots gestzt werden,
  //Sonst würde die Prüfung über 19:30 Uhr hinaus andauern.

  const allDrops = document.querySelectorAll(".insidediv");
  console.log(allDrops.length)
  allDrops.forEach((item) => {
    if(parseInt(item.getAttribute("data-this")) > 21 - (calcTimeSlots()-1)){
      item.setAttribute("data-empfehlung", "verboten");
    }
  })
  callback();
}



kategorie.addEventListener("change", deleteRooms2);


function dragoverpapierkorb(e) { //Was passiert wenn ein Token über den Papierkorb gezogen wird
  e.preventDefault();
  const draggable = document.querySelector('.dragging'); //das gerade gezogene Element hat die Klasse .dragging. Dieses Selektieren wir...
  this.appendChild(draggable); //... und hängen es dem Papierkorb an
  createNewElement();
}


function droppapierkorb() {
  calcCap();    //kalkuliere die verwendeten Kapazitäten neu, da jetzt weniger Token existieren
  if (this.lastChild.hasAttribute("data-token")) {  //falls das dem Papierkorb anghängte Element ein Token ist...
    this.lastChild.remove();  //lösche den Token

    empfehlung();      //weniger Token -> andere Empfehlung nötig
    findfirst();       //es könnte der vorherige Mastertoken gelöscht worden sein -> finde einen neuen Mastertoken
  }
}

drags.forEach(item => {
  item.addEventListener("dragstart", dragstart);
  //item.addEventListener("drag", drag);
  item.addEventListener("dragend", dragend);
})


function listenershinzufügen() {
  //Diese Funktion fügt den Timeslot-Divs die für das Drag and Drop nötigen eventlistener hinzu
  // setzeVerboteneDrops();
  const papierkorb = document.querySelector("#papierkorb");
  papierkorb.addEventListener("dragover", dragoverpapierkorb);    //wenn sich ein Token über den Papierkorb gezogen wird, führe die Funktion dragoverpapierkorb aus
  papierkorb.addEventListener("drop", droppapierkorb);            //wenn der Token über dem Papierkorb losgelassen wird, führ die Funktion ...  aus

  const drops = document.querySelectorAll(".dropable");         //füge jedem Timeslot...
  drops.forEach(item => {
    item.addEventListener("dragover", dragover);              //den Eventlister fürs drüber ziehen

    item.addEventListener("drop", drop);                      //den Eventlister fürs loslassen
    //  item.addEventListener("dragenter",);
    item.addEventListener("dragleave", dragleave);            // den Evetnlistener falls ein Token ein Timesot wieder verlässt
  })
}




function dragover(e) {
//Die Funktion definiert was passiert wenn ein Token über einen Timeslot gezogen wird
if(!(this.getAttribute("data-empfehlung") == "verboten")){ //falls es sich nicht, um ein in setzeVerboteneDrops() definierten verbotetenen Timeslot handelt,...
  e.preventDefault();
  const draggable = document.querySelector('.dragging');   //...selektiere das gerade gezogene Element und...

  this.appendChild(draggable);  //...hänge es dem Timeslot als kindelement an
}
}



function dragend(e) {
  //Die Funktion definiert was passiert wenn ein Token aufgehörtz wird zuziehen

  e.target.classList.remove('dragging');  //Die Klasse dragging wird entfernt

  try {
    if (e.target.parentElement.classList.contains("insidediv")) {  //Wenn das Parentelement des Token nun ein Timeslot ist...
      if (e.target.hasAttribute("data-token")) { //...und es sich auch tatsächlich um einen Token handelt...


        number = parseInt(e.target.lastChild.textContent);    //Entnehme die Timeslotanzahl aus dem Token

//Im folgenden werden die  Timeslots, die von einem Token belegt werden, rot eingefärbt.
        if (!(e.target.parentElement.hasAttribute("data-setby"))) {      //Falls der Timeslot nicht schon von einem anderen Token besetzt wurde, dann...
          var item2 = e.target.parentElement;   //Setze eine Referenz (item2) auf den timeslot des Tokens
          for (var i = 1; i < number; i++) {
            item2 = item2.nextSibling;      //verschiebe item2 auf den rechten benachbarten Timeslots und prüfe...
            if (!(item2.hasAttribute("data-setby"))) { //ob dieser nicht schon von einem anderen Token gesetzt wurde...
              item2.setAttribute("data-setby", e.target.id); //falls er noch nicht von einem andern gesetzt wurde, dann setze du ihn mit der ID des Token
              item2.style.backgroundColor = "pink"; //und färbe ihn rot
              if (i == number - 1) {   //gerade selbst nicht sicher warum das muss
                item2.setAttribute("data-setby", e.target.id);
              }
            }
          }
          if (number != 0) {
            //Nachdem nun die benachbarten Timeslots des Tokentimeslots erfogreich gefärbt wurden, muss nun der Timeslot des Token selbst gefärbt werden
            e.target.parentElement.style.backgroundColor = "pink";
            e.target.parentElement.setAttribute("data-hastoken", "true");
            e.target.parentElement.setAttribute("data-setby", e.target.id);
          }
        }
        //     item2 = item2.nextSibling;


        calcCap();
        createNewElement();
        empfehlung();
        findfirst();

      }
    }
  } catch {}
}



function dragstart(e) {
// Die Funktion definiert was passiert wenn ein Token bekonnen wird zu ziehen

  console.log(this.parentElement);
  if (this.parentElement.classList.contains("newdrag")) {      //Falls das Parentelement des zuziehen begonnen Token die Tokenquelle war....
    listenershinzufügen();      //...füge die Eventlister hinzu (Eigentlich nur beim, ersten Token nötig, wird aber einfachheitshalber bei jedem neuen Token gemacht -> Stört nicht)
  }

  this.classList.add('dragging');     //bei Dragstart bekommt der zu ziehen begonne Token die Klasse dragging

//Im fogenden müssen die timeslots des verlasssenden Tokens wieder entfärbt werden
  if (e.target.parentElement.classList.contains("insidediv")) {    //Falls das Parentelement des zuziehen begonnen Elements ein Timeslot ist (und nicht zum beispiel die Tokenquelle)
    if (e.target.hasAttribute("data-token")) {                     //...und es sich auch tatsächlich um einen Token handelt...

      var number = parseInt(e.target.lastChild.textContent);      //Entnehme die Timeslotanzahl aus dem Token

      if (e.target.parentElement.getAttribute("data-setby") == e.target.id) {       //Prüfe ob der Timeslot von diesem token gesetzt wurde und nicht von einem anderen Token. Wenn von einem andern Token gesetzt, darf nicht von diesem entfärbt werden
        var item2 = e.target.parentElement; //Setze eine Referenz (item2) auf den timeslot des Tokens
        for (var i = 1; i < number; i++) {
          item2 = item2.nextSibling; //verschiebe item2 auf den rechten benachbarten Timeslots und prüfe...
          if (item2.getAttribute("data-setby") == e.target.id) {   // prüfe auch die benachbarten Timeslots ob auch diese nicht von einem anderen geseetzt
            item2.removeAttribute("data-setby");  //entferne das Attribut "data-setby". Der Timeslot ist nun nicht mehr besetzt
            item2.style.backgroundColor = "white";  //färbe den Timeslot wieder weiß
            if (i == number - 1) {  //kein Plan -> Prüfen
              item2.removeAttribute("data-setby");
            }
          }

        }
  //Nachdem nun die benachbarten Timeslots des Tokentimeslots erfogreich entfärbt wurden, muss nun der Timeslot des Token selbst enfärbt werden
        e.target.parentElement.style.backgroundColor = "white";
        e.target.parentElement.setAttribute("data-hastoken", "false");
        e.target.parentElement.removeAttribute("data-setby");
      }
    }
}
}


function dragleave(e) {
//noch nicht gebraucht
}



var timeslots;
function calcTimeSlots() {
  //Diese Funktion berechnet die benötigten Timeslots aus der angegebenen Prüfungsdauer
  var duration = minutes.value;   //Ziehe die Zeit aus der Formelement
  if (duration == 0) {            //Wenn Zeit in Minuten = 0, dann auch keien Timeslots benötigt
    return 0;
  }
  timeslots = parseInt(duration / 30);        //Teile
  if (duration % 30 > 10) {    //falls es bei der Teilung durch 30 einen Rest gibt und dieser größer 10 (minuten) ist, so rechne noch ein Timslot drauf. Beispiel: (45 Minuten / 30 = 1 Timslot) + 1 Timslot weil 45 % 30 = 15; 15 > 10
    timeslots += 1;
  }
  timeslots += 1; //nächste Prüfung nicht direkt im Anschluss, deswegen pauschal 1 drauf

  return timeslots;
}





function createNewElement() {
  if (dragcontainer[1].childElementCount === 0) {             //falls sich in der Tokenquelle kein Token befindet...
    const text = document.createTextNode(calcTimeSlots());    //erstelle ein Textknoten mit der berechneten Timeslotanzahl
    const anotherDrag = document.createElement("div");       //erstelle ein Div für den Token
    dragID++;           //globale Variable, siehe ganz oben
    anotherDrag.id = "drag" + dragID;                       //gebe jedem Token eine eindeutige ID
    anotherDrag.style.display = "table-cell"
    anotherDrag.classList.add("dnd");
    anotherDrag.setAttribute("draggable", "true"); //Brauch ich das noch?
    anotherDrag.setAttribute("data-token", "true");
    anotherDrag.setAttribute("title", "Token")
    anotherDrag.addEventListener("dragstart", dragstart);
    anotherDrag.addEventListener("dragend", dragend);
    anotherDrag.appendChild(text);
    dragcontainer[1].appendChild(anotherDrag);
  }
}



function findfirst() {
  const alldrags = document.querySelectorAll("#raumgrid .dnd");    //selektiere alle Tokens
  try {
    for(item of alldrags){   //Mache ersteinaml alle Tokens zu normalen Token
      item.style.color = "black";
      item.style.borderColor = "black";
      item.setAttribute("title", "Token");
    }
//jetzt nimm den ersten Token und betimm ihn als Mastertoken
    alldrags[0].style.borderColor = "#2D9FFC"
    alldrags[0].style.color = "#2D9FFC"
    alldrags[0].setAttribute("title", "Mastertoken");

    var allDrops = document.querySelectorAll(".insidediv");   //Selektiere alle Timeslots

    var firstandfellows = [];
    var first = parseInt(alldrags[0].parentElement.getAttribute("data-this"));

    for (var i = first; i < first + calcTimeSlots(); i++) {
      firstandfellows.push(i);
    }
    allDrops.forEach((item) => {
      if (!firstandfellows.includes(parseInt(item.getAttribute("data-this"))) && item.style.borderColor != "deepskyblue") {
        item.style.opacity = "60%"
        item.setAttribute("data-gegraut", "true")
      } else {
        item.style.opacity = "100%"
        item.removeAttribute("data-gegraut")
      }
      if (!firstandfellows.includes(parseInt(item.getAttribute("data-this"))) && item.style.borderColor == "deepskyblue"){
        item.setAttribute("data-gegraut", "true")   //verhindert, dass empfehlungen, die eigentlich gegraut sein müssten, belegt werden können
      }
    });
  } catch {console.log("nicht geklappt")}
}



function getTeilnehmer() {
  var prufungen = document.querySelectorAll("#datalistpruf option");
  var teilnehmer = 0;
  prufungen.forEach((item) => {
    if (item.selected) {
      var temp = item.textContent.split("[T.: ");
      var temp = temp[1].split("] [D");
      teilnehmer += parseInt(temp[0]);
    }
  })
  return teilnehmer;
}




function callbacktest1(results, betrachtetesDatum, callback){

  var ergebnisse = [];

  for(result of results){

    var dateOne = result["Datum"];
    var dateTwo = result["DatumBis"];

    for (var i = dateOne; i <= dateTwo; i.setDate(i.getDate() + 1)){
      console.log(results)
      var teilergebnis = [];

      var betrachteterTag = betrachtetesDatum.getDay()
      console.log(betrachteterTag);
      if(betrachteterTag === 0){
        betrachteterTag = 7;
      }

      if(result["Wochentage"].includes(betrachteterTag.toString())){
        teilergebnis.push(i);
        for(var j = 1; j <= 21; j++){
          teilergebnis.push(result["TS"+j])
        }
          teilergebnis.push(" "+result["Studiengang"]+" "+result["Semesternummer"])
          ergebnisse.push(lodash.cloneDeep(teilergebnis));
          console.log("sony", result)

      }
    //   if(result === results[results.length-1] && i >= dateTwo){
    //     console.log("ausgabe", ergebnisse)
    //     callback(ergebnisse);
    // }

    }
  }
    callback(ergebnisse)
}

function callbacktest2(ergebnisse, betrachtetesDatum, callback){
  var belegung = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  console.log("Tagesdau", ergebnisse)
  for (item of ergebnisse){
    if(item[0].getTime() == betrachtetesDatum.getTime()){     //Hä was soll das?

      for(var u = 1; u <= 21; u++){
        if(item[u] == 1){
          belegung[u-1] = item[22];
        }

      }
    }
  }
  callback(belegung);
}



function ladeBelegungen(datumTagt, callback){
  var prufungen = document.querySelectorAll("#datalistpruf option");
  var ids = [];
  prufungen.forEach((item) => {
    if(item.selected){
      var id = extractID(item);

      var sql = "SELECT * FROM prufungen, prufungstudsemverbindung, studiengangssemester, studsembelegungverbindung, studiengangssemester_belegung WHERE prufungen.Prufung_ID = '"+id+"' AND prufungen.Prufung_ID = prufungstudsemverbindung.Prufung_ID AND prufungstudsemverbindung.Studiengangssemester_ID = studiengangssemester.Studiengangssemester_ID AND studiengangssemester.Studiengangssemester_ID = studsembelegungverbindung.Studiengangssemester_ID AND studsembelegungverbindung.Belegungs_ID = studiengangssemester_belegung.Belegungs_ID UNION SELECT * FROM prufungen, prufunganwesendeverbindung, anwesende, anwesendebelegungverbindung, anwesende_belegung WHERE prufungen.Prufung_ID = '"+id+"' AND prufungen.Prufung_ID = prufunganwesendeverbindung.Prufung_ID AND prufunganwesendeverbindung.Anwesende_ID = anwesende.Anwesende_ID AND anwesende.Anwesende_ID = anwesendebelegungverbindung.Anwesende_ID AND anwesendebelegungverbindung.Belegungs_ID = anwesende_belegung.Belegungs_ID";

      if(datumTagt === undefined){
        var peter = document.querySelector("#kws");
        datumTagt = peter.value;
      }
      var betrachtetesDatum = new Date(datumTagt)

      betrachtetesDatum.setHours(0);

      db.query(sql, function(err, results) {
        console.log("luke", results)
        if(err) throw err;


        callbacktest1(results, betrachtetesDatum, function(ergebnisse){
          callbacktest2(ergebnisse, betrachtetesDatum, function(belegung){
            console.log("this is: "+belegung);
            var allDrops = document.querySelectorAll(".insidediv");
            for(drop of allDrops){
              console.log("hier ist die belegung", belegung)
             if(belegung[parseInt(drop.getAttribute("data-this"))-1] !== 0){
               console.log("drin");
               drop.classList.add("belegt3")
               drop.setAttribute("data-state", "oc")
               drop.setAttribute("title", "eingetragene Abwesenheit:"+belegung[parseInt(drop.getAttribute("data-this"))-1]);
               // if(ids.length > 0){
               //   drop.setAttribute("title", "Ein oder mehrere Studsem haben heute bzw. gestern bereits eine Prüfung gehabt: "+ids.join());
               // } else drop.setAttribute("title", "eingetragene Abwesenheit");
             }
             if(item === prufungen[prufungen.length-1] && drop === allDrops[allDrops.length-1]){
               console.log(document.querySelectorAll(".insidediv"));
               console.log("erstes Callback")
               callback();

             }
            }
            if(item === prufungen[prufungen.length-1] && allDrops.length === 0){
              console.log("zweites Callback")
              callback();
            }
          })
        })
      });
    }else{
      if(item === prufungen[prufungen.length-1]){
        callback();
      }
    }
  })
  if(prufungen.length === 0){
    console.log("drittes Callback")
    callback();
  }
}





function calcCap() {
  var neededCap = getTeilnehmer();
  var arr = [neededCap, neededCap, neededCap, neededCap, neededCap, neededCap, neededCap, neededCap, neededCap, neededCap, neededCap, neededCap, neededCap, neededCap, neededCap, neededCap, neededCap, neededCap, neededCap, neededCap, neededCap]
  var alldrops = document.querySelectorAll(".insidediv");


  alldrops.forEach((item) => {
    if(item.hasAttribute("data-setby")){
      var thisItem = parseInt(item.getAttribute("data-this"));
      arr[thisItem - 1] = arr[thisItem - 1] - parseInt(item.getAttribute("data-cap"));
    }
  });


  var allSpaces = document.querySelectorAll(".space");
  var allSpaces2 = document.querySelectorAll(".space2");
  for (var i = 0; i < 21; i++) {
    allSpaces[i].textContent = arr[i];
    allSpaces2[i].textContent = arr[i];
    if (arr[i] <= 0) {
      allSpaces[i].parentElement.style.backgroundColor = "#F9E6AE";
      allSpaces2[i].parentElement.style.backgroundColor = "#F9E6AE";
      //allSpaces[i].parentElement.style.borderColor = "#37F72E";
    } else {
      allSpaces[i].parentElement.style.backgroundColor = "#A9CAEB";
      allSpaces2[i].parentElement.style.backgroundColor = "#A9CAEB";
      //allSpaces[i].parentElement.style.borderColor = "black";
    }
  }
}

function removeduplicates(arr){
  let uniquearr = [];
arr.forEach((element) => {
    if (!uniquearr.includes(element)) {
        uniquearr.push(element);
    }
});

return uniquearr;
}



function drop(e) {
  //e.preventDefault();
  createNewElement();
}



function ladeVerplanteAnwesende(paraDatum, callback){
console.log("Funktion ladeVerplanteAnwesende in")
if(paraDatum === undefined){
  paraDatum = datumInput2.value;
}
  var thisdate = new Date(paraDatum);
  var prufungen = document.querySelectorAll("#datalistpruf option");
  var timeslots = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var anwesende = [];

  prufungen.forEach((pruf) => {
 if(pruf.selected){
    var id = extractID(pruf);
    var sql;

var sql0 = "SELECT * FROM prufungen, prufunganwesendeverbindung, anwesende WHERE prufungen.Prufung_ID = '"+id+"' AND prufungen.Prufung_ID = prufunganwesendeverbindung.Prufung_ID AND prufunganwesendeverbindung.Anwesende_ID = anwesende.Anwesende_ID"
db.query(sql0, function(err, results0) {
  if (err) throw err;
  console.log("jo das sind die Anwesende der prüfung",results0);
    results0.forEach((result0)=>{

      sql = "SELECT * FROM anwesende, prufunganwesendeverbindung, prufungen, prunfung_termin_verb, prufung_termin WHERE anwesende.Anwesende_ID = prufunganwesendeverbindung.Anwesende_ID AND prufunganwesendeverbindung.Prufung_ID = prufungen.Prufung_ID AND prufungen.Prufung_ID = prunfung_termin_verb.Prufung_ID AND prunfung_termin_verb.Termin_ID = prufung_termin.Termin_ID AND prufung_termin.Datum = '"+transformDateToHTML(thisdate)+"' AND anwesende.Anwesende_ID = '"+result0["Anwesende_ID"]+"'"

      db.query(sql, function(err, results) {
        if (err) throw err;
        console.log("MyErgebnis", results)
        results.forEach((result) => {
          anwesende.push(" " + result["Vorname"]+" "+result["Nachname"]);
        })
        anwesende = removeduplicates(anwesende);
        results.forEach((result) => {
          for(var i = 1; i <= 21; i++){
            if(result["TS"+i] == 1){
              timeslots[i-1] = " "+anwesende.join()+ " betreut zu dieser Zeit eine Prüfung. PrüfungID: "+result["Prufung_ID"] ;
            }
          }
        })

        console.log(timeslots)
        var allDrops = document.querySelectorAll(".insidediv");
        for(drop of allDrops){
         if(timeslots[parseInt(drop.getAttribute("data-this"))-1] !== 0){
           console.log("drin");
           drop.classList.add("belegt4")
           drop.setAttribute("data-state", "oc")
           drop.setAttribute("title", "Anweseder"+timeslots[parseInt(drop.getAttribute("data-this"))-1]);
           // if(ids.length > 0){
           //   drop.setAttribute("title", "Ein oder mehrere Studsem haben heute bzw. gestern bereits eine Prüfung gehabt: "+ids.join());
           // } else drop.setAttribute("title", "eingetragene Abwesenheit");
         }
        }
        if(pruf === prufungen[prufungen.length-1] && result0 === results0[results0.length-1]){
          callback();
        }
      })

    })
    if(pruf === prufungen[prufungen.length - 1] && results0.length === 0){
      callback();
    }
});

}
  })
  console.log("Funktion ladeVerplanteAnwesende out")
  if(prufungen.length === 0){
    callback();
  }
}




var marker = true;
var laenge = 0;
var capEmpfehlungen = [];
var itemsEmpfehlungen = [];

function empfehlung(restart) {

if(restart != undefined){
  laenge = restart;
  return
}

  const allDrags = document.querySelectorAll("#raumgrid .dnd");
  const allDrops = document.querySelectorAll(".insidediv");
  if (allDrags.length <= itemsEmpfehlungen.length) {
    capEmpfehlungen = [];
    marker = true;
    console.log("in1")
  }

  if (capEmpfehlungen.includes(parseInt(allDrops[0].getAttribute("data-cap")))) {
    return;
  }

  itemsEmpfehlungen = [];
  capEmpfehlungen = [];

  allDrops.forEach((element) => {

    if (element.style.borderColor == "deepskyblue") {
      element.style.borderColor = "black";
      element.style.color = "black";
      element.style.borderStyle = "solid";
      element.style.fontWeight = "normal";
      element.removeAttribute("title");
    }
  })

//  var firstAdvice;

  var a = "allDrops[item].getAttribute('data-state') == 'free' && allDrops[item].getAttribute('data-empfehlung') != 'verboten'"
  var b = "parseInt(allDrops[item].getAttribute('data-cap')) "
  var c = "allDrops[item2].getAttribute('data-state') != 'free'"
  var d = "allDrops[item2] = allDrops[item2].nextSibling; "
  var e = "capEmpfehlungen.push(parseInt(allDrops[item].getAttribute('data-cap'))); itemsEmpfehlungen.push(allDrops[item]);"

  if (allDrags.length > 1) {
    for (var i = 2; i <= allDrags.length; i++) {
      var p = (i - 1) * 21;
      a = a + "&& allDrops[parseInt(item)+" + p + "].getAttribute('data-state') == 'free' && allDrops[parseInt(item)+" + p + "].getAttribute('data-empfehlung') != 'verboten'  "
      b = b + "+ parseInt(allDrops[parseInt(item)+" + p + "].getAttribute('data-cap')) "
      c = c + " || allDrops[parseInt(item2)+" + p + "].getAttribute('data-state') != 'free'"
      d = d + " allDrops[parseInt(item2)+" + p + "] = allDrops[parseInt(item2)+" + p + "].nextSibling; "
      e = e + "capEmpfehlungen.push(parseInt(allDrops[parseInt(item)+" + p + "].getAttribute('data-cap'))); itemsEmpfehlungen.push(allDrops[parseInt(item)+" + p + "]);"
    }
  }
try{
  for (item in allDrops) {
    if (getTeilnehmer() - (eval(b)) <= 0) {
      if (eval(a)) {
        var checker = true;
        var item2 = item;
        for (var i = 1; i < calcTimeSlots(); i++) {
          //eval(d);
          item2++;
          if (eval(c)) {
            checker = false;
            break;
          }// else console.log("jop")
        }
        if (checker == true) {
          //console.log(capEmpfehlungen);
          eval(e);
          //console.log(capEmpfehlungen);
          break;
        }
      }
    }
  }
} catch{
 console.log("keine Empfehlung möglich?")
}

console.log("Hier:")
console.log(itemsEmpfehlungen);



console.log(capEmpfehlungen);
  capEmpfehlungen.reverse()
  var teilnehmer = getTeilnehmer();
  var cap = 0;
  console.log(itemsEmpfehlungen);
  for (var i = 0; i < capEmpfehlungen.length; i++) {
    cap = cap + capEmpfehlungen[i];

    if (cap >= teilnehmer && i < capEmpfehlungen.length - 1) {
      console.log("jetz isses soweit")
      marker = false;


      console.log(itemsEmpfehlungen);
      //console.log(capEmpfehlungen);
      itemsEmpfehlungen.shift();
      //console.log(itemsEmpfehlungen);
    }
  }
  console.log("länge"+laenge);
  console.log("empfehlungen:"+itemsEmpfehlungen.length)
  if(itemsEmpfehlungen.length > laenge){
    console.log("in2")
    marker = true
    laenge = itemsEmpfehlungen.length;
  }
  // if(capEmpfehlungen.includes(parseInt(allDrops[0].getAttribute("data-cap")))){
  //   dialogs.alert("Ende")
  //   itemsEmpfehlungen.pop();
  // }
  console.log(marker)

if(marker){
  itemsEmpfehlungen.forEach((element) => {

    if(element.getAttribute("data-empfehlung") != "verboten"){
      element.style.borderColor = "deepskyblue";
      element.style.color = "deepskyblue"
      element.style.fontWeight = "bold";
      if(itemsEmpfehlungen.length > 1){
        itemsEmpfehlungen[0].style.borderStyle = "dashed";
        itemsEmpfehlungen[0].setAttribute("title", "Dieser Slot muss nicht unbedingt der beste sein, probiere auch mal die Slots darüber aus (falls frei).");
      }
    }
  })
}
}




function loadRoomBelegung(callback){
  console.log("Funktion ladeRoombelegung wurde auferufen!")
  const rooms = document.querySelectorAll(".roomdiv");
  nameDivTwo = document.querySelector(".nameDivTwo");
  datumsangabe = nameDivTwo.getAttribute("data-datum");
  rooms.forEach((room) => {
    var sql = "SELECT * FROM raum, prufung_termin_raumverb, prufung_termin WHERE raum.Bezeichnung = '"+room.getAttribute("data-room")+"' AND raum.Raum_ID = prufung_termin_raumverb.Raum_ID AND prufung_termin_raumverb.Termin_ID = prufung_termin.Termin_ID AND prufung_termin.Datum='"+datumsangabe+"'"
    db.query(sql, function(err, results) {
      console.log(results);
      if(results.length > 0){
        console.log(results)

        var roomslots = room.children;
        console.log(roomslots)
        for(roomslot of roomslots){
          if(roomslot.hasAttribute("data-this")){
            var temp = "TS"+roomslot.getAttribute("data-this");
            for(result of results){
              if(result[temp] == "1"){
                roomslot.classList.add("belegt2")
                roomslot.setAttribute("title", "Dieser Raum ist belegt. Termin_ID: "+result["Termin_ID"])
                roomslot.setAttribute("data-state", "oc")
              }
            }
          }
        }
      }
      if(room === rooms[rooms.length-1]){
        callback()
      }
    });

  });
  console.log("Funktion ladeRoombelegung wurde ausgeführt!")
  if(rooms.length === 0){
    callback()
  }
}



function falschePosition(){
  var checker = false;
  var allDrops = document.querySelectorAll(".insidediv");
  for(drop of allDrops){
    if(drop.hasAttribute("data-setby")){
      if(drop.getAttribute("data-state") == "oc" || drop.hasAttribute("data-gegraut")){
        checker = true;
        break;
      }
    }
  }
  return checker;
}



function deleteOldies(){
  var thisdate = new Date();

  console.log("Oldies gelöscht bis: ", thisdate);
  var sql = "DELETE FROM prufung_termin WHERE prufung_termin.Datum < '"+transformDateToHTML(thisdate)+"'"
  db.query(sql, function(err, results) {
  });
}
deleteOldies();



function extractPP(item){
  var temp = item.textContent.split("[PP.: ");
  var temp = temp[1].split("]");
  return temp[0];
}



function extractID(item){
  var temp = item.textContent.split("[ID.: ");
  var temp = temp[1].split("]");
  return temp[0];
}

function extractSemester(item){
  var temp = item.textContent.split(" | ");
  return temp[1];
}

function extractDauer(item){
  var temp = item.textContent.split("[D.: ");
  var temp = temp[1].split("]");
  return temp[0];
}



function plausiblecheck(e){
  e.preventDefault();

  if(falschePosition()){
    dialogs.alert("Fehlerhafte Positionierung eines Tokens. Keine Eintragung möglich.");
    return;
  }

  var semester;
  var dauer;
  const prüfungen = datalistpruf.children;
  var checkerSem = false;
  var checkerDauer = false;

  Array.from(prüfungen).forEach((prüfung) =>{
    if(prüfung.selected){
      if(extractSemester(prüfung) !== "Immer"){
        if(semester === undefined){
          semester = extractSemester(prüfung);
        }
        if(semester !== extractSemester(prüfung)){
          checkerSem = true;
        }
      }

      if(dauer === undefined){
        dauer = extractDauer(prüfung);
      }
      if(dauer !== extractDauer(prüfung)){
        checkerDauer = true;
      }
    }
  })


  if(checkerSem || checkerDauer){
    dialogs.confirm("Möchten Sie trotzdem eintragen?", ok => {
      if(ok === true){
        eintragen();
      }
    })
  } else eintragen();

  if(checkerSem){
    dialogs.alert("Hinweis: Nicht alle Prüfungen haben das gleiche Standardsemester.")
  }
  if(checkerDauer){
    dialogs.alert("Hinweis: Nicht alle Prüfungen haben die gleiche Dauer.")
  }


}

buttonEintragen.addEventListener("click", plausiblecheck);



function schonPrufung(paraDatum, callback){
  if(paraDatum === undefined){
    paraDatum = datumInput2.value;
  }
  console.log("Funktion schonPrufung in")
  var thisdate = new Date(paraDatum);
  var nextdate = new Date(paraDatum);
  nextdate.setDate(nextdate.getDate()+1)
  var prevdate = new Date(paraDatum);
  prevdate.setDate(prevdate.getDate()-1)

  var prufungen = document.querySelectorAll("#datalistpruf option");


  prufungen.forEach((pruf) => {
  if(pruf.selected){
    var pp = extractPP(pruf);
    var id = extractID(pruf);
    var sql;

var sql0 = "SELECT * FROM prufungen, prufungstudsemverbindung, studiengangssemester WHERE prufungen.Prufung_ID = '"+id+"' AND prufungen.Prufung_ID = prufungstudsemverbindung.Prufung_ID AND prufungstudsemverbindung.Studiengangssemester_ID = studiengangssemester.Studiengangssemester_ID"
db.query(sql0, function(err, results0) {
  if (err) throw err;
  console.log("jo das sind die semseter der prüfung",results0);
  var studsem = [];
  var prufIds = [];

    results0.forEach((result0)=>{

      if(pp === "N"){
        sql = "SELECT * FROM studiengangssemester, prufungstudsemverbindung, prufungen, prunfung_termin_verb, prufung_termin WHERE studiengangssemester.Studiengangssemester_ID = prufungstudsemverbindung.Studiengangssemester_ID AND prufungstudsemverbindung.Prufung_ID = prufungen.Prufung_ID AND (studiengangssemester.Studiengang = '"+result0["Studiengang"]+"' OR  studiengangssemester.Abkurzung = '"+result0["Abkurzung"]+"') AND prufungen.Prufung_ID = prunfung_termin_verb.Prufung_ID AND prunfung_termin_verb.Termin_ID = prufung_termin.Termin_ID AND prufung_termin.Datum = '"+transformDateToHTML(thisdate)+"'"
      } else{
        sql = "SELECT * FROM studiengangssemester, prufungstudsemverbindung, prufungen, prunfung_termin_verb, prufung_termin WHERE studiengangssemester.Studiengangssemester_ID = prufungstudsemverbindung.Studiengangssemester_ID AND prufungstudsemverbindung.Prufung_ID = prufungen.Prufung_ID AND (studiengangssemester.Studiengang = '"+result0["Studiengang"]+"' OR  studiengangssemester.Abkurzung = '"+result0["Abkurzung"]+"') AND prufungen.Prufung_ID = prunfung_termin_verb.Prufung_ID AND prunfung_termin_verb.Termin_ID = prufung_termin.Termin_ID AND (prufung_termin.Datum = '"+transformDateToHTML(thisdate)+"' OR prufung_termin.Datum ='"+transformDateToHTML(nextdate)+"' OR prufung_termin.Datum ='"+transformDateToHTML(prevdate)+"')"
      }

      db.query(sql, function(err, results) {
        if (err) throw err;
        console.log("so siehts aus", results)

          for(result of results){
            if(result["Prüfungsart"] !== "Hausarbeit"){
              studsem.push(" "+result["Studiengang"]+" "+result["Semesternummer"]);
              prufIds.push(" "+result["Prufung_ID"]);
              studsem = removeduplicates(studsem);
              prufIds = removeduplicates(prufIds);
              console.log(studsem);
              var allDropsxy = document.querySelectorAll(".insidediv");
              console.log("Es gibt soviele Drops:", allDropsxy.lenth)
              allDropsxy.forEach((drop) => {
                drop.setAttribute("data-state", "oc");
                drop.classList.add("belegt");
                drop.setAttribute("title", "Studiengangssemester stehen nicht zur Verfügug: "+studsem.join()+"; Durch diese Prüfungen belegt:"+prufIds.join());
              })
            }
            if(pruf === prufungen[prufungen.length-1] && result0 === results0[results0.length-1] && result === results[results.length-1]){
              callback()
            }
          }
          if(pruf === prufungen[prufungen.length-1] && result0 === results0[results0.length-1] && results.length === 0){
            callback()
          }
      })

    })
    if(pruf === prufungen[prufungen.length-1] && results0.length === 0){
      callback()
    }
});

}
  })
  console.log("Funktion schonPrufung out")
  if(prufungen.length === 0){
    callback(null)
  }
}





function eintragen(){



  var prufungen = document.querySelectorAll("#datalistpruf option");

  //Datum ermitteln
  const namediv = document.querySelectorAll(".nameDivTwo");
  var datum = namediv[0].getAttribute("data-datum")

  //Beginn der Klausur durch Mastertoken ermitteln
    const allDrags = document.querySelectorAll("#raumgrid .dnd")
    var beginn = allDrags[0].parentElement.getAttribute("data-this");
    var beginnString = getTime(parseInt(beginn));
    var mastertokenId = allDrags[0].id;
    console.log(beginnString)

    //timeslots ermitteln
    var timeslots = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    const allDrops = document.querySelectorAll(".insidediv");
    allDrops.forEach((item) => {
      if(item.getAttribute("data-setby") == mastertokenId){
        timeslots[parseInt(item.getAttribute("data-this"))-1] = 1;
      }
    })
    console.log(timeslots);

var update = datum+"T"+beginnString;
var sql = "INSERT INTO prufung_termin (Beginn, Datum, TS1, TS2, TS3, TS4, TS5, TS6, TS7, TS8, TS9, TS10, TS11, TS12, TS13, TS14, TS15, TS16, TS17, TS18, TS19, TS20, TS21) VALUES ('" + beginnString + "','" + datum + "','" + timeslots[0] + "','" + timeslots[1] + "','" + timeslots[2] + "','" + timeslots[3] + "','" + timeslots[4] + "','" + timeslots[5] + "','" + timeslots[6] + "','" + timeslots[7] + "','" + timeslots[8] + "','" + timeslots[9] + "','" + timeslots[10] + "','" + timeslots[11] + "','" + timeslots[12] + "','" + timeslots[13] + "','" + timeslots[14] + "','" + timeslots[15] + "','" + timeslots[16] + "','" + timeslots[17] + "','" + timeslots[18] + "','" + timeslots[19] + "','" + timeslots[20] + "')"
    db.query(sql, function(err, results) {
  var alreadyset = false;
  prufungen.forEach((item) => {
//id ermitteln
  if(item.selected){
      var id = extractID(item);
      console.log(id);

      var sqlxyz = "UPDATE prufungen SET Letzter_Termin = '"+update+"' WHERE prufungen.Prufung_ID = '"+id+"'";
      db.query(sqlxyz, function(err, results2) {
        if(err) throw err
      });
      // var sqltest = "SELECT * FROM prufungen, prunfung_termin_verb, prufung_termin WHERE prufungen.Prufung_ID = '"+id+"' AND prufungen.Prufung_ID = prunfung_termin_verb.Prufung_ID AND prunfung_termin_verb.Termin_ID = prufung_termin.Termin_ID"
      // db.query(sqltest, function(err, results000) {
      //   if (err) throw err;
      // if(results000.length === 0){

      var sql2 = "INSERT INTO prunfung_termin_verb (Prufung_ID, Termin_ID) VALUES ('"+id+"','"+results["insertId"]+"')"
      db.query(sql2, function(err, results2) {
        if(err) throw err;
      });

      const allDrags = document.querySelectorAll("#raumgrid .dnd")
      if(!alreadyset){
        for(item2 of allDrags){
          console.log(item2.parentElement.getAttribute("data-parent"))
          console.log(results["insertId"])
          var sql4 = "SELECT * FROM raum WHERE Bezeichnung='"+item2.parentElement.getAttribute("data-parent")+"'"
          db.query(sql4, function(err, results4) {
            console.log(results4)
            for(result of results4){
              var sql3 = "INSERT INTO prufung_termin_raumverb (Termin_ID, Raum_ID) VALUES ('"+results["insertId"]+"','"+result["Raum_ID"]+"')"
              db.query(sql3, function(err, results3) {
              });
              break;
            }

          });

          alreadyset = true;
        }
       }
      dialogs.alert("Prüfungen eingetragen", loadRooms);
      setTimeout(()=>{
        location.reload()
      }, 1000);
// } else dialogs.alert("Für diese Prüfung gibt es schon einen Termin: PrüfungsID "+id+"") //if results.length
// }); //slect query
}   //if selected
}); //Prufung-for each
}); //erste insert into query
//verwendete Räume ermitteln
} //komplette funktion


function checkDate(){

  var today = new Date();
  today.setHours(0);
  var thisdate = new Date(datumInput2.value);

  if(feiertagejs.isHoliday(thisdate, 'RP')){
    console.log(feiertagejs.getHolidayByDate(thisdate, 'RP'))
    dialogs.alert("Dieser Tag könnte ein Feiertag sein: " + feiertagejs.getHolidayByDate(thisdate, 'RP').name)
  }


  if(today > thisdate){
    console.log("hier bin ich")
    dialogs.alert("Hinweis: Dieses Datum liegt in der Vergangenheit.")


  }

}




//https://www.youtube.com/watch?v=jfYWwQrtzzY
//https://www.youtube.com/watch?v=7HUCAYMylCQ
//https://stackoverflow.com/questions/4345045/loop-through-a-date-range-with-javascript
