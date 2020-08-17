// TODO Docstrings
class StreamManager {

    // Format: ?stream1+stream2+stream3&option1+option2
    // Search streamer is on Twitch platform
    constructor(columnsRoot, search) {
        if (search.startsWith("?")) {
            search = search.substr(1);
        }

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
                this._streams.splice(i, 0, newStream);
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

    removeStream(username, service) {
        // TODO Show stream-gen if empty
    }

    updateWindowSearch() {
        // TODO Implement
    }

    getStreamList() {
        return this._streams;
    }

    // Should only be called only once
    genAllColumns() {
        for (let index in this._streams) {
            let currStream = this._streams[index];
            this._columnsRoot.appendChild(currStream.getColumn(this._settings));
        }
    }
}