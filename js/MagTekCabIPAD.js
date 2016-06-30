/**
 * Created by wgong on 6/24/2016.
 */

function MagTekCabIPAD() {
  var magtek_applet_initialized = false;
  var magtek_device_ready = false;
  var magtek_init_timer = null;
  var magtek_init_timed_out = false;

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
  var _AMSWalletID = '';
  var _CcNumMasked = '';
  var _CcCardType = 0;

  var fnStatusCallback = null;
  var _manual_input = false;
  var fnFormCallback = null;
  var ccFormKey = null;
  var waiting_for_input = false;

  var magtek_msg_cancelled = 3;
  var magtek_msg_thank_you = 4;
  var magtek_msg_processing = 6;
  var magtek_msg_please_wait = 7;

  //window.onload = function () {
  //  window.magTekCabIPAD = new MagTekCabIPAD();
  //  window.magTekCabIPAD.doInit();
  //};

  return {
    /*
     *  This is the function that callers should use to get card input from user (swipe or manual).
     */
    deviceInputStart: function (fnStatus, fnData, key, manual_input) {
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

      if (typeof(manual_input) != 'undefined') _manual_input = manual_input;
      //if (magtek_init_timer != null) return; // already trying to initialize

      this.doRequestInput();
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

      // Close device and cleanup
      //DeviceCancelOperation();
      this.DeviceEndSession();
      this.DeviceClose();

      return;
    },

    magTekSetErrorMessage: function (msg) {
      // Pass status to caller
      if (typeof(fnStatusCallback) == 'undefined' || fnStatusCallback == null) return;
      fnStatusCallback(1, msg);  // status 1 == error
    },

    magTekSetInfoMessage: function (msg) {
      // Pass status to caller
      if (typeof(fnStatusCallback) == 'undefined' || fnStatusCallback == null) return;
      fnStatusCallback(2, msg);  // status 2 == info
    },

    doInit: function () {
      var that = this;
      magtek_init_timed_out = false;
      setTimeout(function() {
        that.magTekInitTimeout();
      }, 30000);// total init time should be within 30 seconds
      this.GetLibStatus();
    },

    magTekInitTimeout: function () {

      if (magtek_applet_initialized) return;

      magtek_init_timed_out = true;
      magtek_init_timer = null;

      this.magTekSetErrorMessage("Unable to initialize library");
    },

    GetLibStatus: function () {
      var that = this;
      magtek_init_timer = null;

      try {

        var iResult = 1;
        // var iResult = document.JMTIPADLIB.MTIPADLibStatus();
        var iResult = ipad.IsLibReady();

        if (iResult == 0) {
          magtek_applet_initialized = true;
          if (fnFormCallback) { // If caller is waiting for input then call doRequestInput()
            this.doRequestInput();
          }
          return;
        }

        //if (magtek_init_timed_out || iResult != 1) {
        if (iResult != 1) {
          this.magTekSetErrorMessage("Unable to initialize device communication");
          return;
        }

      } catch (err) {
        this.magTekSetErrorMessage("Unable to initialize library: " + err.description);
      }

      //Restart the timer to wait some more for applet status
      magtek_init_timer = setTimeout(function() {
        that.GetLibStatus();
      }, 4000);// 4 seconds

    },

    doRequestInputDelayed: function () {
      var that = this;
      setTimeout(function() {
        that.doRequestInput();
      }, 20);
    },

    doRequestInput: function () {

      //DeviceCancelOperation(); // cancel previous device function
      this.DeviceEndSession();      // redisplays "welcome" message on device

      if (!fnFormCallback || fnFormCallback == null) return; // nobody is listening

      // Open the device if not already open
      if (!magtek_device_ready) {
        // Open the device
        this.DeviceOpen();
        if (!magtek_device_ready) {
          //magTekSetErrorMessage("Unable to open device ...trying again...");
          //doRequestInputDelayed();
          this.magTekSetErrorMessage("Unable to open device.");
          return;
        }
      } else {
        // Check if the device is still connected
        if (ipad.GetDeviceConnectionStatus() == 0) {
          // Device is no longer connected
          this.magTekSetErrorMessage("Device is not available");
          this.deviceInputEnd();
          return;
        }
      }

      var data = null;
      waiting_for_input = true;
      if (_manual_input) {
        this.magTekSetInfoMessage("Enter credit card data now...<br>Use pin pad to cancel");
        data = this.DeviceRequestManualCard();
      } else {
        this.magTekSetInfoMessage("Swipe credit card now...<br>Use pin pad to cancel");
        data = this.DeviceRequestCard();
      }
      waiting_for_input = false;

      // Get the operation status return code
      // var op_status = document.JMTIPADLIB.getOpStatusCode();
      var op_status = ipad.GetOpStatus();
      if (op_status == 0) { // user swiped card or manually entered card
        if (this.processCardData(data, _manual_input)) {
          // processCardData validation successful. Now waiting for SetWalletIDNotification callback to be invoked.
          return;
        }
        if (ipad.GetDeviceConnectionStatus() == 0) {
          // Device is no longer connected
          this.magTekSetErrorMessage("Device is not available");
          this.deviceInputEnd();
          return;
        }
      } else if (op_status == 1) { // user canceled operation on IPAD keypad
      } else if (op_status == 2) { // timeout waiting for input
      }

      // Nofify caller that we're not waiting for input any more
      if (typeof(fnStatusCallback) != 'undefined' && fnStatusCallback != null) {
        fnStatusCallback(0, "");  // status = cancelled or timed out
      }

      this.DeviceEndSession();      // redisplays "welcome" message on device
    },

    processCardData: function (CardData, manual_input) {

      if (CardData == null || CardData.Track2 == null || CardData.Track1 == null) {
        alert("Card data not read. Please try again.");
        return false;
      }

      this.magTekSetInfoMessage("Encrypting credit card...");
      this.DeviceDisplayMessage(magtek_msg_please_wait);

      // CardData.CardType: CardTypeOther=0, CardTypeFinancial=1,CardTypeAAMVA=2, CardTypeManual=3, CardTypeUnknown=4
      // CardData.CardStatus: CardStatusOK=0, CardStatusErr_Trk1=0x02, CardStatusErr_Trk2 = 0x04, CardStatusErr_Trk3 = 0x08
      _request_key = ''; // it's new data, clear the previous request key in case reply to earlier request comes in while processing

      var PAN = null;
      var cc_exp_month = null;
      var cc_exp_year = null;
      var cardholder_name = null;

      // First try to get PAN and expiration data by parsing Track2 data (refer to http://en.wikipedia.org/wiki/Magnetic_stripe_card)
      var track2_segments = CardData.Track2.split("=");
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
      if (CardData.Track1.length > 2) {
        // Track1 data is a format we can parse
        var track1_segments = CardData.Track1.split("^");
        if (track1_segments.length == 3) { // expecting 3 segments in track1 data
          // Get cardholder from track1 data (note: only available in track1, not track2)
          cardholder_name = track1_segments[1];

          if ((manual_input && CardData.Track1.substring(0, 2) == "%M") ||
            (!manual_input && CardData.Track1.substring(0, 2) == "%B")) {
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

      /*
       var CardResponse = "\nTrack1="+ CardData.Track1 + "\nTrack2="+ CardData.Track2 + "\nTrack3="+ CardData.Track3;
       CardResponse +=  "\nEncTrack1="+ CardData.EncTrack1 + "\nEncTrack2="+ CardData.EncTrack2 + "\nEncTrack3="+ CardData.EncTrack3;
       CardResponse +=  "\nEncMP="+ CardData.EncMP + "\nKSN="+ CardData.KSN;
       CardResponse +=  "\nMPSTS="+ CardData.MPSTS + "\nCardType="+ CardData.CardType;
       CardResponse +=  "\nPAN="+ PAN;
       alert(CardResponse);
       */
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
      _encAccountHolder = cardholder_name != null ? cardholder_name.trim() : "";

      _CcNumMasked = window.top.maskCard(PAN);
      var card_validation_code = window.top.cardValidation(PAN);
      if (card_validation_code == 0) {
        alert("Invalid card type");
        return false;
      }
      _CcCardType = window.top.cardTypeFromValidationType(card_validation_code);
      if (_CcCardType == 0) {
        alert("Unsupported credit card");
        return false;
      }

      // Set remaining values from device
      _encTrack2 = CardData.EncTrack2; // Track2
      _encMPStatus = CardData.MPSTS; // CardData.EncMPStatus;
      _encMP = manual_input ? '0' : CardData.EncMP;
      _encKSN = CardData.KSN;
      _encCardType = "1";     // per AMS 4.3 API: always pass 1
      _encBlockType = "2";    // per AMS 4.3 API: 1 == MagenSafe V4/V5 compatible device, 2 == IPAD v1 device

      //Added by Webber Gong
      alert('Card Number: ' + PAN + '\nCard Expiration: ' + _encCCExpiry + '\nAccountHolder: ' +
        cardholder_name +  '\nMasked Card Number: ' + _CcNumMasked + '\nCard Type: ' + _CcCardType);
      return false;

      // Make AMS request to get wallet ID. Callback function will close the dialog.
      _request_key = new Date().getTime() + "_" + _CcNumMasked;
      var done = generateCCWalletIDFromEncryptedInput(_encCCExpiry, _encAccountHolder, '', _CcNumMasked, _encTrack2, '', _encMP, _encMPStatus, _encKSN, _encCardType, _encBlockType, '', this.SetWalletIDNotification, _request_key);
      if (done) {
        // Function not waiting, so must have displayed some error to the user.
        _request_key = '';
        return false;
      }

      return true; // waiting for callback to handle response
    },

    // Callback to process wallet ID in response from server ajax request
    SetWalletIDNotification: function (wallet_id, request_key, error) {
      this.DeviceEndSession();

      if (fnFormCallback == null) {
        return; // nobody cares anymore, just return
      }

      if (request_key != _request_key) {
        return; // just ignore reply for request other than current one -- maybe user swiped card again while first swipe still being processed
      }

      _request_key = ''; // have reply, clear the key

      if (error && error != null && typeof(error).toLowerCase() == 'string' && error.length > 0) {
        alert(error);
        //doRequestInput();
        // Nofify caller that we're not waiting for input any more
        if (typeof(fnStatusCallback) != 'undefined' && fnStatusCallback != null) {
          fnStatusCallback(0, "");  // status = cancelled or timed out
        }
        this.DeviceEndSession();      // redisplays "welcome" message on device
        return;
      }

      // Validate wallet id
      if (wallet_id == null || wallet_id.length == 0 || wallet_id == 'null') {
        alert("Failure encrypting credit card data. Please try again.");
        //doRequestInput();
        // Nofify caller that we're not waiting for input any more
        if (typeof(fnStatusCallback) != 'undefined' && fnStatusCallback != null) {
          fnStatusCallback(0, "");  // status = cancelled or timed out
        }
        this.DeviceEndSession();      // redisplays "welcome" message on device
        return;
      }

      this.magTekSetInfoMessage("Finishing...");
      this.DeviceDisplayMessage(magtek_msg_thank_you, 5);

      // Pass wallet id to caller
      fnFormCallback(ccFormKey, wallet_id, _CcNumMasked, _encCCExpiry, _CcCardType, _encAccountHolder, _encAccountZip);
    },

    // Javascript methods to interface to device (see JMTIPADLIB.js for examples of all available)


    //-------------------------------------------------
    // Usage:
    //      Establish communucation with IPAD device
    //-------------------------------------------------
    DeviceOpen: function () {
      if (magtek_device_ready) return;

      try {
        //magTekSetInfoMessage("Opening device ...");
        // var iResult = document.JMTIPADLIB.MTIPADOpen();
        var iResult = ipad.open();

        if (iResult == 1) {
          magtek_device_ready = true;
          return;
        }

        magtek_device_ready = false;

      } catch (err) {
        this.magTekSetErrorMessage("Error opening device: " + err.description);
      }
    },

    DeviceClose: function () {
      if (!magtek_device_ready) return;
      magtek_device_ready = false;
      try {
        //var iResult = document.JMTIPADLIB.MTIPADClose();
        var iResult = ipad.close();
        if (iResult != 1) {
          //alert("Close IPAD failed. RC = " + iResult);
        }
      } catch (err) {
      }
    },

    DeviceEndSession: function () {
      if (!magtek_device_ready) return;
      try {
        // Displays "Welcome" message on device
        //document.JMTIPADLIB.MTIPADEndSession("0");
        ipad.EndSession(0);

      } catch (err) {
      }
    },

    DeviceCancelOperation: function () {
      if (!magtek_device_ready) return;
      try {
        //document.JMTIPADLIB.MTIPADCancelOperation();
        alert("TODO DeviceCancelOperation");
      } catch (err) {
      }
    },

    DeviceDisplayMessage: function (message_id, display_num_seconds) {
      if (!display_num_seconds) display_num_seconds = 0;
      //var iResult = document.JMTIPADLIB.MTIPADDisplayMsg(display_num_seconds, message_id);
      // TODO CALL MAGTEK.DLL FUNCTION
    },

    DeviceRequestCard: function (retry) {

      // request card
      var wait_seconds = 30;
      var msg_id = retry ? 3 : 1;  // 1=="Swipe Card", 2=="Please Swipe Card", 3=="Please Swipe Again"
      var buzzer = retry ? 2 : 1; // 0, 1, or 2 tones
      //CardInfo = document.JMTIPADLIB.MTIPADRequestCard(wait_seconds, msg_id, buzzer, opStatus, CardInfo);

      //var ccStatus = ipad.RequestCard(10,1,0);
      var ccStatus = ipad.RequestCard(wait_seconds, msg_id, buzzer);
      if (ccStatus != 0) {
        return null;
      }

      var opStatus = ipad.GetOpStatus();
      var data = ipad.GetCardData();

      var jsCardData = new VBArray(data);
      var cardData = new Object();
      cardData.Track1 = jsCardData.getItem(20, 1);
      cardData.Track2 = jsCardData.getItem(21, 1);
      cardData.CardType = jsCardData.getItem(3, 1);
      cardData.EncTrack1 = jsCardData.getItem(23, 1);
      cardData.EncTrack2 = jsCardData.getItem(24, 1);
      cardData.EncTrack3 = jsCardData.getItem(25, 1);
      cardData.EncMP = jsCardData.getItem(26, 1);
      cardData.MPSTS = jsCardData.getItem(19, 1);
      cardData.KSN = jsCardData.getItem(27, 1);
      /*
       var CardResponse = "\nTrack1="+ cardData.Track1 + "\nTrack2="+ cardData.Track2 + "\nTrack3="+ cardData.Track3;
       CardResponse +=  "\nEncTrack1="+ cardData.EncTrack1 + "\nEncTrack2="+ cardData.EncTrack2 + "\nEncTrack3="+ cardData.EncTrack3;
       CardResponse +=  "\nEncMP="+ cardData.EncMP + "\nKSN="+ cardData.KSN;
       CardResponse +=  "\nMPSTS="+ cardData.MPSTS + "\nCardType="+ cardData.CardType;
       alert(CardResponse);
       */
      return cardData;


    },

    DeviceRequestManualCard: function () {

      // request manual input
      var wait_seconds = 90; //
      var buzzer = 1;  // 0, 1, or 2 tones
      //CardInfo = document.JMTIPADLIB.MTIPADRequestManualCardData(wait_seconds, buzzer, opStatus, CardInfo);
      var ccStatus = ipad.RequestManualCardData(45, 1);
      if (ccStatus != 0) {
        return null;
      }

      var opStatus = ipad.GetOpStatus();
      var data = ipad.GetCardData();

      var jsCardData = new VBArray(data);
      var cardData = new Object();
      cardData.Track1 = jsCardData.getItem(20, 1);
      cardData.Track2 = jsCardData.getItem(21, 1);
      cardData.CardType = jsCardData.getItem(3, 1);
      cardData.EncTrack1 = jsCardData.getItem(23, 1);
      cardData.EncTrack2 = jsCardData.getItem(24, 1);
      cardData.EncTrack3 = jsCardData.getItem(25, 1);
      cardData.EncMP = jsCardData.getItem(26, 1);
      cardData.MPSTS = jsCardData.getItem(19, 1);
      cardData.KSN = jsCardData.getItem(27, 1);
      /*
       var CardResponse = "\nTrack1="+ cardData.Track1 + "\nTrack2="+ cardData.Track2 + "\nTrack3="+ cardData.Track3;
       CardResponse +=  "\nEncTrack1="+ cardData.EncTrack1 + "\nEncTrack2="+ cardData.EncTrack2 + "\nEncTrack3="+ cardData.EncTrack3;
       CardResponse +=  "\nEncMP="+ cardData.EncMP + "\nKSN="+ cardData.KSN;
       CardResponse +=  "\nMPSTS="+ cardData.MPSTS + "\nCardType="+ cardData.CardType;
       alert(CardResponse);
       */
      return cardData;

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
            args["callerKey"],
            args["isManualInput"]);

        } else if (args["MagtekRequest"] == "deviceInputEnd") {
          this.deviceInputEnd();
        }
      } catch (err) {
        if (console) {
          console.error("MagTekCabIPAD.handleXNetRequest; error: " + err.description);
        }
      }
    }
  };
}
