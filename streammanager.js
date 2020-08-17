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
        this._noAPI = this._settings.indexOf("noapi") == -1;
        this._streams = search[0].split("+").filter(el => el.trim() != "")
                        .map(user => new Stream(this, user, this._noAPI));

        console.log("Parsed arguments:");
        console.log({ "streams": this._streams, "settings": this._settings });
    }

    isValid() {
        return this._streams.length != 0;
    }

    addStream(username, after) {
        let newStream = new Stream(this, username, this._noAPI);
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
                     s.stopAPICalls() && removeDOMElement(s.getColumn()));
        });
        this.updateWindowSearch();
    }

    updateWindowSearch() {
        if (this._streams.length == 0) {
            this._columnsGen.classList.remove("hidden");
            this._columnsRoot.classList.add("hidden");
            history.pushState(null, '', window.location.pathname);
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
}