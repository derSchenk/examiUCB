var Dialogs = require('dialogs');
var dialogs = Dialogs(opts={});

const formular = document.querySelectorAll('#formular');
const buttonSend = document.querySelector('input[type="submit"]');
const buttonAdd = document.querySelector('#buttonaddpruf');
const prufungInput = document.querySelector('#inputlistprufinput');
const datalistPruf = document.querySelector('#datalistpruf');
const listprufungen = document.querySelector('#listprufungen');
const kategorie = document.querySelector("#selectroomcat");
const raumgrid = document.querySelector("#raumgrid");
const minutes = document.querySelector("#ZeitPrufung");

const drags = document.querySelectorAll(".dragable");
const dnd = document.querySelector(".dnd");
const dragcontainer = document.querySelectorAll(".newdrag");




//----------Formular-Datenspeicher---------
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

//Laden der Vorschläge für die Prüfungen--------------------
var sql = 'SELECT * FROM prufungen ORDER BY Prufung_Name ASC';
db.query(sql, function(err, results){
	if(err) throw err;
	//console.log(results);
  results.forEach(result => {
  	const nOption = document.createElement('option');
  	nOption.value = result["Prufung_Name"].toLowerCase().trim()+" | "+result["Standardsemester"]+" | "+result["Prüfungsstatus"];
    allePrufungen.push(result["Prufung_Name"].toLowerCase().trim()+" | "+result["Standardsemester"]+" | "+result["Prüfungsstatus"]);
  	listprufungen.appendChild(nOption);
  });
});

//-----------------------------------------------------------------

function setVisible(){
  dnd.removeAttribute("hidden");
  dnd.style.display = "table-cell";
  dnd2 = document.querySelector(".newdrag .dnd")
  dnd2.textContent = calcTimeSlots();
  dragcontainer.forEach((item) => {
    item.removeAttribute("hidden")
    item.style.display = "flex";
  })
}

//Formular Daten abrufen und Format anpassen-----------------------
function getDataForm(e) {

		e.preventDefault();
    setVisible();

		prufungen = [];
		days = [];
		kalenderwochen = [];

		var formData = new FormData(formular[0]);

		var prufungenVar = formData.getAll('datalistpruf2');
		var timeString = formData.get('ZeitPrufung2');
		var kalenderwochen3 = formData.get('kws2').trim();
		var kalenderwochen2 = kalenderwochen3.split(" ");
		var daysdrei = formData.get('days2').trim();
		var dayszwei = daysdrei.split(" ");
	  var timeVar= parseInt(timeString);

		if(prufungenVar.length > 0 && kalenderwochen3.localeCompare("") != 0 && daysdrei.localeCompare("") != 0 && timeVar >= 0){
		//ÄNDERN: Wenn nur ein Buchsstabe in Kalenderwochen ist, wird es akzeptiert!!!
			prufungen = prufungenVar;
			var time = timeVar;
			roomcat = formData.get('selectroomcat2');

			kalenderwochen2.forEach(function(item){
				var a = parseInt(item);
				if(a > 0 && a <= 53 && !kalenderwochen.includes(a)){
					kalenderwochen.push(a);
				}
			});
			kalenderwochen.sort();

			dayszwei.forEach(function(item){
				var a = parseInt(item);
				if(a==6 || a==7){
					if(confirm("Soll die Prüfung wirklich an einem Samstag bzw. Sonntag stattfinden dürfen?")){
						if(!days.includes(a)){
						days.push(a);
						}
					}
				} else {
					if(a > 0 && a <= 5 && !days.includes(a)){
						days.push(a);
						}
				}
			});
			days.sort();

		}else dialogs.alert("Erforderliche Eingabe fehlt");
}

buttonSend.addEventListener('click', getDataForm, false);
//---------------------------------------------------

//Verschieben der Prüfung von Input zu Select--------------------------

function addPrufung(e){
	e.preventDefault();
	var eingabe = prufungInput.value;
	var checker = true;
	var vorhanden = datalistPruf.children;
    if(vorhanden.length > 0){
		Array.from(vorhanden).forEach(function(item){
			if(item.value.localeCompare(eingabe)==0){
				checker = false;
			}
		});
	}

	if(checker==true && eingabe.length > 0 && allePrufungen.includes(eingabe)){
		const neueOption = document.createElement('option');
		neueOption.value = eingabe;
		neueOption.selected = true;
		const neuerText = document.createTextNode(eingabe);
		neueOption.appendChild(neuerText);
		datalistPruf.appendChild(neueOption);
	}
	prufungInput.value = "";
}

buttonAdd.addEventListener('click', addPrufung, false);


