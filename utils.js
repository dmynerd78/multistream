/**
 * Add all streams to DOM
 * @param {Array} streams list of all streams with in format "platform:channelName"
 * @param {Array} settings list of options to skip: "novideo", "nochat", "nobanner", "noapi"
 * @param {Array} streamColumns list of all streams added to DOM
 * @param {DOM} startCol if specified, add column *after* startCol. Else add to end of all columns
 */
function genColumns(streams, settings, streamColumns, startCol=null) {
    document.querySelector("#stream-gen").classList.add("hidden");
    document.querySelector("#stream-chats").classList.remove("hidden");

    for (var index in streams) {
        let channel = streams[index].split(":");

        // Ignore blank channel
        if (channel[0] == "") {
            continue;
        }

        noAPI = settings.indexOf("noapi") == -1;
        let plat = channel[0];
        let user = channel[1];

        // Skip user if already exists
        let skipUser = false;
        for(let i=0; i< streamColumns.length; i++) {
            let s = streamColumns[i];

            if(s.getUsername() == user && s.getPlatform().substr(0, 1) == plat) {
                skipUser = true;
                break;
            }
        }
        if(skipUser) {
            continue;
        }

        let options = 0;
        if (settings.indexOf("novideo") == -1) { options |= ENABLE_VIDEO; }
        if (settings.indexOf("nobanner") == -1) { options |= ENABLE_BANNER; }
        if (settings.indexOf("nochat") == -1) { options |= ENABLE_CHAT; }
        console.log(options.toString(2));

        let stream = new Stream(user, plat, options, noAPI);

        let div = stream.getDOM();

        streamColumns.push(stream);
        if (startCol === null || startCol.nextSibling === null) {
            document.querySelector("#stream-chats").appendChild(div);
        } else {
            document.getElementById("stream-chats").insertBefore(div, startCol.nextSibling);
        }
    }

    return streamColumns;
}

/**
 * Utility to add a new input row to #stream-gen
 */
function addStream() {
    // Deep Clone used to prevent same-reference conflicts
    document.querySelector("#stream-gen .wrapper").appendChild(STREAM_ROW.cloneNode(true));
}

/**
 * Remove a given DOM element from the document
 * @param {dom} node a DOM element you wish to remove
 */
function removeDOMElement(node) {
    var parent = node.parentElement;
    parent.removeChild(node);
}

/**
 * Read #stream-gen inputs and updates the URL with all the options
 */
function readInputStreams() {
    var dataStreams = [];

    // Streamers
    var streams = document.querySelectorAll("#stream-gen .input-group");
    let invalidInput = false;
    streams.forEach(function(inputGroup) {
        username = inputGroup.children[0].value;
        platform = inputGroup.children[1].value;

        inputGroup.children[0].classList.remove("error");
        inputGroup.children[1].classList.remove("error");

        if(platform == "") {
            inputGroup.children[1].classList.add("error");
            invalidInput = true;
        }
        if(username == "") {
            inputGroup.children[0].classList.add("error");
            invalidInput = true;
        }
        if(invalidInput) { return; }

        dataStreams.push(platform[0] + ":" + username);
    });

    // Prevent URL being updated if not all inputs are being used
    if(invalidInput) { return; }

    // Extra Options
    var dataOptions = [];
    noVideoChat = document.querySelector("#noVideoChat").value;
    noBanner = document.querySelector("#noBanner").checked;
    noAPICalls = document.querySelector("#noAPICalls").checked;
    if (noVideoChat != "") { dataOptions.push(noVideoChat); }
    if (noBanner) { dataOptions.push("nobanner"); }
    if (noAPICalls) {dataOptions.push("noapi"); }


    // Add arguments to URL
    search = "?" + dataStreams.join("+");
    if(dataOptions.length > 0) {
        search += "&" + dataOptions.join("+");
    }
    window.location.search = search;
}

/**
 * Clamps num within the between min and max
 * @param {int} num number to clamp
 * @param {int} min minimum return value
 * @param {int} max maximum return value
 */
function clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num;
}


