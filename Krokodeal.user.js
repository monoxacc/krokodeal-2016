// ==UserScript==
// @name        Krokodeal-Jäger (by MoNoX)
// @namespace   Krokodeal2016
// @description Absahnen!
// @downloadURL https://github.com/monoxacc/krokodeal-2016/raw/master/Krokodeal.user.js
// @include     https://www.mydealz.de/*
// @exclude     https://www.mydealz.de/xmas-game*
// @require     https://gist.githubusercontent.com/arantius/3123124/raw/grant-none-shim.js
// @require     https://raw.githubusercontent.com/eligrey/FileSaver.js/master/FileSaver.js
// @version     2016.15
// @grant       none
// ==/UserScript==
//   /==========\
//  |- by MoNoX -|
//   \==========/

var bDebug = false;


/*  ===========================
		Style definitions
	===========================  */

var styleCSS = "@import url('https://fonts.googleapis.com/css?family=Heebo:100,400');\
	#MessBox {\
		background-color: #005293;\
		bottom:0px;\
		border-radius:6px;\
		-webkit-box-shadow: 4px 4px 18px 0px rgba(97,97,97,1);\
		-moz-box-shadow: 4px 4px 18px 0px rgba(97,97,97,1);\
		box-shadow: 4px 4px 18px 0px rgba(97,97,97,1);\
		color: #fff; \
		font-family: 'Heebo', sans-serif; \
		font-weight: 00;\
		height:280px; \
		margin-bottom:25px;\
		margin-left:2px;\
		overflow:auto;\
		padding: 14px; \
		position:fixed;\
		width:290px; \
	}\
	#MessBox a {\
		color: #69be28;\
		font-weight: 400;\
		margin-top: 4px;\
		text-decoration: underline;\
	}\
	#MessBox p {\
		margin: 10px 0;\
		text-align: center;\
	}\
	#MessBox p.left-align {\
		margin-top: 20px;\
		text-align: left;\
	}\
	#MessBox .headline {\
		font-size: 18px;\
		font-weight: 400;\
		margin: 18px 0; \
	}\
	#MessBox #InputBox {\
		bottom:14px;\
		position:absolute;\
	}\
	#MessBox #InputBox input {\
		background-color: #69be28;\
		border: none;\
		border-radius: 4px;\
		color: #000;\
		cursor: pointer;\
		font-weight: 400;\
		padding: 2px 6px;\
		margin: 0px 3px;\
	}\
	#MessBox #InputBox input:hover {\
		background-color: #afd798;\
	}";

// set style
GM_addStyle(styleCSS);

/*  ===========================
		Functions
	===========================  */

function sendTelegramMessage(chat_id, msg) {
	if((chat_id != null || chat_id != "")  && msg != null) {
		$.ajax({
			'type': 'POST',
			'url': 'https://api.telegram.org/bot'+ telegramToken +'/sendMessage',
			'contentType': 'application/x-www-form-urlencoded',
			'data': JSON.parse('{"chat_id":"'+chat_id+'","text":"'+msg+'"}'),
			'dataType': 'json',
			'success': function() { }
		});
	} else {
		console.log("sendTelegramMessage() bad call!");
	}
}

