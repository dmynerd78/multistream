// TODO Docstrings
class StreamManager {

    // Format: ?stream1+stream2+stream3&option1+option2
    // Search streamer is on Twitch platform
    constructor(search, columnsGen, columnsRoot) {
        if (search.startsWith("?")) {
            search = search.substr(1);
        }

        this._columnsGen = columnsGen;
        this._columnsRoot = columnsRoot;
        search = search.split("&");
        this._settings = [];
        if (search.length > 1) {
            this._settings = search[1].split("+");
        }

        // Could save as single binary number but would reduce readability elsewhere
        // Could also save each setting as a field but this would reduce readability when creating streams
        this._doAPI = this._settings.indexOf("noapi") == -1;
        this._streams = search[0].split("+").filter(el => el.trim() != "")
                        .map(user => new Stream(this, user, this._doAPI));
        this._apiTimeout = null;  // Stores setTimeout reference for API calls
        if(this._doAPI) {
            this._runAPICalls();
        }

        console.log("Parsed arguments:");
        console.log({ "streams": this._streams, "settings": this._settings });
    }

    isValid() {
        return this._streams.length != 0;
    }

    addStream(username, after) {
        let newStream = new Stream(this, username, this._doAPI);
        let newUsername = username.toLowerCase();
        let afterUsername = after.toLowerCase();

        for(let i=0; i<this._streams.length; i++) {
            let currStream = this._streams[i];
            let currUsername = currStream.getUsername().toLowerCase();

            // Stream already exists
            if(currUsername == newUsername) {
                return false;
            }

            // Found stream to place it after
            if(currUsername == afterUsername) {
                this._streams.splice(i+1, 0, newStream);
                let newCol = newStream.getColumn(this._settings);

                if(currStream.getColumn().nextSibling == null) {
                    this._columnsRoot.appendChild(newCol);
                } else {
                    this._columnsRoot.insertBefore(newCol, currStream.getColumn().nextSibling);
                }

                this.updateWindowSearch();
                this.stopAPICalls();
                this._runAPICalls();
                resizeBanners();
                return true;
            }
        }

        // Could not find stream to place it after
        return false;
    }

    removeStream(username) {
        username = username.toLowerCase();

        this._streams = this._streams.filter((s) => {
            return !(s.getUsername().toLowerCase() == username &&
                     removeDOMElement(s.getColumn()));
        });
        this.updateWindowSearch();
        resizeBanners();
    }

    updateWindowSearch() {
        if (this._streams.length == 0) {
            this._columnsGen.classList.remove("hidden");
            this._columnsRoot.classList.add("hidden");
            history.pushState(null, '', window.location.pathname);

            this.stopAPICalls();
            return;
        }

        let search = this._streams.map((el) => el.getUsername()).join("+");
        if (this._settings.length != 0) {
            search += "&" + this._settings.join("+");
        }

        if(window.location.search != search) {
            let newPath = window.location.pathname + '?' + search;
            history.pushState(null, '', newPath);
        }
    }

    getStreamList() {
        return this._streams;
    }

    genAllColumns() {
        for (let index in this._streams) {
            let currStream = this._streams[index];
            this._columnsRoot.appendChild(currStream.getColumn(this._settings));
        }

        this._columnsGen.classList.add("hidden");
        this._columnsRoot.classList.remove("hidden");

        resizeBanners();
    }

    _runAPICalls() {
        let users = this._streams.map((el) => el.getUsername()).join("&user_login=");
        if(users == "") { return; }

        console.info(`Polling ${this._streams.map((el) => el.getUsername()).join(",")}...`);

        let request = new XMLHttpRequest();
        request.open("GET", "https://api.twitch.tv/helix/streams?user_login=" + users, true);

        let that = this;
        request.onload = function () { // TODO Use .bind()
            if (this.status == 429) {
                console.warn("Too many API calls! Removing interval (HTTP Status 429)");
                that.stopAPICalls();
                return;
            }

            let payload = JSON.parse(this.response);
            let apiInfo = {};

            for (let index in payload.data) {
                let currItem = payload.data[index];
                apiInfo[currItem.user_name.toLowerCase()] = currItem;
            }

            for(let index in that._streams) {
                let currStream = that._streams[index];

                let text;
                let title;
                let isLive;
                if(currStream.getUsername().toLowerCase() in apiInfo) {
                    let data = apiInfo[currStream.getUsername().toLowerCase()];

                    text = data.viewer_count.toLocaleString() + " viewers";
                    title = "Live for " + get_uptime(data.started_at);
                    isLive = true;
                } else {
                    text = "";
                    title = "";
                    isLive = false;
                }

                currStream.updateBannerInfo(text, title, isLive);
            }
        };
        request.setRequestHeader("CLIENT-ID", Stream.TWITCH_CLIENT_ID);
        request.setRequestHeader("Authorization", `Bearer ${Stream.TWITCH_OAUTH_ID}`);

        request.send();

        // Setup next run interval
        this._apiTimeout = setTimeout(() => { this._runAPICalls(); }, 60 * 1000);
    }

    /**
     * Stop API polling for said stream.
     * *You can not restart API Polling again once this is called*
     */
    stopAPICalls() {
        clearTimeout(this._apiTimeout);
        return true;
    }
}