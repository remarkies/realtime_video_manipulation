//establish connection to peer server
let peer = new Peer({host: 'nodejs', port: 9000, path: '/peerjs'});
//let peer = new Peer({key: 'lwjd5qra8257b9'});

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

    //emitting peer id to server
    socket.emit('new peer', id);

    //display peer id as background
    $('#key').text(id);
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
    });

    //if error occured
    conn.on('error', function(err) {
        console.log('connection error: ' + err);
    });
});

//someone tries to call you
peer.on('call', function(call) {
    navigator.getUserMedia({video: true, audio: true}, function(stream) {
        call.answer(stream); // Answer the call with an A/V stream.
        call.on('stream', function(remoteStream) {
            // Show stream in some video/canvas element.
            console.log('someones calling me');
            remoteVideo.srcObject = remoteStream;
            remoteVideo.play();
        });
    }, function(err) {
        console.log('Failed to get local stream' ,err);
    });
});

peer.on('error', function(err) {
   console.log(err);
});

//server tells who to connect to by passing client
socket.on('establishConnection', function(client) {

    //establish connection to peer client & save connection globally
    dataConnection = peer.connect(client.peerId);

    //if could establish connection to peer
    dataConnection.on('open', function() {

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
            connectionClosed();
        });

        //if error occured
        dataConnection.on('error', function(err) {
            console.log('connection error: ' + err);
        });
    });
});

//gui update triggered by server
socket.on('hud update', function(hud) {

    //hud element 1
    $('#activeUsers').text('Active users: ' + hud.activeUsers);

    //hud element 2
    $('#searchingUsers').text('Searching users: ' + hud.searchingUsers);
});

//change gui due to connection closed
function connectionClosed() {
    document.getElementById('triangle').style = "clip-path: polygon(90% 0%, 20% 100%, 100% 100%, 100% 0%); backdrop-filter: blur(10px)";
    document.getElementById('searchButton').style = "display: block;";
}

//change gui due to connection established
function connectionEstablished() {
    document.getElementById('triangle').style = "clip-path: polygon(0% 0, 0% 100%, 100% 100%, 100% 0%); backdrop-filter: blur(15px)";
    document.getElementById('searchButton').style = "display: none;";
    document.getElementById('loader').style = "display: none";
}

//client pressed search
function search() {

    //calls search function on socket server
    socket.emit('search', socket.id);

    document.getElementById('loader').style = "display: block";
}

function mediaCall(client) {
    navigator.getUserMedia({video: true, audio: true}, function(stream) {
        let call = peer.call(client.peerId, stream);
        call.on('stream', function(remoteStream) {
            // Show stream in some video/canvas element.
            remoteVideo.srcObject = remoteStream;
            remoteVideo.play();
        });
    }, function(err) {
        console.log('Failed to get local stream' ,err);
    });
}


