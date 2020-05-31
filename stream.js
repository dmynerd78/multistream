class Stream {
    /**
     * Create a stream
     * @param {string} username - Username of the channel.
     * @param {string} platform - Platform user is on ("twitch" or "mixer").
     * @param {boolean} doAPICalls - periodically call APIs for viewer count, live status, etc.
     */
    constructor(username, platform, doAPICalls = true) {
        if(username == "") { throw "Username empty"; }

        // username = username.trim().toLowerCase();
        platform = platform.trim().toLowerCase();
        if (platform != "mixer" && platform != "twitch" &&
            platform != "m" && platform != "t") {
                throw "Invalid platform";
        }

        if (platform == "m") { platform = "mixer"; }
        if (platform == "t") { platform = "twitch"; }

        this._username = username;
        this._platform = platform;

        // Initially null to prevent unneccesary background from iframe JS
        this._player = null;
        this._banner = null;
        this._chat = null;
        this._resizeChat = false;
        this._doAPICalls = doAPICalls;
        this._apiTimeout = null;  // In case setTimeout needs to be cleared
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
     * Return which platform the streamer is on
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
        switch (this._platform) {
            case "mixer":
                return "https://mixer.com/" + this._username;
            case "twitch":
                return "https://twitch.tv/" + this._username;
        }
    }

    /**
     * Return URL for embedded video player
     */
    getVideoURL() {
        switch (this._platform) {
            case "mixer":
                return "https://mixer.com/embed/player/" + this._username;
            case "twitch":
                return "https://player.twitch.tv/?channel=" + this._username;
        }
    }

    /**
     * Returns URL for the channel's embedded chat
     */
    getChatURL() {
        switch (this._platform) {
            case "mixer":
                return "https://mixer.com/embed/chat/" + this._username;
            case "twitch":
                return "https://www.twitch.tv/embed/" + this._username + "/chat?darkpopout";
        }
    }

    /**
     * Create iframe for video player. Auto mutes the stream
     */
    _genEmbedVideo() {
        let iframe = htmlToElement("<iframe class='player' allowfullscreen='true' frameborder='0' scrolling='no'></iframe>");

        switch (this._platform) {
            case "mixer":
                iframe.src = this.getVideoURL();
                iframe.disableCostream = "true";
                iframe.muted = "true";
                iframe.mixplay = "false";
                break;
            case "twitch":
                iframe.src = this.getVideoURL() + "&muted=true";
                break;
        }

        return iframe;
    }

    /**
     * Generates a streamer "banner" which contains link to
     * streamer page along with dom elements for _runAPICalls()
     */
    _genBanner() {
        // TODO Adding new stream should double banner size and have stream input below
        let banner = htmlToElement(`<div class='banner' style='background: var(--${this._platform}-color);'></div>`);
        let channelName = htmlToElement(`<span class='channelName'>${this._username}</span>`);
        let openStream = htmlToElement(`<div class='rightWrapper'><a href='${this.getChannelURL()}' target='_blank' rel='noopener' class='channelButton noselect'>Open</a></div>`);
        let updateCols = htmlToElement("<div class='rightWrapper'></div>");
        let addStreamIcon = htmlToElement("<a title='Add Stream' class='addStream icon'>&#x2795</a>");
        let streamInput = htmlToElement(`<div class="inner-input-group hidden">
                <input type="text" size="12" placeholder="Username" required>
                <select style="width: 62px;">
                    <option value="twitch">Twitch</option>
                    <option value="mixer">Mixer</option>
                </select>
            </div>`);
        let removeStreamIcon = htmlToElement(`<a title='Remove stream' class='removeStream icon' onclick='removeDOMStream("${this._username}");'>&#x2796;</a>`);
        let viewerCount = htmlToElement("<span class='viewerCount'></span>");
        let isLiveIcon = htmlToElement("<div class='liveIcon'></div>");

        let streamInputCancel = htmlToElement("<button>Cancel</button>");
        streamInputCancel.onclick = () => streamInput.classList.add("hidden");

        let streamInputAdd = htmlToElement("<button>Add</button>");
        streamInputAdd.onclick = function () {
            let username = streamInput.getElementsByTagName("input")[0].value.trim();
            if(username.length == 0) {
                return;
            }
            let platform = streamInput.getElementsByTagName("select")[0].value;
            let stream = [`${platform.substr(0, 1)}:${username}`];

            window.streamColumns = genColumns(stream, window.urlParser.getSettings(), window.streamColumns);
            window.urlParser.addStream(platform, username);
            streamInput.classList.add("hidden");
            streamInput.getElementsByTagName("input")[0].value = "";
        };

        streamInput.appendChild(streamInputAdd);
        streamInput.appendChild(streamInputCancel);
        addStreamIcon.onclick = () => streamInput.classList.remove("hidden");

        banner.appendChild(channelName);
        banner.appendChild(openStream);
        banner.appendChild(updateCols);
        updateCols.appendChild(removeStreamIcon);
        updateCols.appendChild(addStreamIcon);
        updateCols.appendChild(streamInput);

        if(this._doAPICalls) {
            updateCols.appendChild(viewerCount);
            updateCols.appendChild(isLiveIcon);
        }

        if (this._doAPICalls) {
            this._runAPICalls(viewerCount, isLiveIcon);
        }

        return banner;
    }

    /**
     * Creates iframe element which contains the chat
     */
    _genEmbedChat() {
        let divWrapper = htmlToElement("<div class='chatWrapper noselect'></div>");
        if(this._resizeChat) {
            divWrapper.style.height = "50%";
        }

        // Resize chat on mousedown of chatWrapper
        divWrapper.addEventListener("mousedown", function (e) {
            if (e.offsetY < 5) {
                let resizeBind = resize.bind(null, divWrapper);

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
        console.info(`Polling ${this._username} (${this._platform})...`);

        let request = new XMLHttpRequest();
        switch(this._platform) {
            case "mixer":
                request.open("GET", "https://mixer.com/api/v1/channels/" + this._username, true);
                request.onload = function () {
                    let data = JSON.parse(this.response);
                    if(data.online == false) {
                        viewers.textContent = "Not Live";
                        liveIndicator.classList.remove("live");
                    } else {
                        viewers.textContent = `${data.viewersCurrent.toLocaleString()} viewers`;
                        liveIndicator.classList.add("live");
                    }
                };
                break;

            case "twitch":
                request.open("GET", "https://api.twitch.tv/helix/streams?user_login=" + this._username, true);

                request.onload = function () {
                    let data = JSON.parse(this.response);

                    if(data.data.length == 0) {
                        viewers.textContent = "Not Live";
                        liveIndicator.classList.remove("live");
                    } else {
                        let stream = data.data[0];
                        viewers.textContent = `${stream.viewer_count.toLocaleString()} viewers | Uptime: ${Stream.get_uptime(stream.started_at)}`;
                        liveIndicator.classList.add("live");
                    }
                };
                request.setRequestHeader("CLIENT-ID", Stream.TWITCH_CLIENT_ID);
                request.setRequestHeader("Authorization", `Bearer ${Stream.TWITCH_OAUTH_ID}`);
                break;
        }
        request.send();

        // Setup next run interval
        this._apiTimeout = setTimeout(() => { this._runAPICalls(viewers, liveIndicator); }, 1.5 * 60 * 1000);
    }

    /**
     * Stop API polling for said stream.
     * *You can not restart API Polling again once this is called*
     */
    stopAPICalls() {
        clearTimeout(this._apiTimeout);
    }
}