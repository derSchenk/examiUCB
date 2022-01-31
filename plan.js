var Dialogs = require('dialogs');
var dialogs = Dialogs(opts={});
const { jsPDF } = require("jspdf"); // will automatically load the node version
var fs = require('fs');
var feiertagejs = require('feiertagejs');




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



  function transformDateToHTML(datum){
    var day = datum.getDate();
    var month = datum.getMonth()+1;
    if(day < 10){
      day = "0"+day;
    }
    if(month < 10){
      month = "0"+month;
    }
    datumstring = day+'.'+month+'.'+datum.getFullYear();
    return datumstring
  }

function tableheader(){
  var tr = document.querySelector("#uberschrift");
  var datum = transformDateToHTML(new Date());
  var text = document.createTextNode("Prüfungsplan - Stand: "+datum);
  const nobr = document.createElement("nobr");
  nobr.appendChild(text);
  tr.appendChild(nobr);
}
tableheader();



function prufungsUbersicht(){
  tk = document.querySelector("#tabellenkörper");
  sql = "SELECT * FROM prufungen, prunfung_termin_verb, prufung_termin WHERE prufungen.Prufung_ID = prunfung_termin_verb.Prufung_ID AND prunfung_termin_verb.Termin_ID = prufung_termin.Termin_ID ORDER BY Datum, Beginn, Prufung_Name"
  console.log(sql)
  db.query(sql, function(err, results){
    console.log(results)
    if(err) throw err;
      results.forEach((result)=>{
        const zeile = document.createElement("tr");

        var spalte = document.createElement("td");
        var text = document.createTextNode(transformDateToHTML(new Date(result["Datum"])))
        spalte.appendChild(text);
        zeile.appendChild(spalte);

        //Berechne ende
        var tempdate = new Date();
        tempdate.setHours(0);
        tempdate.setMinutes(0);
        tempdate.setSeconds(0);
        var starthours = result["Beginn"].split(":")[0];
        var startminutes = result["Beginn"].split(":")[1];
        if(starthours[0] === "0"){
          starthours = starthours.slice(1);
        }
        if(startminutes[0] === "0"){
          startminutes = startminutes.slice(1);
        }
        tempdate.setMinutes(parseInt(startminutes));
        tempdate.setHours(parseInt(starthours));
        tempdate.setMinutes(tempdate.getMinutes()+parseInt(result["Dauer"]));

        var endminutes = tempdate.getMinutes();
        var endhours = tempdate.getHours();

        if(endminutes < 10){
          endminutes = "0"+endminutes;
        }
        if(endhours < 10){
          endhours = "0"+endhours;
        }

        var endtime = " - "+endhours+":"+endminutes;
        //

        spalte = document.createElement("td");
        var nobr = document.createElement("nobr");
        text = document.createTextNode(result["Beginn"] + (result["Prüfungsart"] !== "Hausarbeit" ? endtime : ""))
        nobr.appendChild(text);
        spalte.appendChild(nobr);
        zeile.appendChild(spalte);

        var id = result["Prufung_ID"];
        console.log("id ", id)
        var sql2 = "SELECT * FROM prufungen, prufungstudsemverbindung, studiengangssemester WHERE prufungen.Prufung_ID = '"+id+"' AND prufungen.Prufung_ID = prufungstudsemverbindung.Prufung_ID AND prufungstudsemverbindung.Studiengangssemester_ID = studiengangssemester.Studiengangssemester_ID"
        db.query(sql2, function(err, results2){
          console.log("Hier", results2)
          if(err) throw err;
          spalte = document.createElement("td");
          for(result2 of results2){
            var text = document.createTextNode(result2["Abkurzung"]+result2["Semesternummer"]+" ")

            spalte.appendChild(text);

          }
          zeile.appendChild(spalte);

          var spalte = document.createElement("td");
          var text = document.createTextNode(result["B_M"])
          spalte.appendChild(text);
          zeile.appendChild(spalte);

          var spalte = document.createElement("td");
          var text = document.createTextNode(result["Prufung_Name"])
          spalte.appendChild(text);
          zeile.appendChild(spalte);

          var spalte = document.createElement("td");
          var text = document.createTextNode(result["Verantwortlicher"])
          spalte.appendChild(text);
          zeile.appendChild(spalte);

          sql3 = "SELECT raum.Bezeichnung FROM prufung_termin, prufung_termin_raumverb, raum WHERE prufung_termin.Termin_ID = '"+result["Termin_ID"]+"' AND prufung_termin.Termin_ID = prufung_termin_raumverb.Termin_ID AND prufung_termin_raumverb.Raum_ID = raum.Raum_ID"
          db.query(sql3, function(err, results3){
          var spalte = document.createElement("td");
          for(result3 of results3){
            var text = document.createTextNode(result3["Bezeichnung"])
            var br = document.createElement("br");
            var nobr = document.createElement("nobr");
            nobr.appendChild(text)
            spalte.appendChild(nobr);
            spalte.appendChild(br);
          }
          zeile.appendChild(spalte);




          var spalte = document.createElement("td");
          var text = document.createTextNode(result["Hilfsmittel"])
          spalte.appendChild(text);
          zeile.appendChild(spalte);

          var spalte = document.createElement("td");
          var text = document.createTextNode(result["Bemerkung"])
          spalte.appendChild(text);
          zeile.appendChild(spalte);
          tk.appendChild(zeile)
        })

})


})})}

prufungsUbersicht()



setTimeout(()=>{
  window.print();
}, 1000)
