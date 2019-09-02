class Stream {
    constructor(username, platform) {
        if(username == "") { throw "Username empty"; }

        platform = platform.trim().toLowerCase();
        if (platform != "mixer" && platform != "twitch") {
            throw "Invalid platform";
        }

        this.username = username;
        this.platform = platform;
    }

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

    genEmbedChat() {
        var iframe = document.createElement("iframe");
        iframe.src = this.getChatURL();
        iframe.classList.add("chat");
        iframe.frameBorder = "0";
        iframe.scrolling = "no";

        return iframe;
    }

    genEmbedVideo() {
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

    genBanner() {
        var banner = document.createElement("div");
        var channelName = document.createElement("span");
        var channelButton = document.createElement("a");

        banner.classList.add("banner");
        banner.appendChild(channelName);
        banner.appendChild(channelButton);

        channelName.innerText = this.username;
        channelName.classList.add("channelName");

        channelButton.classList.add("channelButton");
        channelButton.href = this.getChannelURL();
        channelButton.target = "_blank";
        channelButton.innerText = "Open";

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
}