/*
 * Written by Matthew Wong
 *
 * This is the background script that will processes messages sent from the content
 * script. Takes the message to lookup a professor on RateMyProfessor.com
 *
 */
var ratingsArray = [];
var contentMessage = null;
var firstName = "";
var lastName = "";
var overall = null;
var avg = null;
var numberOfRatings = null;
var returnShipment = [];
var selectedAddress = null;
var buildingRegex = /^((?!,).)*$/i;

chrome.runtime.onMessage.addListener(
  function(request, sender, callback) {
    contentMessage = request; // gets message from content script
    if (contentMessage == "TBA") {
      contentMessage = null;
      callback("TBA");
      return;
      //if the chosen span element has TBA
    }
    if (buildingRegex.test(contentMessage)) {
      if (/CHAMBERLIN/.test(contentMessage)) {
        contentMessage = 'Thomas C Chamberlin Hall';
      } else if (/E C B/.test(contentMessage)) {
        contentMessage = 'Engineering Centers Bldg';
      } else if (/EDUCATION/.test(contentMessage)) {
        contentMessage = 'Education Bldg';
      } else if (/BIOTECH CT/.test(contentMessage)) {
        contentMessage = 'BIOTECHNOLOGY CENTER';
      } else if (/WIMR/.test(contentMessage)) {
        contentMessage = 'WISCONSIN INSTITUTES FOR MEDICAL RESEARCH';
      } else if (/STERLING/.test(contentMessage)) {
        contentMessage = 'Sterling Hall, 475 N Charter St';
      } else if (/MECH ENGR/.test(contentMessage)) {
        contentMessage = 'Mechanical Engineering Bldg, 1513 University Ave';
      } else if (/WENDT/.test(contentMessage)) {
        contentMessage = 'Wendt Commons Library';
      } else if (/SOC SCI/.test(contentMessage)) {
        contentMessage = 'William H. Sewell Social Sciences Bldg';
      } else if (/PSYCHOLOGY/.test(contentMessage)) {
        contentMessage = 'Brogden Psychology Building';
      } else if (/HUMANITIES/.test(contentMessage)) {
        contentMessage = 'Humanities Building, Mosse, George L';
      } else if (/MICROBIAL SCIENCES/.test(contentMessage)) {
        contentMessage = 'MICROBIAL SCIENCES BLDG';
      } else if (/NOLAND/.test(contentMessage)) {
        contentMessage = 'Lowell E Noland Zoology Bldg';
      } else if (/GYM-NAT/.test(contentMessage)) {
        contentMessage = 'UW Natatorium';
      } else if (/SCIENCE/.test(contentMessage)) {
        contentMessage = 'Science Hall';
      } else if (/BABCOCK/.test(contentMessage)) {
        contentMessage = 'Babcock Hall, Linden Drive';
      } else if(/RUSSELL LB/.test(contentMessage)){
        contentMessage = 'Russell Laboratories, 1630 Linden Dr';
      } else if(/SOILS/.test(contentMessage)){
        contentMessage = 'Soils Building';
      } else if (/PLANT SCI/.test(contentMessage)){
        contentMessage = 'PLANT SCIENCES';
      }
      selectedAddress = contentMessage + ', Madison, Wisconsin 53706';
      contentMessage = null;
      callback();
      return;
    } //cases for certain locations for google maps
    contentMessage = contentMessage.split(",");
    lastName = contentMessage[0];
    firstName = contentMessage[1].split(" ")[0];
    if (firstName.indexOf(".") != -1) {
      firstName = firstName.substring(0, firstName.indexOf(".") - 2);
    } // in case name has a middle name
    ratingsArray = [];
    overall = null;
    avg = null;
    numberOfRatings = null;
    returnShipment = [];
    //reset all values
    var xhttp = new XMLHttpRequest();
    var newURL = 'http://www.ratemyprofessors.com/search.jsp?queryBy=teacherName&schoolName=university+of+wisconsin+madison&queryoption=HEADER&query=' +
      encodeURIComponent(lastName) + '&facetSearch=true';

    xhttp.onload = function() {
      if (findID(xhttp.responseText, firstName, lastName)) {
        getRatings(contentMessage);
        var x = setTimeout(function() {
          callback(returnShipment);
        }, 600);
        //needed to set a timeout since script would try to pull data before the data had been extracted
      } else {
        callback();
      }

    };
    xhttp.onerror = function() {
      console.log("ERROR\nSelected Professor: " + contentMessage + "\nSelected Address: " + selectedAddress);
      callback();
    };
    xhttp.open("GET", newURL, true);
    xhttp.send(null);
    return true;
  });

