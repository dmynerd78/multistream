function genColumns() {
    document.querySelector("#stream-gen").classList.add("hidden");
    document.querySelector("#stream-chats").classList.remove("hidden");

    var settings = [];
    if (search.length > 1) {
        settings = search[1].split("/");
    }

    for (var index in streams) {
        let channel = streams[index].split(":");
        if (channel[0] == "") {
            continue;
        } // Ignore blank channel

        let stream = new Stream(channel[1], channel[0]);

        let div = document.createElement("div");
        div.classList.add("col");
        if (settings.indexOf("novideo") == -1) {
            div.appendChild(stream.getPlayer());
        }

        if(settings.indexOf("nobanner" == -1)) {
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
    document.querySelector("#stream-gen .wrapper").appendChild(STREAM_ROW.cloneNode(true));
}

function removeStream(node) {
    parent = node.parentElement;
    parent.removeChild(node);
}

function readInputStreams() {
    return;

    // window.location.search = "";
}