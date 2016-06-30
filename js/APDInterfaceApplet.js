/**
 * Created by wgong on 6/21/2016.
 */
// Javascript used to interface to APDInterfaceApplet (Paymentech) AND APDMonerisInterfaceApplet (Moneris)
function APDInterfaceApplet(
  cc_scan_with_emv_device,
  cc_scan_with_paymenttech_device,
  cc_scan_with_moneris_device,
  cc_apd_device_type,
  avs_full_addr,
  avs_zip,
  applet_name,
  ams_url,
  ams_port,
  ams_timeout,
  card_acceptor_name,
  terminal_location_address,
  terminal_location_city,
  terminal_location_state,
  terminal_location_zip,
  merchant_descriptor,
  merchant_user,
  merchant_password,
  terminal_number,
  device_id,
  usb_port_name,
  pinpad_data_entry_timeout,
  pinpad_pin_entry_timeout,
  pinpad_swipe_card_timeout,
  write_to_log,
  error_msg) {
  var apd_applet_initialized = false;
  var apd_init_timer = null;
  var apd_init_timed_out = false;
  var apd_is_loading_applet = false;
  var apd_applet_load_error = null;
  var _fnStatusCallback = null;
  var _isBusy = false;
  var _isManualInput = false;
  var _clientTransactionId = null;
  var _orderId = null;
  var _orderDescriptor = null;
  var _orderAmount = null;
  var _isRefund = false;
  var _isDebitCard = false;
  var _isWalletSave = false;
  var _rno = 0;
  var _receipt_header_id = 0;
  var _receipt_payment_id = 0;
  var _customerId = 0;
  var _companyId = 0;
  var _companyAgentId = 0;
  var _cardholder_addr = null;
  var _cardholder_zip = null;
  var _fnFormCallback = null;
  var _cardFormKey = null;
  var _terminal_number = null; // override value, for testing only
  var _com_port = null;        // override value, for testing only
  var _timeout = null;         // override value, for testing only
  var _doAVS = false;
  var _isAVSFailed = false;
  var _AMSResponse = null;
  var _isCapturePending = false;
  var _originalAMSTransactionId = null;
  var _serverTransactionDescription = null;
  var _isReversingTransaction = false;  // are we reversing swipe (undo) because of server-side error, or AVS validation didn't pass
  var _isFailedReverseTransaction = false;  // Did pinpad void fail trying to reverse transaction

  var applet_code_base = '../device-libs/';

  if (error_msg) {
    alert(error_msg);
    return null;
  } else {
    return {
      APDLoadApplet: function () {
        if (window.navigator.appName.toLowerCase().indexOf("netscape") != -1 ||
          window.navigator.appName.toLowerCase().indexOf('internet explorer') != -1) {
          var appletStr = '';
          var mainTagName = '';
          if (window.navigator.appName.toLowerCase().indexOf("netscape") != -1) { // set object for Netscape:
            appletStr =
              "<applet codebase=" + applet_code_base + " " +
              "archive=\"" + applet_name + ".jar\"" +
              "code=\"" + applet_name + ".class\"" +
              "id=\"APDInterfaceApplet\"" +
              "name=\"APDInterfaceApplet\"" +
              "height=\"0\" width=\"0\" " +
              "scriptable=\"true\"" +
              "mayscript=\"mayscript\"" +
              "pluginspage=\"http://java.com/en/download/index.jsp\"" + ">";
            mainTagName = 'applet';
          } else if (window.navigator.appName.toLowerCase().indexOf('internet explorer') != -1) { //set object for IE
            appletStr =
              "<object codebase=" + applet_code_base + " type=\"application/x-java-applet;version=1.5\"" +
              "archive = \"" + applet_name + ".jar\"" +
              "code=\"" + applet_name + ".class\"" +
              "id=\"APDInterfaceApplet\"" +
              "name=\"APDInterfaceApplet\"" +
              "height=\"0\" width=\"0\">" +
              "<param name=\"mayscript\" value=\"true\">";
            mainTagName = 'object';
          }
          if (!cc_scan_with_emv_device) {
            appletStr +=
              "<param name=\"separate_jvm\" value=\"true\">" +
              "<param name=\"cache_option\" value=\"No\">" +
              "<param name=\"classloader_cache\" value=\"true\">";
          }
          appletStr +=
            "<param name=\"dll_ver\" value=\"1.0.0\">" +
            "<param name=\"dll_auto_update\" value=\"Yes\">" +
            "<param name=\"AMSURL\" value=\"" + ams_url + "\">" +
            "<param name=\"AMSPort\" value=\"" + ams_port + "\">" +
            "<param name=\"AMSTimeout\" value=\"" + ams_timeout + "\">" +
            "<param name=\"CardAcceptorName\" value=\"" + card_acceptor_name + "\">" +
            "<param name=\"TerminalLocationAddress\" value=\"" + terminal_location_address + "\">" +
            "<param name=\"TerminalLocationCity\" value=\"" + terminal_location_city + "\">" +
            "<param name=\"TerminalLocationState\" value=\"" + terminal_location_state + "\">" +
            "<param name=\"TerminalLocationZIP\" value=\"" + terminal_location_zip + "\">" +
            "<param name=\"MerchantDescriptor\" value=\"" + merchant_descriptor + "\">" +
            "<param name=\"MerchantUser\" value=\"" + merchant_user + "\">" +
            "<param name=\"MerchantPassword\" value=\"" + merchant_password + "\">" +
            "<param name=\"TerminalNumber\" value=\"" + terminal_number + "\">" +
            "<param name=\"DeviceId\" value=\"" + device_id + "\">" +
            "<param name=\"USBPortName\" value=\"" + usb_port_name + "\">" +
            "<param name=\"PinpadDataEntryTimeout\" value=\"" + pinpad_data_entry_timeout + "\">" +
            "<param name=\"PinpadPINEntryTimeout\" value=\"" + pinpad_pin_entry_timeout + "\">" +
            "<param name=\"PinpadSwipeCardTimeout\" value=\"" + pinpad_swipe_card_timeout + "\">" +
            "<param name=\"WriteToLog\" value=\"" + write_to_log + "\">" +
            "</" + mainTagName + ">";
          document.getElementById('dvObjectHolder').innerHTML = appletStr;
        }
      },

      /*
       *  This is the function that callers should use to get card input from user (swipe or manual).
       */
      APDInputStart: function (fnStatus, fnData, key, isManualInput, clientTransactionId, orderId, orderDescriptor, orderAmount, isRefund, isDebitCard, isWalletSave, rno, customerId, companyId, companyAgentId, cardholder_addr, cardholder_zip, receiptheader_id, receiptpayment_id) {

        if (_isBusy) {
          alert("Busy processing another card");
        }

        _isBusy = true;

        _fnStatusCallback = fnStatus;
        _fnFormCallback = fnData;
        _cardFormKey = key;

        _AMSResponse = null;

        if (typeof(rno) != 'undefined') {
          _rno = rno;
        } else {
          _rno = 0;
        }
        if (typeof(customerId) != 'undefined') {
          _customerId = customerId;
        } else {
          _customerId = 0;
        }

        if (typeof(companyId) != 'undefined') {
          _companyId = companyId;
        } else {
          _companyId = 0;
        }
        if (typeof(companyAgentId) != 'undefined') {
          _companyAgentId = companyAgentId;
        } else {
          _companyAgentId = 0;
        }
        if (typeof(isManualInput) != 'undefined') {
          _isManualInput = isManualInput;
        } else {
          _isManualInput = false;
        }
        if (typeof(clientTransactionId) != 'undefined') {
          _clientTransactionId = clientTransactionId;
        } else {
          _clientTransactionId = null;
        }
        if (typeof(orderId) != 'undefined') {
          _orderId = orderId;
        } else {
          _orderId = null;
        }
        if (typeof(orderDescriptor) != 'undefined') {
          _orderDescriptor = orderDescriptor;
        } else {
          _orderDescriptor = null;
        }
        if (typeof(orderAmount) != 'undefined') {
          _orderAmount = orderAmount;
        } else {
          _orderAmount = null;
        }
        if (typeof(isRefund) != 'undefined') {
          _isRefund = isRefund;
        } else {
          _isRefund = false;
        }
        if (typeof(isDebitCard) != 'undefined') {
          _isDebitCard = isDebitCard;
        } else {
          _isDebitCard = false;
        }
        if (typeof(isWalletSave) != 'undefined') {
          _isWalletSave = isWalletSave;
        } else {
          _isWalletSave = false;
        }
        if (typeof(cardholder_addr) != 'undefined') {
          _cardholder_addr = cardholder_addr;
        } else {
          _cardholder_addr = null;
        }
        if (typeof(cardholder_zip) != 'undefined') {
          _cardholder_zip = cardholder_zip;
        } else {
          _cardholder_zip = null;
        }
        if (typeof(receiptheader_id) != 'undefined') {
          _receipt_header_id = receiptheader_id;
        } else {
          _receipt_header_id = null;
        }
        if (typeof(receiptpayment_id) != 'undefined') {
          _receipt_payment_id = receiptpayment_id;
        } else {
          _receipt_payment_id = null;
        }

        _isReversingTransaction = false;
        _isFailedReverseTransaction = false;

        this.doAppletRequest();
      },

      /*
       *  Called to clean up after input sucessfully received or function cancelled
       */
      APDInputEnd: function () {

        _isBusy = false;

        _fnStatusCallback = null;
        _fnFormCallback = null;
        _cardFormKey = null;

        _AMSResponse = null;

        return;
      },

      APDSetErrorMessage: function (msg) {
        _isBusy = false;
        // Pass status to caller
        if (typeof(_fnStatusCallback) == 'undefined' || _fnStatusCallback == null) return;
        _fnStatusCallback(1, msg);  // status 1 == error
      },

      APDSetInfoMessage: function (msg) {
        // Pass status to caller
        if (typeof(_fnStatusCallback) == 'undefined' || _fnStatusCallback == null) return;
        _fnStatusCallback(2, msg);  // status 2 == info
      },

      /*
       * Function to reset pinpad device if Terminal Number needs to be cleared. Only used for maintenance.
       */
      APDPinPadReset: function () {
        try {
          // Call applet method to reset device
          return document.APDInterfaceApplet.APDPinPadReset();
        } catch (err) {
          this.APDSetErrorMessage("Error resetting PinPad device: " + err.description);
        }
        return false;
      },

      doInit: function () {
        var that = this;
        apd_init_timed_out = false;
        apd_init_timer = null;

        if (this.isAppletReady()) {
          return true;
        }

        if (!this.isAppletReady()) {
          //Start the timer to wait some more for applet status
          apd_init_timer = setTimeout(function () {
            that.checkAppletLoadTimeout();
          }, 4000); // 4 seconds
          // Start timer for total time to wait for applet initialization
          setTimeout(function () {
            that.initTimeout();
          }, 30000); // total init time should be within 30 seconds
        }
      },

      initTimeout: function () {

        if (apd_applet_initialized) return;

        apd_init_timed_out = true;
        apd_init_timer = null;

        if (apd_applet_load_error != null && apd_applet_load_error.length > 0) {
          this.APDSetErrorMessage("Unable to initialize applet: " + apd_applet_load_error);
        } else {
          this.APDSetErrorMessage("Unable to initialize applet");
        }

      },

      isAppletReady: function () {
        apd_applet_load_error = null;
        try {
          var iResult = document.APDInterfaceApplet.APDIsReady();
          if (iResult == true) {
            apd_applet_initialized = true;
            apd_is_loading_applet = false;
            return true;
          }

        } catch (err) {
          apd_applet_load_error = err.description;

          // ANE-14240 Applet may need to be loaded. If applet gets loaded in main window and then in a popup window, when the popup window is closed the
          // applet is stopped. This happens because all instances of the applet use one classloader so the ActivePaymentDevice dll can be loaded
          // in any instance.
          if (!apd_is_loading_applet) {
            apd_is_loading_applet = true;
            this.APDLoadApplet(); // load the applet
          }
        }

        apd_applet_initialized = false;
        return false;

      },

      checkAppletLoadTimeout: function () {
        var that = this;
        apd_init_timer = null;

        if (this.isAppletReady()) {
          if (_fnFormCallback) { // If caller is waiting for input then call this.doAppletRequest()
            this.doAppletRequest();
          }
          return;
        }

        if (!apd_init_timed_out) {
          //Restart the timer to wait some more for applet status
          apd_init_timer = setTimeout(function () {
            that.checkAppletLoadTimeout();
          }, 4000); // 4 seconds
        }
      },

      /*
       *  Make applet request to get input from Active Payment Device library.
       */
      doAppletRequest: function () {
        if (!_fnFormCallback || _fnFormCallback == null) {
          _isBusy = false;
          return; // nobody is listening
        }

        if (!this.isAppletReady()) {
          if (!this.doInit()) {
            return; // this.checkAppletLoadTimeout will call this function (this.doAppletRequest) again when applet is loaded
          }
        }

        this.doAppletCardInputRequest();

        //Webber Gong's Mark
        //// Make sure we're still logged in to the server and have a valid receipt. Handler will call this.doAppletCardInputRequest if we are logged in.
        //try {
        //  this.APDSetInfoMessage("Verifying server session status...");
        //  $.ajax({
        //    type: "POST",
        //    url: "checkAPDServerStatus.sdi?rno=" + _rno + "&isWalletSave=" + (_isWalletSave ? "true" : ""),
        //    dataType: "json",
        //    success: function (json, textStatus, jqXHR) {
        //      var valid_session = json.logged_in != null && json.logged_in == 'true';
        //      if (valid_session && !_isWalletSave) {
        //        valid_session = json.receipt_valid != null && json.receipt_valid == 'true';
        //      }
        //      if (valid_session) {
        //        this.doAppletCardInputRequest();
        //      } else {
        //        this.exitRequest("Your session has timed out or server error. The remaining balance will be left on account. You must log-in again.");
        //      }
        //    },
        //    error: function () {
        //      this.exitRequest("Your session has timed out or server error. The remaining balance will be left on account. You must log-in again.")
        //    }
        //  });
        //} catch (err) {
        //  this.exitRequest("Your session has timed out or server error. The remaining balance will be left on account. You must log-in again.");
        //}
      },

      // Abnormal error, notify client so they can exit
      exitRequest: function (err) {
        alert(err);  // Display the error
        // Notify caller, pass null wallet ID.
        _fnFormCallback(_cardFormKey,
          "EXIT",  // special value to notify caller to stop asking for payments
          null, null,
          _clientTransactionId,
          null, // don't pass error, we already displayed error. if pass error callback will try again.
          _orderAmount,
          _serverTransactionDescription);
        _isBusy = false;
      },

      doAppletCardInputRequest: function () {
        var that = this;
        if (_isManualInput) {
          this.APDSetInfoMessage("Waiting for credit card number to be keyed in ...");
        } else {
          this.APDSetInfoMessage("Waiting for " + (_isDebitCard ? "debit" : "credit") + " card ...");
        }
        // Set timeout to call this.requestInput. Fixes issue in some browsers where info message doesn't display if immediately request input.
        setTimeout(function () {
          that.requestInput();
        }, 100);

      },

      requestInput: function () {

        var ams_response = null;
        var client_request = null;

        try {
          // Call applet method to initialize request object
          client_request = document.APDInterfaceApplet.APDStartTransaction();
          if (_terminal_number) {
            client_request.setTerminalNumber(_terminal_number);
          }
          if (_com_port) {
            client_request.setUSBPortName(_com_port);
          }
          if (_timeout) {
            client_request.setPinpadDataEntryTimeout(_timeout);
            client_request.setPinpadPINEntryTimeout(_timeout);
            client_request.setPinpadSwipeCardTimeout(_timeout);
          }

          // make sure we use the unique client transaction id each request.
          if (cc_scan_with_paymenttech_device) {
            if (_clientTransactionId != null) {
              _clientTransactionId = document.APDInterfaceApplet.generateClientId();
            }
          }

          client_request.setClientTransactionID(_clientTransactionId);
          client_request.setOrderID(_orderId);
          client_request.setOrderAmount(_orderAmount);
          client_request.setOrderDescriptor(_orderDescriptor);

          _doAVS = false;
          _isAVSFailed = false;
          if (!cc_scan_with_moneris_device) {
            // Check if we need to do address verification (unless using Moneris pinpad, the AMS Moneris ActivePinPad library doesn't support AVS)
            if (!_isDebitCard && !_isRefund && !_isWalletSave) {
              if (avs_full_addr) {
                // site.verisignUseAvs() is enabled
                if (_cardholder_addr != null && _cardholder_addr.length > 0) {
                  client_request.setCCAddress(_cardholder_addr);
                  _doAVS = true;
                }
                if (_cardholder_zip != null && _cardholder_zip.length > 0) {
                  client_request.setCCZip(_cardholder_zip);
                  _doAVS = true;
                }
              } else if (avs_zip) {
                // site.verisignUseAvsZipOnly() is enabled
                if (_cardholder_zip != null && _cardholder_zip.length > 0) {
                  client_request.setCCZip(_cardholder_zip);
                  _doAVS = true;
                }
              }
            }
          }
          client_request.setManualEntry(_isManualInput);

          // Send the request to the ACTIVE Payment Device library now (via applet and JNI bridge) and get response
          if (_isWalletSave) {
            ams_response = client_request.processAPDWalletSave();
          } else if (_isRefund) {
            ams_response = client_request.processAPDRefund(_isDebitCard);
          } else {
            if (_doAVS) {
              ams_response = client_request.processAPDAuth();
            } else {
              ams_response = client_request.processAPDPayment(_isDebitCard);
            }
          }

        } catch (err) {
          if (ams_response == null || typeof(ams_response) == 'undefined') {
            this.APDSetErrorMessage("Exception getting input from device:" + err.description);
          } else {
            this.APDSetErrorMessage("Input exception: " + err.description + ". \nReversing card transaction now...");
            // log the AMS request first.
            this.notifyServer(true, _cardFormKey, client_request, ams_response, false, false, false, function () {
            }, function () {
            });
            // Cancel the payment card swipe if necessary
            this.doAppletVoidRequest(ams_response.getAccountID(), ams_response.getAMSTransactionID(), true);
          }
          return;
        }
        // if response is null, that means some error happend in AN side, the request has not been sent to AMS yet.
        if (ams_response == null || typeof(ams_response) == 'undefined') {
          this.APDSetErrorMessage("No response from AMS PinPad Payment Device library");
          return;
        }

        // if exception happen when get response from AMS, then save the request in AN side, and void the request in back end if necessary.
        if (cc_scan_with_paymenttech_device) {
          if (ams_response.getCallStatus() != "0") {
            this.APDSetErrorMessage("Exception trying to process the charge. Reversing card transaction...");
            // log the AMS request first.
            this.notifyServer(true, _cardFormKey, client_request, ams_response, false, false, false, function () {
            }, function () {
            });
            // Cancel the payment card swipe if necessary
            this.doAppletVoidRequest(ams_response.getAccountID(), ams_response.getAMSTransactionID(), true);
            return;
          }
        }

        // Process the response from the device
        try {

          // First, if we were expecting a credit card but got debit card (or vice versa), update the type.
          // AMS ActivePinPad library (used for Moneris) doesn't respect TenderType, we may be expecting debit card but get credit card (or vice versa).
          var is_unexpected_cardtype = false;
          if (((_isDebitCard && ams_response.getCardType() != "DEBIT") && (_isDebitCard && ams_response.getCardType() != "Interac")) || ((!_isDebitCard && ams_response.getCardType() == "Interac")
            || (!_isDebitCard && ams_response.getCardType() == "DEBIT"))) {
            is_unexpected_cardtype = true;
            // Switch the tender type so server notification will have the right type
            _isDebitCard = !_isDebitCard;
            client_request.setTenderType(_isDebitCard ? "DEBIT" : "CC_RETAIL"); // tender types from APD*InterfaceApplet.java
          }

          // Process the response
          if (ams_response.getUserErrorMessage().length > 0 && ams_response.getUserErrorMessage() != "Approved") {

            // Set the error message
            var error_msg = ams_response.getUserErrorMessage();
            /*
             try {
             if (ams_response.getCCGResponseMessage() != null && ams_response.getCCGResponseMessage().length > 0) {
             error_msg = error_msg + '<br>' + ams_response.getCCGResponseMessage();
             }
             if (ams_response.setCCGResultCode() > 0) {
             error_msg = error_msg + ' (' + ams_response.setCCGResultCode() + ')';
             }
             } catch (err) {}
             */
            this.APDSetErrorMessage(error_msg);

            if (_rno != 0) { // no receipt number if invoked from APDTest.html
              // Error, write to server icverifylog
              var ams_result_code = parseInt(ams_response.getTransactionResultCode());
              if (!isNaN(ams_result_code) && ams_result_code > 0 && ams_response.getLastFourDigits().length > 0) {
                this.notifyServer(true, _cardFormKey, client_request, ams_response, false, false, false, function () {
                }, function () {
                });
              }
            }

            return;
          }

          // Debit card not allowed for future payments
          if (_isWalletSave && _isDebitCard) {
            this.doNotifyCaller(ams_response, _cardFormKey, "Debit card cannot be used for future charges. Please input a valid credit card.");
            _isBusy = false;
            return;
          }

          // If card wasn't processed as the requested tender type then alert the user
          if (is_unexpected_cardtype) {
            alert("Note: The input card was actually processed as a " + (_isDebitCard ? "DEBIT" : "CREDIT") + " card.");
          }

          this.APDSetInfoMessage(ams_response.getUserErrorMessage() + " ... Processing ...");

          if (_doAVS) {
            if (ams_response.getCCGAVSAddress() == 'N' || ams_response.getCCGAVSZIP() == 'N') {
              _isAVSFailed = true;
            } else {
              _isCapturePending = true;
            }
          }

          if (_isWalletSave) {
            // Success, send Ajax request to server with data.
            // Once server has been sucessfully notified, this.doNotifyCaller will be called.
            this.notifyServer(_doAVS ? true : false, _cardFormKey, client_request, ams_response, false, false, false, this.handleServerNotifySuccess, function () {
            });
          } else if (_rno != 0) { // no receipt number if invoked from APDTest.html
            // Success, send Ajax request to server with data. If didn't just do AUTH for AVS verification then server will
            // process the payment or credit, otherwise server will process the payment when get subsequent notify after CAPTURE.
            // Once server has been sucessfully notified, this.doNotifyCaller will be called.
            this.notifyServer(_doAVS ? true : false, _cardFormKey, client_request, ams_response, false, false, false, this.handleServerNotifySuccess, this.handleServerNotifyError);
          } else {
            _isBusy = false;
          }

        } catch (err) {
          // Handle error, void the card transaction now
          this.handleServerError("Error processing card: " + err.description);
        }
      },

      /*
       *  Make applet request to CAPTURE transaction through Active Payment Device library. Used for a credit card if AVS verification enabled
       *  and verification succeeded with initial AUTH request.
       */
      doAppletCaptureRequest: function (ams_wallet_id, ams_reference_number) {

        try {
          // Call applet method to initialize request object
          var client_request = document.APDInterfaceApplet.APDStartTransaction();
          if (_terminal_number) {
            client_request.setTerminalNumber(_terminal_number);
          }
          if (_com_port) {
            client_request.setUSBPortName(_com_port);
          }
          if (_timeout) {
            client_request.setPinpadDataEntryTimeout(_timeout);
            client_request.setPinpadPINEntryTimeout(_timeout);
            client_request.setPinpadSwipeCardTimeout(_timeout);
          }
          client_request.setClientTransactionID(_clientTransactionId);
          client_request.setOrderID(_orderId);
          client_request.setOrderAmount(_orderAmount);
          client_request.setOrderDescriptor(_orderDescriptor);

          // Send the request to the ACTIVE Payment Device library now (via applet and JNI bridge) and get response
          client_request.setAccountID(ams_wallet_id);
          client_request.setReferenceID(ams_reference_number);
          var ams_response = client_request.processAPDCapture();

          if (ams_response == null || typeof(ams_response) == 'undefined') {
            this.APDSetErrorMessage("No response from ACTIVE Payment Device library for CAPTURE request");
            return;
          }

          // Process the response
          if (ams_response.getUserErrorMessage().length > 0 && ams_response.getUserErrorMessage() != "Approved") {
            this.APDSetErrorMessage(ams_response.getUserErrorMessage());
            if (_rno != 0) { // no receipt number if invoked from APDTest.html
              // Error, write to server icverifylog
              var ams_result_code = parseInt(ams_response.getTransactionResultCode());
              if (!isNaN(ams_result_code) && ams_result_code > 0 && ams_response.getLastFourDigits().length > 0) {
                this.notifyServer(true, _cardFormKey, client_request, ams_response, false, false, false, function () {
                }, function () {
                });
              }
            }

            return;
          } else {
            this.APDSetInfoMessage(ams_response.getUserErrorMessage() + " ... Processing capture ...");
          }

          if (_rno != 0) { // no receipt number if invoked from APDTest.html
            // Send Ajax request to server with data. If capture is for earlier AUTH for AVS verification then server will process the payment or credit.
            this.notifyServer(_isCapturePending ? false : true, _cardFormKey, client_request, ams_response, false, _isCapturePending, false, this.handleServerNotifySuccess, this.handleServerNotifyError);
          } else {
            _isBusy = false;
          }

        } catch (err) {
          this.APDSetErrorMessage("Error capturing payment: " + err.description);
        }

      },

      /*
       *  Make applet request to VOID transaction through Active Payment Device library. Used for a credit card if AVS verification enabled
       *  and verification failed on initial AUTH request.
       */
      doAppletVoidRequest: function (ams_wallet_id, ams_reference_number, undo_payment) {

        try {

          _isFailedReverseTransaction = false;

          var transaction_description = "voiding payment";
          if (undo_payment) {
            transaction_description = "reversing transaction";
          }

          // Call applet method to initialize request object
          var client_request = document.APDInterfaceApplet.APDStartTransaction();
          if (_terminal_number) {
            client_request.setTerminalNumber(_terminal_number);
          }
          if (_com_port) {
            client_request.setUSBPortName(_com_port);
          }
          if (_timeout) {
            client_request.setPinpadDataEntryTimeout(_timeout);
            client_request.setPinpadPINEntryTimeout(_timeout);
            client_request.setPinpadSwipeCardTimeout(_timeout);
          }
          client_request.setClientTransactionID(_clientTransactionId);
          client_request.setOrderID(_orderId);
          client_request.setOrderAmount(_orderAmount);
          client_request.setOrderDescriptor(_orderDescriptor);

          if (_isManualInput) {
            client_request.setManualEntry(_isManualInput);
          }

          // Send the request to the ACTIVE Payment Device library now (via applet and JNI bridge) and get response
          client_request.setAccountID(ams_wallet_id);
          client_request.setReferenceID(ams_reference_number);
          var ams_response = client_request.processAPDVoid(_isDebitCard);

          if (ams_response == null || typeof(ams_response) == 'undefined') {
            this.APDSetErrorMessage("No response from device library for request " + transaction_description);
            return;
          }

          // Process the response
          if (ams_response.getUserErrorMessage() && ams_response.getUserErrorMessage().length > 0 && ams_response.getUserErrorMessage() != "Approved") {
            this.APDSetErrorMessage(ams_response.getUserErrorMessage());
            if (_rno != 0) { // no receipt number if invoked from APDTest.html
              // Error, write to server icverifylog
              var ams_result_code = parseInt(ams_response.getTransactionResultCode());
              if (!isNaN(ams_result_code) && ams_result_code > 0 && ams_response.getLastFourDigits().length > 0) {
                // ANE-41214 Notify the server of the error. If was payment reverse because of previous error then
                // send "logOnly" false so the server will post the payment as credit on customer account
                if (undo_payment && !_isRefund) {
                  _isFailedReverseTransaction = true;
                  this.notifyServer(false, _cardFormKey, client_request, ams_response, false, false, false, this.handleServerNotifySuccess, function () {
                  });
                } else {
                  // Send "logOnly" true
                  this.notifyServer(true, _cardFormKey, client_request, ams_response, false, false, false, function () {
                  }, function () {
                  });
                }
              }
              if (undo_payment && _isRefund) {
                alert("Unable to reverse card transaction. Use Front Desk 'Adjust Balance' function to debit customer account to remove $" + _orderAmount + " balance on account.");
              }
            }

            return;
          } else {
            this.APDSetInfoMessage("Success " + transaction_description + (undo_payment ? ". Please try again." : ""));
          }

          if (_rno != 0) { // no receipt number if invoked from APDTest.html
            // Send Ajax request to server with data. Server will write to icverifylog and process the payment or credit.
            this.notifyServer(true, _cardFormKey, client_request, ams_response, _isAVSFailed, false, undo_payment, this.handleServerNotifySuccess, this.handleServerNotifyError);
          } else {
            _isBusy = false;
          }

        } catch (err) {
          this.APDSetErrorMessage("Error " + transaction_description + ": " + err.description);
        }

      },

      notifyServer: function (log_only, key, client_request, ams_response, is_avs_fail_void, is_auth_capture, is_reverse_transaction, fnOnSuccess, fnOnError) {
        // Send Ajax request to server with data. Server will write to icverifylog and process the payment or credit if necessary.
        try {

          _isReversingTransaction = is_reverse_transaction;

          _AMSResponse = ams_response;
          if (_originalAMSTransactionId == null) {
            _originalAMSTransactionId = ams_response.getAMSTransactionID();
          }

          var ccExpYear;
          var ccExpMonth;
          try {
            ccExpYear = ams_response.getCCExpYear();
            ccExpMonth = ams_response.getCCExpMonth();
          } catch (e) {
            ccExpYear = '';
            ccExpMonth = '';
          }
          var isError = '';
          var cardNum = '';

          if (ams_response.getUserErrorMessage() != null && ams_response.getUserErrorMessage().length > 0 && ams_response.getUserErrorMessage() != "Approved") {
            isError = true;
          }

          if (ams_response.getLastFourDigits() != null && ams_response.getLastFourDigits().length > 0) {
            cardNum = "xxx" + ams_response.getLastFourDigits();
          }

          // Make the request
          var _url = "processAPDResponse.sdi?logOnly=" + (log_only ? "true" : "")
            + "&rno=" + _rno
            + "&receiptheader_id=" + _receipt_header_id
            + "&receiptpayment_id=" + _receipt_payment_id
            + "&customer_id=" + _customerId
            + "&company_id=" + _companyId
            + "&company_agent_id=" + _companyAgentId
            + "&key=" + key
            + "&isDebitCard=" + (_isDebitCard ? "true" : "")
            + "&isRefund=" + (_isRefund ? "true" : "")
            + "&amount=" + _orderAmount
            + "&clientTrxId=" + _clientTransactionId
            + "&orderId=" + _orderId
            + "&tenderType=" + client_request.getTenderType()
            + "&transactionType=" + client_request.getTransactionType()
            + "&transactionMessage=" + ams_response.getUserErrorMessage()
            + "&isError=" + isError
            + "&isFailedReverseTransaction=" + _isFailedReverseTransaction
            + "&AMSAccountId=" + ams_response.getAccountID()
            + "&isWalletSave=" + (_isWalletSave ? "true" : "")
            + "&apdDeviceType=" + cc_apd_device_type
            + "&cardType=" + ams_response.getCardType()
            + "&cardNum=" + cardNum
            + "&ccgResultCode=" + ams_response.getCCGResultCode()
            + "&ccgAuthCode=" + ams_response.getCCGAUTHCode()
            + "&ccgAVSAddress=" + ams_response.getCCGAVSAddress()
            + "&ccAVSZip=" + ams_response.getCCGAVSZIP()
            + "&ccgCSC=" + ams_response.getCCGCSC()
            + "&resultCode=" + ams_response.getTransactionResultCode()
            + "&AMSTransactionId=" + ams_response.getAMSTransactionID()
            + "&OriginalAMSTransactionId=" + _originalAMSTransactionId
            + "&AVSFailed=" + (is_avs_fail_void ? "true" : "")
            + "&AuthCaptured=" + (is_auth_capture ? "true" : "")
            + "&CCExpYear=" + ccExpYear
            + "&CCExpMonth=" + ccExpMonth
            + "&CTR=" + ams_response.getMerchantCTR();

          //Webber Gong's Mark
          console.log('Processing Request:\n' + _url);
          alert('Processing Request:\n' + _url);
          return;

          $.ajax({
            type: "POST",
            url: _url,
            dataType: "json",
            success: fnOnSuccess,
            error: fnOnError
          });
        } catch (err) {
          this.handleServerError("Exception submitting processAPDResponse request: " + err.description + ". Please try again.");
        }
      },

      handleServerNotifySuccess: function (json, textStatus, jqXHR) {

        if (_AMSResponse == null) {
          alert("handleServerNotifySuccess, no previous response available");
          return;
        }

        // Save off the transaction description from the response because might need to make subsequent void or capture request and won't have description in server notify response.
        if (json.transaction_description != null && typeof(json.transaction_description) != 'undefined') {
          _serverTransactionDescription = json.transaction_description;
        }

        // If server returned processing error then handle it (the transaction will be voided)
        var error = json.server_error;
        if (error && error.length > 0) {
          this.handleServerError(error);
          _isBusy = false;
          return;
        }

        var extra_message = json.server_message;
        if (extra_message && extra_message.length > 0) {
          if (_isFailedReverseTransaction) {
            // All done
            this.exitRequest(extra_message);
            return;
          }
          alert(extra_message);
        }

        if (_isReversingTransaction == true) {
          // Successfully notified server of reversed transaction, nothing more to do here. Return and wait for next swipe.
          _isReversingTransaction = false;
          _isBusy = false;
          return;
        }

        if (_isWalletSave) {
          this.doNotifyCaller(_AMSResponse, json.key, error);
          _isBusy = false;
          return;
        }

        // If AVS is enabled then initial transaction was an AUTH. If AVS succeeded then capture payment otherwise void the auth.
        if (_doAVS) {
          _doAVS = false;
          if (_isAVSFailed) {
            // Cancel the payment card swipe
            this.doAppletVoidRequest(_AMSResponse.getAccountID(), _AMSResponse.getAMSTransactionID(), true);
          } else if (_isCapturePending) {
            // AVS succeeded , capture the payment now
            this.doAppletCaptureRequest(_AMSResponse.getAccountID(), _AMSResponse.getAMSTransactionID());
          } else {
            this.APDSetErrorMessage("Unknown status pending");
          }
          return;
        }

        // If AVS failed then this is response from server notification of the void, show error to user
        if (_isAVSFailed) {
          if (avs_zip) {
            this.APDSetErrorMessage("Cardholder zip code verification failed");
          } else {
            this.APDSetErrorMessage("Cardholder address verification failed");
          }
          return;
        }

        this.doNotifyCaller(_AMSResponse, json.key, error);
        _isBusy = false;

      },

      doNotifyCaller: function (ams_response, key, error) {
        // Pass data, including wallet id to caller callback
        _fnFormCallback(key,
          ams_response.getAccountID(),
          ams_response.getLastFourDigits().length > 0 ? "xxx" + ams_response.getLastFourDigits() : "",
          ams_response.getCardType(),
          _clientTransactionId,
          error,
          _orderAmount,
          _serverTransactionDescription);

        // Nofify caller that we're not waiting for input any more
        if (typeof(_fnStatusCallback) != 'undefined' && _fnStatusCallback != null) {
          _fnStatusCallback(0, "");
        }

      },

      handleServerNotifyError: function (req, text_status) {
        this.handleServerError("See server log for details.");
      },

      // Handle error making Ajax request to notify server.
      // Unless we were already reversing a payment, send APD library a request to void the payment
      // since we couldn't apply it on the server.
      handleServerError: function (error) {

        if (_AMSResponse == null) {
          return;
        }

        this.APDSetErrorMessage("Server error...");
        alert("Server error processing transaction: " + error);

        if (_isReversingTransaction == true) {
          // Error notifying server of reversed transaction, nothing more to do here. Return and wait for next swipe.
          _isReversingTransaction = false;
          _isBusy = false;
          return;
        }


        if (_isWalletSave) {
          // Error notifying server of wallet save, nothing more to do
          _isBusy = false;
          return;
        }

        this.APDSetErrorMessage("Reversing card transaction...");
        alert("Card transaction is being reversed now...");
        // Since the server got an error trying to apply the payment on the server, void the payment. User will need to retry.
        this.doAppletVoidRequest(_AMSResponse.getAccountID(), _AMSResponse.getAMSTransactionID(), true);
      },

      /*
       * If running in XNet then handle request from sdi page in another iframe, passed on from XNet
       */
      handleXNetRequest: function (args) {
        try {

          var originalRequestorId = args["RequestorID"];

          if (args["APDRequest"] == "APDInputStart") {

            this.APDInputStart(
              function (status, message) { // status 1 == error, 2 == info
                // Callback for status update. Post message back to the requestor.
                var json_data = {
                  messageType: "APDPinPadClientMessage",
                  RequestorID: getXNETHostFrameId(),
                  TargetID: originalRequestorId,
                  APDMessageType: "Status",
                  opstatus: status,
                  opmessage: message
                };
                // Must set level 2, parent is iframe "APDInterface" hosted in XNet, parent.parent is the XNet frame listening for messages
                PostMessageToXnet(json_data, 2);
              },
              function (key, accountID, maskedCC, cardType, clientTransactionId, error, orderAmount, serverTransactionDescription) {
                // Callback to process data from the device. Post message back to the requestor.
                var json_data = {
                  messageType: "APDPinPadClientMessage",
                  RequestorID: getXNETHostFrameId(),
                  TargetID: originalRequestorId,
                  APDMessageType: "Data",
                  key: key,
                  accountID: accountID,
                  maskedCC: maskedCC,
                  cardType: cardType,
                  clientTransactionId: clientTransactionId,
                  operror: error,
                  orderAmount: orderAmount,
                  serverTransactionDesc: serverTransactionDescription
                };
                // Must set level 2, parent is iframe "APDInterface" hosted in XNet, parent.parent is the XNet frame listening for messages
                PostMessageToXnet(json_data, 2);
              },
              args["callerKey"],
              args["isManualEntry"],
              args["clientTransactionId"],
              args["orderId"],
              args["orderDescriptor"],
              args["orderAmount"],
              args["isRefund"],
              args["isDebitCard"],
              args["isWalletSave"],
              args["rno"],
              args["customerId"],
              args["companyId"],
              args["companyAgentId"],
              args["cardholderAdr"],
              args["cardholderZip"],
              args["committedReceiptId"],
              args["receiptPaymentId"]);

          } else if (args["APDRequest"] == "APDInputEnd") {
            this.APDInputEnd();
          }
        } catch (err) {
          if (console) {
            console.error("APDInterfaceApplet.handleXNetRequest; error: " + err.description);
          }
        }
      }
    };
  }
}
