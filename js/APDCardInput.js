function APDCardInput(
  ams_order_id,
  ams_order_descriptor,
  receipt_number,
  committed_receipt_id,
  key,
  is_manual_entry,
  amount,
  is_debit_card,
  is_refund,
  payer_customer_id,
  payer_company_id,
  payer_company_agent_id,
  payer_addr,
  payer_zip,
  receipt_payment_id) {

  var request_key = null;

  return {

    // Use Active Payment Device library to get card
    APDInputDialog: function (target) {
      var that = this;
      // Validate the amount
      if (amount == null || typeof(amount) == 'undefined' || amount == '' || parseFloat(amount) == 0) {
        alert("Please specify amount before attempting to input card");
        return;
      }

      if (!isXNETHost()) {
        // ANE-14240 If applet iframe not found then insert it now. If we're executing in a popup window then this is necessary.
        // For main window the applet iframe is in the tab frame.
        var applet_frame = findFrame("APDInterface");
        if (!applet_frame || applet_frame == null) {
          // We must be in a popup window, inject the applet into an iframe
          var el = $("<iframe id='APDInterface' name='APDInterface' style='width:0;height:0;' scrolling='no' frameborder='0' src='html/APDInterfaceApplet.html'></iframe>");
          $("body").append(el);
          // Set delay to give iframe contents time to load, then try this call again
          setTimeout(function () {
            that.APDInputDialog(target);
          }, 500);
          return;
        }
      }

      var container = $("#APDdialog");
      if (container.length <= 0) {
        // First time, create the container element and load the dialog
        container = $("<div id='APDdialog'></div>");
        $("body").append(container);
        container.load("html/APDInterfaceUI.html", function () {
          window.apdInterfaceUI = new APDInterfaceUI();
          window.apdInterfaceUI.APDSetInfoMessage("Initializing ...");
          window.apdInterfaceUI.enableModeButtons(false);
          container.dialog({
            dialogClass: 'apd_input_dialog',
            autoOpen: false,
            modal: true,
            closeOnEscape: false,
            title: 'Card Input',
            position: {
              my: 'bottom',
              at: 'top',
              of: target,
              collision: "fit"
            }, // ANE-5768 workaround, default dialog position so it won't be positioned at center (causing scroll) before we can position in dialogopen handler
            beforeClose: function (event, ui) {
              window.apdInterfaceUI.APDInputReset();
              return true;
            }
          });
          that.doOpenAPDDialog(container, target);
        });
      } else {
        that.doOpenAPDDialog(container, target);
      }
    },

    doOpenAPDDialog: function (container, target) {
      var that = this;
      container.unbind("dialogopen"); // unbind previous handler
      container.bind("dialogopen", function (event, ui) {
        request_key = key;
        var clientTransactionId = randomUUID(); // every single request gets unique client transaction ID
        window.apdInterfaceUI.APDInputReset(that.newCardFromAPD, request_key, clientTransactionId, ams_order_id, ams_order_descriptor, amount, is_debit_card, is_refund, is_manual_entry, false, receipt_number, payer_customer_id, payer_company_id, payer_company_agent_id, payer_addr, payer_zip, committed_receipt_id, receipt_payment_id);
        container.dialog("widget").position({
          my: 'bottom',
          at: 'top',
          of: $(target),
          collision: "fit"
        });
        container.dialog('option', 'title', (is_debit_card ? 'Debit Card' : 'Credit Card') + ' Input $' + formatCurrency(amount));
      });
      container.dialog('open');
    },

    newCardFromAPD: function (key, wallet_id, cc_masked, cc_card_type, apd_transaction_key, user_error, amount, transaction_description) {
      if (key !== request_key) {
        return false;
      }

      // Close the popup
      if ($("#APDdialog").dialog("isOpen") === true) {
        $("#APDdialog").dialog('close');
      }

      // Check if user cancelled from the device itself
      if (wallet_id == null) {
        return true;
      }

      if (user_error != null && user_error.length > 0) {
        alert(user_error);
        return false;
      }

      parentResizeInner();
      resetFormDirty(document.apd_form);

      return true;
    }
  };
}
