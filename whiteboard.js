var app = require("express")();
var Entities = require('html-entities').AllHtmlEntities;
 
var entities = new Entities();

var server = app.listen(9000);
var io = require('socket.io').listen(server);

function makeid()
{
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for( var i=0; i < 24; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

app.get("/", function(req, res) {
	res.sendFile(__dirname + '/index.html');
})

app.get("/board", function(req, res) {
	res.sendFile(__dirname + '/board.html');
})

app.get("/scripts/geometry.js", function(req, res) {
	res.sendFile(__dirname + '/scripts/geometry.js');
})

app.get("/scripts/board.js", function(req, res) {
	res.sendFile(__dirname + '/scripts/board.js');
})

app.get("/scripts/chat.js", function(req, res) {
	res.sendFile(__dirname + '/scripts/chat.js');
})

var boards = {};

var clients = [];

var messages = [ 'line', 'chat', 'newline', 'addpoint', 'move', 'remove' ];

function clean(data) {
	return entities.encode(data)
}

function register(socket, message, board, processor){

	socket.on(message, function (data) {

		for(var i = 0; i < board.clients.length; i++){
			// don't send the same message to the originating socket
			if(board.clients[i] != socket)
			{
				if (processor) {
					data = processor(data)
				}
				board.clients[i].emit(message, data);
			}
		}
	});
}

function registerJoin(socket) {
	socket.on('join', function (data) {
		var board = boards[data.id];
		if (board) {
			console.log(socket.id + " joins board: " + board.name);
			board.clients.push(socket);
			// attach all message handlers to this socket
			for(var j = 0; j < messages.length; j++)
			{
				register(socket, messages[j], board);
			}
		} else {
			socket.emit('error', { message: "Board does not exist!" });
		}
	});
}

function registerGetBoardInfo(socket) {
	socket.on('getBoardInfo', function (data) {
		var board = boards[data.id];
		if (board) {
			socket.emit('boardInfo', { name: board.name });
		} else {
			socket.emit('errorhandler', { message: "Board does not exist!" });
		}
	});
}

function registerCreate(socket) {
	socket.on('create', function (data) {
		var id = makeid();
		boards[id] = { id: id, name: data.name, clients: [] };
		console.log("Created a new board: " + data.name + " (" + id + ")");
		socket.emit('created', { id: id });
	});
}

// wait for a connection from a client
io.on('connection', function (socket) {
	console.log(socket.id);
	// add this socket to the clients list
	registerJoin(socket);
	registerCreate(socket);
	registerGetBoardInfo(socket);
});

