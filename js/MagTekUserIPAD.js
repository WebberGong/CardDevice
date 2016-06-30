/**
 * Created by wgong on 6/24/2016.
 */

function MagTekUserIPAD() {
  var applet_frame = null;

  /*
   * Called by input page to request credit card swipe or cleaning up after a swipe
   */
  var callerFn = null;
  var callerKey = null;
  var _manual_input = false;

  var that;

  //window.onload = function () {
  //  window.magTekUserIPAD = new MagTekUserIPAD();
  //  window.magTekUserIPAD.magTekSetInfoMessage("Connecting to library  ...");
  //  window.magTekUserIPAD.enableModeButtons(false);
  //  if (!isXNETHost()) {
  //    applet_frame = findFrame("magtekdeviceinterface");
  //  }
  //};

  return {
    magTekInputReset: function (fn, key) {
      var that = this;
      if (key == null || typeof(key) == 'undefined') {
        if (isXNETHost()) {
          // We're running in XNet, use PostMessage to send request to iframe containing the applet
          var json_data = {
            messageType: "MagtekDeviceRequest",
            RequestorID: getXNETHostFrameId(),
            MagtekRequest: "deviceInputEnd"
          };
          PostMessageToXnet(json_data, 2);
        } else {
          window.magTekApplet.deviceInputEnd(); // disconnect/cleanup
        }

      } else {
        callerFn = fn;
        callerKey = key;
        _manual_input = $("#magtek_ipad_input_manual").val() === "true";
        if (_manual_input) {
          this.magTekSetInfoMessage("Enter credit card data now...<br>Use pin pad to cancel");
        } else {
          this.magTekSetInfoMessage("Swipe credit card now...<br>Use pin pad to cancel");
        }
        this.enableModeButtons(false);
        // Wait a second to give the dialog time to be positioned and status message displayed before call to library
        setTimeout(function() {
          that.doDelayedDeviceInputStart();
        }, 500);// 1/2 second
      }
    },

    doRequestInput: function (manual_input) {
      var that = this;
      _manual_input = manual_input;
      if (_manual_input) {
        this.magTekSetInfoMessage("Enter credit card data now...<br>Use pin pad to cancel");
      } else {
        this.magTekSetInfoMessage("Swipe credit card now...<br>Use pin pad to cancel");
      }
      this.enableModeButtons(false);
      // Wait a second to give the dialog time to be positioned and status message displayed before call to library
      setTimeout(function() {
        that.doDelayedDeviceInputStart();
      }, 500);// 1/2 second
    },

    doDelayedDeviceInputStart: function () {
      if (isXNETHost()) {
        // We're running in XNet, use PostMessage to send request to iframe containing the applet
        var json_data = {
          messageType: "MagtekDeviceRequest",
          RequestorID: getXNETHostFrameId(),
          MagtekRequest: "deviceInputStart",
          callerKey: callerKey,
          isManualInput: _manual_input
        };
        PostMessageToXnet(json_data, 2);
      } else {
        that = this;
        window.magTekApplet.deviceInputStart(this.magTekStatusCallback, callerFn, callerKey, _manual_input);
      }
    },

    /*
     * If running in XNet then handle request from the static applet iframe containing MagTekAppletIPAD or MagTekCabIPAD, passed on from XNet
     */
    handleXNetMessage: function (args) {
      try {
        if (args["MagtekMessageType"] == "Data") {
          // Payment data back from APD Pinpad device input
          callerFn(args["key"],
            args["accountID"],
            args["maskedCC"],
            args["cardExpiry"],
            args["cardType"],
            args["accountHolder"],
            args["accountZip"]);
        } else if (args["MagtekMessageType"] == "Status") {
          // Status message from APD PinPad page
          this.magTekStatusCallback(args["opstatus"], args["opmessage"]);
        }
      } catch (err) {
        if (console) {
          console.error("MagTekUserIPAD.handleXNetRequest; error: " + err.description);
        }
      }
    },

    magTekStatusCallback: function (status_code, msg) {
      if (status_code == 0) {
        // user cancelled or timeout waiting for swipe
        that.enableModeButtons(true);
      } else if (status_code == 1) {
        that.magTekSetErrorMessage(msg); // error
      } else if (status_code == 2) {
        that.magTekSetInfoMessage(msg); // info
      }
    },

    magTekSetErrorMessage: function (msg) {
      $("#magtek_dialog_status").attr('class', 'mterror_status');
      $("#magtek_dialog_status").html(msg);
    },

    magTekSetInfoMessage: function (msg) {
      $("#magtek_dialog_status").attr('class', 'mtinfo_status');
      $("#magtek_dialog_status").html(msg);
    },

    enableModeButtons: function (enable) {
      if (enable) {
        $(".mtbutton").attr("disabled", false);
        $("#magtek_button_help").show();
        this.magTekSetInfoMessage("");
        //$("#magtek_dlg_cancel_btn").attr("disabled", false);
      } else {
        $(".mtbutton").attr("disabled", true);
        $("#magtek_button_help").hide();
        //$("#magtek_dlg_cancel_btn").attr("disabled", true);
      }
    }
  };
}
