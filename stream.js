// TODO Individually hide video/char per column
// TODO Embed new twitch js library to make managing video/chat easier?

class Stream {
    /**
     * Create a stream
     * @param {Object} streamManager - StreamManager class this will be apart of
     * @param {string} username - Username of the channel
     * @param {boolean} doAPICalls - periodically call APIs for viewer count, live status, etc.
     */
    constructor(streamManager, username, doAPICalls = true) {
        if(username == "") { throw "Username empty"; }

        this._streamManager = streamManager;
        this._username = username.trim();
        this._platform = "twitch";

        // Initially null to prevent unneccesary background iframe JS
        this._column = null;
        this._player = null;
        this._banner = null;
        this._chat = null;
        this._resizeChat = false;
        this._doAPICalls = doAPICalls;
        this._apiTimeout = null;  // Stores setTimeout reference for API calls
    }

    /**
     * Return Twitch CLIEND-ID Header value
     */
    static get TWITCH_CLIENT_ID() { return "f4mlkz1jrw7cjouyeomk1w5cgu1szd"; }

    /**
     * Return temporary OAuth key.
     * Key will expire in a month or two and will need to be replaced
     * Get new one with POST https://id.twitch.tv/oauth2/token?grant_type=client_credentials&client_id={}&client_secret={}
     */
    static get TWITCH_OAUTH_ID() { return "jotxtukprcgp4zwmosrd2tlpullwx8"; }

    /**
     * Create a hh:ss display (or dd:hh:ss if >24 hours) for a stream's uptime
     * @param {*} startTime the time a stream started. Must be parsable by JS's Date object
     */
    static get_uptime(startTime) {
        let sec = Math.abs(new Date(startTime).getTime() - Date.now());
        let mins = Math.floor(sec / 60000);
        let hrs = Math.floor(mins / 60);
        let days = Math.floor(hrs / 24);
        mins = mins % 60;
        hrs = hrs % 24;

        days = days.toString().padStart(2, "0");
        hrs = hrs.toString().padStart(2, "0");
        mins = mins.toString().padStart(2, "0");
        if (days == 0) {
            return `${hrs}:${mins}`;
        } else {
            return `${days}:${hrs}:${mins}`;
        }
    }

    /**
     * Return username of streamer
     */
    getUsername() {
        return this._username;
    }

    /**
     * Returns full platform name that the streamer is on (all lower case)
     */
    getPlatform() {
        return this._platform;
    }

    /**
     * Get the DOM element containing the video player
     * NOTE: If the player and chat are being added, the video player
     * *MUST* be added first as it initializes resizing
     */
    getPlayer() {
        if(this._player === null) {
            this._player = this._genEmbedVideo();
            this._resizeChat = true;
        }
        return this._player;
    }

    /**
     * Get the DOM element containing the banner
     */
    getBanner() {
        if(this._banner === null) {
            this._banner = this._genBanner();
        }
        return this._banner;
    }

    /**
     * Get the DOM element containing the chat iframe
     */
    getChat() {
        if(this._chat === null) {
            this._chat = this._genEmbedChat();
        }
        return this._chat;
    }

    /**
     * Ger url to a channel
     */
    getChannelURL() {
        switch (this.getPlatform()) {
            case "twitch":
                return "https://twitch.tv/" + this.getUsername();
        }
    }

    /**
     * Return URL for embedded video player
     */
    getVideoURL() {
        switch (this._platform) {
            case "twitch":
                return `https://player.twitch.tv/?channel=${this.getUsername()}&parent=${document.location.hostname}`;
        }
    }

    /**
     * Returns URL for the channel's embedded chat
     */
    getChatURL() {
        switch (this._platform) {
            case "twitch":
                return `https://www.twitch.tv/embed/${this.getUsername()}/chat?parent=${document.location.hostname}&darkpopout`;
        }
    }

    /**
     * Create iframe for video player. Auto mutes the stream
     */
    _genEmbedVideo() {
        let iframe = htmlToElement("<iframe class='player' allowfullscreen='true' frameborder='0' scrolling='no'></iframe>");

        switch (this._platform) {
            case "twitch":
                // TODO Set volume to 1/100 instead
                iframe.src = this.getVideoURL() + "&muted=true";
                break;
        }

        return iframe;
    }