//Verhinderungen abfragen-------------------------------------------------------------
var exam = "algebrastat";
sql = "SELECT anwesende.Nachname, anwesende_belegung.jahr, anwesende_belegung.tag, anwesende_belegung.kw, anwesende_belegung.tslot FROM prufungen, prufunganwesendeverbindung, anwesende, anwesendebelegungverbindung, anwesende_belegung WHERE prufungen.Prufung_Name = '"+exam+"' AND prufungen.Prufung_ID = prufunganwesendeverbindung.Prufung_ID AND prufunganwesendeverbindung.Anwesende_ID = anwesende.Anwesende_ID AND anwesende.Anwesende_ID = anwesendebelegungverbindung.Anwesende_ID AND anwesendebelegungverbindung.Belegungs_ID = anwesende_belegung.Belegungs_ID"
sql2 = "SELECT studiengangssemester.Studiengang, studiengangssemester_belegung.jahr, studiengangssemester_belegung.tag, studiengangssemester_belegung.kw, studiengangssemester_belegung.tslot FROM prufungen, prufungstudsemverbindung, studiengangssemester, studsembelegungverbindung, studiengangssemester_belegung WHERE prufungen.Prufung_Name = '"+exam+"' AND prufungen.Prufung_ID = prufungstudsemverbindung.Prufung_ID AND prufungstudsemverbindung.Studiengangssemester_ID = studiengangssemester.Studiengangssemester_ID AND studiengangssemester.Studiengangssemester_ID = studsembelegungverbindung.Studiengangssemester_ID AND studsembelegungverbindung.Belegungs_ID = studiengangssemester_belegung.Belegungs_ID"
var verhinderungen = [];
var verhinderungen2 = [];
db.query(sql, function(err, results){
	if(err) throw err;
  verhinderungen2 = results;
});
db.query(sql2, function(err, results){
	if(err) throw err;
  verhinderungen = results;
  verhinderungen = verhinderungen.concat(verhinderungen2);
  console.log(verhinderungen);
});
//---------------------------------------

function getTime(number){
  var time;
  if(number === 1){
    time = "09:00";
  } else if (number === 2) {
    time = "09:30";
  }else if (number === 3) {
    time = "10:00";
  }else if (number === 4) {
    time = "10:30";
  }else if (number === 5) {
    time = "11:00";
  }else if (number === 6) {
    time = "11:30";
  }else if (number === 7) {
    time = "12:00";
  }else if (number === 8) {
    time = "12:30";
  }else if (number === 9) {
    time = "13:00";
  }else if (number === 10) {
    time = "13:30";
  }else if (number === 11) {
    time = "14:00";
  }else if (number === 12) {
    time = "14:30";
  }else if (number === 13) {
    time = "15:00";
  }else if (number === 14) {
    time = "15:30";
  }else if (number === 15) {
    time = "16:00";
  }else if (number === 16) {
    time = "16:30";
  }else if (number === 17) {
    time = "17:00";
  }else if (number === 18) {
    time = "17:30";
  }else if (number === 19) {
    time = "18:00";
  }else if (number === 20) {
    time = "18:30";
  }else if (number === 21) {
    time = "19:00";
  }
  return time;
}


function loadRooms(e){
  e.preventDefault();
  while (raumgrid.firstChild) {
      raumgrid.firstChild.remove()
  }



  var rooms = [];
  var sql3 = "SELECT * FROM raum WHERE Kategorie='"+kategorie.value+"' ORDER BY Kapazität, Bezeichnung ASC;"
  db.query(sql3, function(err, results){
  	if(err) throw err;
    results.forEach(function(item){
      console.log(results)
        const outsidediv = document.createElement('div');
        outsidediv.className = "outsidediv";
        const divName = document.createElement("div");
        divName.className = "nameDiv";
        const bez = document.createTextNode(item["Bezeichnung"]+" | Kap: "+item["Kapazität"]);
        divName.appendChild(bez);
        outsidediv.appendChild(divName);
        for(var i = 1; i <= 21; i++){
          console.log(i);
          const neuerText = document.createTextNode(getTime(i));
          const newSpan = document.createElement("span");
          newSpan.removeAttribute("draggable");
          newSpan.appendChild(neuerText);
          const insidediv = document.createElement('div');
          insidediv.appendChild(newSpan);
          insidediv.className = "insidediv dropable";
          insidediv.id = item["Bezeichnung"]+"_"+i;
          insidediv.setAttribute("data-this", i.toString());
          insidediv.setAttribute("data-prev", (i-1).toString());
          insidediv.setAttribute("data-next", (i+1).toString());
          insidediv.setAttribute("data-cap", item["Kapazität"]);
          insidediv.setAttribute("data-parent", item["Bezeichnung"]);
          insidediv.setAttribute("data-state", "free");
          outsidediv.appendChild(insidediv);
        }
        raumgrid.appendChild(outsidediv);
        raumgrid.removeAttribute("hidden");

    })
  });

}

