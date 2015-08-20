var app = require("express")();
var server = app.listen(9000);
var io = require('socket.io').listen(server);

app.get("/", function(req, res) {
	res.sendFile(__dirname + '/index.html')
})

var clients = [];


io.on('connection', function (socket) {
  console.log(socket.id);
  clients.push(socket);
	
  socket.on('line', function (data) {
    //console.log(socket.id + ": " + data);
	for(var i = 0; i < clients.length; i++){
		if(clients[i]!=socket)
		{
			clients[i].emit('line', data);
		}
	}
  });
});

