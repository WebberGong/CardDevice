/**
 * Created by wgong on 6/24/2016.
 */

function MagTekCabMSR() {
  var magtek_device_open = false;
  var initialized = false;
  var initialize_timeout = false;

  var _request_key = '';
  var _encTrack2 = '';
  var _encMP = '';
  var _encMPStatus = '';
  var _encKSN = '';
  var _encCardType = '';
  var _encBlockType = '';
  var _encCCExpiry = '';
  var _encAccountHolder = '';
  var _encAccountZip = '';
  var _CcNumMasked = '';
  var _AMSWalletID = '';
  var _CcCardType = 0;

  var fnStatusCallback = null;
  var fnFormCallback = null;
  var ccFormKey = null;

  var last_error_msg = '';

  //window.onload = function () {
  //  window.magTekCabMSR = new MagTekCabMSR();
  //  // Load library
  //  window.magTekCabMSR.GetDeviceState();
  //};

  return {
    /*
     *  This is the function that callers should use to get card swipe from user
     */
    deviceInputStart: function (fnStatus, fnData, key) {
      fnStatusCallback = fnStatus;
      fnFormCallback = fnData;
      ccFormKey = key;

      _encTrack2 = '';
      _encMP = '';
      _encMPStatus = '';
      _encKSN = '';
      _encCardType = '';
      _encBlockType = '';
      _encCCExpiry = '';
      _encAccountHolder = '';
      _encAccountZip = '';
      _AMSWalletID = '';
      _CcNumMasked = '';
      _CcCardType = 0;

      // Check if the applet/device has already been initialized
      if (!magtek_device_open) {
        if (!initialized && (initialize_timeout || !this.GetDeviceState())) {
          this.magTekSetErrorMessage("Unable to initialize MagTek USBHID library or communicate with device");
          return;
        }
        this.magTekSetInfoMessage("Opening device...");
        this.OpenDevice();
      }
      if (magtek_device_open) {
        this.magTekSetInfoMessage("Please swipe credit card..."); // tell user that card can be swiped again
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
      _encCCExpiry = '';
      _encAccountHolder = '';
      _encAccountZip = '';
      _AMSWalletID = '';
      _CcNumMasked = '';
      _CcCardType = 0;

      if (magtek_device_open) {
        this.CloseDevice();
      }
      return;
    },

    /*
     *  Function that callers should use to get current status message.
     */
    getStatusMessage: function () {
      if (magtek_device_open) {
        return "Please swipe credit card...";
      }
      if (last_error_msg.length > 0) return last_error_msg;
      if (!magtek_device_open) {
        return "Opening device...";
      }
      return '';
    },

    magTekSetErrorMessage: function (msg) {
      last_error_msg = '';
      // Pass status to caller
      if (typeof(fnStatusCallback) == 'undefined' || fnStatusCallback == null) return;
      fnStatusCallback(1, msg);  // status 1 == error

    },

    magTekSetInfoMessage: function (msg) {
      last_error_msg = msg;
      // Pass status to caller
      if (typeof(fnStatusCallback) == 'undefined' || fnStatusCallback == null) return;
      fnStatusCallback(2, msg);  // status 2 == info
    },

    processCardData: function () {
      _request_key = ''; // it's a new swipe, clear the previous request key in case reply to earlier request comes in while processing new swipe
      var PAN = '';
      var cc_exp_month = null;
      var cc_exp_year = null;
      var cardholder_name = null;

      var device = document.getElementById('USBHID');

      // First try to get PAN and expiration data by parsing Track2 data (refer to http://en.wikipedia.org/wiki/Magnetic_stripe_card)
      var track2 = device.getTrackMasked(2);
      var track2_segments = track2.split("=");
      if (track2_segments.length >= 2) {
        // Get PAN from track2 data
        if (track2_segments[0].length > 4) {
          PAN = track2_segments[0].substring(1, track2_segments[0].length);
        }
        // Get card expiration from track2 data
        if (track2_segments[1].length >= 4) {
          cc_exp_month = track2_segments[1].substring(2, 4);
          cc_exp_year = track2_segments[1].substring(0, 2);
        }
      }

      // Now try to get cardholder name from Track1 data. Also, if didn't get PAN or expiration date
      // from Track2 data then try to get those from Track1 too. Note: some valid cards will have a
      // format (e.g. %E) where the Track1 data doesn't provice valid PAN or expiration date appropriate
      // for our needs but does provide cardholder name.
      var track1 = device.getTrackMasked(1);
      if (track1.length > 2) {
        // Track1 data is a format we can parse
        var track1_segments = track1.split("^");
        if (track1_segments.length == 3) { // expecting 3 segments in track1 data
          // Get cardholder from track1 data (note: only available in track1, not track2)
          cardholder_name = track1_segments[1];

          if (track1.substring(0, 2) == "%B") {
            // If necessary, get PAN from track1 data
            if ((PAN == null || PAN.length == 0) && track1_segments[0].length > 4) {
              PAN = track1_segments[0].substring(2, track1_segments[0].length);
            }
            // If necessary, get expiration date from track1 data
            if ((cc_exp_month == null || cc_exp_month.length == 0 || cc_exp_year == null || cc_exp_year.length == 0) && track1_segments[2].length >= 4) {
              cc_exp_month = track1_segments[2].substring(2, 4);
              cc_exp_year = track1_segments[2].substring(0, 2);
            }
          }
        }
      }

      // Validate cart indicative data
      if (PAN == null || PAN.length == 0) {
        alert("Invalid account number read from card");
        return false;
      }
      PAN = PAN.replace(/[^0-9]/g, ''); // strip alpha

      if (cc_exp_month == null || cc_exp_month.length == 0 || cc_exp_year == null || cc_exp_year.length == 0) {
        alert("Invalid expiration date read from card");
        return false;
      }

      // Set values from parsed data now
      _encCCExpiry = cc_exp_month + "/" + cc_exp_year;
      _encAccountHolder = cardholder_name !== null ? cardholder_name.trim() : "";

      _CcNumMasked = window.top.maskCard(PAN);
      var card_validation_code = window.top.cardValidation(PAN);
      if (card_validation_code == 0) {
        alert("Invalid card type");
        return false;
      }
      _CcCardType = window.top.cardTypeFromValidationType(card_validation_code);

      // Set remaining values from device
      _encTrack2 = device.getTrack(2);
      _encMPStatus = device.MPrintStatus;
      _encMP = device.MagnePrintDataHexString();
      _encKSN = device.DUKPTKSN;
      _encCardType = "1";     // per AMS 4.3 API: always pass 1
      _encBlockType = "1";    // per AMS 4.3 API: 1 == MagenSafe V4/V5 compatible device, 2 == IPAD v1 device

      /*
       var CardResponse = "\nMasked(all)=" + device.getTrackMasked(0) + "\nTrack1="+ track1 + "\nTrack2="+ track2 + "\nTrack3="+ device.getTrack(3);
       //CardResponse +=  "\nEncTrack1="+ CardData.EncTrack1 + "\nEncTrack2="+ CardData.EncTrack2 + "\nEncTrack3="+ CardData.EncTrack3;
       CardResponse += "\nKSN="+ device.DUKPTKSN;
       CardResponse +=  "\nEncMP="+ device.MagnePrintDataHexString();
       CardResponse +=  "\nMPSTS="+ device.MPrintStatus; // + "\nCardType="+ CardData.CardType;
       CardResponse += "\nAdditional Card Info:\n_encCCExpiry="+ _encCCExpiry+ "\n_encAccountHolder="+ _encAccountHolder + "\n_CcNumMasked="+ _CcNumMasked+"\n_CcCardType:"+_CcCardType;
       alert(CardResponse);
       */

      //Added by Webber Gong
      alert('Card Number: ' + PAN + '\nCard Expiration: ' + _encCCExpiry + '\nAccountHolder: ' +
        cardholder_name +  '\nMasked Card Number: ' + _CcNumMasked + '\nCard Type: ' + _CcCardType);
      return false;

      // Make AMS request to get wallet ID. Callback function will close the dialog.
      _request_key = new Date().getTime() + "_" + _CcNumMasked;
      this.magTekSetInfoMessage("Encrypting credit card...");

      var done = generateCCWalletIDFromEncryptedInput(_encCCExpiry, _encAccountHolder, '', _CcNumMasked, _encTrack2, '', _encMP, _encMPStatus, _encKSN, _encCardType, _encBlockType, '', this.SetWalletIDNotification, _request_key);
      if (done) {
        // Function returned true so must have displayed some error to the user. Function would return false if waiting for wallet id from server. Callback would have been notified when done.
        this.magTekSetInfoMessage("Please swipe credit card again..."); // generateCCWalletIDFromEncryptedInput displayed error alert to user, redisplay waiting msg
        _request_key = '';
      }

      // Waiting for callback to get notification that encryption is done
      return true;
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
        this.magTekSetInfoMessage("Please swipe credit card again...");
        return;
      }

      // Validate wallet id
      if (wallet_id == null || wallet_id.length == 0 || wallet_id == 'null') {
        alert("Failure encrypting credit card data. Please try again.");
        this.magTekSetInfoMessage("Please swipe credit card again...");
        return;
      }

      this.magTekSetInfoMessage("Finishing...");

      // Pass wallet id to caller
      fnFormCallback(ccFormKey, wallet_id, _CcNumMasked, _encCCExpiry, _CcCardType, _encAccountHolder, _encAccountZip);
    },

    /*
     * Functions to communicate with the device
     */
    OpenDevice: function () {

      if (initialize_timeout) {
        this.magTekSetErrorMessage("Unable to initialize MagTek USBHID library or communicate with device");
        return;
      }

      try {
        if (!document.getElementById('USBHID').PortOpen) {
          document.getElementById('USBHID').PortOpen = true;
        }
        if (!document.getElementById('USBHID').PortOpen) {
          this.magTekSetErrorMessage("Unable to open device");
          return;
        }
        magtek_device_open = true;
      } catch (err) {
        alert("Error opening MagTek USBHID device: " + err);
        this.magTekSetErrorMessage("Unable to open device");
        return;
      }
      this.magTekSetInfoMessage("Device is open");
    },

    CloseDevice: function () {
      try {
        if (document.getElementById('USBHID').PortOpen) {
          document.getElementById('USBHID').PortOpen = false;
        }
      } catch (err) {
        this.magTekSetErrorMessage("Error closing device: " + err);
      }
      magtek_device_open = false;
    },

    GetDeviceState: function () {
      var that = this;

      magtek_init_timer = setTimeout(function() {
        that.GetDeviceStateTimeout();
      }, 10000);// 10 seconds
      this.OpenDevice();

      try {
        var devIn = '14';
        var devOut = '';
        document.getElementById('USBHID').USBSwipe_Command(devIn, devOut);
        deviceState = document.getElementById('USBHID').SwipeCommandOutput;
        var deviceState = deviceState.replace(/ /g, '');
        initialized = true;
      } catch (err) {
        this.magTekSetErrorMessage("Error getting device state: " + err);
      }

      this.CloseDevice();
      return initialized;
    },

    GetDeviceStateTimeout: function () {
      if (!initialized) {
        initialize_timeout = true;
      }
    },

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
          console.error("MagTekCabMSF.handleXNetRequest; error: " + err.description);
        }
      }
    }
  };
}
