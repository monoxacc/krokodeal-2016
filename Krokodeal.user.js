// ==UserScript==
// @name        Krokodeal-Jäger (by MoNoX)
// @namespace   Krokodeal2016
// @description Absahnen!
// @downloadURL https://github.com/monoxacc/krokodeal-2016/raw/master/Krokodeal.user.js
// @include     https://www.mydealz.de/*
// @exclude     https://www.mydealz.de/xmas-game*
// @require     https://gist.githubusercontent.com/arantius/3123124/raw/grant-none-shim.js
// @require     https://raw.githubusercontent.com/eligrey/FileSaver.js/master/FileSaver.js
// @version     2016.13
// @grant       none
// ==/UserScript==
//   /==========\
//  |- by MoNoX -|
//   \==========/

var bDebug = false;

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

/**
 * Check for userban by using trading system search.
 */
function checkBanned() {
	$.get('https://www.mydealz.de/xmas-game/trade',function() { 
		//trade system is available at this point
		var username = getUsername();
		$.get('https://www.mydealz.de/search/xmas-game-trading-partner-search?q='+username,function(result) { 
			if(result.data.suggestions.length == 1) {
				alert("You are NOT banned!");
			} else {
				alert("Looks like you are banned!");
			}
		});
	});
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
	var oldLastKrokoTime = lastKrokoTime;
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
	lastKrokoTime = d.getTime();
	GM_setValue("lastKroko", d.getTime());
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

function getKrokoCatchedText(requestDataContentHTML) {
	var mydiv = document.createElement('div');
	mydiv.innerHTML = requestDataContentHTML;
	var crocModal = mydiv.getElementsByClassName("size--all-l")[0];
	//var txtKrokokey = document.getElementById("txtKrokokey");
	if(crocModal != null)
	{
		if(mydiv.getElementsByClassName("mc-notification-charcater--win")[0]!=null)
		{
			//Kroko catched!
			//txtKrokokey.style.backgroundColor = "green";
		}
		else
		{
			//txtKrokokey.style.backgroundColor = "red";
		}
		return crocModal.textContent;
	} else {
		console.log("error occured", mydiv.innerHTML);
	}
}

function initMessBox()
{
	var box = document.createElement('div');
	box.id = "MessBox";
	var boxstyle = document.createAttribute("style");
	boxstyle.value = "width:250px;height:250px;position:fixed;bottom:0px;background-color:black;color:white;font-weight:bold;margin-bottom:25px;margin-left:2px;overflow:auto;"; //overflow:scroll;
	//boxstyle.value += "background: url('https://www.mydealz.de/assets/img/mascotcards/deer/red_nose-level2.svg') no-repeat scroll 40% 90% / 50% auto #000;";
	box.setAttributeNode(boxstyle);
	
	var script_version = GM_info.script.version;
	box.innerHTML = "KrokoDEAL-Jäger " + script_version + "</br>";
	box.innerHTML += "<span id='statusspan' style='color:yellow;'></span></br>";
	box.innerHTML += "<span id='reloadspan' style='color:red;'></span></br>";
	box.innerHTML += "<a href='https://www.mydealz.de/xmas-game/collection' target='_blank'>>> My Kroko-Collection <<</a></br>";
	if(lastKrokoTime) {
		var d = new Date(lastKrokoTime);
		box.innerHTML += "<span id='lastKroko'>Last Kroko: "+d.toLocaleTimeString()+"</span></br>";
		d.setTime(d.getTime()+avgKrokoTime); // ETA calculation
		box.innerHTML += "<span id='nextKroko'>Next Kroko: "+d.toLocaleTimeString()+" (ETA)</span></br>";
	}
	
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
	box.appendChild(chkAutoCatch);
	box.appendChild(chkAutoCatchLabel);
		
	box.appendChild(document.createElement('br'));
		
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
	box.appendChild(chkTelegramNotify);
	box.appendChild(chkTelegramNotifyLabel);
	
	//KrokoKey Eingabe Box
	var inputbox = document.createElement('div');
	inputbox.id = "InputBox";
		var inputboxstyle = document.createAttribute("style");
		inputboxstyle.value = "position:absolute;bottom:0px;";
	inputbox.setAttributeNode(inputboxstyle);
		
	var btnStats = document.createElement('input');
		btnStats.id = "btnStats";
		btnStats.type = "button";
		btnStats.value = "logs";
		btnStats.onclick = function() {
			saveStringAsFile(GM_getValue("requeststats", "no logs"));
		}
		var btnClass = document.createAttribute("class");
		btnClass.value = "text--backgroundPill";
	btnStats.setAttributeNode(btnClass);
	inputbox.appendChild(btnStats);
	
	var btnClearStats = document.createElement('input');
		btnClearStats.id = "btnClearStats";
		btnClearStats.type = "button";
		btnClearStats.value = "clear logs";
		btnClearStats.onclick = function(){
			if (confirm('Clear logs?')) GM_setValue("requeststats", "");
		};
		var btnClass = document.createAttribute("class");
		btnClass.value = "text--backgroundPill";
	btnClearStats.setAttributeNode(btnClass);
	inputbox.appendChild(btnClearStats);
	
	var btnTelegramToken = document.createElement('input');
		btnTelegramToken.id = "btnTelegramToken";
		btnTelegramToken.type = "button";
		btnTelegramToken.margin = "5px";
		btnTelegramToken.value = "set TelegramToken";
		btnTelegramToken.onclick = function() {
			var inputToken = prompt("Please set your Telegram-Bot token!", telegramToken);
			if (inputToken != null) { //user not aborted
				telegramToken = inputToken;
				GM_setValue("telegramToken", inputToken);
			}
		};
		var btnClass = document.createAttribute("class");
		btnClass.value = "text--backgroundPill";
	btnTelegramToken.setAttributeNode(btnClass);
	inputbox.appendChild(btnTelegramToken);
	
	var btnCheckBann = document.createElement('input');
		btnCheckBann.id = "btnCheckBann";
		btnCheckBann.type = "button";
		btnCheckBann.value = "am i banned?";
		btnCheckBann.onclick = checkBanned;
		var btnClass = document.createAttribute("class");
		btnClass.value = "text--backgroundPill";
		btnCheckBann.setAttributeNode(btnClass);
	inputbox.appendChild(btnCheckBann);
	
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
		setMessBoxSpanText("statusspan", "Kroko found & clicked!", "green");
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
		setMessBoxSpanText("reloadspan", "next Page in..."+ getReloadTimeleft(targetTime) +"s", "red");
	},1000);
	clearTimeout(idTimeoutNextPage);
	idTimeoutNextPage = setTimeout(function(){
		window.location.href = nextPage;
	}, countdown);
}