    getColumn(settings) {
        if(this._column) {
            return this._column;
        }

        let div = htmlToElement("<div class='col'></div>");
        if (settings.indexOf("novideo") == -1) { div.appendChild(this.getPlayer()); }
        if (settings.indexOf("nobanner") == -1) { div.appendChild(this.getBanner()); }
        if (settings.indexOf("nochat") == -1) { div.appendChild(this.getChat()); }

        this._column = div;
        return div;
    }

    /**
     * Generates a streamer "banner" which contains link to
     * streamer page along with dom elements for _runAPICalls()
     */
    _genBanner() {
        // TODO Option to hide video/chat per column
        let banner = htmlToElement(`<div class='banner' style='background: var(--${this.getPlatform()}-color);'></div>`);
        let bannerTop = htmlToElement("<div class='top'></div>");
        let bannerBot = htmlToElement("<div class='bot hidden'></div>");
        let channelName = htmlToElement(`<span class='channelName'>${this.getUsername()}</span>`);
        let updateCols = htmlToElement("<div class='rightWrapper'></div>");
        let addStreamIcon = htmlToElement("<a title='Add another stream' class='addStream icon'>&#x2795</a>");
        let removeStreamIcon = htmlToElement("<a title='Remove this stream' class='removeStream icon'>&#x2796;</a>");
        // TODO Update
        // removeStreamIcon.addEventListener("click", () => removeDOMStream(this.getUsername(), window.streamColumns));

        let streamInputWrapper = htmlToElement(`<div class="inner-input-group rightWrapper"></div>`);
        let streamInput = htmlToElement(`<input type="text" placeholder="Username" required>`);
        streamInput.addEventListener("keydown", (e) => { // TODO Update
            let inputStream = streamInput.value.trim();
            switch(e.key) {
                case "Enter": {
                    this._streamManager.addStream(inputStream, this.getUsername());

                    bannerBot.classList.add("hidden");
                    streamInput.value = "";
                    break;
                }

                case "Escape": {
                    bannerBot.classList.add("hidden");
                    streamInput.value = "";
                    break;
                }
            }
        });

        let viewerCount = htmlToElement("<span class='viewerCount'></span>");
        let isLiveIcon = htmlToElement("<div class='liveIcon'></div>");

        let streamInputCancel = htmlToElement("<button>Cancel</button>");
        streamInputCancel.addEventListener("click", () => bannerBot.classList.add("hidden"));

        let streamInputAdd = htmlToElement("<button>Add</button>");
        streamInputAdd.addEventListener("click", () => {
            let inputStream = streamInput.value.trim();
            this._streamManager.addStream(inputStream, this.getUsername());

            bannerBot.classList.add("hidden");
            streamInput.value = "";
        });

        streamInputWrapper.append(streamInput, streamInputAdd, streamInputCancel);
        addStreamIcon.addEventListener("click", () => {
            if (Math.floor(window.innerWidth / this._streamManager.getStreamList()) < 350) {
                alert("There is no more space for more streams\nIf you want to add more, increase the size of the window");
                return;
            }

            bannerBot.classList.remove("hidden");
            bannerBot.querySelector("input").focus();
        });

        bannerTop.append(channelName, updateCols);
        banner.appendChild(bannerTop);

        let controls = htmlToElement("<div class='controls'></div>");
        if (this._doAPICalls) {
            updateCols.append(viewerCount, isLiveIcon);
        }

        let userButton = htmlToElement(`<a href='${this.getChannelURL()}' target='_blank' rel='noopener' class='channelButton noselect'>Open</a>`);

        controls.append(addStreamIcon, removeStreamIcon, userButton);
        updateCols.appendChild(controls);
        bannerBot.appendChild(streamInputWrapper);
        banner.appendChild(bannerBot);


        if (this._doAPICalls) {
            this._runAPICalls(viewerCount, isLiveIcon);
        }

        return banner;
    }

