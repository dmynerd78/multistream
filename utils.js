/**
 * Add all streams to DOM
 * @param {Array} streams list of all streams with in format "platform:channelName"
 * @param {Array} settings list of all supported options: "novideo", "nochat", "nobanner", "noapi"
 */
function genColumns(streams, settings) {
    document.querySelector("#stream-gen").classList.add("hidden");
    document.querySelector("#stream-chats").classList.remove("hidden");

    for (var index in streams) {
        let channel = streams[index].split(":");

        // Ignore blank channel
        if (channel[0] == "") {
            continue;
        }

        noAPI = settings.indexOf("noapi") == -1;

        let stream = new Stream(channel[1], channel[0], noAPI);

        let div = document.createElement("div");
        div.classList.add("col");
        if (settings.indexOf("novideo") == -1) {
            div.appendChild(stream.getPlayer());
        }

        if (settings.indexOf("nobanner") == -1) {
            div.appendChild(stream.getBanner());
        }

        if (settings.indexOf("nochat") == -1) {
            div.appendChild(stream.getChat());
        }

        streams[index] = stream;
        document.querySelector("#stream-chats").appendChild(div);
    }

    console.log("Streams:");
    console.log(streams);
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
