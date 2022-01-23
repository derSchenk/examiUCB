var Dialogs = require('dialogs');
var dialogs = Dialogs(opts = {});
const lodash = require("lodash");

const formular = document.querySelectorAll('#formular');
const buttonSend = document.querySelector('input[type="submit"]');
const buttonAdd = document.querySelector('#buttonaddpruf');
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
datumInput.value = transformDateToHTML(new Date());

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

//----------------------------------------------------------



//Laden der Vorschläge für die Prüfungen--------------------
var sql = 'SELECT * FROM prufungen ORDER BY Prufung_Name ASC';
db.query(sql, function(err, results) {
  if (err) throw err;
  //console.log(results);
  results.forEach(result => {
    const nOption = document.createElement('option');
    var inhalt = result["Prufung_Name"].toLowerCase().trim() + " | " + result["Standardsemester"] + " | " + result["Prüfungsstatus"] + " [T.: " + result["Teilnehmerzahl"] + "]" + " [D.: " + result["Dauer"] + "]" + " [ID.: " + result["Prufung_ID"] + "]"
    nOption.value = inhalt;
    allePrufungen.push(inhalt);
    listprufungen.appendChild(nOption);
  });
});

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
    datumInput2.value = transformDateToHTML(new Date());
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
    datumInput2.value = transformDateToHTML(new Date());
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

  loadRooms()

  //Statt hidden könnte auch Display = none gesetzt werden? Besser?
}

buttonSend.addEventListener('click', setVisible, false);
//---------------------------------------------------


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
    if (dauer[0] != "null") {
      if (parseInt(dauer[0]) >= parseInt(minutes.value)) {
        minutes.value = dauer[0];
      }
    }
  }
  prufungInput.value = "";
}

buttonAdd.addEventListener('click', addPrufung, false);

var vorher;

function changeRaumkat() {
  if (raumkat.value != "- Kein Raum benötigt -") {
    vorher = raumkat.value;
  }
  if (minutes.value == 0) {
    raumkat.value = "- Kein Raum benötigt -";
  } else raumkat.value = vorher;
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

function loadRooms(e) { //Funktion erstellt das Grid für das Drag'n'Drop

  while (raumgrid.firstChild) { //Falls das Grid durch vorherige Abfrage bereits gefüllt. Lösche diese Einträge.
    raumgrid.firstChild.remove()
  }

  //Oberer Teilnehmer: siehe unterer Teilnehmer-Counter für Erläuterungen (weiter unten)
  const capcounterOuter = document.createElement("div");
  capcounterOuter.classList.add("outsidediv")
  const seitlicherPlatzhalter = document.createElement("div"); //...erstelle ein Div (seitlicher Tabellenkopf) für die Kategorie und für die Kapazität
  seitlicherPlatzhalter.className = "nameDivTwo";
  const datum = document.createTextNode(returnWeekdayString(new Date(datumInput2.value))+" "+datumInput2.value);
  seitlicherPlatzhalter.appendChild(datum);
  seitlicherPlatzhalter.setAttribute("data-datum", datumInput2.value);
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

    loadRoomBelegung();
  });
  //----------------------------------------------------------------------------

  ladeBelegungen();
  empfehlung(0)

}



//----------DRAG AND DROP-----------------------------------------------------

function setzeVerboteneDrops(){
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
}






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
  setzeVerboteneDrops();
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




