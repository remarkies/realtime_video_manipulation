var express = require('express');
var app = express();
var http = require('http').createServer(app);
var path = require('path');
var io = require('socket.io')(http);
app.use(express.static('public'));

//make files accessible on /
app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

http.listen(8080, function(){
    log('listening on *:8080');
});

//holds all clients which are connected to the server
let clients = [];


//console output with current time + message
function log(message) {
    let today = new Date();
    let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    let dateTime = date+' '+time;
    console.log(dateTime + ' - ' + message);
}

function generateHudValues(socket) {
    //console.log('Clients', clients);
    let searchingUsers = clients.filter(function(e) { return e.searching === true});
    let returnValue = {
        activeUsers: clients.length,
        searchingUsers: searchingUsers.length,
        serverVersion: 1.0
    };
    return returnValue;
}

function getClient(socketId) {
    return clients.find(o => o.socketId === socketId);
}

function addClient(socketId, peerId = null, searching = false) {
    clients.push({ socketId: socketId, peerId: peerId, searching: searching });
}

function removeClient(socketId) {
    //holds index of disconnected client in list
    let index = -1;

    //get index of disconnected client in list
    for(let i = 0; i < clients.length; i++)
        if(clients[i].socketId === socketId)
            index = i;

    //delete disconnected client from list
    clients.splice(index, 1);
}

function changeClientSearchingState(socketId, searchingState) {
    let client = getClient(socketId);

    if(client !== undefined) {
        client.searching = searchingState;
    } else {
        log('Could not change searching state of client!', socketId);
    }
}

io.on('connection', function(socket){

    log('Connecting ' + socket.id);

    let existsClient = getClient(socket.id);

    if(existsClient === undefined) {
        addClient(socket.id);
    }

    socket.on('new peer', function(peerId){
        //add new peerId to client
        let client = getClient(socket.id);

        if(client !== undefined) {
            client.peerId = peerId;
            log('Updated peerId ' + client.peerId + ' of client ' + client.socketId);
        } else {
            log('Could not find client for new peer! SocketId: ' + socket.Id);
        }

        //push hud update (active clients value changed)
        io.emit('hud update', generateHudValues(socket));
    });

    socket.on('search', function(socketId) {

        log('Client ' + socketId + ' called search function');

        //find a searching client
        let searchingClient = clients.find(o => o.searching && o.peerId !== null);

        //if found another searching client
        if(searchingClient !== undefined) {

            log('Server wants to connect ' + searchingClient.socketId + ' to ' + socketId);

            //push awaiting client object to searching client
            io.to(socketId).emit('establishConnection', searchingClient);

            //update awaiting client's searching state
            changeClientSearchingState(searchingClient.socketId, false);

        } else {

            //find requesting client in list
            let requestingClient = getClient(socketId);

            if(requestingClient !== undefined) {
                //update requesting client's searching state
                changeClientSearchingState(requestingClient.socketId, true)
            } else {
                log('Client handling problem! SocketId: ' + socketId);
            }

        }

        //push hud update (searching clients value changed)
        io.emit('hud update', generateHudValues(socket));
    });

    socket.on('disconnect', function(){
        log('Disconnected ' + socket.id);

        removeClient(socket.id);

        //push hud update (active or searching clients value may have changed)
        io.emit('hud update', generateHudValues(socket));
    });

    socket.on('error', (error) => {
        log(error);
    });
});