function handleTelegramNotifyChanged(e) {
	var chkTelegramNotify = e.target;
	if (chkTelegramNotify.checked) {
		if(telegramToken == "") { //check telegramToken is set
			var inputToken = prompt("Please set your Telegram-Bot token!");
			if (inputToken == null) { //user aborted
				chkTelegramNotify.checked = false;
				return 0;
			} else {
				//TODO: test token api method getMe()
				telegramToken = inputToken;
				GM_setValue("telegramToken", inputToken);
			}
		}
		var code = getRandomString();
		var inputNewChatId = prompt("Please set your chat_id here.\r\nIf you have no chat_id, leave the field blank and send the following code to your Telegram-Bot, AFTER SENDING press OK\r\n\r\n" + code, telegramChatId);
		if (inputNewChatId != null) { // user pressed OK
			inputNewChatId = inputNewChatId.trim();
			if (inputNewChatId == "") { //user has no chat_id, find chat_id
				$.ajax({
					'type': 'POST',
					'url': 'https://api.telegram.org/bot'+ telegramToken +'/getUpdates',
					'contentType': 'application/x-www-form-urlencoded',
					'data': JSON.parse('{"offset":"-1"}'),
					'dataType': 'json',
					'success': function(d,s,r) {
						var success = d.result[0].message.text == code;
						if(success) {
							telegramChatId = d.result[0].message.chat.id;
							GM_setValue("telegramChatId", d.result[0].message.chat.id);
							sendTelegramMessage(telegramChatId, "Success! Your Chat_Id is "+telegramChatId);
							try { document.getElementById('chkTelegramNotifyLabel').innerHTML = " Telegram-Notifier ["+telegramChatId+"]"; } catch(err) {}
						} else {
							chkTelegramNotify.checked = false;
						}
						alert(success ? "Success! Your Chat_Id is "+telegramChatId : "Failed, please try again.");
					}
				});
			} else {
				if (/^[1-9]\d*$/.test(inputNewChatId)) { // is valid number (exclude 0)
					if (inputNewChatId != telegramChatId) { //chat_id were changed
						var old = telegramChatId;
						telegramChatId = inputNewChatId;
						GM_setValue("telegramChatId", inputNewChatId);
						sendTelegramMessage(telegramChatId,"Success! Chat_Id were changed from "+old+" to "+inputNewChatId+" (yours)");
						try { document.getElementById('chkTelegramNotifyLabel').innerHTML = " Telegram-Notifier ["+telegramChatId+"]"; } catch(err) {}
					}
				} else {
					alert("Chat_id invalid!");
					chkTelegramNotify.checked = false;
				}
			}
		} else { //user aborted
			chkTelegramNotify.checked = false;
		}
	}
	bTelegramNotify = chkTelegramNotify.checked;			
	GM_setValue("bTelegramNotify", chkTelegramNotify.checked);
}

function getUsername() {
	try {
		return document.getElementById('user-profile-dropdown').getElementsByClassName('navDropDown-head-text')[0].innerText;
	} catch(err) {
	}
	return '';
}

