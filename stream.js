/** Class representation of a stream */
class Stream {
    /**
     * Create a stream
     * @param {string} username - Username of the channel.
     * @param {string} y - Platform user is on ("twitch" or "mixer").
     */
    constructor(username, platform) {
        if(username == "") { throw "Username empty"; }

        platform = platform.trim().toLowerCase();
        if (platform != "mixer" && platform != "twitch" &&
            platform != "m" && platform != "t") {
                throw "Invalid platform";
        }

        if(platform == "m") { platform = "mixer"; }
        if (platform == "t") { platform = "twitch"; }

        this.username = username;
        this.platform = platform;

        this._player = this._genEmbedVideo();
        this._banner = this._genBanner();
        this._chat = this._genEmbedChat();
    }

    getPlayer() {
        return this._player;
    }

    getBanner() {
        return this._banner;
    }

    getChat() {
        return this._chat;
    }

    /**
     * Get stream url.
     * @return {string} HTTPS url channel
     */
    getChannelURL() {
        switch (this.platform) {
            case "mixer":
                return "https://mixer.com/" + this.username;
            case "twitch":
                return "https://twitch.tv/" + this.username;
        }
    }

    getPlatformColor() {
         switch (this.platform) {
             case "mixer":
                 return "#1FBAED";
             case "twitch":
                 return "#6441A4";
         }
    }

    getVideoURL() {
        switch (this.platform) {
            case "mixer":
                return "https://mixer.com/embed/player/" + this.username;
            case "twitch":
                return "https://player.twitch.tv/?channel=" + this.username;
        }
    }

    getChatURL() {
        switch (this.platform) {
            case "mixer":
                return "https://mixer.com/embed/chat/" + this.username;
            case "twitch":
                return "https://www.twitch.tv/embed/" + this.username + "/chat";
        }
    }

    _genEmbedVideo() {
        var iframe = document.createElement("iframe");
        iframe.classList.add("player");
        iframe.allowFullscreen = "true";
        iframe.frameBorder = "0";
        iframe.scrolling = "no";

        switch (this.platform) {
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

        banner.classList.add("banner");
        banner.appendChild(channelName);
        banner.appendChild(channelButton);
        banner.appendChild(viewerCount);

        channelName.innerText = this.username;
        channelName.classList.add("channelName");

        channelButton.classList.add("channelButton");
        channelButton.href = this.getChannelURL();
        channelButton.target = "_blank";
        channelButton.innerText = "Open";

        // TODO Implement
        viewerCount.classList.add("viewerCount");
        // viewerCount.innerText = "10 viewers";

        switch (this.platform) {
            case "mixer":
                banner.style.background = this.getPlatformColor();
                // TODO Current viewer polling
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
}