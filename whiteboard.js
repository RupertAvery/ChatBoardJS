var app = require("express")();
var Entities = require('html-entities').AllHtmlEntities;
 
var entities = new Entities();

var server = app.listen(9000);
var io = require('socket.io').listen(server);

app.get("/", function(req, res) {
	res.sendFile(__dirname + '/index.html')
})

app.get("/scripts/geometry.js", function(req, res) {
	res.sendFile(__dirname + '/scripts/geometry.js')
})

app.get("/scripts/board.js", function(req, res) {
	res.sendFile(__dirname + '/scripts/board.js')
})

app.get("/scripts/chat.js", function(req, res) {
	res.sendFile(__dirname + '/scripts/chat.js')
})

var clients = [];
var messages = ['line','chat','newline','addpoint','move','remove'];

function clean(data) {
	return entities.encode(data)
}

function register(socket, message, processor){
	socket.on(message, function (data) {
		for(var i = 0; i < clients.length; i++){
			if(clients[i]!=socket)
			{
				if (processor) {
					data = processor(data)
				}
				clients[i].emit(message, data);
			}
		}
	});
}

io.on('connection', function (socket) {
	console.log(socket.id);
	clients.push(socket);

	for(var j = 0; j < messages.length; j++)
	{
		register(socket, messages[j]);
	}
});

