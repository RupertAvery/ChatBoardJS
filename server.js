var app = require("express")();
var Board = require("./board-server.js");
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();

var server = app.listen(9000);
var io = require('socket.io').listen(server);

app.get("/", function(req, res) {
	res.sendFile(__dirname + '/index.html');
})

app.get("/board", function(req, res) {
	res.sendFile(__dirname + '/board.html');
})

function clean(data) {
	return entities.encode(data)
}

function serveStatic(request, response) {
	console.log(request.originalUrl);
	console.log(" => " + __dirname + request.path);
	response.sendFile(__dirname + request.path);
}
	
function ignoreRoute(url)
{
	app.get(url, serveStatic)
}

app.get(/\/images\/*/, function(req, res) {
	var board = manager.getBoardById(req.query.board);
	if (board) {
		board.getImage(res, req.query.img);
	} else {
		socket.emit('error', { message: "Board does not exist!" });
	}
})

ignoreRoute(/\/scripts\/*/);
ignoreRoute(/\/css\/*/);
ignoreRoute(/\/fonts\/*/);

function BoardManager() {
	var boards = {};

	function createBoard(name) {
		var board = new Board(name)
		boards[board.id] = board;
		return board;
	}

	return {
		createBoard: createBoard,
		getBoardById: function(id) {
			return boards[id];
		}
	}
}

var manager = new BoardManager();


function registerJoin(socket) {
	socket.on('join', function (data) {
		var board = manager.getBoardById(data.id);
		if (board) {
			board.join(socket, data);
		} else {
			socket.emit('error', { message: "Board does not exist!" });
		}
	});
}

function registerRejoin(socket) {
	socket.on('rejoin', function (data) {
		var board = manager.getBoardById(data.id);
		if (board) {
			board.rejoin(socket, data.sessionId);
		} else {
			socket.emit('error', { message: "Board does not exist!" });
		}
	});
}

function registerGetBoardInfo(socket) {
	socket.on('getBoardInfo', function (data) {
		var board = manager.getBoardById(data.id);
		if (board) {
			socket.emit('boardInfo', { name: board.name });
		} else {
			socket.emit('errorhandler', { message: "Board does not exist!" });
		}
	});
}


function registerCreate(socket) {
	socket.on('create', function (data) {
		var board = manager.createBoard(data.name);
		console.log("Created a new board: " + board.name + " (" + board.id + ")");
		socket.emit('created', { id: board.id, name: board.name });
	});
}

// wait for a connection from a client
io.on('connection', function (socket) {
	console.log(socket.id);
	// add this socket to the clients list
	registerJoin(socket);
	registerRejoin(socket);
	registerCreate(socket);
	registerGetBoardInfo(socket);


});