    /**
     * Creates iframe element which contains the chat
     */
    _genEmbedChat() {
        // TODO Make sure resizing works
        let divWrapper = htmlToElement("<div class='chatWrapper noselect'></div>");
        if(this._resizeChat) {
            divWrapper.style.height = "70%";
        }

        // Resize chat on mousedown of chatWrapper
        divWrapper.addEventListener("mousedown", function (e) {
            if (e.offsetY < 5) {
                let resizeBind = resizeChats.bind(null, divWrapper);

                window.prevChatY = e.y;
                resizeSheet.innerHTML = "iframe { pointer-events: none; } * { cursor: n-resize; }";
                document.addEventListener("mousemove", resizeBind, false);

                // Stop resizing on mouseup
                document.addEventListener("mouseup", function handler(e) {
                    resizeSheet.innerHTML = "";

                    e.currentTarget.removeEventListener(e.type, handler);
                    document.removeEventListener("mousemove", resizeBind, false);
                }, false);

                // Stop resizing when mouse leaves document
                document.addEventListener("mouseleave", function handler(e) {
                    resizeSheet.innerHTML = "";

                    e.currentTarget.removeEventListener(e.type, handler);
                    document.removeEventListener("mousemove", resizeBind, false);
                }, false);
            }
        }, false);

        let iframe = htmlToElement(`<iframe src='${this.getChatURL()}' class='chat' frameborder='0' scrolling='no'></iframe>`);

        divWrapper.appendChild(iframe);

        if (this._resizeChat) {
            return divWrapper;
        }
        return iframe;
    }

    /**
     * Sets up API polling which will give statistics like viewer count, isLive, etc.
     * It's only needed to call this method once per streamer since the method contains
     * a setTimeout() which calls itself again to update the information periodically
     * @param {dom} viewers span element which will have it's content updated
     * @param {dom} liveIndicator div that add/remove live class from
     */
    _runAPICalls(viewers, liveIndicator) {
        console.info(`Polling ${this.getUsername()} (${this.getPlatform()})...`);

        let request = new XMLHttpRequest();
        switch(this.getPlatform()) {
            case "twitch":
                request.open("GET", "https://api.twitch.tv/helix/streams?user_login=" + this.getUsername(), true);

                request.onload = function () {
                    if (this.status == 429) {
                        console.warn("Too many API calls! Removing interval (HTTP Status 429)");
                        stopAPICalls();
                        return;
                    }

                    let data = JSON.parse(this.response);

                    if(data.data.length == 0) {
                        viewers.textContent = "Not Live";
                        liveIndicator.classList.remove("live");
                        viewers.title = "";
                        liveIndicator.title = "";
                    } else {
                        let stream = data.data[0];
                        viewers.textContent = `${stream.viewer_count.toLocaleString()} viewers`;
                        viewers.title = `Live for ${Stream.get_uptime(stream.started_at)}`;
                        liveIndicator.title = `Live for ${Stream.get_uptime(stream.started_at)}`;
                        liveIndicator.classList.add("live");
                    }
                };
                request.setRequestHeader("CLIENT-ID", Stream.TWITCH_CLIENT_ID);
                request.setRequestHeader("Authorization", `Bearer ${Stream.TWITCH_OAUTH_ID}`);
                break;
        }
        request.send();

        // Setup next run interval
        this._apiTimeout = setTimeout(() => { this._runAPICalls(viewers, liveIndicator); }, 60 * 1000);
    }

    /**
     * Check to see if viewerCount span needs to be hidden
     * (ensures banner's .top element doesn't take up two lines)
     */
    checkBannerSize() {
        if(this._banner === null || !this._doAPICalls) { return; }

        let top = this._banner.querySelector(".top");
        if ((top.querySelector(".channelName").clientWidth + top.querySelector(".controls").clientWidth) > top.clientWidth - 230) {
            top.querySelector(".rightWrapper .viewerCount").style.display = "none";
            return true;
        } else {
            top.querySelector(".rightWrapper .viewerCount").style.removeProperty("display");
            return false;
        }
    }

    /**
     * Stop API polling for said stream.
     * *You can not restart API Polling again once this is called*
     */
    stopAPICalls() {
        clearTimeout(this._apiTimeout);
    }
}