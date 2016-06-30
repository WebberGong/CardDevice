/**
 * @author ezheng
 * For signature PAD TOPAZ Model: T-LBK57GC-BHSB-R (LBK57)
 */
function SignPad () {
	// Useful listener the signature, witch mean sync the signature between device and AUI canvas 
	var signatureListener;
	
	// Useful listener pen events on the device
	var eventListener;
	
	// When the stuff click the clear button, we need restart the eventListener;
	var eventListenerNeedRestart = false;
	
	// Useful listener the device status, we need end of the signatureListener and eventListener when the device disconnected
	var guardThread;
	
	// Useful send back string of signature to stuff desktop
	var signatureStringCallback;
	
	// Useful agree signature callback, when user clicked "Agree and Sign" button, we should enabled the "Clear" and "OK" buttons on the stuff side, and show the canvas for the signature by real time on the stuff side.
	var signatureAgreeCallback;
	
	// Useful cancel signature callback, when user clicked "x" button, we should disable the "Clear" and "OK" buttons on the stuff side.
	var signatureCancelCallback;
	
	// Useful signature PAD disconnected callback, when user in the signature cycle, the device disconnected, will call this function.
	var signatureDisconnectCallback;
	
	// Configuration information for layout
	var lp = new LayoutProperty ();
	
	// Configuration information for system property
	var cp = new ConfigurationProperty ();
	
	// Create the instance for EventControler
	var eventControler = new EventControler();
	
	// Useful store the waiver title
	var waiverTitle;
	
	// Useful store the waiver content
	var waiverContent;
	
	// Create the instance for Pager
	var pager = new Pager ();
	
	// Init the current page number as -1
	var currentPageNumber = 1;
	
	var resourceURL = "";
	
	this.setSignatureAgreeCallback = function (signatureAgreeFun) {
		signatureAgreeCallback = signatureAgreeFun;
	}
	
	this.setSignatureCancelCallback = function (signatureCancelFun) {
		signatureCancelCallback = signatureCancelFun;
	}
	
	this.setSignatureStringCallback = function (signatureStringFun) {
		signatureStringCallback = signatureStringFun;
	}
	
	this.setSignatureDisconnectCallback = function (signatureDisconnectFun) {
		signatureDisconnectCallback = signatureDisconnectFun;
	}
	
	// Connect to SignPad
	this.connect = function () {
		initSignaturePad();
	}

	// Disconnect SignPad, it will clear all screen and show a blank screen
	// Use for exit signature pad, stop sign
	this.discontect = function () {
		exitSigPad ();
	}

	// Return SignPad status of connection
	this.getStatus = function () {
		var status = GetTabletState();
		if (status == 1) {
			return true;
		}
		return false;
	}
	
	this.getSigWebStatus = function () {
		return SigWebStatus();
	}
	
	// Useful end the eventListener and signatureListener threads.
	this.endProcess = function () {
		clearInterval(eventListener);
		clearInterval(signatureListener);
	}
	
	this.setResourceURL = function (url, akamaiEnabled) {
		resourceURL = url;
		lp.setImagesBaseURL(akamaiEnabled);
	}

	// Starting signPad, push a long text to SignPad and show on waiver panel
	this.showWaiver = function (waiverDescription, richText) {
//		console.log("INFO:", "ShowWaiver start......");
//		console.log("INFO:", "Title=" + waiverDescription);
//		console.log("INFO:", "Content=" + richText);
		waiverTitle = waiverDescription;
		waiverContent = richText;
		initWaiverView();
	}
	
	// Refresh the signing area
	var clearSign = function () {
		ClearTablet();
		LcdRefresh(2, 32, 149 , 576,  182); //Refresh the signing area on the LCD
		ClearSigWindow(1);
	}
	
	// Go back to sign init status when user input incorrect, stuff handle this action
	this.resign = function () {
		var ctx = document.getElementById('cnv').getContext('2d');
		SigWebSetDisplayTarget(ctx);
		showSignatureView();
	}
	
	var initSignaturePad = function () {
		//For compression mode
		SetSigCompressionMode(1);

        SetJustifyMode(0);
		KeyPadClearHotSpotList();
		ClearSigWindow(1);
		SetDisplayXSize(640);
		SetDisplayYSize(480);
		SetImageXSize(640);
		SetImageYSize(480);
		SetTabletState(1);
		SetLCDCaptureMode(2);
		LCDSetPixelDepth(8);
	}
	
	var initWaiverView = function () {
//		console.log("INFO:", "InitWaiverView start......");
		var ctx = document.getElementById('cnv').getContext('2d');
		SigWebSetDisplayTarget(ctx);
		showWaiverView ();
		initGuardThread();
	}
	
	// Create a guard thread for listener event timer and signature timer
	var initGuardThread = function () {
		guardThread = setInterval(statusChecker, 3000);
	}
	
	// Checker for device connection status
	var statusChecker = function () {
		if (GetTabletState() != 1) {
			clearInterval(eventListener);
			clearInterval(signatureListener);
			clearInterval(guardThread);
			if (signatureDisconnectCallback) {
				signatureDisconnectCallback();
			}
		}
	}
	
	var showWaiverView = function () {
//		console.log("INFO:", "ShowWaiverView start......");
//		if (!eventListener) {
//			eventListener = setInterval(SigWebEvent, 100);
//		}
		clearInterval(signatureListener);
		LcdRefresh(0, 0, 0, 640, 480);
		KeyPadClearHotSpotList();
		LCDSetPixelDepth(8);

		var waiverView = new View();
		var waiverBottomBar = new BottomBar(0, 2, lp.waiverBottomBarX, lp.waiverBottomBarY, lp.imagesBaseURL + resourceURL + lp.waiverBottomBarImg);
		waiverView.addBottomBar(waiverBottomBar);

		var waiverAgreeBtn = new ImageButton(0, 2, lp.waiverAgreeBtnX, lp.waiverAgreeBtnY, lp.imagesBaseURL + resourceURL + lp.waiverAgreeBtnImg);
		waiverAgreeBtn.onClick(1, 1, lp.waiverAgreeBtnWidth, lp.waiverAgreeBtnHeight, function () {
			showSignatureView ();
			if (signatureAgreeCallback) {
				signatureAgreeCallback();
			}
		});
		waiverView.addImageButton(waiverAgreeBtn);

		var waiverPreviousBtn = new ImageButton(0, 2, lp.waiverPreviousBtnX, lp.waiverPreviousBtnY, lp.imagesBaseURL + resourceURL + lp.waiverPreviousBtnImg);
		waiverPreviousBtn.onClick(2, 1, lp.waiverPreviousBtnWidth, lp.waiverPreviousBtnHeight, function () {
			if (pager.getCurrentPageNumber() > 1) {
				waiverPanel.refresh();
				pager.previousPage();
				pager.refreshPageNumberPanel(waiverPagingCountNum);
			}
		});
		waiverView.addImageButton(waiverPreviousBtn);

		var waiverNextBtn = new ImageButton(0, 2, lp.waiverNextBtnX, lp.waiverNextBtnY, lp.imagesBaseURL + resourceURL + lp.waiverNextBtnImg);
		waiverNextBtn.onClick(3, 1, lp.waiverNextBtnWidth, lp.waiverNextBtnHeight, function () {
			if (pager.getCurrentPageNumber() < pager.getTotalNumber()) {
				waiverPanel.refresh();
				pager.nextPage();
				pager.refreshPageNumberPanel(waiverPagingCountNum);
			}
		});
		waiverView.addImageButton(waiverNextBtn);

		if (cp.useRichText == "0") {
			eventControler.initPenEvent();
			pager.init(eventControler);
		}
		var waiverPanel = new TextPanel(30, 30, lp.waiverPanelWidth, lp.waiverPanelHeight, waiverContent);
		waiverView.addTextPanel(waiverPanel);
		
		if (cp.useRichText == "1") {
			eventControler.initPenEvent();
			pager.init(eventControler);
		}
		
		var waiverPagingCountNum = new Text(0, 2, lp.waiverPagingCountNumX, lp.waiverPagingCountNumY, lp.waiverPagingCountNumWidth, lp.waiverPagingCountNumHeight, lp.waiverPagingCountNumFont, lp.waiverPagingCountNumFontSize, pager.getCurrentPageNumber() + "/" + pager.getTotalNumber());
		waiverView.addText(waiverPagingCountNum);
		
//		console.log("INFO:", "eventListener" + eventListener);
		if (!eventListener) {
			eventListener = setInterval(SigWebEvent, 100);
		}
		
		eventControler.initPenEvent();
	}

	var showSignatureView = function () {
		LcdRefresh(0, 0, 0, 640, 480);
		KeyPadClearHotSpotList();
		LCDSetPixelDepth(8);
		
		if (eventListenerNeedRestart) {
			eventListener = setInterval(SigWebEvent, 100);
			eventListenerNeedRestart = false;
		}

		var signView = new View();
		var background = new Background(0, 2, lp.signBackgroundX, lp.signBackgroundY, lp.imagesBaseURL + resourceURL + lp.signBackgroundImg);
		signView.setBackbround(background);

		var cancelBtn = new ImageButton(0, 2, lp.signCancelBtnX, lp.signCancelBtnY, lp.imagesBaseURL + resourceURL + lp.signCancelBtnImg);
		cancelBtn.onClick(4, 1, lp.signCancelBtnWidth, lp.signCancelBtnHeight, function () {
			showWaiverView();
			if (signatureCancelCallback) {
				signatureCancelCallback();
			}
		});
		signView.addImageButton(cancelBtn);

		var clearBtn = new ImageButton(0, 2, lp.signClearBtnX, lp.signClearBtnY, lp.imagesBaseURL + resourceURL + lp.signClearBtnImg);
		clearBtn.onClick(5, 1, lp.signClearBtnWidth, lp.signClearBtnHeight, function () {
			clearSign();
		});
		signView.addImageButton(clearBtn);

		var okBtn = new ImageButton(0, 2, lp.signOkBtnX, lp.signOkBtnY, lp.imagesBaseURL + resourceURL + lp.signOkBtnImg);
		okBtn.onClick(6, 1, lp.signOkBtnWidth, lp.signOkBtnHeight, function () {
			// Comment for check the signature whether signatured
			// if(NumberOfTabletPoints() > 0) {
			// }
			
			GetSigImageB64(function fulfillCallback(str) {
				var base64Str = cutOffPNG(str);
				if (signatureStringCallback) {
					signatureStringCallback(base64Str);
				}
				showEndingView();
			});
			
			// Below for simple sigString
			// var sigString = GetSigString();
			// signatureStringCallback(sigString);
			// showEndingView();
			
			clearInterval(signatureListener);
        	clearInterval(eventListener);
        	eventListenerNeedRestart = true;
		});
		signView.addImageButton(okBtn);

		eventControler.initPenEvent();

		var signPanel = new SignPanel (1, 2, lp.signSignaturePanelX, lp.signSignaturePanelY, lp.signSignaturePanelWidth, lp.signSignaturePanelHeight, lp.imagesBaseURL + resourceURL + lp.signSignaturePanelImg);
		signView.addSignPanel(signPanel);
		signatureListener = setInterval(SigWebRefresh, 50);
	}
	
	var cutOffPNG = function (base64PNG) {
//		console.log(base64PNG);

		var orgImage = new Image();
		orgImage.src = "data:image/png;base64," + base64PNG;

		var canvasTemp = document.createElement("canvas"); 
		canvasTemp.width = lp.signSignaturePanelWidth - 60; 
		canvasTemp.height = lp.signSignaturePanelHeight - 28; 
		
		// Coordinate(0,0), witch mean start from there to draw the image, equivalent offset。 
		canvasTemp.getContext("2d").drawImage(orgImage, -lp.signSignaturePanelX - 33, -lp.signSignaturePanelY - 15); 

		var base64String = canvasTemp.toDataURL("image/png");
		var loc = base64String.search("base64,");
		var retstring = base64String.slice(loc + 7, base64String.length);
//		console.log("New image:", retstring);
//		console.groupEnd();
		return retstring;
	}
	
	/** 
	 * decode base64
	 * @param {Object} str 
	 */  
	function base64decode(str){  
	    var c1, c2, c3, c4;  
	    var i, len, out;  
	    len = str.length;  
	    i = 0;  
	    out = "";  
	    while (i < len) {  
	        /* c1 */  
	        do {  
	            c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff];  
	        }  
	        while (i < len && c1 == -1);  
	        if (c1 == -1)   
	            break;  
	        /* c2 */  
	        do {  
	            c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff];  
	        }  
	        while (i < len && c2 == -1);  
	        if (c2 == -1)   
	            break;  
	        out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));  
	        /* c3 */  
	        do {  
	            c3 = str.charCodeAt(i++) & 0xff;  
	            if (c3 == 61)   
	                return out;  
	            c3 = base64DecodeChars[c3];  
	        }  
	        while (i < len && c3 == -1);  
	        if (c3 == -1)   
	            break;  
	        out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));  
	        /* c4 */  
	        do {  
	            c4 = str.charCodeAt(i++) & 0xff;  
	            if (c4 == 61)   
	                return out;  
	            c4 = base64DecodeChars[c4];  
	        }  
	        while (i < len && c4 == -1);  
	        if (c4 == -1)   
	            break;  
	        out += String.fromCharCode(((c3 & 0x03) << 6) | c4);  
	    }  
	    return out;  
	}  
	
	var showEndingView = function () {
		LcdRefresh(0, 0, 0, 640, 480);
		KeyPadClearHotSpotList();
		LCDSetPixelDepth(8);
		
		var endingView = new View();

		var background = new Background(0, 2, lp.endingBackgroundX, lp.endingBackgroundY, lp.imagesBaseURL + resourceURL + lp.endingBackgroundImg);
		endingView.setBackbround(background);
	}
	
	// Commponent BottomBar
	var BottomBar = function (dest, mode, x, y, url) {
		var dest = dest;
		var mode = mode;
		var x = x;
		var y = y;
		var url = url;

		this.getDest = function () {
			return dest;
		}

		this.getMode = function () {
			return mode;
		}

		this.getX = function () {
			return x;
		}

		this.getY = function () {
			return y;
		}

		this.getUrl = function () {
			return url;
		}
	}

	// Component ImageButton
	var ImageButton = function (dest, mode, x, y, url) {
		var dest = dest;
		var mode = mode;
		var x = x;
		var y = y;
		var url = url;
		var keyListener;
		var iKeyCode;
		var iCoordToUse;
		var iWidth;
		var iHeight;

		var unfocusedImg;

		this.show = function () {

		}

		this.hidden = function () {

		}

		this.changeBackground = function () {

		}

		this.onClick = function (keyCode, coordToUse, width, height, fun) {
			KeyPadAddHotSpot(keyCode, coordToUse, x, y, width, height);
			iKeyCode = keyCode;
			iCoordToUse = coordToUse;
			iWidth = width;
			iHeight = height;
			keyListener = fun;
			eventControler.addListener(this);
		}

		this.getKeyListener = function () {
			return keyListener;
		}

		this.setUnfocusedImg = function (img) {
			unfocusedImg = img;
		}

		this.getDest = function () {
			return dest;
		}

		this.getMode = function () {
			return mode;
		}

		this.getX = function () {
			return x;
		}

		this.getY = function () {
			return y;
		}

		this.getUrl = function () {
			return url;
		}

		this.getKeyCode = function () {
			return iKeyCode;
		}

		this.getCoordToUse = function () {
			return iCoordToUse;
		}

		this.getWidth = function () {
			return iWidth;
		}

		this.getHeight = function () {
			return iHeight;
		}
	}
	
	// Component Background
	var Background = function (dest, mode, x, y, url) {
		var dest = dest;
		var mode = mode;
		var x = x;
		var y = y;
		var url = url;

		this.getDest = function () {
			return dest;
		}

		this.getMode = function () {
			return mode;
		}

		this.getX = function () {
			return x;
		}

		this.getY = function () {
			return y;
		}

		this.getUrl = function () {
			return url;
		}
	}

	// Component TextPanel
	var TextPanel = function (marginLeft, marginTop, width, height, text) {
		var x = marginLeft;
		var y = marginTop;
		var w = width;
		var h = height;
		var content = text;

		this.getX = function () {
			return x;
		}

		this.getY = function () {
			return y;
		}

		this.getContent = function () {
			return content;
		}

		this.getWidth = function () {
			return w;
		}
		
		this.refresh = function () {
			LcdRefresh(0, 0, 0, 640, 400);
		}
		
		this.addContent = function (dest, model, x, y, width, height, gstr) {
			LcdWriteImageStream(dest, model, x, y, width, height, gstr);
		}
	}
	
	// Component Text
	var Text = function (dest, mode, x, y, width, height, f, fSize, str) {
		var dest = dest;
		var mode = mode;
		var x = x;
		var y = y;
		var w = width;
		var h = height;
		var font = f;
		var fontSize = fSize;
		var content = str;

		this.getDest = function () {
			return dest;
		}

		this.getMode = function () {
			return mode;
		}

		this.getX = function () {
			return x;
		}

		this.getY = function () {
			return y;
		}

		this.getFont = function () {
			return font;
		}

		this.getFontSize = function () {
			return fontSize;
		}

		this.getContent = function () {
			return content;
		}
		
		this.refresh = function () {
			LcdRefresh(0, x, y , w,  h);
		}
		
		this.addContent = function (str) {
			LCDWriteString(dest, mode, x, y, font, fontSize, str);
		}
	}
	
	// Component SignPanel
	var SignPanel = function (dest, mode, x, y, width, height, url) {
		var dest = dest;
		var mode = mode;
		var x = x;
		var y = y;
		var width = width;
		var height = height;
		var url = url;
		
		this.getDest = function () {
			return dest;
		}

		this.getMode = function () {
			return mode;
		}

		this.getX = function () {
			return x;
		}

		this.getY = function () {
			return y;
		}

		this.getWidth = function () {
			return width;
		}

		this.getHeight = function () {
			return height;
		}

		this.getUrl = function () {
			return url;
		}
		
		this.refresh = function () {
			
		}
	}
	
	// Component View
	var View = function () {
		this.setBackbround = function (background) {
			LCDSendGraphicUrl(background.getDest(), background.getMode(), background.getX(), background.getY(), background.getUrl());
		}

		this.addTextPanel = function (textPanel) {
			if (cp.useRichText == "0") {
				printSimpleText(textPanel);
			} else if (cp.useRichText == "1"){
				printRichText(textPanel);
			}
		}

		this.addImageButton = function (imageButton) {
			LCDSendGraphicUrl(imageButton.getDest(), imageButton.getMode(), imageButton.getX(), imageButton.getY(), imageButton.getUrl());
		}

		this.addBottomBar = function (bottomBar) {
			LCDSendGraphicUrl(bottomBar.getDest(), bottomBar.getMode(), bottomBar.getX(), bottomBar.getY(), bottomBar.getUrl());
		}

		this.addText = function (text) {
			LCDWriteString(text.getDest(), text.getMode(), text.getX(), text.getY(), text.getFont(), text.getFontSize(), text.getContent());
		}

		this.addSignPanel = function (signPanel) {
			LCDSendGraphicUrl(signPanel.getDest(), signPanel.getMode(), signPanel.getX(), signPanel.getY(), signPanel.getUrl());
			LcdRefresh(2, signPanel.getX(), signPanel.getY() , signPanel.getWidth(),  signPanel.getHeight());
			LCDSetWindow(signPanel.getX(), signPanel.getY(), signPanel.getWidth(), signPanel.getHeight());
			SetSigWindow(1, signPanel.getX(), signPanel.getY(), signPanel.getWidth(), signPanel.getHeight());
		}

		this.show = function () {

		}

		this.hidden = function () {

		}

		//~ For simple
		var printSimpleText = function (textPanel) {
			pager.firstPage(textPanel, waiverTitle, waiverContent);
		}

		//~ For rich
		var printRichText = function (textPanel) {
			pager.firstPage(textPanel, waiverTitle, waiverContent);
		}
	}
	
	// use for exit device
	var exitSigPad = function () {
		clearInterval(eventListener);
		clearInterval(signatureListener);
		clearInterval(guardThread);
		LcdRefresh(0, 0, 0, 640, 480);
		LCDSetWindow(0, 0, 640, 480);
        SetSigWindow(1, 0, 0, 640, 480);
		KeyPadClearHotSpotList();
		SetLCDCaptureMode(1);
//		SetTabletState(0);
	}

	window.onload = function () {
	};

	window.onunload = function (){
		exitSigPad();
	};
}

