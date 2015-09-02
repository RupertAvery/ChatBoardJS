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

function clean(data) {
	return entities.encode(data)
}

var messages = [ 'chat', 'newline', 'addpoint', 'move', 'remove' ];

var messageHandlers = {
	'chat' : function(board, data) {
		board.messages.push(data)
	},
	'newline' : function(board, data) {
		board.objects[data.name] = { type: 'line', name: data.name, x: data.x, y: data.y, color: data.color, offset: { x: 0, y: 0 } }
	},
	'addpoint' : function(board, data) {
		board.objects[data.name].points = board.objects[data.name].points || [];
		board.objects[data.name].points.push(data);
	},
	'move' : function(board, data) {
		var offset = board.objects[data.name].offset
		offset.x += data.x;
		offset.y += data.y;
	},
	'remove' : function(board, data) {
		delete board.objects[data.name];
	}
}

function register(socket, message, board, processor){

	socket.on(message, function (data) {
		if(messageHandlers[message]) {
			messageHandlers[message](board, data);
		}

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
			socket.emit('replay', { objects: board.objects, messages: board.messages });
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
		boards[id] = { id: id, name: data.name, messages: [], clients: [], objects: {} };
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