function getRandomString() {
	return Math.random().toString(36).substr(2, 9); //25 is max lenght
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 * http://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setMessBoxSpanText(span,text,color)
{
	var MessBoxSpan = document.getElementById(span);
	if(MessBoxSpan==null)
	{ console.log("Konnte MessBoxSpan nicht finden!"); return; }
	
	if(color!="") MessBoxSpan.style.color = color;
	MessBoxSpan.innerHTML = text;
}

function setKrokoTimeStats() {
	var d = new Date();
	var oldLastKrokoTime = lastKrokoClickedTime;
	if(oldLastKrokoTime) {
		var oldAvgKrokoTime = avgKrokoTime;
		avgKrokoTime = d.getTime() - oldLastKrokoTime;
		if(oldAvgKrokoTime > 0) {
			avgKrokoTime = Math.ceil((oldAvgKrokoTime + avgKrokoTime) / 2);
		}
		//prevent bad ETA
		if(avgKrokoTime > 5400000) { //if more than 90min in ms
			avgKrokoTime = 3600000; //set 60min as default
		}
		GM_setValue("avgKrokoTime", avgKrokoTime);
	}
	lastKrokoClickedTime = d.getTime();
	GM_setValue("lastKrokoClicked", d.getTime());
}

function addStats(statsObj)
{
	var savedStats = GM_getValue("requeststats", null);
	GM_setValue("requeststats", (savedStats == null ? JSON.stringify(statsObj) : savedStats + JSON.stringify(statsObj))+"\r\n");
}

function createStatObj(intDate,bCatchable,sCatchKey)
{
	return {date:intDate,catchable:bCatchable,key:sCatchKey};
}

function saveStringAsFile(text)
{
	var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
	var filename = getTimeStamp()+"_requestlog.txt"
	saveAs(blob, filename);
}

function getTimeStamp()
{
	var d = new Date()
	return d.getFullYear()*100000000+(d.getMonth()+1)*1000000+d.getDate()*10000+d.getHours()*100+d.getMinutes();
}

// returns true, if a Kroko were catched and sets krokoCatchedText for telegram notification
function detectKrokoCatched(requestDataContentHTML) {
	var mydiv = document.createElement('div');
	mydiv.innerHTML = requestDataContentHTML;
	var crocModal = mydiv.getElementsByClassName("size--all-l")[0];
	if (crocModal != null)
	{
		krokoCatchedText = crocModal.textContent;
		var catched = false;
		try {
			catched = mydiv.getElementsByClassName("mc-notification-character--win")[0] != null;
		} catch(err) {
			console.log("Couldn'd find ElementsByClassName: 'mc-notification-character--win'", mydiv.innerHTML);
		}
		return catched;
	} else {
		console.log("Couldn'd find ElementsByClassName: 'size--all-l'", mydiv.innerHTML);
	}
	return false;
}

function initMessBox()
{
	var box = document.createElement('div');
	box.id = "MessBox";
	
	var script_version = GM_info.script.version;
	var headline = document.createElement("p");
		headline.innerHTML = "KrokoDEAL-J&auml;ger " + script_version;
		var headlineClass = document.createAttribute("class");
		headlineClass.value = "headline";
	headline.setAttributeNode(headlineClass);
	box.appendChild(headline);

	var infospans = document.createElement("p");
		var spanStatus = document.createElement("span");
		spanStatus.id = "statusspan";
	infospans.appendChild(spanStatus);
	infospans.appendChild(document.createElement("br"));
		var spanReload = document.createElement("span");
		spanReload.id = "reloadspan";
	infospans.appendChild(spanReload);
	box.appendChild(infospans);
	
	var collectionlinkP = document.createElement("p");
		var colllink = document.createElement("a");
			colllink.innerHTML = "&gt;&gt; My Kroko-Collection &lt;&lt;";
			var colllinkHref = document.createAttribute("href");
			colllinkHref.value = "https://www.mydealz.de/xmas-game/collection";
			var colllinkTarget = document.createAttribute("target");
			colllinkTarget.value = "_blank";
		colllink.setAttributeNode(colllinkHref);
		colllink.setAttributeNode(colllinkTarget);
	collectionlinkP.appendChild(colllink);
	box.appendChild(collectionlinkP);
		
	var checkboxes = document.createElement("p");
		var checkboxesClass = document.createAttribute("class");
			checkboxesClass.value = "left-align";
	checkboxes.setAttributeNode(checkboxesClass);
		//  Checkbox AutoCatch
		var chkAutoCatch = document.createElement('input');
			chkAutoCatch.id = "chkAutoCatch";
			chkAutoCatch.type = "checkbox";
			chkAutoCatch.checked = (bAutoCatch === 'true');
			chkAutoCatch.onchange = function() {
				bAutoCatch = chkAutoCatch.checked;
				GM_setValue("bAutoCatch", chkAutoCatch.checked);
			};
		var chkAutoCatchLabel = document.createElement('label');
			chkAutoCatchLabel.for = chkAutoCatch.id;
			chkAutoCatchLabel.innerHTML = " Auto-Catching";
	checkboxes.appendChild(chkAutoCatch);
	checkboxes.appendChild(chkAutoCatchLabel);
	checkboxes.appendChild(document.createElement('br'));
		//  Checkbox Telegram-Notifier
		var chkTelegramNotify = document.createElement('input');
			chkTelegramNotify.id = "chkTelegramNotify";
			chkTelegramNotify.type = "checkbox";
			chkTelegramNotify.checked = (bTelegramNotify === 'true');
			chkTelegramNotify.onchange = handleTelegramNotifyChanged;
		var chkTelegramNotifyLabel = document.createElement('label');
			chkTelegramNotifyLabel.id = "chkTelegramNotifyLabel";
			chkTelegramNotifyLabel.for = chkTelegramNotify.id;
			chkTelegramNotifyLabel.innerHTML = " Telegram-Notifier ["+telegramChatId+"]";
	checkboxes.appendChild(chkTelegramNotify);
	checkboxes.appendChild(chkTelegramNotifyLabel);
	box.appendChild(checkboxes);

	//Kroko ETA
	if(lastKrokoClickedTime) {
		var d = new Date(lastKrokoClickedTime);
		var lastKroko = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
		d.setTime(d.getTime()+avgKrokoTime); // ETA calculation
		var nextKroko = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
		var etaSpans = document.createElement("p");
			var spanLastKroko = document.createElement("span");
				spanLastKroko.id = "lastKroko";
				spanLastKroko.innerHTML = "Last Kroko: "+lastKroko+" (ETA: "+nextKroko+")";
		etaSpans.appendChild(spanLastKroko);
		box.appendChild(etaSpans);
	}

	// buttonbox
	var inputbox = document.createElement('div');
		inputbox.id = "InputBox";
		// logs button
		var btnStats = document.createElement('input');
			btnStats.id = "btnStats";
			btnStats.type = "button";
			btnStats.value = "logs";
			btnStats.onclick = function() {
				saveStringAsFile(GM_getValue("requeststats", "no logs"));
			};
	inputbox.appendChild(btnStats);
		// clear logs button
		var btnClearStats = document.createElement('input');
			btnClearStats.id = "btnClearStats";
			btnClearStats.type = "button";
			btnClearStats.value = "clear logs";
			btnClearStats.onclick = function(){
				if (confirm('Clear logs?')) GM_setValue("requeststats", "");
			};
	inputbox.appendChild(btnClearStats);
		// set TelegramToken button
		var btnTelegramToken = document.createElement('input');
			btnTelegramToken.id = "btnTelegramToken";
			btnTelegramToken.type = "button";
			btnTelegramToken.value = "set TelegramToken";
			btnTelegramToken.onclick = function() {
				var inputToken = prompt("Please set your Telegram-Bot token!", telegramToken);
				if (inputToken != null) { //user not aborted
					telegramToken = inputToken;
					GM_setValue("telegramToken", inputToken);
				}
			};
	inputbox.appendChild(btnTelegramToken);
	box.appendChild(inputbox);
	
	document.getElementsByTagName("body")[0].appendChild(box);
}

titleBlinking = (function () {
  var oldTitle = document.title;
  var msg = "KrokoDEAL found!";
  var timeoutId;
  var blink = function() { document.title = document.title == msg ? ' ' : msg; };
  var clear = function() {
    clearInterval(timeoutId);
    document.title = oldTitle;
    window.onmousemove = null;
    timeoutId = null;
  };
  return function () {
    if (!timeoutId) {
      timeoutId = setInterval(blink, 1000);
      window.onmousemove = clear;
    }
  };
}()
);

function handleKroko()
{
	console.log("handleKroko");
	//find & click redeem-link
	var button = $('div.link')[0];
	if(button != null)
	{
		setTimeout(function(){ button.click(); }, getRandomInt(2000, 3000));
		setMessBoxSpanText("statusspan", "Kroko found & clicked!", "greenyellow");
	} else { 
		console.log("object 'div.link' not found!"); 
	}
}

function goNextPage(sec)
{
	var countdown = sec * 1000;
	var targetTime = (new Date()).getTime() + countdown;
	clearInterval(idIntervalReloadspan);
	idIntervalReloadspan = setInterval(function(){
		setMessBoxSpanText("reloadspan", "next Page in "+ getReloadTimeleft(targetTime) +" sec", "white");
	},1000);
	clearTimeout(idTimeoutNextPage);
	idTimeoutNextPage = setTimeout(function(){
		window.location.href = nextPage;
	}, countdown);
}

function getReloadTimeleft(targetTime)
{
	return ( ( targetTime - new Date().getTime() ) / 1000 ).toFixed(1);
}

/*  ===========================
		Main entry point
	===========================  */

// get saved configs
var bAutoCatch = GM_getValue("bAutoCatch", "true");
var avgKrokoTime = parseInt(GM_getValue("avgKrokoTime", 60 * 60 * 1000)); //default = 1h in ms
var lastKrokoClickedTime = parseInt(GM_getValue("lastKrokoClicked", 0));

var telegramToken = GM_getValue("telegramToken","");
var telegramChatId = GM_getValue("telegramChatId", "");
var bTelegramNotify = GM_getValue("bTelegramNotify", (telegramChatId != "").toString());

var krokoCounter = parseInt(GM_getValue("krokoCounter",0));
var krokoCounterLimit = 15; // max:20 (collect >20 krokos one behind the other = ban)
var krokoCounterLimitReached = krokoCounter >= krokoCounterLimit;

var krokoCatchedText = "";

// Timer IDs
var idIntervalReloadspan = 0;
var idTimeoutNextPage = 0;

// Debug output
if (bDebug) {
	console.log("bAutoCatch:",bAutoCatch);
	console.log("avgKrokoTime:",avgKrokoTime);
	console.log("lastKrokoClickedTime:",lastKrokoClickedTime);
	console.log("telegramToken:",telegramToken);
	console.log("telegramChatId:",telegramChatId);
	console.log("bTelegramNotify:",bTelegramNotify);
	console.log("krokoCounter:",krokoCounter);
	console.log("krokoCounterLimit:",krokoCounterLimit);
	console.log("krokoCounterLimitReached:",krokoCounterLimitReached);
}

initMessBox();

$(document).ajaxComplete(function(e,r,s)
{
	if (s.url.indexOf("mascotcards") > -1 && bDebug) {
		console.log('ajaxComplete:');
		console.log(e);
		console.log(r);
		console.log(s);
	}
	if (s.url.indexOf("/mascotcards/see") > -1) { // Kroko is nearby
		var regEx = new RegExp("(mascotcards-[0-9a-z]+)");
		var match = r.responseText.match(regEx);
		if (match) { // Kroko appeared
			var catchKey = match[1];
			addStats(createStatObj(getTimeStamp(),true, catchKey));

			if (!krokoCounterLimitReached) {
				titleBlinking();
				if(bAutoCatch === 'true') {
					handleKroko();
					if (!bDebug) {
						goNextPage(getRandomInt(5,10));
					}
				}
			}
		} else { // no Kroko appeared
			addStats(createStatObj(getTimeStamp(),false, null));
			
			if (!krokoCounterLimitReached) {
				setMessBoxSpanText("statusspan", "There is something...maybe next page!!", "orange");
				if (!bDebug) {
					goNextPage(getRandomInt(5,10));
				}
			}
		}
	}
	if (s.url.indexOf("/mascotcards/claim") > -1) { // Kroko were clicked (response contains catched or not-catched info)
		if (bDebug) {
			console.log("claim detected, content:");
			console.log(r.responseJSON.data.content);
		}

		// detect, that Kroko were catched & scrap text for telegram notify
		var bCatched = detectKrokoCatched(r.responseJSON.data.content);
		if (bCatched) {
			setKrokoTimeStats(); // avgTime calc & save lastKrokoClicked-Timestamp
			krokoCounter = krokoCounter + 1;
			GM_setValue("krokoCounter", krokoCounter + 1);
		}
		
		if (bTelegramNotify === 'true') {
			sendTelegramMessage(telegramChatId, getUsername() + ": " + krokoCatchedText);
		}
	}
});

// check krokoCounter-Limit to prevent ban
if (krokoCounterLimitReached) {
	//wait 2h to prevent ban
	var currDateStamp = new Date().getTime();
	var twoHours = 2 * 60 * 60 * 1000; // 2h in ms
	var lastKrokoDate = new Date(lastKrokoClickedTime);
	var waitUntilDate = new Date(lastKrokoDate.getTime() + twoHours);
	if (currDateStamp > waitUntilDate.getTime()) { // time already waited, reset counter
		krokoCounter = 0;
		GM_setValue("krokoCounter", 0);
		krokoCounterLimitReached = false;
	} else { // wait time to prevent ban
		setMessBoxSpanText("statusspan", "Wait 2h to prevent ban.", "red");
		setMessBoxSpanText("lastKroko", "Please don't click any Kroko until "+waitUntilDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})+"!", "red");
		setInterval(function(){
			setMessBoxSpanText("reloadspan", "next Page in "+ getReloadTimeleft(waitUntilDate.getTime()) +" sec", "white");
		},1000);
		setTimeout(function(){
			GM_setValue("krokoCounter", krokoCounter + 1);
			window.location.reload(true);
			//window.location.href = nextPage;
		}, waitUntilDate.getTime() - currDateStamp);
		return; // end this script here until wait-time is over
	}
}

setMessBoxSpanText("statusspan", "Watching out for Kroko...", "greenyellow");

//Links zu Deals scrapen
var links = $.map($('a[href]'), 
	function(e)
	{
		var regEx = new RegExp("^https:\/\/www\.mydealz\.de\/(deals|gutscheine|freebies).*$");		
		var bIsValid = regEx.test(e.href);
		var bIsCurrentPage = (e.href == window.location.href)
		var bContainsHash = e.href.indexOf("#") > -1;
		if(bIsValid && !bIsCurrentPage && !bContainsHash)
			return e;
	}
);

//Random Link selecten
var nextPage = links[getRandomInt(0, links.length-1)].href;
delete links;

goNextPage(getRandomInt(120, 600));
