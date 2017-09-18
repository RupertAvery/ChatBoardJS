var express = require("express");
var ms = require("ms");
var app = express();
var argv = require("optimist").argv;
var Board = require("./board-server.js");
var fs = require("fs");
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();
var server = app.listen(argv.port || 9000);

var __webroot = __dirname + '/web';

var io = require('socket.io').listen(server);

app.get("/", function(req, res) {
	res.sendFile(__webroot + '/index.html');
})

app.get("/reload", function(req, res) {
	Board = require("./board-server.js");
	res.sendFile(__webroot + '/index.html');
})

app.get("/board", function(req, res) {
	res.sendFile(__webroot + '/board.html');
})

function clean(data) {
	return entities.encode(data)
}

app.get('/scripts/fb.js', function(req, res) {
	var data = fs.readFileSync(__webroot + '/scripts/fb.js', 'utf8');
	res.write(data.replace("%appId%", argv.appId));
	res.end();
})

app.use('/common', express.static( __dirname + '/common', { maxAge: ms('30 days') }));
app.use('/fonts', express.static( __webroot + '/fonts', { dotfiles: 'allow', maxAge: ms('30 days') }));
app.use('/scripts', express.static( __webroot + '/scripts', { maxAge: ms('30 days') }));
app.use('/css', express.static( __webroot + '/css', { dotfiles: 'allow', maxAge: ms('30 days') }));
app.use('/images', express.static( __webroot + '/images', { maxAge: ms('30 days') }));

app.get(/\/images\/*/, function(req, res) {
	if(req.query.board) {
		var board = manager.getBoardById(req.query.board);
		if (board) {
			board.getImage(req.query.img, function(image) {
				if (image) {
					res.writeHead(200, { 'Content-Type' :  image.contentType });
					res.end(image.data, 'binary');
				} else {
					res.writeHead(500);
					res.end();
				}
			});
		} else {
			socket.emit('error', { message: "Board does not exist!" });
		}
	} else {
		serveStatic(req, res);
	}
})


app.get('*', function(req, res){
  res.status(404).sendFile(__webroot + '/notfound.html');
});

function BoardManager() {
	var boards = {};

	function createBoard(name) {
		var board = new Board(name)
		boards[board.id] = board;
		return board;
	}
	
	function saveBoards() {
		for(var board in boards){
			boards[board].save();
		}
	}

	function loadBoards() {
		
	}

	function getBoardById(id) {
		var board = boards[id];

		if(!board){
			board = Board.load(id);
			if(board){
				boards[board.id] = board;
			}
		}

		return board;
	}

	return {
		createBoard: createBoard,
		saveBoards: saveBoards,
		loadBoards: loadBoards,
		getBoardById: getBoardById
	}
}

var manager = new BoardManager();

var interval = 5 * 60 * 1000;  // every 5 minutes

setInterval(manager.saveBoards, 10 * 1000);

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
		manager.saveBoards();
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

