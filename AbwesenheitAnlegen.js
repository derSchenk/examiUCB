const inputTyp = document.querySelector("#typ");
const inputObjekt = document.querySelector("#objekt");
const inputVonDate = document.querySelector("#vonDate");
const inputBisDate = document.querySelector("#bisDate");
const inputTage = document.querySelector("#tage");
const inputVonSlot = document.querySelector("#vonSlot");
const inputBisSlot = document.querySelector("#bisSlot");

const buttonEintragen = document.querySelector('#buttonEintragen')
const formulare = document.querySelectorAll('.formular')

const inputlöschen = document.querySelector('#löschen')
const alleElemente = document.querySelector('#alleElemente')
const buttonLöschen = document.querySelector('#buttonLöschen')


//--------------------------------------------
function checkSlot(e){
  e.preventDefault();
  if(parseInt(inputBisSlot.value) < parseInt(inputVonSlot.value)){
    inputBisSlot.value = inputVonSlot.value;

  }
}
function checkSlot2(e){
  e.preventDefault();
  if(parseInt(inputBisSlot.value) < parseInt(inputVonSlot.value)){
    inputVonSlot.value = inputBisSlot.value;

  }
}
inputVonSlot.addEventListener("change",checkSlot, false);
inputBisSlot.addEventListener("change",checkSlot2, false);

function checkDate2(e){
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
console.log("this is: "+ typeof  inputBisDate.value);
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

		db.connect(function(err){
			if(err) throw err;
			console.log("Verbindung zur Datenbank hergestellt.")
		});

//----------------------------------------------------------
function loadFormData(e){
e.preventDefault();

if(inputBisDate.value == ""){
  inputBisDate.value = inputVonDate.value;
  if(inputTage.value.trim() == ""){
    inputTage.value = "1 2 3 4 5 6 7";
  }
}

if(input.value == ""){
  inputTage.value = "1 2 3 4 5";
}



var dateOne = new Date(inputVonDate.value);
var dateTwo = new Date(inputBisDate.value);

var days = inputTage.value.trim().split(" ");

var timeslots = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

for(var i = parseInt(inputVonSlot.value)-1; i <= parseInt(inputBisSlot.value)-1; i++){
  timeslots[i] = 1;
}

console.log(days);

var p;
for(var i = dateOne; i <= dateTwo; i.setDate(i.getDate()+1)){

  if(i.getDay()==0){
    p = 7;
  } else p = i.getDay();

  if(days.includes(String(p))){
    var kwunddate = dateTokw3(i)
    console.log(kwunddate);

  }
}
  }

buttonEintragen.addEventListener("click", loadFormData, false);




//----Berechne KW + Day aus Date
function dateTokw3(i){
//https://die-aktuelle-kalenderwoche.de/kalenderwochen-in-javascript
  var date = i;
  var day = date.getDay();
  if(day == 0){   //Amerikanische Wochen starten mit Sonntag
    day = day + 7;
  }
var currentThursday = new Date(date.getTime() +(3-((date.getDay()+6) % 7)) * 86400000);
// At the beginnig or end of a year the thursday could be in another year.
var yearOfThursday = currentThursday.getFullYear();
// Get first Thursday of the year
var firstThursday = new Date(new Date(yearOfThursday,0,4).getTime() +(3-((new Date(yearOfThursday,0,4).getDay()+6) % 7)) * 86400000);
// +1 we start with week number 1
// +0.5 an easy and dirty way to round result (in combinationen with Math.floor)
var weekNumber = Math.floor(1 + 0.5 + (currentThursday.getTime() - firstThursday.getTime()) / 86400000/7);

var kwunddate = [];
kwunddate.push(weekNumber);
kwunddate.push(day);

return kwunddate;
}