function getReloadTimeleft(targetTime)
{
	return ( (targetTime - (new Date()).getTime() ) / 1000 ).toFixed(1);
}

/*  ===========================
		Main entry point
	===========================  */

// get saved configs
var bAutoCatch = GM_getValue("bAutoCatch", true);
var avgKrokoTime = parseInt(GM_getValue("avgKrokoTime", 3600000));
var lastKrokoTime = parseInt(GM_getValue("lastKroko", 0));

var telegramToken = GM_getValue("telegramToken","");
var telegramChatId = GM_getValue("telegramChatId", "");
var bTelegramNotify = GM_getValue("bTelegramNotify", telegramChatId != "");

// Timer IDs
var idIntervalReloadspan = 0;
var idTimeoutNextPage = 0;

initMessBox();

$(document).ajaxComplete(function(e,r,s)
{
	if (s.url.indexOf("mascotcards") > -1 && bDebug) {
		console.log('ajaxComplete:');
		console.log(e);
		console.log(r);
		console.log(s);
	}
	if (s.url.indexOf("/mascotcards/see") > -1)
	{
		var regEx = new RegExp("(mascotcards-[0-9a-z]+)");
		var match = r.responseText.match(regEx);
		if (match)
		{
			var catchKey = match[1];
			addStats(createStatObj(getTimeStamp(),true, catchKey));
			
			// avgTime calc & save lastKroko-Timestamp
			setKrokoTimeStats();
			
			//document.getElementById("txtKrokokey").value = catchKey;
			titleBlinking();
			if(bAutoCatch === 'true') {
				handleKroko();
				if (!bDebug) {
					goNextPage(getRandomInt(5,10));
				}
			}
		}
		else
		{
			addStats(createStatObj(getTimeStamp(),false, null));
			
			setMessBoxSpanText("statusspan", "There is something...maybe next page!!", "red");
			if (!bDebug) {
				goNextPage(getRandomInt(5,10));
			}
		}
	}
	if (s.url.indexOf("/mascotcards/claim") > -1) {
		if (bDebug) {
			console.log("claim detected, content:");
			console.log(r.responseJSON.data.content);			
		}
		if (bTelegramNotify === 'true') {
			var msg = getKrokoCatchedText(r.responseJSON.data.content);
			sendTelegramMessage(telegramChatId, getUsername() + ": " + msg);
		}
	}
});

setMessBoxSpanText("statusspan", "Watch out for Kroko...", "yellow");

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
