/**
 * Created by wgong on 6/22/2016.
 */
function APDInterfaceUI() {

  /*
   * Called by input page to request credit card swipe or cleaning up after a swipe
   */
  var callerFn = null;
  var callerKey = null;
  var isDialogHidden = false;
  var _rno = null;
  var _committed_receipt_id = null;
  var _receiptpayment_id = null;
  var _customerId = null;
  var _companyId = null;
  var _companyAgentId = null;
  var _cardholder_addr = null;
  var _cardholder_zip = null;
  var _clientTransactionId = null;
  var _orderId = null;
  var _orderDescriptor = null;
  var _orderAmount = null;
  var _isDebitCard = false;
  var _isRefund = false;
  var _isManualEntry = false;
  var _isWalletSave = false;

  $(document).ready(function () {
    if (!isXNETHost()) {
      window.apdInterfaceApplet_PinPad_Paymentech = new findFrame("APDInterface").window.APDInterfaceApplet(
        cc_scan_with_emv_device = '',
        cc_scan_with_paymenttech_device = 'Checked',
        cc_scan_with_moneris_device = '',
        cc_apd_device_type = 1,
        avs_full_addr = 'Checked',
        avs_zip = '',
        applet_name = 'APDInterfaceApplet',
        ams_url = 'mstest.active.com',
        ams_port = '443',
        ams_timeout = '90',
        card_acceptor_name = 'YMCA OF METROPOLITAN LOS ANGELES',
        terminal_location_address = '937 Enterprise Dr',
        terminal_location_city = 'Sacramento',
        terminal_location_state = 'CA',
        terminal_location_zip = '95825',
        merchant_descriptor = 'ActiveNetTrainer',
        merchant_user = 'AMS34VbVMSCRealDivId',
        merchant_password = 'AMS34VbVMSCRealDivId',
        terminal_number = '007',
        device_id = '',
        usb_port_name = window.top.pin_pad_port,
        pinpad_data_entry_timeout = '20',
        pinpad_pin_entry_timeout = '20',
        pinpad_swipe_card_timeout = '20',
        write_to_log = 'Yes',
        error_msg = ''
      );
      window.apdInterfaceApplet_PinPad_Moneris = new findFrame("APDInterface").window.APDInterfaceApplet(
        cc_scan_with_emv_device = '',
        cc_scan_with_paymenttech_device = '',
        cc_scan_with_moneris_device = 'Checked',
        cc_apd_device_type = 2,
        avs_full_addr = 'Checked',
        avs_zip = '',
        applet_name = 'APDMonerisInterfaceApplet',
        ams_url = 'mstest.active.com',
        ams_port = '443',
        ams_timeout = '90',
        card_acceptor_name = 'YMCA OF METROPOLITAN LOS ANGELES',
        terminal_location_address = '937 Enterprise Dr',
        terminal_location_city = 'Sacramento',
        terminal_location_state = 'CA',
        terminal_location_zip = '95825',
        merchant_descriptor = 'ActiveNetTrainer',
        merchant_user = 'AMS34VbVMSCRealDivId',
        merchant_password = 'AMS34VbVMSCRealDivId',
        terminal_number = '007',
        device_id = '',
        usb_port_name = window.top.pin_pad_port,
        pinpad_data_entry_timeout = '60',
        pinpad_pin_entry_timeout = '0',
        pinpad_swipe_card_timeout = '60',
        write_to_log = 'No',
        error_msg = ''
      );
      window.apdInterfaceApplet_PinPad_Paymentech_EMV = new findFrame("APDInterface").window.APDInterfaceApplet(
        cc_scan_with_emv_device = 'Checked',
        cc_scan_with_paymenttech_device = '',
        cc_scan_with_moneris_device = '',
        cc_apd_device_type = 3,
        avs_full_addr = 'Checked',
        avs_zip = '',
        applet_name = 'APDEMVInterfaceApplet',
        ams_url = 'mstest.active.com',
        ams_port = '443',
        ams_timeout = '90',
        card_acceptor_name = 'YMCA OF METROPOLITAN LOS ANGELES',
        terminal_location_address = '937 Enterprise Dr',
        terminal_location_city = 'Sacramento',
        terminal_location_state = 'CA',
        terminal_location_zip = '95825',
        merchant_descriptor = 'ActiveNetTrainer',
        merchant_user = 'AMS34VbVMSCRealDivId',
        merchant_password = 'AMS34VbVMSCRealDivId',
        terminal_number = '035',
        device_id = '',
        usb_port_name = window.top.pin_pad_port,
        pinpad_data_entry_timeout = '60',
        pinpad_pin_entry_timeout = '60',
        pinpad_swipe_card_timeout = '60',
        write_to_log = 'No',
        error_msg = ''
      );
      window.apdInterfaceApplet_PinPad_Elavon_EMV = new findFrame("APDInterface").window.APDInterfaceApplet(
        cc_scan_with_emv_device = 'Checked',
        cc_scan_with_paymenttech_device = '',
        cc_scan_with_moneris_device = '',
        cc_apd_device_type = 4,
        avs_full_addr = 'Checked',
        avs_zip = '',
        applet_name = 'APDEMVElavonInterfaceApplet',
        ams_url = 'mstest.active.com',
        ams_port = '443',
        ams_timeout = '90',
        card_acceptor_name = 'YMCA OF METROPOLITAN LOS ANGELES',
        terminal_location_address = '937 Enterprise Dr',
        terminal_location_city = 'Sacramento',
        terminal_location_state = 'CA',
        terminal_location_zip = '95825',
        merchant_descriptor = 'ActiveNetTrainer',
        merchant_user = 'AMS34VbVMSCRealDivId',
        merchant_password = 'AMS34VbVMSCRealDivId',
        terminal_number = '007',
        device_id = '87807',
        usb_port_name = window.top.pin_pad_port,
        pinpad_data_entry_timeout = '60',
        pinpad_pin_entry_timeout = '60',
        pinpad_swipe_card_timeout = '60',
        write_to_log = 'No',
        error_msg = ''
      );

      switch (window.top.pin_pad_type) {
        case 1:
          window.apdInterfaceApplet = window.apdInterfaceApplet_PinPad_Paymentech;
          break;
        case 2:
          window.apdInterfaceApplet = window.apdInterfaceApplet_PinPad_Moneris;
          break;
        case 3:
          window.apdInterfaceApplet = window.apdInterfaceApplet_PinPad_Paymentech_EMV;
          break;
        case 4:
          window.apdInterfaceApplet = window.apdInterfaceApplet_PinPad_Elavon_EMV;
          break;
        default:
          alert("Invalid pin pad type!")
          return;
      }
      window.apdInterfaceApplet.APDSetInfoMessage("Initializing applet ...");
      window.apdInterfaceApplet.APDLoadApplet();
    }
  });

  var that;

  return {
    APDInputReset: function (fn, key, clientTransactionId, orderId, orderDescriptor, orderAmount, isDebitCard, isRefund, isManualEntry, isWalletSave, rno, customer_id, company_id, company_agent_id, cardholder_addr, cardholder_zip, committed_receipt_id, receiptpayment_id, balance_field_name) {
      var that = this;
      if (key == null || typeof(key) == 'undefined') {

        // Tell the device we're done
        if (isXNETHost()) {
          // We're running in XNet, use PostMessage to send request to iframe containing the applet
          var json_data = {
            messageType: "APDPinPadDeviceRequest",
            RequestorID: getXNETHostFrameId(),
            APDRequest: "APDInputEnd"
          };
          PostMessageToXnetFrame(json_data);
        } else {
          window.apdInterfaceApplet.APDInputEnd(); // cleanup
        }

        _rno = null;
        _committed_receipt_id = null;
        _receiptpayment_id = null;
        _customerId = null;
        _companyId = null;
        _companyAgentId = null;
        _cardholder_addr = null;
        _cardholder_zip = null;
        _clientTransactionId = null;
        _orderId = null;
        _orderDescriptor = null;
        _orderAmount = null;
        _isDebitCard = false;
        _isRefund = false;
        _isManualEntry = false;
        this.APDSetInfoMessage('');
      } else {
        callerFn = fn;
        callerKey = key;
        isDialogHidden = false;
        if (rno != null && typeof(rno) != 'undefined') {
          _rno = rno;
          _committed_receipt_id = committed_receipt_id;
          _receiptpayment_id = receiptpayment_id;
          _customerId = customer_id;
          _companyId = company_id;
          _companyAgentId = company_agent_id;
          if (cardholder_addr != null && typeof(cardholder_addr) != 'undefined') {
            _cardholder_addr = cardholder_addr;
          }
          if (cardholder_zip != null && typeof(cardholder_zip) != 'undefined') {
            _cardholder_zip = cardholder_zip;
          }
        }
        _clientTransactionId = clientTransactionId;
        _orderId = orderId;
        _orderDescriptor = orderDescriptor;
        _orderAmount = orderAmount;
        _isDebitCard = isDebitCard;
        _isRefund = isRefund;
        _isManualEntry = isManualEntry;
        _isWalletSave = isWalletSave;
        this.enableModeButtons(false);
        if (_isManualEntry) {
          this.APDSetInfoMessage("Waiting for credit card number to be keyed in ...");
        } else {
          this.APDSetInfoMessage("Waiting for " + (_isDebitCard ? "debit" : "credit") + " card ...");
        }
        // Wait a second to give the dialog time to be positioned and status message displayed before call to library
        setTimeout(function () {
          that.doStartDeviceInput();
        }, 500); // 1/2 second
      }
    },

    APDStatusCallback: function (status_code, msg) {
      if (isDialogHidden) {
        return;
      }
      if (status_code == 0) {
        // user cancelled or timeout waiting for swipe
        that.enableModeButtons(true);
      } else if (status_code == 1) {
        that.enableModeButtons(true);
        that.APDSetErrorMessage(msg); // error
      } else if (status_code == 2) {
        that.APDSetInfoMessage(msg); // info
      }
    },

    APDSetErrorMessage: function (msg) {
      $("#APD_dialog_status").attr('class',
        'apderror_status');
      $("#APD_dialog_status").html(msg);
    },

    APDSetInfoMessage: function (msg) {
      $("#APD_dialog_status").attr('class', 'apdinfo_status');
      $("#APD_dialog_status").html(msg);
    },

    doStartDeviceInput: function () {
      // Pass the request to the page to send on to applet
      if (isXNETHost()) {
        // We're running in XNet, use PostMessage to send request to iframe containing the applet
        var json_data = {
          messageType: "APDPinPadDeviceRequest",
          RequestorID: getXNETHostFrameId(),
          APDRequest: "APDInputStart",
          callerKey: callerKey,
          isManualEntry: _isManualEntry,
          clientTransactionId: _clientTransactionId,
          orderId: _orderId,
          orderDescriptor: _orderDescriptor,
          orderAmount: _orderAmount,
          isRefund: _isRefund,
          isDebitCard: _isDebitCard,
          isWalletSave: _isWalletSave,
          rno: _rno,
          customerId: _customerId,
          companyId: _companyId,
          companyAgentId: _companyAgentId,
          cardholderAdr: _cardholder_addr,
          cardholderZip: _cardholder_zip,
          committedReceiptId: _committed_receipt_id,
          receiptPaymentId: _receiptpayment_id
        };
        PostMessageToXnetFrame(json_data);
      } else {
        that = this;
        window.apdInterfaceApplet.APDInputStart(this.APDStatusCallback, callerFn, callerKey, _isManualEntry, _clientTransactionId, _orderId, _orderDescriptor, _orderAmount, _isRefund, _isDebitCard, _isWalletSave, _rno, _customerId, _companyId, _companyAgentId, _cardholder_addr, _cardholder_zip, _committed_receipt_id, _receiptpayment_id);
      }
    },

    enableModeButtons: function (enable) {
      if (enable) {
        $(".apdbutton").attr("disabled", false);
        $(".apdbutton").css("visibility", "visible");
        $(".apd_input_dialog").find(".ui-dialog-titlebar-close").show();//ANE-16324 hidden dialog close button when watting time
      } else {
        $(".apdbutton").css("visibility", "hidden"); // don't use hide(), want to keep in the layout
        $(".apdbutton").attr("disabled", true);
        $(".apd_input_dialog").find(".ui-dialog-titlebar-close").hide()//ANE-16324 hidden dialog close button when watting time
      }
    },

    closeDialog: function () {
      $("#APDdialog").dialog('close');
    },

    doRequestInput: function (manual_input) {
      var that = this;
      _manual_input = manual_input;
      this.enableModeButtons(false);
      if (_isManualEntry) {
        this.APDSetInfoMessage("Waiting for credit card number to be keyed in ...");
      } else {
        this.APDSetInfoMessage("Waiting for " + (_isDebitCard ? "debit" : "credit") + " card ...");
      }
      setTimeout(function () {
        that.doStartDeviceInput();
      }, 500); // delay 1/2 second to workaround problem in Chrome where buttons and info message don't get updated before browser hung waiting for library input
    },

    /*
     * If running in XNet then handle request from the static applet iframe containing APDInterfaceApplet, passed on from XNet
     */
    handleXNetMessage: function (args) {
      try {
        if (args["APDMessageType"] == "Data") {
          // Payment data back from APD Pinpad device input
          callerFn(args["key"],
            args["accountID"],
            args["maskedCC"],
            args["cardType"],
            args["clientTransactionId"],
            args["operror"],
            args["orderAmount"],
            args["serverTransactionDesc"]);
        } else if (args["APDMessageType"] == "Status") {
          // Status message from APD PinPad page
          this.APDStatusCallback(args["opstatus"], args["opmessage"]);
        }
      } catch (err) {
        if (console) {
          console.error("APDInterfaceApplet.handleXNetRequest; error: " + err.description);
        }
      }
    }
  };
}
