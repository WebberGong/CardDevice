/**
 * Created by wgong on 6/24/2016.
 */

function MagTekUserMSR() {
  var applet_frame = null;

  /*
   * Called by input page to request credit card swipe or cleaning up after a swipe
   */
  var callerFn = null;
  var callerKey = null;

  var that;

  //window.onload = function () {
  //  window.magTekUserMSR = new MagTekUserMSR();
  //  window.magTekUserMSR.magTekSetInfoMessage("Connecting to library ...");
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
        // Wait a second to give the dialog time to be positioned and status message displayed before call to library
        setTimeout(function() {
          that.doDelayedDeviceInputStart();
        }, 500); // 1/2 second
      }
    },

    magTekStatusCallback: function (status_code, msg) {
      if (status_code == 0) {
        // user cancelled or timeout waiting for swipe
      } else if (status_code == 1) {
        that.magTekSetErrorMessage(msg); // error
      } else if (status_code == 2) {
        that.magTekSetInfoMessage(msg); // info
      }
    },

    doDelayedDeviceInputStart: function () {
      if (isXNETHost()) {
        // We're running in XNet, use PostMessage to send request to iframe containing the applet
        var json_data = {
          messageType: "MagtekDeviceRequest",
          RequestorID: getXNETHostFrameId(),
          MagtekRequest: "deviceInputStart",
          callerKey: callerKey
        };
        PostMessageToXnet(json_data, 2);
      } else {
        that = this;
        window.magTekApplet.deviceInputStart(this.magTekStatusCallback, callerFn, callerKey);
      }
    },

    /*
     * If running in XNet then handle request from the static applet iframe containing MagTekAppletMSR or MagTekCabMSR, passed on from XNet
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
          console.error("MagTekUserIMSF.handleXNetRequest; error: " + err.description);
        }
      }
    },

    magTekSetErrorMessage: function (msg) {
      $("#magtek_dialog_status").attr('class', 'mterror_status');
      $("#magtek_dialog_status").text(msg);
    },

    magTekSetInfoMessage: function (msg) {
      $("#magtek_dialog_status").attr('class', 'mtinfo_status');
      $("#magtek_dialog_status").text(msg);
    }
  };
}