chrome.tabs.onUpdated.addListener(function(id, info, tab) {
  if (tab.url.toLowerCase().indexOf("portal.isis.wisc.edu") > -1) {
    //load the icon in the student center
    chrome.pageAction.show(tab.id);
  }
});

function findID(text, firstName, lastName) {
  firstName = firstName.toString();
  lastName = lastName.toString();
  var getProfessor = document.createElement("TD");
  var bool = false;
  getProfessor.innerHTML = text;
  professors = getProfessor.getElementsByClassName("listing PROFESSOR");
  if (professors.length == 1) {
    var getProfessor2 = document.createElement("TD");
    var profRegex = new RegExp(lastName + ", ", "i");
    getProfessor2.innerHTML = professors[0].innerHTML;
    guess = getProfessor2.getElementsByClassName("main");
    if (profRegex.test(guess[0].textContent)) {
      contentMessage = getProfessor2.getElementsByTagName("A")[0].getAttribute("href");
      bool = true;
    }
    if (bool) {
      return true;
    } else {
      contentMessage = '/search.jsp?queryBy=teacherName&schoolName=university+of+wisconsin+madison&queryoption=HEADER&query=' +
        encodeURIComponent(lastName) + '&facetSearch=true';
      return false;
    }
  } else if (professors.length > 1) {
    var first = firstName.substring(0, 2);
    var profRegex = new RegExp(lastName + ", " + first, "i");
    var getProfessor2 = document.createElement("TD");
    for (var i = 0; i < professors.length; i++) {
      getProfessor2.innerHTML = professors[i].innerHTML;
      guess = getProfessor2.getElementsByClassName("main");
      if (profRegex.test(guess[0].textContent)) {
        contentMessage = getProfessor2.getElementsByTagName("A")[0].getAttribute("href");
        bool = true;
        break;
      }
    }
    if (bool) {
      return true;
    } else {
      contentMessage = '/search.jsp?queryBy=teacherName&schoolName=university+of+wisconsin+madison&queryoption=HEADER&query=' +
        encodeURIComponent(lastName + " " + firstName) + '&facetSearch=true';
      return false;
    }
  } else {
    contentMessage = '/search.jsp?queryBy=teacherName&schoolName=university+of+wisconsin+madison&queryoption=HEADER&query=' +
      encodeURIComponent(lastName) + '&facetSearch=true';
    return false;
  }
}

function getRatings(url) {
  var link = 'http://www.ratemyprofessors.com/' + url;
  var xhttp2 = new XMLHttpRequest();
  xhttp2.onload = function() {
    gatherRatings(xhttp2.responseText);
  };
  xhttp2.onerror = function() {
    console.log("ERROR\n Link: " + link);
    callback();
  };
  xhttp2.open("GET", link, true);
  xhttp2.send(null);
  return true;
}

function gatherRatings(text) {
  var getGrades = document.createElement("TD");
  var getRatings = document.createElement("TD");
  var getNumRatings = document.createElement("TD");
  var numberRegex = /\d{1}[.]\d{1}/i;
  var averageRegex = /[A-Z]{1}[+-]*/i;
  var numRatingsRegex = /\d{1,3} Student Ratings/i;
  getGrades.innerHTML = text;
  getRatings.innerHTML = text;
  getNumRatings.innerHTML = text;
  grades = getGrades.querySelectorAll('[class="grade"]');
  numRatings = getNumRatings.querySelectorAll('[class="table-toggle rating-count active"]');
  ratings = getRatings.getElementsByClassName("rating");
  if (grades && grades.length > 0) {
    for (var i = 0; i < 2; i++) {
      content = grades[i].innerHTML;
      if (numberRegex.test(content)) {
        overall = content;
      }
      if (averageRegex.test(content)) {
        avg = content;
      }
    }
    returnShipment[3] = overall;
    returnShipment[4] = avg;
  }

  if (ratings) {
    for (var i = 0; i < ratings.length; i++) {
      content = ratings[i].innerHTML;
      if (numberRegex.test(content)) {
        for (var j = 0; j < 3; j++) {
          content = ratings[i + j].innerHTML;
          ratingsArray[j] = content;
          returnShipment[j] = content;
        }
        break;
      }
    }
  }
  if (numRatings && numRatings.length > 0) {
    for (var i = 0; i < numRatings.length; i++) {
      content = numRatings[i].innerHTML;
      if (numRatingsRegex.test(content)) {
        content = content.trim();
        numberOfRatings = content.split(" ")[0];
      }
    }
    returnShipment[5] = numberOfRatings;
  }

  if (returnShipment) {
    return true;
  } else {
    return false;
  }
}
