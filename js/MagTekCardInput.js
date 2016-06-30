//mag_tek_type in ['MagtekIPAD', 'MagtekDynamag'];
function MagTekCardInput(mag_tek_type, is_ie, use_old_method) {

  var appletFileName = '';
  var inputFileName = '';

  return {
    magTekInputDialog: function (target) {
      var that = this;

      var initAppletExpression = [];
      var initInputExpression = [];
      if (mag_tek_type === 'MagtekIPAD') {
        if (is_ie) {
          appletFileName = 'MagTekCabIPAD';
          initAppletExpression.push('window.magTekApplet.doInit();');
        } else {
          appletFileName = 'MagTekAppletIPAD';
          initAppletExpression.push('window.magTekApplet.magTekSetInfoMessage("Initializing applet ...");');
          initAppletExpression.push("setTimeout(function () { window.magTekApplet.magTekLoadApplet(); }, 1500);");
        }
        if (use_old_method) {
          inputFileName = 'MagTekInputIPAD';
          initInputExpression.push('window.magTekInput.magTekSetInfoMessage("Initializing applet ...");');
          initInputExpression.push("setTimeout(function () { window.magTekInput.magTekLoadApplet(); }, 1500);");
        } else {
          inputFileName = 'MagTekUserIPAD';
          initInputExpression.push('window.magTekInput.magTekSetInfoMessage("Connecting to library  ...");');
          initInputExpression.push('window.magTekInput.enableModeButtons(false);');
          initInputExpression.push('if (!isXNETHost()) { window.magTekInput.applet_frame = findFrame("magtekdeviceinterface"); }');
        }
      } else if (mag_tek_type === 'MagtekDynamag') {
        if (is_ie) {
          appletFileName = 'MagTekCabMSR';
          initAppletExpression.push('window.magTekApplet.GetDeviceState();');
        } else {
          appletFileName = 'MagTekAppletMSR';
          initAppletExpression.push('window.magTekApplet.magTekSetInfoMessage("Initializing applet ...");');
          initAppletExpression.push("setTimeout(function () { window.magTekApplet.magTekLoadApplet(); }, 1500);");
        }
        if (use_old_method) {
          inputFileName = 'MagTekInputMSR';
          initInputExpression.push('window.magTekInput.magTekSetInfoMessage("Initializing applet ...");');
          initInputExpression.push("setTimeout(function () { window.magTekInput.magTekLoadApplet(); }, 1500);");
        } else {
          inputFileName = 'MagTekUserMSR';
          initInputExpression.push('window.magTekInput.magTekSetInfoMessage("Connecting to library ...");');
          initInputExpression.push('if (!isXNETHost()) { window.magTekInput.applet_frame = findFrame("magtekdeviceinterface"); }');
        }
      }

      if (!isXNETHost()) {
        // If applet iframe not found then insert it now. If we're executing in a popup window then this is necessary.
        // For main window the applet iframe is in the tab frame.
        //TODO : REMOVE THIS WHEN BACKUP PAYMENT FORM IS NO LONGER IN POPUP
        var applet_frame = findFrame("magtekdeviceinterface");
        if (!applet_frame || applet_frame == null) {
          if (console) {
            console.log("magTekInputDialog; injecting magtekdeviceinterface iframe to load applet in window " + this.name);
          }
          // We must be in a popup window, inject the applet into an iframe
          if (!appletFileName) {
            alert('Parameters invalid!');
            return;
          }
          var el = $("<iframe id='magtekdeviceinterface' name='magtekdeviceinterface' style='visibility:hidden;width:0;height:0;' scrolling='no' frameborder='0' src='html/" + appletFileName + ".html'></iframe>");
          $("body").append(el);
          // Set delay to give iframe contents time to load, then try this call again
          setTimeout(function () {
            that.magTekInputDialog(target);
          }, 1000);
          return;
        }
      }

      var container = $("#magtekdialog");
      if (container.length <= 0) {
        // First time, create the container element and load the dialog
        container = $("<div id='magtekdialog'></div>");
        $("body").append(container);
        if (!inputFileName) {
          alert('Parameters invalid!');
          return;
        }
        container.load("html/" + inputFileName + ".html", function () {
          window.magTekApplet = eval('new findFrame("magtekdeviceinterface").' + appletFileName + '();');
          for (var i in initAppletExpression) {
            eval(initAppletExpression[i]);
          }
          window.magTekInput = eval('new ' + inputFileName + '();');
          for (var i in initInputExpression) {
            eval(initInputExpression[i]);
          }
          container.dialog({
            dialogClass: 'magtek_cc_input_dialog',
            autoOpen: false,
            modal: true,
            closeOnEscape: true,
            title: 'Credit Card Input',
            position: {
              my: 'bottom',
              at: 'top',
              of: $(target),
              collision: "fit"
            }, // ANE-5768 workaround, default dialog position so it won't be positioned at center (causing scroll) before we can position in dialogopen handler
            beforeClose: function (event, ui) {
              window.magTekInput.magTekInputReset();
              return true;
            }
          });
          that.doOpenMagTekDialog(container, target);
        });
      } else {
        that.doOpenMagTekDialog(container, target);
      }
    },

    doOpenMagTekDialog: function (container, target) {
      var that = this;
      container.unbind("dialogopen"); // unbind previous handler
      container.bind("dialogopen", function (event, ui) {
        window.magTekInput.magTekInputReset(that.newCardFromMagTek, "cc");
        container.dialog("widget").position({
          my: 'bottom',
          at: 'top',
          of: $(target),
          collision: "fit"
        });
      });
      container.dialog('open');
    },

    // Callback function to handle CC data from the magtek device
    newCardFromMagTek: function (key, wallet_id, cc_masked, cc_exp, cc_card_type, cc_account_name, cc_account_zip) {
      if ($("#magtekdialog").dialog("isOpen") === true) {
        $("#magtekdialog").dialog('close');
      }
      return true;
    }
  };
}
