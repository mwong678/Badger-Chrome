/*
 * Written by Matthew Wong
 *
 * This is the popup script that is responsible for what displays on the
 * popup.html file.
 *
 */
var rmp = 'http://www.ratemyprofessors.com';
var API_KEY = "EXAMPLE API KEY";

function info(professor, ratings, overall, average) {
  var request = new XMLHttpRequest();
  request.open('GET', rmp + professor, true);
  request.onreadystatechange = function() {
    if (request.readyState === 4) {
      var status = request.status;

      if ((status >= 200 && status < 300) || status === 304) {
        if (professor.length > 35) {
          document.getElementById('rmp').setAttribute('src', rmp + professor);
        } else {
          document.getElementById('rmp').setAttribute('src', rmp + professor + "#professor-result-template");
        }

      } else {
        alert("Error: status code " + status);
      }

    }
  }
  request.send(null);
}

function map(address) {
  var xhttp = new XMLHttpRequest();
  var url = 'https://www.google.com/maps/embed/v1/place?key=' + encodeURIComponent(API_KEY) + '&q=' + encodeURIComponent(address);

  xhttp.onload = function() {
    document.getElementById('rmp').setAttribute('src', url);
  };
  xhttp.onerror = function() {
    console.log("error");
    document.getElementById('status').innerHTML = "Please select a professor!";
    document.getElementById('rmp').setAttribute('src', 'http://www.ratemyprofessors.com/search.jsp?queryBy=teacherName&schoolName=university+of+wisconsin+madison&queryoption=HEADER&query=&facetSearch=true#ad-container');
  };
  xhttp.open("GET", url, true);
  xhttp.send(null);
  return true;
}

function search() {
  var professor = chrome.extension.getBackgroundPage().contentMessage;
  var address = chrome.extension.getBackgroundPage().selectedAddress;
  var ratings = chrome.extension.getBackgroundPage().ratingsArray;
  var overall = chrome.extension.getBackgroundPage().overall;
  var average = chrome.extension.getBackgroundPage().avg;
  if (professor) {
    document.getElementById('status').innerHTML = "";
    info(professor, ratings, overall, average);
  } else if (!professor && address) {
    document.getElementById('status').innerHTML = "";
    map(address);
  } else {
    document.getElementById('status').innerHTML = "Please select a professor!";
    document.getElementById('rmp').setAttribute('src', 'http://www.ratemyprofessors.com/search.jsp?queryBy=teacherName&schoolName=university+of+wisconsin+madison&queryoption=HEADER&query=&facetSearch=true#ad-container');
  }
}


document.addEventListener('DOMContentLoaded', function() {
  search();
});
