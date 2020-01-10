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

        if(platform == "m") { platform = "mixer"; }
        if (platform == "t") { platform = "twitch"; }

        this._username = username;
        this._platform = platform;

        // Initially null to prevent unneccesary background JS via iframes
        this._player = null;
        this._banner = null;
        this._chat = null;
        this._doAPICalls = doAPICalls;
    }

    static get TWITCH_CLIENT_ID() { return "f4mlkz1jrw7cjouyeomk1w5cgu1szd"; }

    // start is a string that can be parsed by a Date object
    static get_uptime(start) {
        let sec = Math.abs(new Date(start).getTime() - Date.now());
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

    getPlayer() {
        if(this._player === null) {
            this._player = this._genEmbedVideo();
        }
        return this._player;
    }

    getBanner() {
        if(this._banner === null) {
            this._banner = this._genBanner();
        }
        return this._banner;
    }

    getChat() {
        if(this._chat === null) {
            this._chat = this._genEmbedChat();
        }
        return this._chat;
    }

    getChannelURL() {
        switch (this._platform) {
            case "mixer":
                return "https://mixer.com/" + this._username;
            case "twitch":
                return "https://twitch.tv/" + this._username;
        }
    }

    getPlatformColor() {
         switch (this._platform) {
             case "mixer":
                 return "#1FBAED";
             case "twitch":
                 return "#6441A4";
         }
    }

    getVideoURL() {
        switch (this._platform) {
            case "mixer":
                return "https://mixer.com/embed/player/" + this._username;
            case "twitch":
                return "https://player.twitch.tv/?channel=" + this._username;
        }
    }

    getChatURL() {
        switch (this._platform) {
            case "mixer":
                return "https://mixer.com/embed/chat/" + this._username;
            case "twitch":
                return "https://www.twitch.tv/embed/" + this._username + "/chat";
        }
    }

    _genEmbedVideo() {
        var iframe = document.createElement("iframe");
        iframe.classList.add("player");
        iframe.allowFullscreen = "true";
        iframe.frameBorder = "0";
        iframe.scrolling = "no";

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

    _genBanner() {
        var banner = document.createElement("div");
        var channelName = document.createElement("span");
        var channelButton = document.createElement("a");
        var viewerCount = document.createElement("span");
        var isLiveIcon = document.createElement("div");

        banner.classList.add("banner");
        banner.appendChild(channelName);
        banner.appendChild(channelButton);
        if(this._doAPICalls) {

            banner.appendChild(viewerCount);
            banner.appendChild(isLiveIcon);
        }

        channelName.innerText = this._username;
        channelName.classList.add("channelName");

        channelButton.classList.add("channelButton");
        channelButton.href = this.getChannelURL();
        channelButton.target = "_blank";
        channelButton.innerText = "Open";

        isLiveIcon.classList.add("liveIcon");

        viewerCount.classList.add("viewerCount");
        if (this._doAPICalls) {
            this._runAPICalls(viewerCount, isLiveIcon);
        }

        switch (this._platform) {
            case "mixer":
                banner.style.background = this.getPlatformColor();
                break;
            case "twitch":
                banner.style.background = this.getPlatformColor();
                break;
        }

        return banner;
    }

    _genEmbedChat() {
        var iframe = document.createElement("iframe");
        iframe.src = this.getChatURL();
        iframe.classList.add("chat");
        iframe.frameBorder = "0";
        iframe.scrolling = "no";

        return iframe;
    }

    _runAPICalls(viewers, liveIndicator) {
        console.log(`Polling ${this._username} (${this._platform})...`);

        let request = new XMLHttpRequest();
        switch(this._platform) {
            case "mixer":
                request.open("GET", "https://mixer.com/api/v1/channels/" + this._username, true);
                request.onload = function () {
                    // Begin accessing JSON data here
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
                    // Begin accessing JSON data here
                    let data = JSON.parse(this.response);

                    if(data.data.length == 0) {
                        viewers.textContent = "Not Live";
                        liveIndicator.classList.remove("live");
                    } else {
                        let stream = data.data[0];
                        viewers.textContent = `LIVE | ${stream.viewer_count.toLocaleString()} viewers | Uptime: ${Stream.get_uptime(stream.started_at)}`;
                        liveIndicator.classList.add("live");
                    }
                };
                request.setRequestHeader("CLIENT-ID", Stream.TWITCH_CLIENT_ID);
                break;
        }
        request.send();

        // Setup next run interval
        setTimeout(() => { this._runAPICalls(viewers, liveIndicator); }, 3 * 60 * 1000);
    }
}