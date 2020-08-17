/**
 * Utility to add a new input row to #stream-gen
 */
function addStreamGenInput() {
    // Use deep copy clone to prevent same-reference conflicts
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

        inputGroup.children[0].classList.remove("error");
        inputGroup.children[1].classList.remove("error");

        if(username == "") {
            inputGroup.children[0].classList.add("error");
            invalidInput = true;
        }
        if(invalidInput) { return; }

        dataStreams.push(username);
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

    // Update search which then forces index's JS to rerun
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
function resizeChats(element, event) {
    const dx = window.prevChatY - event.y;
    window.prevChatY = event.y;

    let desiredHeight = parseInt(getComputedStyle(element, '').height) + dx;
    desiredHeight = clamp(desiredHeight, 300, window.innerHeight - 250);
    window.chatHeightSheet.innerHTML = `.col .chatWrapper { height: ${desiredHeight}px !important; }`;
}

/**
 * Whenever window is rezied, check if banner content needs to be hidden
 * to fit within a single line. Couldn't figure out how to get this
 * working with CSS sadly. Resize event only works on window (not ideal)
 */
function resizeBanners() {
    let streamColumns = window.streamManager.getStreamList();

    for(let i=0; i<streamColumns.length; i++) {
        streamColumns[i].checkBannerSize();
    }
}

window.addEventListener("resize", resizeBanners, false);

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

            let removeSearch = currCol.getUsername();
            removeDOMElement(document.querySelector(`#stream-chats .col:nth-child(${i+1})`));
            urlParser.removeStream(removeSearch);
            streamColumns.splice(i, 1);
            return;
        }
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