var prevChatY;
/**
 * Resize all chats to a given height
 * @param {*} element divWrapper which had it's MouseEvent fired
 * @param {*} event MouseEvent that was fired
 */
function resize(element, event) {
    const dx = window.prevChatY - event.y;
    window.prevChatY = event.y;

    let desiredHeight = parseInt(getComputedStyle(element, '').height) + dx;
    desiredHeight = clamp(desiredHeight, 300, window.innerHeight - 250);
    window.chatHeightSheet.innerHTML = `.col .chatWrapper { height: ${desiredHeight}px !important; }`;
}

/**
 * Remove a stream from #stream-chats.
 * If it removes the last stream, it'll auto show the generate new multi
 * by removing the search component of window.location
 * @param {string} username the name of the streamer to remove
 */
function removeDOMStream(username, streamColumns) {
    for(i = 0; i < streamColumns.length; i++) {
        let currCol = streamColumns[i];

        if (currCol.getUsername().toLowerCase() == username.toLowerCase()) {
            currCol.stopAPICalls();

            let removeSearch = currCol.getPlatform().substr(0, 1) + ":" + currCol.getUsername();
            removeDOMElement(document.querySelector(`#stream-chats .col:nth-child(${i+1})`));
            urlParser.removeStream(removeSearch);
            streamColumns.splice(i, 1);
            return;
        }
    }
}

function compactedMode() {
    document.getElementById("stream-chats").style.flexWrap = "wrap";

    for(let i=0; i<streamColumns.length; i++) {
        streamColumns[i].compactedMode();
    }
}

// TODO Docstring
function expandedMode() {
    document.getElementById("stream-chats").style.removeProperty("wrap");

    for (let i = 0; i < streamColumns.length; i++) {
        streamColumns[i].expandedMode();
    }
}

/**
 * Create DOM element given HTML string representation
 * https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
 * @param {String} HTML representing a single element
 * @return {Element}
 */
function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

class URLParams {
    constructor(search) {
        if(search.startsWith("?")) {
            search = search.substr(1);
        }

        search = search.split("&");
        this._streams = search[0].split("+");
        this._settings = [];
        if (search.length > 1) {
            this._settings = search[1].split("+");
        }

        console.log("Parsed arguments:");
        console.log({"streams": this._streams, "settings": this._settings});
    }

    isValid() {
        return this._streams.length != 0 && this._streams[0] != "";
    }

    /**
     * Add a stream to the URL. Returns true if added false it's a duplicate
     * @param {string} platform either "mixer" or "twitch"
     * @param {string} username username of the player to add
     */
    addStream(platform, username) {
        platform = platform.slice(0, 1).toLowerCase();
        let checkString = platform + ":" + username.toLowerCase();
        for(let index in this._streams) {
            let currStream = this._streams[index].toLowerCase();

            if (currStream == checkString) {
                return false;
            }
        }

        this._streams.push(`${platform}:${username}`);
        this.updateSearch();
        return true;
    }

    /**
     * Remove a stream from the URL. Returns true if removed. False if not found in URL
     * @param {string} stream a string in the format "<platform_prefix>:<username>"
     * where platform_prefix is "m" for Mixer and "t" for Twitch
     * where username is the username of the channel
     */
    removeStream(stream) {
        stream = stream.toLowerCase();
        for(i=0; i<this._streams.length; i++) {
            if(this._streams[i].toLowerCase() == stream) {
                this._streams.splice(i, 1);
                this.updateSearch();
                return true;
            }
        }

        return false;
    }

    updateSearch() {
        if(this._streams.length == 0) {
            document.querySelector("#stream-gen").classList.remove("hidden");
            document.querySelector("#stream-chats").classList.add("hidden");
            history.pushState(null, '', window.location.pathname);
            return;
        }

        let search = this._streams.join("+");
        if(this._settings.length != 0) {
            search += "&" + this._settings.join("+");
        }
        let newPath = window.location.pathname + '?' + search;
        history.pushState(null, '', newPath);
        // history.replaceState(null, '', newPath);
    }

    getStreams() {
        return this._streams.slice();
    }

    getSettings() {
        return this._settings.slice();
    }
}