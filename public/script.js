
//establish connection to peer server
//let peer = new Peer({host: 'nodejs', port: 9000, path: '/peerjs'});
//let peer = new Peer({key: 'lwjd5qra8257b9'});
let peer = new Peer(null, {
    debug: false
});

updateMessage("Connecting to peer server.");

//establish WebSocket connection to server
let socket = io({
    //Auto reconnection fucks up sessionhandling
    reconnection: false
});

//stores connection to other peer
let dataConnection = null;

//ask for user media
const getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
const remoteVideo = document.getElementById('remoteVideo');

//received peer client and working connection to peer server
peer.on('open', function (id) {
    updateMessage("Connected to peer server.");
    //emitting peer id to server
    socket.emit('new peer', id);

    //display peer id as background
    $('#key').text(id);

    search();
});

//someone tries to connect to you
peer.on('connection', function(conn) {

    //save passed connection globally
    dataConnection = conn;

    //if connection works
    conn.on('open', function() {

        //change gui
        connectionEstablished();

        //if receiving data
        conn.on('data', function(data) {
            console.log(data);
        });
    });

    //if connection closed
    conn.on('close', function() {
        connectionClosed();
        search();
    });

    //if error occured
    conn.on('error', function(err) {
        console.log('connection error: ' + err);
    });
});

//someone tries to call you
peer.on('call', function(call) {
    updateMessage("Someone found you.");
    navigator.getUserMedia({video: true, audio: false}, function(stream) {

        call.answer(stream);

        call.on('stream', function(remoteStream) {
            remoteVideo.srcObject = remoteStream;
            remoteVideo.play();
        });

    }, function(err) {
        console.log('Failed to get local stream' ,err);
    });
});

peer.on('error', function(err) {
    updateMessage("Peer error. Please refresh page!");
    peer = new Peer(null, {
        debug: false
    });
});

//server tells who to connect to by passing client
socket.on('establishConnection', function(client) {

    console.log('establishConnection');
    //establish connection to peer client & save connection globally
    dataConnection = peer.connect(client.peerId);

    //if could establish connection to peer
    dataConnection.on('open', function() {
        console.log('dataConnection.on open');
        //change gui
        connectionEstablished();

        //call other peer
        mediaCall(client);

        //if receiving data
        dataConnection.on('data', function(data) {
            console.log(data);
        });

        //if connection closed
        dataConnection.on('close', function() {
            console.log('dataConnection close');
            connectionClosed();
        });
    });

    //if error occured
    dataConnection.on('error', function(err) {
        console.log(err);
        dataConnection = null;
        search();
    });
});

//change gui due to connection closed
function connectionClosed() {
    updateMessage("Connection closed.");
    document.getElementById('triangle').style = "clip-path: polygon(90% 0%, 20% 100%, 100% 100%, 100% 0%); backdrop-filter: blur(10px)";
    document.getElementById('remoteVideo').style = "display: none;";
    document.getElementById('remoteCanvas').style = "display: none;";
    document.getElementById('slideContainer').style = "display: none;";
}

//change gui due to connection established
function connectionEstablished() {

    updateMessage("Connection established.");
    document.getElementById('triangle').style = "clip-path: polygon(0% 0, 0% 100%, 100% 100%, 100% 0%); backdrop-filter: blur(15px)";
    document.getElementById('remoteVideo').style = "display: flex;";
    document.getElementById('remoteCanvas').style = "display: flex;";
    document.getElementById('slideContainer').style = "display: flex;";

}

//client pressed search
function search() {

    updateMessage("Searching for other client...");
    //calls search function on socket server
    socket.emit('search', socket.id);
}

//call other client with peerId
function mediaCall(client) {
    navigator.getUserMedia({video: true, audio: false}, function(stream) {

        let call = peer.call(client.peerId, stream);

        call.on('stream', function(remoteStream) {
            remoteVideo.srcObject = remoteStream;
            remoteVideo.play();
        });

        call.on('close', function() {
            updateMessage("Call ended.");
            search();
        });

        call.on('error', function(err) {
            updateMessage("Error occured.");
            console.log('dataConnection.on error');
            console.log(err);
            search();

        });
    }, function(err) {
        console.log('Failed to get local stream' ,err);
    });
}

function updateMessage(input) {
    $('#message').text(input);
}