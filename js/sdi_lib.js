/*
 *  Determine if we are hosted in an external X.NET iframe.
 */
function isXNETHost() {
  // Only check if we are hosted in an iframe
  if (window.self !== window.top) {
    // Check for the X.NET iframe name
    try {
      //console.log('isXNETHost: self.name = ' + self.name);
      if (self.name.substr(0, 15) == "xnet_iframepage") {
        //console.log('isXNETHost() = true');
        return true;
      }
    } catch (err) {
    }
    try {
      //console.log('isXNETHost: parent.name = ' + self.name);
      if (parent != null && parent.name.substr(0, 15) == "xnet_iframepage") {
        //console.log('isXNETHost() = true');
        return true;
      }
    } catch (err) {
    }
    try {
      // workaround if iframe is inside page containing flex app
      if (parent != null) {
        return getFlexAppFrame(parent);
      }
    } catch (err) {
    }
  }
  return false;
}

/*
 * Find requested frame
 */
function findFrame(frame_name) {
  if (isXNETHost()) {
    //if (console) { console.log("Attempt to find frame " + frame_name + " skipped for XNet"); }
    return null;
  }
  return findChildFrame('top', frame_name);
}

function findChildFrame(parent_frame_name, frame_name) {
  var curr_frame_name = parent_frame_name;
  var y = new Array();
  y[0] = 0;
  var level = 0;

  while (curr_frame_name != '') {
    var x = eval(curr_frame_name);
    for (i = y[level]; i < x.length; i++) {
      if (x.frames[i].name == frame_name) {
        return x.frames[i]; // found frame
      }
      if (x.frames[i].length > 0) {
        curr_frame_name = curr_frame_name + '.frames[' + i + ']';
        y[level] = i + 1;
        level++;
        y[level] = 0;
        var fr = findChildFrame(curr_frame_name, frame_name); // recursive call to check child frames for curr frame
        if (fr) {
          return fr;
        }
        break;
      }
    }
    curr_frame_name = level == 0 ? '' : curr_frame_name.substring(0, curr_frame_name.lastIndexOf('.'));
    level--;
  }
  return null; // didn't find frame'
}

// Javascript code to generate a UUID (RFC4122 version 4 compliant)
function randomUUID() {
  var d = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
  });
  return uuid;
};

//******************************************************************
//
//  Format a currency field (without leading $)
//
//******************************************************************
function formatCurrency(num) {
  num = num.toString().replace(/\$|\,/g, '');
  if (isNaN(parseFloat(num))) num = "0";
  num = parseFloat(num);
  var neg = num < 0;
  if (neg)num = -num;
  num = num.toString().replace(/\$|\,/g, '');
  if (isNaN(num)) num = "0";
  cents = Math.floor(num * 100 + 0.5) % 100;
  num = Math.floor((num * 100 + 0.5) / 100).toString();
  if (cents < 10) cents = "0" + cents;
  //for (var i = 0; i < Math.floor((num.length-(1+i))/3); i++)
  //num = num.substring(0,num.length-(4*i+3))+','+num.substring(num.length-(4*i+3));
  num += "." + cents;
  if (neg)num = "-" + num;
  return num;
}

function getXNETHostFrameId() {
  // Only check if we are hosted in an iframe
  if (window.self !== window.top) {
    // Check for the X.NET iframe name
    try {
      if (self.name.substr(0, 15) == "xnet_iframepage") {
        return self.name.substr(16, 20);
      }
    } catch (err) {
    }
    try {
      if (parent != null && parent.name.substr(0, 15) == "xnet_iframepage") {
        return parent.name.substr(16, 20);
      }
    } catch (err) {
    }
  }
  return "";
}

function PostMessageToXnetFrame(json_data) {
  try {
    if (self.name.substr(0, 15) == "xnet_iframepage") {
      PostMessageToXnet(json_data, 1);
      return;
    }
    if (parent.name.substr(0, 15) == "xnet_iframepage") {
      PostMessageToXnet(json_data, 2);
      return;
    }
  } catch (err) {
  }
  // Just call through
  PostMessageToXnet(json_data);
}

// Use PostMessage to send message to javascript in parent AUI.Net window.
// Needed to workaround cross-site scripting error when .sdi pages loaded in iframe
// are served up by servlet with different host and/or port
function PostMessageToXnet(json_data, iframe_level) {
  try {
    // TODO - once we have a way to obtain the X.NET domain for this
    // environment, change the following line to the correct domain
    var xnet_domain = "*";

    // Default to level 1 if not passed in
    if (!iframe_level) {
      iframe_level = 1;
    }
    //if (console) { console.log("PostMessageToXnet: BEFORE (" + JSON.stringify(json_data) + ", iframelevel " + iframe_level + ")"); }
    if (iframe_level == 1) {
      parent.postMessage(JSON.stringify(json_data), xnet_domain);
    } else if (iframe_level == 2) {
      parent.parent.postMessage(JSON.stringify(json_data), xnet_domain);
    }
    //if (console) { console.log("PostMessageToXnet: AFTER"); }
  } catch (err) {
    if (console) {
      console.error("PostMessageToXnet error: " + err.name + ", " + err.message);
    }
  }
}

/*
 *   Clear form "dirty" status
 */
