/**
 * Created by wgong on 6/24/2016.
 */

function MagTekAppletMSR() {
  var magtek_applet_initialized = false;
  var magtek_device_ready = false;
  var magtek_init_timer = null;

  var fnStatusCallback = null;
  var _manual_input = false;
  var fnFormCallback = null;
  var ccFormKey = null;

  var _request_key = '';
  var _encTrack2 = '';
  var _encMP = '';
  var _encMPStatus = '';
  var _encKSN = '';
  var _encCardType = '';
  var _encBlockType = '';
  var _encCSC = '';
  var _encCCExpiry = '';
  var _encAccountHolder = '';
  var _encAccountZip = '';
  var _CcNumMasked = '';
  var _AMSWalletID = '';
  var _CcCardType = 0;

  var applet_code_base = '../device-libs/';

  //window.onload = function () {
  //  window.magTekAppletMSR = new MagTekAppletMSR();
  //  window.magTekAppletMSR.magTekSetInfoMessage("Initializing applet ...");
  //
  //  // Introduce pause as hack to workaround issue where main window has already
  //  // loaded the MagTek applet and we are now trying to load the applet in
  //  // a popup window too. For some reason, if don't delay sometimes the applet
  //  // never loads in the second window.
  //  setTimeout('window.magTekAppletMSR.magTekLoadApplet()', 1500); // 1.5 second
  //};

  return {
    magTekLoadApplet: function () {
      if (window.navigator.appName.toLowerCase().indexOf("netscape") != -1) { // set object for Netscape:
        document.getElementById('dvObjectHolder').innerHTML =
          "<applet codebase=" + applet_code_base + " type=\"application/x-java-applet;version=1.5\"" +
          "archive = \"JMTCardReader.jar\"" +
          "code=\"JMTCardReader.class\"" +
          "name=\"JMSR\"" +
          "scriptable=\"true\"" +
          "style=\"visibility:hidden;\"" +
          "mayscript=\"mayscript\"" +
          "pluginspage=\"http://java.com/en/download/index.jsp\"" + ">" +
          "<param name=\"cache_option\" value=\"No\">" +
          "<param name=\"classloader_cache\" value=\"true\">" +
          "</applet>";
      }
      else if (window.navigator.appName.toLowerCase().indexOf('internet explorer') != -1) { //set object for IE
        document.getElementById('dvObjectHolder').innerHTML =
          "<object codebase=" + applet_code_base + " type=\"application/x-java-applet;version=1.5\"" +
          "archive = \"JMTCardReader.jar\"" +
          "code=\"JMTCardReader.class\"" +
          "name=\"JMSR\"" +
          "height=\"1\" width=\"1\" >" +
          "<param name=\"mayscript\" value=\"true\">" +
          "<param name=\"classloader_cache\" value=\"true\">" +
          "<param name=\"cache_option\" value=\"No\">" +
          " </object>"
      }
    },

    /*
     *  This is the function that callers should use to get card swipe from user
     */
    deviceInputStart: function (fnStatus, fnData, key) {
      var that = this;
      fnStatusCallback = fnStatus;
      fnFormCallback = fnData;
      ccFormKey = key;

      _encTrack2 = '';
      _encMP = '';
      _encMPStatus = '';
      _encKSN = '';
      _encCardType = '';
      _encBlockType = '';
      _encCSC = '';
      _encCCExpiry = '';
      _encAccountHolder = '';
      _encAccountZip = '';
      _AMSWalletID = '';
      _CcNumMasked = '';
      _CcCardType = 0;

      // Check if the applet/device has already been initialized
      if (magtek_applet_initialized) {
        if (!magtek_device_ready) {
          this.magTekSetInfoMessage("Initializing device ...");
          // set timer for 5 seconds to check if applet/device initialized in case we don't get message
          setTimeout(function() {
            that.magTekQueryInitStatus();
          }, 5000);
          // timeout after 20 seconds and report plugin is not installed or applet was not run
          magtek_init_timer = setTimeout(function() {
            that.magTekInitTimeout();
          }, 20000);

        } else {
          this.magTekSetInfoMessage("Waiting for credit card swipe..."); // tell user that card can be swiped again
        }

      }
    },

    /*
     *  Called to clean up after input sucessfully received or function cancelled
     */
    deviceInputEnd: function () {
      fnStatusCallback = null;
      fnFormCallback = null;
      ccFormKey = null;

      _encTrack2 = '';
      _encMP = '';
      _encMPStatus = '';
      _encKSN = '';
      _encCardType = '';
      _encBlockType = '';
      _encCSC = '';
      _encCCExpiry = '';
      _encAccountHolder = '';
      _encAccountZip = '';
      _AMSWalletID = '';
      _CcNumMasked = '';
      _CcCardType = 0;

      if (magtek_init_timer && magtek_init_timer != null) {
        clearTimeout(magtek_init_timer);
        magtek_init_timer = null;
      }
      return;
    },

    /*
     *  Function that callers should use to get current status message.
     */
    getStatusMessage: function () {
      if (magtek_applet_initialized && magtek_device_ready) {
        return "Waiting for credit card swipe...";
      }
      if (!magtek_applet_initialized) {
        return "Initializing applet ...";
      }
      if (!magtek_device_ready) {
        return "Initializing device ...";
      }
    },

    // Try to send a command to the magtek device to see if it's initialized
    magTekQueryInitStatus: function () {
      var that = this;
      if (magtek_applet_initialized && magtek_device_ready) {
        this.magTekSetInfoMessage("Waiting for credit card swipe..."); // tell user that card can be swiped again
        return; // all initialization is done
      }
      try {
        var response_code = document.JMSR.SendStrCmd("0000"); // 00==get 00==software id
        if (response_code.length > 0 && response_code != "0") {
          magtek_applet_initialized = true;
          magtek_device_ready = true;
          this.magTekSetInfoMessage("Waiting for credit card swipe..."); // tell user that card can be swiped again
          return;
        }
      } catch (err) {
      }

      // Set timer to check again, in case don't get applet/device init messages from the applet
      setTimeout(function() {
        that.magTekQueryInitStatus();
      }, 5000);// 5 seconds

      // Also set init timeout if haven't already
      if (magtek_init_timer == null) {
        magtek_init_timer = setTimeout(function () {
          that.magTekInitTimeout();
        }, 20000);
      }
    },

    magTekInitTimeout: function () {
      var that = this;
      magtek_init_timer = null;
      if (!magtek_applet_initialized) {
        this.magTekSetErrorMessage("Timeout initializing applet, trying again...");
        magtek_init_timer = setTimeout(function() {
          that.magTekInitTimeout();
        }, 20000);
      } else if (!magtek_device_ready) {
        // Timeout initializing device. Either it's not plugged in, or it's in KEYBOARD mode instead of HID mode. If in KEYBOARD mode we apparently cannot get info from the device to determine the mode.
        if (confirm("Timeout initializing device. Please connect the Dynamag card swipe device to the USB port on your computer. If the device is connected, but it is not configured for HID mode, then it cannot be initialized by this application. If this is the case, please contact Support for assistance. Do you want to try again to initialize this device? ")) {
          // Keep trying to initialize
          this.magTekSetErrorMessage("Timeout initializing device, trying again...");
          magtek_init_timer = setTimeout(function() {
            that.magTekInitTimeout();
          }, 20000);
        } else {
          this.magTekSetErrorMessage("Unable to initialize device");
          // Tell caller to cancel
          if (fnFormCallback != null) fnFormCallback(ccFormKey, null, '', '', 0, '', '');
        }
      }
    },

    magTekSetErrorMessage: function (msg, cancel_timer) {
      if (cancel_timer && magtek_init_timer && magtek_init_timer != null) {
        clearTimeout(magtek_init_timer);
        magtek_init_timer = null;
      }
      // Pass status to caller
      if (typeof(fnStatusCallback) == 'undefined' || fnStatusCallback == null) return;
      fnStatusCallback(1, msg);  // status 1 == error

    },

    magTekSetInfoMessage: function (msg) {
      // Pass status to caller
      if (typeof(fnStatusCallback) == 'undefined' || fnStatusCallback == null) return;
      fnStatusCallback(2, msg);  // status 2 == info
    },

    SetAllCardData: function (allCardData) {

      _request_key = ''; // it's a new swipe, clear the previous request key in case reply to earlier request comes in while processing new swipe

      var tokens = allCardData.split("|");
      _encTrack2 = tokens[12];
      _encMPStatus = tokens[17];
      _encMP = tokens[18];
      _encKSN = tokens[23];
      //_encSessionID = [24];
      _encCardType = "1";     // per AMS 4.3 API: always pass 1
      _encBlockType = "1";    // per AMS 4.3 API: 1 == MagenSafe V4/V5 compatible device, 2 == IPAD v1 device

      var PAN = tokens[0];
      var track1_length = tokens[5];
      _CcNumMasked = maskCard(PAN);
      var card_validation_code = cardValidation(PAN);
      if (card_validation_code == 0 || track1_length <= 0) {
        alert("Invalid card type");
        return false;
      }
      _CcCardType = cardTypeFromValidationType(card_validation_code);

      _encCCExpiry = tokens[3] + "/" + tokens[4];
      _encAccountHolder = trim(trim(tokens[1]) + ' ' + trim(tokens[2]));
      if (_encAccountHolder.length == 0 && track1_length > 0) {
        var track1_data = tokens[14];
        var track1_tokens = track1_data.split("^");
        _encAccountHolder = track1_tokens[1];
      }

      // Make AMS request to get wallet ID. Callback function will close the dialog.
      _request_key = new Date().getTime() + "_" + _CcNumMasked;
      this.magTekSetInfoMessage("Encrypting credit card...");
      var done = generateCCWalletIDFromEncryptedInput(_encCCExpiry, _encAccountHolder, '', _CcNumMasked, _encTrack2, '', _encMP, _encMPStatus, _encKSN, _encCardType, _encBlockType, '', this.SetWalletIDNotification, _request_key);
      if (done) {
        // Function returned true so must have displayed some error to the user. Function would return false if waiting for wallet id from server. Callback would have been notified when done.
        this.magTekSetInfoMessage("Waiting for credit card swipe..."); // generateCCWalletIDFromEncryptedInput displayed error alert to user, redisplay waiting msg
        _request_key = '';
      }

      // Waiting for callback to get notification that encryption is done
    },

    // Callback to process wallet ID in response from server ajax request
    SetWalletIDNotification: function (wallet_id, request_key, error) {

      if (fnFormCallback == null) {
        return; // nobody cares anymore, just return
      }

      if (request_key != _request_key) {
        return; // just ignore reply for request other than current one -- maybe user swiped card again while first swipe still being processed
      }

      _request_key = ''; // have reply, clear the key

      if (error && error != null && typeof(error).toLowerCase() == 'string' && error.length > 0) {
        alert(error);
        this.magTekSetInfoMessage("Waiting for credit card swipe..."); // tell user that card can be swiped again
        return;
      }

      // Validate wallet id
      if (wallet_id == null || wallet_id.length == 0 || wallet_id == 'null') {
        alert("Failure encrypting credit card data. Please try again.");
        this.magTekSetInfoMessage("Waiting for credit card swipe..."); // tell user that card can be swiped again
        return;
      }

      this.magTekSetInfoMessage("Finishing...");

      // Pass wallet id to caller
      fnFormCallback(ccFormKey, wallet_id, _CcNumMasked, _encCCExpiry, _CcCardType, _encAccountHolder, _encAccountZip);
    },

    SetCardReadingError: function () {
      //alert("Card Read Error; status = " + document.JMSR.GetTrack1DecodeStatus() + ", " + document.JMSR.GetTrack2DecodeStatus() + ", " + document.JMSR.GetTrack3DecodeStatus() + ".");
      alert("Error reading card. Please try again.");
    },

    ReportJavaPluginVersion: function (ver) {
      if (!magtek_applet_initialized) {
        if (parseFloat(ver) >= 1.5) {
          magtek_applet_initialized = true;
          if (!magtek_device_ready) {
            this.magTekSetInfoMessage("Initializing device ..."); // now waiting for device ready message
          } else {
            this.magTekSetInfoMessage("Waiting for credit card swipe..."); // tell user that card can be swiped again
          }
        }
        else {
          this.magTekSetErrorMessage("Java Plugin version 1.5 or higher must be installed.", true);
        }
      }
    },

    DeviceReady: function (varReady) {
      if (varReady.toLowerCase() == "ready") {
        magtek_device_ready = true;
        // Check the device interface mode. Must be in HID mode, not keyboard emulation mode
        var interface_type = document.JMSR.SendStrCmd("0010"); // 00==get 10==interface type (response: 0==HID, 1==kbd)
        if (interface_type != 0) {
          this.magTekSetErrorMessage("Invalid device mode. Detected keyboard emulation mode. HID mode required.");
          return;
        }
        // Ready for swipe
        this.magTekSetInfoMessage("Waiting for credit card swipe..."); // tell user that card can be swiped now
      } else {
        this.magTekSetErrorMessage("Device not ready: " + varReady);
      }
    },

    // End javascript methods from mtjmsr.js

    /*
     * If running in XNet then handle request from sdi page
     */
    handleXNetRequest: function (args) {

      try {

        var originalRequestorId = args["RequestorID"];

        if (args["MagtekRequest"] == "deviceInputStart") {

          this.deviceInputStart(
            function (status, message) { // status 1 == error, 2 == info
              // Callback for status update. Post message back to the requestor.
              var json_data = {
                messageType: "MagtekClientMessage",
                RequestorID: getXNETHostFrameId(),
                TargetID: originalRequestorId,
                MagtekMessageType: "Status",
                opstatus: status,
                opmessage: message
              };
              // Must set level 2, parent is iframe "magtekdeviceinterface" hosted in XNet, parent.parent is the XNet frame listening for messages
              PostMessageToXnet(json_data, 2);
            },
            function (key, accountID, maskedCC, cardExpiry, cardType, accountHolder, accountZip) {
              // Callback to process data from the device. Post message back to the requestor.
              var json_data = {
                messageType: "MagtekClientMessage",
                RequestorID: getXNETHostFrameId(),
                TargetID: originalRequestorId,
                MagtekMessageType: "Data",
                key: key,
                accountID: accountID,
                maskedCC: maskedCC,
                cardExpiry: cardExpiry,
                cardType: cardType,
                accountHolder: accountHolder,
                accountZip: accountZip
              };
              // Must set level 2, parent is iframe "magtekdeviceinterface" hosted in XNet, parent.parent is the XNet frame listening for messages
              PostMessageToXnet(json_data, 2);
            },
            args["callerKey"]);

        } else if (args["MagtekRequest"] == "deviceInputEnd") {
          this.deviceInputEnd();
        }
      } catch (err) {
        if (console) {
          console.error("MagTekAppletMSF.handleXNetRequest; error: " + err.description);
        }
      }
    }
  }
}