// Event controler
var EventControler = function () {
	var componentArray = new Array ();
	var index;
	this.initPenEvent = function () {
//		console.log("INFO:", "InitPenEvent start......");
		LCDSetWindow(0, 0, 1, 1);
        SetSigWindow(1, 0, 0, 1, 1);
        SetLCDCaptureMode(2);
        ClearTablet();
		onSigPenDown = function () {
			for(var i = 0; i < componentArray.length; i ++) {
				if (KeyPadQueryHotSpot(componentArray[i].getKeyCode()) > 0) {
					ClearSigWindow(1);
					index = componentArray[i].getKeyCode();
				}
			}
		   ClearSigWindow(1);
		};
		onSigPenUp = function () {
			for(var i = 0; i < componentArray.length; i ++) {
				if (index == componentArray[i].getKeyCode()) {
					if (index != 2 && index != 3 && index != 5 && index!= 6) {  //~ TODO: Ernest, we need to find out another way to remove the hard code.
						LcdRefresh(0, 0, 0, 640, 480);
					}
					componentArray[i].getKeyListener()();
				}
			}
		   	index = -1;
		   	ClearSigWindow(1);
		};
        SetLCDCaptureMode(2);
	}

	this.addListener = function (component) {
		var counter = 0;
		// Make sure just add once for each event.
		for (var i = 0; i < componentArray.length; i ++) {
			if (componentArray[i].getKeyCode() == component.getKeyCode()) {
				counter ++;
			}
		}

		if (counter == 0) {
			componentArray.push(component);
		}
	}
}