function resetFormDirty(oForm) {
  // Go through all form fields resetting the "default" value for the field to be the current value
  var el, opt, i = 0;
  while ((el = oForm.elements[i++])) {
    if (el.disabled) continue;
    switch (el.type) {
      case 'text' :
      case 'textarea' :
        el.defaultValue = el.value;
        break;
      case 'checkbox' :
      case 'radio' :
        el.defaultChecked = el.checked;
        break;
      case 'select-one' :
      case 'select-multiple' :
        var j = 0;
        while ((opt = el.options[j++])) {
          opt.defaultSelected = opt.selected;
        }
        break;
    }
  }
}

var FFExtra = 0;
function parentResizeInner() {
  if(!parent)return;

  var index = navigator.userAgent.indexOf("Firefox");
  if(index>=0) {
    var version = navigator.userAgent.substring(index).split("/")[1];
    if(parseFloat(version)>=0.1)FFExtra=32;
  }

  try {
    var list = parent.document.getElementsByTagName('iframe');
    for(i=0;i<list.length;i++){
      var element=list[i];
      if(!element.type || element.type == 'resizableIframe'){
        if (element.className=='content_iframe' && element.style.display=='none') continue;
        if (element.className == 'ANHtmlContentIFrame') continue; // workaround if iframe is inside page containing flex app
        resizeIframeElement(element);
      }
    }
    list = parent.parent.document.getElementsByTagName('iframe');
    for(i=0;i<list.length;i++){
      element=list[i];
      if(!element.type || element.type == 'resizableIframe'){
        if (element.className=='content_iframe' && element.style.display=='none') continue;
        if (element.className == 'ANHtmlContentIFrame') continue; // workaround if iframe is inside page containing flex app
        resizeIframeElement(element);
      }
    }
  } catch(err) {}
}

function trimString(sInString) {
  return sInString.replace(/\s+$/g,"");
}

function maskCard(cc_number){
  cc_number = trimString(cc_number);
  digits_to_show = cc_number.length > 4 ? 4 : cc_number.length;
  return "xxx"  + cc_number.substring(cc_number.length - digits_to_show);
}

////////////////////////////////////////////////////////////////////
//
//  Determine credit card types
//
////////////////////////////////////////////////////////////////////
var cc_validation_visa     = 1;
var cc_validation_mc       = 2;
var cc_validation_amex     = 3;
var cc_validation_diners   = 4;
var cc_validation_discover = 5;
var cc_validation_jcb      = 6;

var cc_validation_to_card_type=["1","5","Visa","1","3","Visa","2","2","MasterCard","3","4","American Express",];

function cardValidation(cc){
  // remove all space in the credit card number
  cc = cc.replace (/\s/g, "");
  if(masterCard(cc))return cc_validation_mc;
  if(amexCard(cc))return cc_validation_amex;
  if(visaCard(cc))return cc_validation_visa;
  if(dinersCard(cc))return cc_validation_diners;
  if(discoverCard(cc))return cc_validation_discover;
  if(jcbCard(cc))return cc_validation_jcb;
  return 0;
}

function masterCard (cc) {
  if (!validChecksum(cc)) return false;
  if (cc.length!= 16) return false;
  return cc.indexOf("51")==0
    || cc.indexOf("52")==0
    || cc.indexOf("53")==0
    || cc.indexOf("54")==0
    || cc.indexOf("55")==0;
}

function amexCard (cc) {
  if (!validChecksum(cc)) return false;
  if (cc.length!= 15) return false;
  return cc.indexOf("34")==0
    || cc.indexOf("37")==0;
}

function visaCard (cc) {
  if (!validChecksum(cc)) return false;
  if (cc.length!= 13 && cc.length!= 16) return false;
  return cc.indexOf("4")==0;
}

function dinersCard (cc) {
  if (!validChecksum(cc)) return false;
  if (cc.length!= 14) return false;
  return cc.indexOf("300")==0
    || cc.indexOf("301")==0
    || cc.indexOf("302")==0
    || cc.indexOf("303")==0
    || cc.indexOf("304")==0
    || cc.indexOf("305")==0
    || cc.indexOf("36")==0
    || cc.indexOf("38")==0;
}

function discoverCard (cc) {
  if (!validChecksum(cc)) return false;
  if (cc.length!= 16) return false;
  return cc.indexOf("6011")==0
    || cc.indexOf("622")==0
    || cc.indexOf("64")==0
    || cc.indexOf("65")==0;
}

function jcbCard (cc) {
  if (!validChecksum(cc)) return false;
  if (cc.length== 16 && cc.indexOf("3")==0) return true;
  if (cc.length!= 15) return false;
  return cc.indexOf("2131")==0 || cc.indexOf("1800")==0;
}

function validChecksum(my_cc_number) {
  check_sum = 0;
  odd_toggle = false;
  for (i = my_cc_number.length - 1; i >= 0; i--, odd_toggle = !odd_toggle) {
    digit = parseInt(my_cc_number.charAt(i), 10);
    if (isNaN(digit)) return false;
    if (odd_toggle) {
      if (digit * 2 > 9) {
        check_sum += 1 + (digit * 2) % 10;
      } else {
        check_sum += digit * 2;
      }
    } else {
      check_sum += digit;
    }
  }
  return (check_sum % 10) == 0;
}

function cardTypeFromValidationType(validation_type) {
  for(var i=0;i<cc_validation_to_card_type.length;i+=3) {
    if(cc_validation_to_card_type[i]==validation_type){
      return cc_validation_to_card_type[i+1];
    }
  }
  return 0;
}