function ladeBelegungen(){
  var prufungen = document.querySelectorAll("#datalistpruf option");
  prufungen.forEach((item) => {
    if(item.selected){
      var temp = item.textContent.split("[ID.: ");
      var temp = temp[1].split("]");
      var id = temp[0];
      console.log(id)

      var sql = "SELECT * FROM prufungen, prufunganwesendeverbindung, anwesende, anwesendebelegungverbindung, anwesende_belegung WHERE prufungen.Prufung_ID = '"+id+"' AND prufungen.Prufung_ID = prufunganwesendeverbindung.Prufung_ID AND prufunganwesendeverbindung.Anwesende_ID = anwesende.Anwesende_ID AND anwesende.Anwesende_ID = anwesendebelegungverbindung.Anwesende_ID AND anwesendebelegungverbindung.Belegungs_ID = anwesende_belegung.Belegungs_ID UNION SELECT * FROM prufungen, prufungstudsemverbindung, studiengangssemester, studsembelegungverbindung, studiengangssemester_belegung WHERE prufungen.Prufung_ID = '"+id+"' AND prufungen.Prufung_ID = prufungstudsemverbindung.Prufung_ID AND prufungstudsemverbindung.Studiengangssemester_ID = studiengangssemester.Studiengangssemester_ID AND studiengangssemester.Studiengangssemester_ID = studsembelegungverbindung.Studiengangssemester_ID AND studsembelegungverbindung.Belegungs_ID = studiengangssemester_belegung.Belegungs_ID";
const datumTag = document.querySelector("#kws");
var betrachtetesDatum = new Date(datumTag.value)

      db.query(sql, function(err, results) {
        var ergebnisse = [];
        if (err) throw err;
        //console.log(results);

        for (result of results){
          var dateOne = result["Datum"];
          var dateTwo = result["DatumBis"];
          for (var i = dateOne; i <= dateTwo; i.setDate(i.getDate() + 1)){

            var teilergebnis = [];

            betrachteterTag = betrachtetesDatum.getDay()
            if(betrachteterTag === 0){
              betrachteterTag = 7;
            }

            if(result["Wochentage"].includes(betrachteterTag.toString())){
              teilergebnis.push(i);
              for(var j = 1; j <= 21; j++){
                teilergebnis.push(result["TS"+j])
              }
              ergebnisse.push(lodash.cloneDeep(teilergebnis));
            }


          }

        }

        betrachtetesDatum.setHours(0);
        var belegung = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        for (item of ergebnisse){
          if(item[0].getTime() == betrachtetesDatum.getTime()){     //Hä was soll das?

            for(var u = 1; u <= 21; u++){
              if(item[u] == 1){
                belegung[u-1] = 1;
              }
            }
          }
        }
        console.log("this is: "+belegung);
        var allDrops = document.querySelectorAll(".insidediv");
        for(drop of allDrops){
         if(belegung[parseInt(drop.getAttribute("data-this"))-1] == 1){
           console.log("drin");
           drop.classList.add("belegt")
           drop.setAttribute("data-state", "oc")
           drop.setAttribute("title", "eingetragene Abwesenheit")
         }
        }


      });

    }
  })
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



function drop(e) {
  //e.preventDefault();
  createNewElement();

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

  // if(itemsEmpfehlungen[0].getAttribute("data-state") == "oc"){
  //
  // }

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

// var marker = true;
// var laenge = 0;
// var capEmpfehlungen = [];
// var itemsEmpfehlungen = [];
// function empfehlung(restart) {
//
// if(restart != undefined){
//   laenge = restart;
// }
//
//   const allDrags = document.querySelectorAll("#raumgrid .dnd");
//   const allDrops = document.querySelectorAll(".insidediv");
//   if (allDrags.length <= itemsEmpfehlungen.length) {
//     capEmpfehlungen = [];
//     marker = true;
//     console.log("in1")
//   }
//
//   if (capEmpfehlungen.includes(parseInt(allDrops[0].getAttribute("data-cap")))) {
//     return;
//   }
//
//   // if(itemsEmpfehlungen[0].getAttribute("data-state") == "oc"){
//   //
//   // }
//
//   itemsEmpfehlungen = [];
//
//
//   capEmpfehlungen = [];
//
//   allDrops.forEach((element) => {
//
//
//
//     if (element.style.borderColor == "deepskyblue") {
//       element.style.borderColor = "black";
//       element.style.color = "black";
//       element.style.borderStyle = "solid";
//       element.style.fontWeight = "normal";
//       element.removeAttribute("title");
//     }
//   })
//
// //  var firstAdvice;
//
//   var a = "allDrops[item].getAttribute('data-state') == 'free' && (21 - 0 ) >= parseInt(allDrops[item].getAttribute('data-this'))"
//   var b = "parseInt(allDrops[item].getAttribute('data-cap')) "
//   var c = "allDrops[item2].getAttribute('data-state') != 'free' || !((21 - 0) >= parseInt(allDrops[item2].getAttribute('data-this'))) "
//   var d = "allDrops[item2] = allDrops[item2].nextSibling; "
//   var e = "capEmpfehlungen.push(parseInt(allDrops[item].getAttribute('data-cap'))); itemsEmpfehlungen.push(allDrops[item]);"
//
//   if (allDrags.length > 1) {
//     for (var i = 2; i <= allDrags.length; i++) {
//       var p = (i - 1) * 21;
//       a = a + "&& allDrops[parseInt(item)+" + p + "].getAttribute('data-state') == 'free' && (21 - 0) >= parseInt(allDrops[parseInt(item)+" + p + "].getAttribute('data-this')) "
//       b = b + "+ parseInt(allDrops[parseInt(item)+" + p + "].getAttribute('data-cap')) "
//       c = c + " || allDrops[parseInt(item2)+" + p + "].getAttribute('data-state') != 'free' || !((21 - 0) >= parseInt(allDrops[parseInt(item2)+" + p + "].getAttribute('data-this'))) "
//       d = d + " allDrops[parseInt(item2)+" + p + "] = allDrops[parseInt(item2)+" + p + "].nextSibling; "
//       e = e + "capEmpfehlungen.push(parseInt(allDrops[parseInt(item)+" + p + "].getAttribute('data-cap'))); itemsEmpfehlungen.push(allDrops[parseInt(item)+" + p + "]);"
//     }
//   }
// try{
//   for (item in allDrops) {
//     if (getTeilnehmer() - (eval(b)) <= 0) {
//       if (eval(a)) {
//         var checker = true;
//         var item2 = item;
//         for (var i = 1; i < calcTimeSlots(); i++) {
//           //eval(d);
//           item2++;
//           if (eval(c)) {
//             checker = false;
//             break;
//           }// else console.log("jop")
//         }
//         if (checker == true) {
//           //console.log(capEmpfehlungen);
//           eval(e);
//           //console.log(capEmpfehlungen);
//           break;
//         }
//       }
//     }
//   }
// } catch{
//  console.log("keine Empfehlung möglich?")
// }
//
// console.log("Hier:")
// console.log(itemsEmpfehlungen);
//
//
//
// console.log(capEmpfehlungen);
//   capEmpfehlungen.reverse()
//   var teilnehmer = getTeilnehmer();
//   var cap = 0;
//   console.log(itemsEmpfehlungen);
//   for (var i = 0; i < capEmpfehlungen.length; i++) {
//     cap = cap + capEmpfehlungen[i];
//
//     if (cap >= teilnehmer && i < capEmpfehlungen.length - 1) {
//       console.log("jetz isses soweit")
//       marker = false;
//
//
//       console.log(itemsEmpfehlungen);
//       //console.log(capEmpfehlungen);
//       itemsEmpfehlungen.shift();
//       //console.log(itemsEmpfehlungen);
//     }
//   }
//   console.log("länge"+laenge);
//   console.log("empfehlungen:"+itemsEmpfehlungen.length)
//   if(itemsEmpfehlungen.length > laenge){
//     console.log("in2")
//     marker = true
//     laenge = itemsEmpfehlungen.length;
//   }
//   // if(capEmpfehlungen.includes(parseInt(allDrops[0].getAttribute("data-cap")))){
//   //   dialogs.alert("Ende")
//   //   itemsEmpfehlungen.pop();
//   // }
//   console.log(marker)
//
//
//
// if(marker){
//   itemsEmpfehlungen.forEach((element) => {
//
//     if(element.getAttribute("data-empfehlung") != "verboten"){
//       element.style.borderColor = "deepskyblue";
//       element.style.color = "deepskyblue"
//       element.style.fontWeight = "bold";
//       if(itemsEmpfehlungen.length > 1){
//         itemsEmpfehlungen[0].style.borderStyle = "dashed";
//         itemsEmpfehlungen[0].setAttribute("title", "Dieser Slot muss nicht unbedingt der beste sein, probiere auch mal die Slots darüber aus (falls frei).");
//       }
//     }
//   })
// }
// }


function loadRoomBelegung(){
  const rooms = document.querySelectorAll(".roomdiv");
  nameDivTwo = document.querySelector(".nameDivTwo");
  datumsangabe = nameDivTwo.getAttribute("data-datum");
  rooms.forEach((room) => {
    console.log(datumsangabe)
    console.log(room.getAttribute("data-room"))
    var sql = "SELECT * FROM raum, prufung_termin_raumverb, prufung_termin WHERE raum.Bezeichnung = '"+room.getAttribute("data-room")+"' AND raum.Raum_ID = prufung_termin_raumverb.Raum_ID AND prufung_termin_raumverb.Termin_ID = prufung_termin.Termin_ID AND prufung_termin.Datum='"+datumsangabe+"'"
    db.query(sql, function(err, results) {
      console.log(results)
      console.log(room);
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
    });

  });
}



function falschePosition(){
  var checker = false;
  var allDrops = document.querySelectorAll(".insidediv");
  for(drop of allDrops){
    if(drop.hasAttribute("data-setby")){
      if(drop.getAttribute("data-state") == "oc" || drop.hasAttribute("data-gegraut")){
        checker = true;
      }
    }
  }
  return checker;
}

function deleteOldies(){
  var thisdate = new Date();
  thisdate.setDate(thisdate.getDate()-7);

  console.log("Oldies gelöscht bis: ", thisdate);
  var sql = "DELETE FROM prufung_termin WHERE prufung_termin.Datum < '"+transformDateToHTML(thisdate)+"'"
  db.query(sql, function(err, results) {
  });
}
deleteOldies();



function eintragen(e){
  e.preventDefault();

  if(falschePosition()){
    dialogs.alert("Fehlerhafte Positionierung eines Tokens. Keine Eintragung möglich.");
    return;
  }

  var prufungen = document.querySelectorAll("#datalistpruf option");

  //Datum ermitteln
  const namediv = document.querySelectorAll(".nameDivTwo");
  var datum = namediv[0].getAttribute("data-datum")
  console.log(datum)

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


var sql = "INSERT INTO prufung_termin (Beginn, Datum, TS1, TS2, TS3, TS4, TS5, TS6, TS7, TS8, TS9, TS10, TS11, TS12, TS13, TS14, TS15, TS16, TS17, TS18, TS19, TS20, TS21) VALUES ('" + beginnString + "','" + datum + "','" + timeslots[0] + "','" + timeslots[1] + "','" + timeslots[2] + "','" + timeslots[3] + "','" + timeslots[4] + "','" + timeslots[5] + "','" + timeslots[6] + "','" + timeslots[7] + "','" + timeslots[8] + "','" + timeslots[9] + "','" + timeslots[10] + "','" + timeslots[11] + "','" + timeslots[12] + "','" + timeslots[13] + "','" + timeslots[14] + "','" + timeslots[15] + "','" + timeslots[16] + "','" + timeslots[17] + "','" + timeslots[18] + "','" + timeslots[19] + "','" + timeslots[20] + "')"
    db.query(sql, function(err, results) {
  var alreadyset = false;
  prufungen.forEach((item) => {
//id ermitteln
  if(item.selected){
      var temp = item.textContent.split("[ID.: ");
      var temp = temp[1].split("]");
      var id = temp[0];
      console.log(id);

      var sql2 = "INSERT INTO prunfung_termin_verb (Prufung_ID, Termin_ID) VALUES ('"+id+"','"+results["insertId"]+"')"
      db.query(sql2, function(err, results2) {
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
}
})
})




//verwendete Räume ermitteln




dialogs.alert("Prüfungen eingetragen")
}

buttonEintragen.addEventListener("click", eintragen)


//https://www.youtube.com/watch?v=jfYWwQrtzzY
//https://www.youtube.com/watch?v=7HUCAYMylCQ
//https://stackoverflow.com/questions/4345045/loop-through-a-date-range-with-javascript
