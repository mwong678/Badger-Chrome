/*
 * Written by Matthew Wong
 *
 * This is the content script that will be injected into the active
 * student center page. Relays messages between the background script
 * to inject HTML data.
 *
 */
var re = /[A-Za-z],[A-Za-z]/i;
var re2 = /win0divMTG_INSTR[$]\d{1,3}/i;
var re3 = /[A-Z] [A-Z0-9]*/i;
var re4 = /win0divMTG_ROOM[$]\d{1,3}/i;
var re5 = /MTG_CLASS_NBR[$]\d{1,3}/i;
var re6 = /win0divMTG_LOC[$]\d{1,3}/i;
var re7 = /win0divDERIVED_CLS_DTL_SSR_INSTR_LONG[$]\d{1,3}/i;
var re8 = /MTG_CLASS_NBR[$]span[$]\d{1,3}/i;
//these are all regexes for different components on the page
var mapbutton;
//mapbutton is the last map button that was pressed

document.addEventListener('mousemove', function(e) {
  var srcElement = e.srcElement;
  var text = null;
  if (srcElement.nodeName == 'SPAN') {
    text = srcElement.textContent;
    if (text != null) {
      if (srcElement.parentElement.getAttribute('id')) {
        if (srcElement.parentElement.getAttribute('id').match(re2) || srcElement.parentElement.getAttribute('id').match(re7)) {
          if (text.match(re)) {
            NodeList.prototype.forEach = Array.prototype.forEach;
            var ide = srcElement.getAttribute('id');
            var id = document.getElementById(ide);
            var children = id.childNodes;
            var x = 0;
            var y = 0;

            if (id.getAttribute('id') != 'visited') {

              switch (children.length) {
                case 1:
                  y = 4;
                  break;
                case 3:
                  y = 8;
                  break;
                case 5:
                  y = 12;
                  break;
                case 7:
                  y = 16;
                  break;
                case 9:
                  y = 20;
                  break;
                case 11:
                  y = 24;
                  break;
              }

              for (var i = 0; i < y; i++) {
                if (children[i].nodeName != 'BR' && children[i].nodeName != 'BUTTON') {
                  next = children[i].nextSibling;
                  button = document.createElement('button');
                  button.innerHTML = "View Data";
                  if (children[i].textContent.indexOf(';') != -1) {
                    x = children[i].textContent.indexOf(';');
                    children[i].textContent = children[i].textContent.substring(0, x);
                  }
                  button.setAttribute('id', children[i].textContent.replace(/(\r\n|\n|\r)/gm, ""));
                  if (next) {
                    id.insertBefore(button, next);
                    id.insertBefore(document.createElement("br"), button);
                  } else {
                    id.appendChild(document.createElement("br"));
                    id.appendChild(button);
                    id.appendChild(document.createElement("br"));
                  }
                }
              } //insert the buttons

              children.forEach(function(item) {
                if (item.nodeName == 'BUTTON') {
                  var n = item.nextSibling;
                  var message = item.getAttribute('id');
                  item.onclick = function() {
                    if (n.getAttribute('id') != message + ' br') {
                      chrome.runtime.sendMessage(message, function(response) {
                        var br = document.createElement('BR');
                        oQuality = "";
                        aGrade = "";
                        helpfulness = "";
                        clarity = "";
                        easiness = "";
                        error = "";
                        nRatings = "";
                        if (response && response.length > 0 && response != "TBA") {
                          nRatings = "Number of Ratings: " + response[5];
                          oQuality = "Overall Quality: " + response[3] + "/5.0";
                          //aGrade = "Average Grade: " + response[4];
                          //helpfulness = "Helpfulness: " + response[0] + "/5.0";
                          clarity = "Would Take Again: " + response[1];
                          easiness = "Level of Difficulty: " + response[2] + "/5.0";
                          for (var i = 0; i < 6; i++) {
                            var text2 = document.createElement('P');
                            text2.setAttribute('style', 'color:blue');
                            switch (i) {
                              //sets the number of elements that will be inserted based on current ones
                              case 0:
                                text2.textContent = nRatings;
                                id.insertBefore(text2, n);
                                break;
                              case 1:
                                text2.textContent = oQuality;
                                id.insertBefore(text2, n);
                                break;
                              case 2:
                                text2.textContent = clarity;
                                id.insertBefore(text2, n);
                                break;
                              case 3:
                                text2.textContent = easiness;
                                id.insertBefore(text2, n);
                                break;
                              /*
                              case 4:
                                text2.textContent = clarity;
                                id.insertBefore(text2, n);
                                break;
                              case 5:
                                text2.textContent = easiness;
                                id.insertBefore(text2, n);
                                break;
                                */
                            }
                          }

                        } else if (response && response.length == 0) {
                          var text3 = document.createElement('P');
                          text3.setAttribute('style', 'color:red');
                          error = "This professor doesn't have ratings yet!";
                          text3.textContent = error;
                          id.insertBefore(text3, n);
                        } else if (response && response == "TBA") {
                          var text4 = document.createElement('P');
                          text4.setAttribute('style', 'color:red');
                          error = "To be announced!";
                          text4.textContent = error;
                          id.insertBefore(text4, n);
                        } else {
                          var text5 = document.createElement('P');
                          text5.setAttribute('style', 'color:red');
                          error = "Cannot find chosen professor!";
                          text5.textContent = error;
                          id.insertBefore(text5, n);

                        }
                        srcElement.parentElement.setAttribute('style', 'white-space: nowrap');
                        n.setAttribute('id', message + ' br');
                        item.innerHTML = "Close Data";
                      }); // set function of each button
                    } else if (n.getAttribute('id') == message + ' br') {
                      var curr = item.nextSibling;
                      var temp = curr.nextSibling;
                      while (curr != n) {
                        id.removeChild(curr);
                        curr = temp;
                        temp = curr.nextSibling;
                      }
                      chrome.runtime.sendMessage(message, function(response) {});
                      n.setAttribute('id', message);
                      item.innerHTML = "View Data";
                    }
                    if (mapbutton) {
                      mapbutton.innerHTML = "Show Map";
                    }
                    return false;
                  };
                }
              });
              id.setAttribute('id', 'visited');
            }
          }
        } else if ((srcElement.parentElement.getAttribute('id').match(re4) || srcElement.parentElement.getAttribute('id').match(re6)) && srcElement.textContent != 'Off Campus') {
          if (text.match(re3)) {
            NodeList.prototype.forEach = Array.prototype.forEach;
            var ide2 = srcElement.getAttribute('id');
            var id2 = document.getElementById(ide2);
            var children2 = id2.childNodes;
            var x2 = 0;
            var y2 = 0;

            if (id2.getAttribute('id') != 'visited') {
              //sets the number of elements that will be inserted based on current ones
              switch (children2.length) {
                case 1:
                  y2 = 4;
                  break;
                case 3:
                  y2 = 8;
                  break;
                case 5:
                  y2 = 12;
                  break;
                case 7:
                  y2 = 16;
                  break;
                case 9:
                  y2 = 20;
              }

              for (var i = 0; i < y2; i++) {
                if (children2[i].nodeName != 'BR' && children2[i].nodeName != 'BUTTON') {
                  next2 = children2[i].nextSibling;
                  button2 = document.createElement('button');
                  button2.innerHTML = "Show Map";

                  if (children2[i].textContent.indexOf(';') != -1) {
                    x2 = children2[i].textContent.indexOf(';');
                    children2[i].textContent = children2[i].textContent.substring(0, x);
                  }
                  button2.setAttribute('id', children2[i].textContent.replace(/(\r\n|\n|\r)/gm, ""));
                  if (next2) {
                    id2.insertBefore(document.createElement("br"), next2);
                    id2.insertBefore(button2, next2);
                    id2.insertBefore(document.createElement("br"), next2);
                  } else {
                    id2.appendChild(document.createElement("br"));
                    id2.appendChild(button2);
                    id2.appendChild(document.createElement("br"));
                  }
                }
              } //insert buttons
              children2.forEach(function(item2) {
                if (item2.nodeName == 'BUTTON') {
                  var n2 = item2.nextSibling;
                  var message2 = item2.getAttribute('id');
                  item2.onclick = function() {
                    if (n2.getAttribute('id') != message2 + ' br') {
                      chrome.runtime.sendMessage(message2, function(response2) {});
                      n2.setAttribute('id', message2 + ' br');
                      if (mapbutton) {
                        mapbutton.innerHTML = "Show Map";
                      }
                      item2.innerHTML = "Click Icon!";
                      mapbutton = item2;
                    } else if (n2.getAttribute('id') == message2 + ' br') {
                      var curr2 = item2.nextSibling;
                      var temp2 = curr2.nextSibling;
                      while (curr2 != n2) {
                        id2.removeChild(curr2);
                        curr2 = temp2;
                        temp2 = curr2.nextSibling;
                      }
                      chrome.runtime.sendMessage(message2, function(response) {});
                      n2.setAttribute('id', message2);
                    }
                    return false;
                  };
                }
              });
              id2.setAttribute('id', 'visited');
            }
          }
        }
      }
    }
  } else if (srcElement.nodeName == 'A' && srcElement.getAttribute('Name') && re5.test(srcElement.getAttribute('Name'))) {
    NodeList.prototype.forEach = Array.prototype.forEach;
    var ide = srcElement.parentElement.getAttribute('id');
    var id = document.getElementById(ide);
    srcElement.parentElement.removeAttribute('class');
    var children = id.childNodes;
    var x = 0;
    var y = 0;

    if (id.getAttribute('id') != 'visited') {
      for (var i = 0; i < children.length; i++) {
        if (children[i].nodeName != 'BUTTON' && children[i].nodeName != 'BR') {
          button = document.createElement('button');
          button.innerHTML = "Seat Data";
          button.setAttribute('id', id.textContent.replace(/(\r\n|\n|\r)/gm, ""));
          id.appendChild(document.createElement("br"));
          id.appendChild(button);
          id.appendChild(document.createElement("br"));
        }
      }
      children.forEach(function(item) {
        if (item.nodeName == 'BUTTON') {
          var n = item.nextSibling;
          var message = item.getAttribute('id');
          item.onclick = function() {
            if (typeof n === 'undefined' || n.getAttribute('id') != message + ' br') {
              var iframe = document.createElement('iframe');
              iframe.setAttribute('style', 'display:block; visibility:hidden');
              iframe.setAttribute('name', message + ' iframe');
              iframe.setAttribute('id', message + ' iframe');
              iframe.setAttribute('height', '0px');
              iframe.setAttribute('width', '0px');
              id.insertBefore(iframe, n);
              var forms = document.forms;
              var num = 0;
              for (var i = 0; i < forms.length; i++) {
                if (forms[i].getAttribute('name') == (message + ' iframe')) {
                  num = i;
                  break;
                }
              }
              forms[num].ICAction.value = srcElement.getAttribute('name');
              forms[num].target = message + ' iframe';
              forms[num].submit();
              //creates an invisible iframe and submits the form, targeting that iframe, and extracts data from it
              setTimeout(function() {
                var ifr = iframe.contentDocument || iframe.contentWindow.document;
                if (ifr.getElementById('SSR_CLS_DTL_WRK_ENRL_CAP') != null) {
                  var cc = "Class Capacity: " + ifr.getElementById('SSR_CLS_DTL_WRK_ENRL_CAP').textContent;
                  var et = "Enrollment Total: " + ifr.getElementById('SSR_CLS_DTL_WRK_ENRL_TOT').textContent;
                  var as = "Available Seats: " + ifr.getElementById('SSR_CLS_DTL_WRK_AVAILABLE_SEATS').textContent;
                  var wlc = "Wait List Capacity: " + ifr.getElementById('SSR_CLS_DTL_WRK_WAIT_CAP').textContent;
                  for (var i = 0; i < 4; i++) {
                    var text = document.createElement('P');
                    text.setAttribute('style', 'color:blue');
                    switch (i) {
                      case 0:
                        text.textContent = cc;
                        id.insertBefore(text, id.lastChild);
                        break;
                      case 1:
                        text.textContent = et;
                        id.insertBefore(text, id.lastChild);
                        break;
                      case 2:
                        text.textContent = as;
                        id.insertBefore(text, id.lastChild);
                        break;
                      case 3:
                        text.textContent = wlc;
                        id.insertBefore(text, id.lastChild);
                        break;
                    }
                  }
                } else {
                  var text = document.createElement('P');
                  text.setAttribute('style', 'color:red');
                  text.textContent = "Data didn't load, try again!";
                  id.insertBefore(text, id.lastChild);
                }
                srcElement.parentElement.setAttribute('style', 'white-space: nowrap');
                n.setAttribute('id', message + ' br');
              }, 3000);
              //had to use a timeout function since script would try to try to pull data before the form was loaded
            } else if (n.getAttribute('id') == message + ' br') {
              var curr = item.nextSibling;
              var temp = curr.nextSibling;
              while (curr != n) {
                id.removeChild(curr);
                curr = temp;
                temp = curr.nextSibling;
              }

              n.setAttribute('id', message);
            }
            return false;
          };
        }
      });
      id.setAttribute('id', 'visited'); //mark section as visited so no more buttons will be generated
    }
  }
}, false);
