var express = require('express');
var app = express();
var http = require('http').createServer(app);
var path = require('path');
var io = require('socket.io')(http);
app.use(express.static('public'));
const { ExpressPeerServer } = require('peer');

//make express listen on port 9000
const server = app.listen(9000);

//peer-server options
const options = {
    debug: true,
    path: '/peerjs'
};

//create peer-server
const peerServer = ExpressPeerServer(server, options);

//run peer-server with express
app.use(options.path, peerServer);

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
    let searchingUsers = clients.filter(function(e) { return e.searching === true});
    let returnValue = {
        activeUsers: clients.length,
        searchingUsers: searchingUsers.length
    };

    //console.log(socket.id + ' triggered new values: ', returnValue);
    return returnValue;
}

io.on('connection', function(socket){

    socket.on('new peer', function(peerId){

        //add new client to list
        clients.push({ socketId: socket.id, peerId: peerId, searching: false });

        //push hud update (active clients value changed)
        io.emit('hud update', generateHudValues(socket));
    });

    socket.on('search', function(socketId) {

        //find a searching client
        let searchingClient = clients.find(o => o.searching);

        //if found another searching client
        if(searchingClient !== undefined) {

            //push awaiting client object to searching client
            io.to(socketId).emit('establishConnection', searchingClient);

            //update awaiting client's searching state
            searchingClient.searching = false;
        } else {

            //find requesting client in list
            let requestingClient = clients.find(o => o.socketId);

            //update requesting client's searching state
            requestingClient.searching = true;
        }

        //push hud update (searching clients value changed)
        io.emit('hud update', generateHudValues(socket));
    });

    socket.on('disconnect', function(){

        //holds index of disconnected client in list
        let index = 0;

        //get index of disconnected client in list
        for(let i = 0; i < clients.length; i++)
            if(clients[i].socketId === socket.id)
                index = i;

        //delete disconnected client from list
        clients.splice(index, 1);

        //push hud update (active or searching clients value may have changed)
        io.emit('hud update', generateHudValues(socket));
    });
});
