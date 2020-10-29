# krokodeal-2016
Krokodeal hunt script for Tampermonkey.
*Also works for ~~2017~~ ~~2018~~ ~~2019~~ 2020!*

#### This is an experimental script for educational purposes only.

- tested on Chrome v86

![alt sample picture](pic.png)

### Features

- automatically browsing
- auto-click Kroko, if appeared
- randomized browse and click -time behaviour
- get notificated by a catch with the ~~Telegram~~ Discord messenger
- ban prevention - this will take a 2h break after collection of 15 Krokos (the real deadline is possibly the continuous collection of 20 Krokos)
- ETA calculation for next Kroko

### First Steps

1. Install [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
2. Click the link to [raw Krokodeal.user.js](https://github.com/monoxacc/krokodeal-2016/raw/master/Krokodeal.user.js)
3. Tampermonkey asks to install script
4. Navigate to a deal page
5. Chill and wait - one tab is enough, there is no benefit by using more than one browser tab

### Discord Notifier

1. Your Discord Server -> Settings -> Integrations -> WebHooks
2. Create your [KrokoHunter-WebHook](https://discordjs.guide/popular-topics/webhooks.html#creating-webhooks)
3. Copy WebHook-URL and set it in bot

![alt sample picture](pic2.png)

### Hints

- To prevent that the bot will stuck (e.g. caused by internet connection errors like timeout/server unreachable) you can use [AutoRefresh](https://chrome.google.com/webstore/detail/auto-refresh/ifooldnmmcmlbdennkpdnlnbgbmfalko) with 30 or 45min configured.

### ~~Telegram Notifier~~
(removed and replaced by Discord Notifier, last working state with Telegram is f8db4b0dd8ea29925bbe6ae4eee15392fe43605b )
1. ~~Create a telegram bot at [BotFather](https://telegram.me/BotFather)~~
2. ~~Set Telegram token~~
3. ~~Check the Telegram-Notify option and send the captcha to your telegram bot~~
4. ~~Get notified!~~

~~A more detailed german tutorial, you can find [here](https://www.christian-luetgens.de/homematic/telegram/botfather/Chat-Bot.htm).~~

*Thanks to the following persons for distributing their software for free:*
- <sub>Anthony Lieuallen
  - <sub>[grant-none-shim.js](https://gist.githubusercontent.com/arantius/3123124/raw/grant-none-shim.js)
