function genColumns() {
    document.querySelector("#stream-gen").classList.add("hidden");
    document.querySelector("#stream-chats").classList.remove("hidden");

    for (var index in streams) {
        let channel = streams[index].split(":");

        // Ignore blank channel
        if (channel[0] == "") {
            continue;
        }

        let stream = new Stream(channel[1], channel[0]);

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

function addStream() {
    // Deep Clone used to prevent same-reference conflicts
    document.querySelector("#stream-gen .wrapper").appendChild(STREAM_ROW.cloneNode(true));
}

function removeStream(node) {
    var parent = node.parentElement;
    parent.removeChild(node);
}

function readInputStreams() {
    var dataStreams = [];

    // Streamers
    var streams = document.querySelectorAll("#stream-gen .input-group");
    invalidInput = false;
    streams.forEach(function(inputGroup) {
        console.log(inputGroup);
        username = inputGroup.children[0].value;
        platform = inputGroup.children[1].value;

        if(username == "") {
            inputGroup.children[0].classList.add("error");
            invalidInput = true;
            return;
        }

        dataStreams.push(platform[0] + ":" + username);
    });

    // Prevent URL being updated if not all inputs are being used
    if(invalidInput) { return; }

    // Extra Options
    var dataOptions = [];
    noVideoChat = document.querySelector("#extra-options .noVideoChat").value;
    noBanner = document.querySelector("#extra-options .noBanner").checked;
    if(noVideoChat != "") { dataOptions.push(noVideoChat); }
    if (noBanner) { dataOptions.push("nobanner"); }


    // Add arguments to URL
    search = "?" + dataStreams.join("+");
    if(dataOptions.length > 0) {
        search += "&" + dataOptions.join("+");
    }
    window.location.search = search;
}