//The Pager
var Pager = function () {
	var lp = new LayoutProperty ();
	var cp = new ConfigurationProperty ();
	var eventControler;
	var stringTotalNumber = 0;
	var stringCurrentPageNumber = 0;
	
	var imageTotalNumber = 0;
	var imageCurrentPageNumber = 0;
	
	var imageCountOnPage = 3;
	
	var imageArray = new Array();
	var textResult = ""; // Useful cache the paging data
	var textArray = new Array();
	var textTitleHeight = 0;
	var textFirstPageLineCount = 15;
	var textOtherPageLineCount = 17;
	var textX;
	var textY;
	
	var imageWidth = 579;
	var imageHeight = 110;
	
	var pagingStatus = false;
	
	var targetPanel;
	
	this.init = function (eventContainer) {
		eventControler = eventContainer;
	}
	
	this.pagingToString = function (text) {
		
	}
	
	this.getTotalNumber = function () {
		if (cp.useRichText == "0") {
			return stringTotalNumber;
		} else if (cp.useRichText == "1") {
			return imageTotalNumber;
		}
		return "0";
	}
	
	this.getCurrentPageNumber = function () {
		if (cp.useRichText == "0") {
			return stringCurrentPageNumber;
		} else if (cp.useRichText == "1") {
			return imageCurrentPageNumber;
		}
		return "0";
	}
	
	this.firstPage = function (textPanel, title, text) {
		targetPanel = textPanel;
		
		if (cp.useRichText == "0") {
			stringCurrentPageNumber = 1;
			
			var txt = textPanel.getContent();
			textX = textPanel.getX();
			textY = textPanel.getY() + 10; // Set a magic number for the y which match IE
			
			if (textResult == "") {
				var c = document.createElement('canvas');
				c.width = lp.waiverPanelWidth;
				c.height = lp.waiverPanelHeight;
				var cntx = c.getContext('2d');
				textArray = wrapText(cntx, txt, textX, textY, 350, 22); // width = 350 is a migic value, need to do more research.
				stringTotalNumber = Math.ceil((textArray.length - textFirstPageLineCount) / textOtherPageLineCount) + 1;
				
				var divContent = document.getElementById("richTextContentDiv");
				title = "<p style=\"font-family:'Arial';font-size:20px;background-color: #FFFFFF;font-weight:bold;text-align:center;margin-top: 0em; margin-bottom:0em;\">" + title + "</p>";
				divContent.innerHTML = title;
				textTitleHeight = divContent.offsetHeight;
				html2canvas(divContent).then(function (canvas) {
						gstr = createLcdBitmapFromCanvasByXY(canvas, 1, 0, imageWidth, textTitleHeight);
						textPanel.addContent(0, 2, 30, 25, imageWidth, textTitleHeight, gstr);
						divContent.style.display = "none";
						
						textResult = gstr;
						
						for (var i = 0; i < textFirstPageLineCount && i < textArray.length; i ++) {
							LCDWriteString(0, 2, textX, i * 22 + textY + textTitleHeight, "17px Arial", 22, textArray[i]);
						}
						
						eventControler.initPenEvent();
				});
			} else {
				stringTotalNumber = Math.ceil((textArray.length - textFirstPageLineCount) / textOtherPageLineCount) + 1;
				textPanel.addContent(0, 2, 30, 25, imageWidth, textTitleHeight, textResult);
				for (var i = 0; i < textFirstPageLineCount && i < textArray.length; i ++) {
					LCDWriteString(0, 2, textX, i * 22 + textY + textTitleHeight, "17px Arial", 22, textArray[i]);
				}
				eventControler.initPenEvent();
			}
		} else if (cp.useRichText == "1") {
			imageCurrentPageNumber = 1;
			var containerHeight = 0;
			
			var divContent = document.getElementById("richTextContentDiv");
			title = "<p style=\"font-family:'Arial';font-size:22px;background-color: #FFFFFF;font-weight:bold;text-align:center;margin-bottom:0em;\">" + title + "</p>";
			text = "<p style=\"font-family:'Arial';font-size:17px;background-color: #FFFFFF;font-weight:bold;text-align:center;-webkit-margin-before: 0em;-webkit-margin-after: 0em;margin-top: 0em; margin-bottom:0em;\">" + text + "</p>";
			divContent.innerHTML = title + text;
			containerHeight = divContent.offsetHeight;
			count = Math.ceil(containerHeight / imageHeight);
			imageTotalNumber = Math.ceil(count / imageCountOnPage);
			html2canvas(divContent).then(function(canvas) {
				var gstr = "";
				
				for (var i = 0; i < count; i ++) {
					gstr = createLcdBitmapFromCanvasByXY(canvas, 1, i * imageHeight, imageWidth, imageHeight);
					if (i < 3) {
						textPanel.addContent(0, 2, 30, 30 + i * imageHeight, imageWidth, imageHeight, gstr);
					}
					imageArray.push(gstr);
				}
				eventControler.initPenEvent();
				divContent.style.display="none";
				// divContent.appendChild(canvas); // For testing.
			});
		}
	}
	
	this.nextPage = function () {
		if (cp.useRichText == "0") {
			stringCurrentPageNumber ++;
		} else if (cp.useRichText == "1") {
			imageCurrentPageNumber ++;
		}
		paging();
	}
	
	this.previousPage = function () {
		if (cp.useRichText == "0") {
			stringCurrentPageNumber --;
		} else if (cp.useRichText == "1") {
			imageCurrentPageNumber --;
		}
		paging();
	}
	
	var paging = function () {
		targetPanel.refresh();
		if (cp.useRichText == "0") {
			if (stringCurrentPageNumber == 1) {
				targetPanel.addContent(0, 2, 30, 30, imageWidth, textTitleHeight, textResult);
				eventControler.initPenEvent();
				
				for (var i = 0; i < textFirstPageLineCount && i < textArray.length; i ++) {
					LCDWriteString(0, 2, textX, i * 22 + textY + textTitleHeight, "17px Arial", 22, textArray[i]);
				}
			} else {
				var j = 0;
				for (var i = (stringCurrentPageNumber - 2) * textOtherPageLineCount + textFirstPageLineCount; (i < (stringCurrentPageNumber - 2) * textOtherPageLineCount + textFirstPageLineCount + textOtherPageLineCount) && i < textArray.length; i ++) {
					LCDWriteString(0, 2, textX, j * 22 + textY - 20, "17px Arial", 22, textArray[i]);
					j ++;
				}
				
			}
		} else if (cp.useRichText == "1") {
			var j = 0;
			for (var i = (imageCurrentPageNumber - 1) * imageCountOnPage; i < (imageCurrentPageNumber - 1) * imageCountOnPage + imageCountOnPage; i ++) {
				targetPanel.addContent(0, 2, 30, 30 + j * imageHeight, imageWidth, imageHeight, imageArray[i]);
				j ++;
			}
		}
		eventControler.initPenEvent();
	}
	
	this.refreshPageNumberPanel = function (pageNumberTextPanel) {
		pageNumberTextPanel.refresh();
		pageNumberTextPanel.addContent(this.getCurrentPageNumber() + "/" + this.getTotalNumber());
		eventControler.initPenEvent();
	}
	
	var wrapText = function (ctx, text, x, y, maxWidth, lineHeight) {
		var stringArray = new Array();
		var lines = text.trim().split("\n");
	    for (var i = 0; i < lines.length; i++) {
	        var words = lines[i].split(' ');
	        var line = '';

	        for (var n = 0; n < words.length; n++) {
	            var testLine = line + words[n] + ' ';
	            var metrics = ctx.measureText(testLine);
	            var testWidth = metrics.width;
	            if (testWidth > maxWidth && n > 0) {
	                stringArray.push(line);
	                line = words[n] + ' ';
	                y += lineHeight;
	            } else {
	                line = testLine;
	            }
	        }
	        stringArray.push(line);
	    }
	    return stringArray;
	}
}

