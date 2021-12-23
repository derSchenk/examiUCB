var Dialogs = require('dialogs');
var dialogs = Dialogs(opts={});

const inputDate = document.querySelector("#date");
const outputKW = document.querySelector("#ergebnis");
const outputDay = document.querySelector("#ergebnis2");
const outputYear = document.querySelector('#ergebnis3');


//Datum in KW umrechnen---------------------------------------------------
function dateTokw(tag, monat, jahr){
//https://die-aktuelle-kalenderwoche.de/kalenderwochen-in-javascript
  var date = new Date(jahr,monat-1,tag);
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

outputKW.value = weekNumber;
outputDay.value = day;
return weekNumber;
}

function dateTokw2(tag, monat, jahr){
//https://die-aktuelle-kalenderwoche.de/kalenderwochen-in-javascript
  var date = new Date(jahr,monat-1,tag);
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

return weekNumber;
}

function auswertenDateKW(e){
  e.preventDefault();
  if(e.keyCode === 13){
    var inputDateSplit = inputDate.value.split('-');
    var tag = inputDateSplit[2];
    var monat = inputDateSplit[1];
    var jahr = inputDateSplit[0];
    outputYear.value = jahr;
    dateTokw(tag, monat, jahr);
  }
}

inputDate.addEventListener("keyup", auswertenDateKW, false);



//KW nach Datum------------------------------------------------------

function addDays(date, days) {
  var result = new Date(date);
  console.log(result);
  result.setDate(result.getDate() + days);
  console.log(result);
  var month = result.getMonth()+1
  var tage = result.getDate();
  if(month < 10){
    month = "0"+month;
  }
  if(tage < 10){
    tage = "0"+tage;
  }
  var ergebnis = result.getFullYear()+"-"+month+"-"+tage;
  console.log(ergebnis);
  inputDate.value = ergebnis;
}

//https://stackoverflow.com/questions/16590500/calculate-date-from-week-number-in-javascript
function getDateOfWeek(d, w, y) {
    console.log(d);
    var simple = new Date(y, 0, 1 + (w - 1) * 7);
    console.log(simple);
    var dow = simple.getDay();
    var ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());

    var thisDate = addDays(ISOweekStart, d-1);
    //console.log(thisDate);
}

function auswertenKWDate(e){
  if(e.keyCode === 13){
    e.preventDefault();
    var today = new Date();
    var currentWeek = dateTokw2(today.getDate(), today.getMonth()+1, today.getFullYear());
    var takeYear;

    if(outputKW.value < currentWeek-8){
      takeYear = today.getFullYear() + 1;
    } else takeYear = today.getFullYear();

    console.log("Hallo"+takeYear);

    if(outputKW.value.trim() != "" && outputKW.value >= 1 && outputKW.value <= 53){
      var d = outputDay.value;
      var w = outputKW.value;
      var y = outputYear.value;
      if(d == ""){
        d = 1;
      }
      if(y == ""){
        y = takeYear;
        //outputYear.setAttribute("placeholder", takeYear);
      }
      getDateOfWeek(parseInt(d), parseInt(w), parseInt(y));
    }else dialogs.alert("Bitte eine Kalenderwoche eingeben bzw. eine valide KW eingeben (1 <= KW <= 53)");
  }
}

outputKW.addEventListener("keyup", auswertenKWDate, false);
outputDay.addEventListener("keyup", auswertenKWDate, false);
outputYear.addEventListener("keyup", auswertenKWDate, false);