buttonSend.addEventListener("click", loadRooms, false);

//----------DRAG AND DROP-----------------------------------------------------

function dragoverpapierkorb(e){
  e.preventDefault();
  const draggable = document.querySelector('.dragging');
  this.appendChild(draggable);
  createNewElement();
  colorize();
}

function droppapierkorb(){
    this.lastChild.remove();
}

drags.forEach(item => {
  item.addEventListener("dragstart", dragstart);
  //item.addEventListener("drag", drag);
  item.addEventListener("dragend", dragend);
})


function listenershinzufügen(){
  const papierkorb = document.querySelector("#papierkorb");
  papierkorb.addEventListener("dragover", dragoverpapierkorb);
  papierkorb.addEventListener("drop", droppapierkorb);

  const drops = document.querySelectorAll(".dropable");
    drops.forEach(item => {
      item.addEventListener("dragover", dragover);

      item.addEventListener("drop", drop);
    //  item.addEventListener("dragenter",);
      item.addEventListener("dragleave", dragleave);
    })
}

function dragover(e){
  var lastDrops = 21 - (calcTimeSlots()-2);
  if(this.getAttribute("data-this") < lastDrops){
    e.preventDefault();
  }else this.lastChild.style.display = none;

  const draggable = document.querySelector('.dragging');
  this.appendChild(draggable);
  colorize();
  findfirst();
}

function dragstart(e){
    listenershinzufügen();                //geht sicher besser!
    this.classList.add('dragging');
}


function dragend(e) {
  this.classList.remove('dragging');
  colorize();
}

function dragleave(e){
  var number = parseInt(this.lastChild.textContent);
  var item2 = this;
    this.style.backgroundColor = "white";
    for(var i = 1; i < number; i++){
        item2 = item2.nextSibling;
        item2.style.backgroundColor = "white";
      }
    }

function calcTimeSlots(){
  var duration = minutes.value;
  if(duration == 0){
    return 0;
  }
  var timeslots = parseInt(duration / 30);
  if(duration%30 > 10){
    timeslots += 1;
  }
  timeslots += 1; //nächste Prüfung nicht direkt im Anschluss
  return timeslots;
}

function createNewElement(){
  if(dragcontainer[0].childElementCount === 0){
    const text = document.createTextNode(calcTimeSlots());
    const anotherDrag = document.createElement("div");
    dragID++;
    anotherDrag.id = "drag"+dragID;
    anotherDrag.style.display = "table-cell"
    anotherDrag.classList.add("dnd");
    anotherDrag.setAttribute("draggable", "true");  //Brauch ich das noch?
    anotherDrag.setAttribute("data-token", "true");
    anotherDrag.setAttribute("title", "Bewege den Token nicht zu schnell von einem Slot in einen anderen.")
    anotherDrag.addEventListener("dragstart", dragstart);
    anotherDrag.addEventListener("dragend", dragend);
    anotherDrag.appendChild(text);
    dragcontainer[0].appendChild(anotherDrag);
  }
}


function colorize(){
  var allDrops = document.querySelectorAll(".insidediv");
  allDrops.forEach( element => {
    if(element.lastChild.hasAttribute("data-token")){
      if(calcTimeSlots() != 0){
      element.style.backgroundColor = "pink";
      }
      var number = parseInt(element.lastChild.textContent);
      var item2 = element;
      for(var i = 1; i < number; i++){
        item2 = item2.nextSibling;
        item2.style.backgroundColor = "pink";
      }
    }
  })
}

function findfirst(){
  const alldrags = document.querySelectorAll("#raumgrid .dnd");
  if(alldrags.length > 1){
    var allDrops = document.querySelectorAll(".insidediv");
    var first;
    var firstandfellows = [];
    for (var item of allDrops){
      if(item.lastChild.hasAttribute("data-token")){
        first = item.getAttribute("data-this");
        break;
      }
    }

    for(var i = parseInt(first); i < parseInt(first)+calcTimeSlots(); i++){
      firstandfellows.push(i);
      console.log(i)
    }
    allDrops.forEach((item) => {
      if(!firstandfellows.includes(parseInt(item.getAttribute("data-this")))){
        item.style.opacity = "60%"
        item.style.backgroundColor = "white";
      } else {
        item.style.backgroundColor = "white";
        item.style.opacity = "100%"
      }
    });
  }
}

function drop(e){
  e.preventDefault();
  createNewElement();
  //findfirst();
}
//https://www.youtube.com/watch?v=jfYWwQrtzzY
//https://www.youtube.com/watch?v=7HUCAYMylCQ