// A configuration information container for signature pad system
function ConfigurationProperty () {
	this.useRichText = "0"; // Useful contral the on/off rich text 0 - Simple text, 1 - Rich text
}

// A dictionary for components layout
function LayoutProperty () {
	this.imagesBaseURL = location.protocol;
	
	this.setImagesBaseURL = function (akamaiEnabled) {
		if (!akamaiEnabled) {
			this.imagesBaseURL += "//" + location.host;
		}
	}
	
	this.waiverBottomBarX = 0;
	this.waiverBottomBarY = 400;
	
	this.waiverPanelWidth = 580;
	this.waiverPanelHeight = 340;
	
	this.waiverBottomBarImg = "/bottomBarBackground.bmp";
	
	this.waiverAgreeBtnX = 50;
	this.waiverAgreeBtnY = 415;
	this.waiverAgreeBtnWidth = 180;
	this.waiverAgreeBtnHeight = 50;
	this.waiverAgreeBtnImg = "/btnAgree.bmp";
	
	this.waiverPreviousBtnX = 260;
	this.waiverPreviousBtnY = 415;
	this.waiverPreviousBtnWidth = 136;
	this.waiverPreviousBtnHeight = 50;
	this.waiverPreviousBtnImg = "/btnPre.bmp";

	this.waiverPagingCountNumX = 416;
	this.waiverPagingCountNumY = 425;
	this.waiverPagingCountNumWidth = 50;
	this.waiverPagingCountNumHeight = 30;
	this.waiverPagingCountNumFont = "24px Arial bold";
	this.waiverPagingCountNumFontSize = "22";

	this.waiverNextBtnX = 476;
	this.waiverNextBtnY = 415;
	this.waiverNextBtnWidth = 136;
	this.waiverNextBtnHeight = 50;
	this.waiverNextBtnImg = "/btnNext.bmp";
	
	this.signBackgroundX = 0;
	this.signBackgroundY = 0;
	this.signBackgroundImg = "/signBackground.bmp";

	this.signCancelBtnX = 559;
	this.signCancelBtnY = 30;
	this.signCancelBtnWidth = 49;
	this.signCancelBtnHeight = 49;
	this.signCancelBtnImg = "/btnClose.bmp";

	this.signTitleX = 150;
	this.signTitleY = 40;
	this.signTitleFont = "30px Arial bold";
	this.signTitleFontSize = "30";

	this.signSignaturePanelX = 32;
	this.signSignaturePanelY = 149;
	this.signSignaturePanelWidth = 576;
	this.signSignaturePanelHeight = 182;
	this.signSignaturePanelImg = "/imgInput.bmp";

	this.signClearBtnX = 32;
	this.signClearBtnY = 380;
	this.signClearBtnWidth = 277;
	this.signClearBtnHeight = 60;
	this.signClearBtnImg = "/btnClear.bmp";

	this.signOkBtnX = 331;
	this.signOkBtnY = 380;
	this.signOkBtnWidth = 277;
	this.signOkBtnHeight = 60;
	this.signOkBtnImg = "/btnOk.bmp";
	
	this.endingBackgroundX = 0;
	this.endingBackgroundY = 0;
	this.endingBackgroundImg = "/submit.bmp";
}