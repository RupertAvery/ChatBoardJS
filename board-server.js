function makeid()
{
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for( var i=0; i < 24; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

function Board(boardname) {
	var id = makeid();
	var name = boardname;
	var clients = [];
	var messages = [];
	var objects = {};
	var users = {};

	
	var commands = [ 'chat', 'newline', 'addpoint', 'move', 'remove', 'image'];

	var commandPreProcessor = {
		'chat' : function(client, data) {
			data.from = client.name; 
			return data;
		}
	}

	var commandHandlers = {
		'chat' : function(data) {
			messages.push(data)
		},
		'newline' : function(data) {
			objects[data.name] = { type: 'line', name: data.name, x: data.x, y: data.y, color: data.color, offset: { x: 0, y: 0 } }
		},
		'image' : function(data) {
			objects[data.name] = { type: 'image', name: data.name, href: data.href, width: data.width, height: data.height, offset: { x: 0, y: 0 } }
		},
		'addpoint' : function(data) {
			objects[data.name].points = objects[data.name].points || [];
			objects[data.name].points.push({ x: data.x, y: data.y });
		},
		'move' : function(data) {
			var offset = objects[data.name].offset
			offset.x += data.x;
			offset.y += data.y;
		},
		'remove' : function(data) {
			delete objects[data.name];
		}
	}

	function register(client, command){
		
		client.socket.on(command, function (data) {
			if (commandPreProcessor[command]) {
				data = commandPreProcessor[command](client, data)
			}		

			if(commandHandlers[command]) {
				commandHandlers[command](data);
			}

			for(var i = 0; i < clients.length; i++){
				// don't send the same message to the originating socket
				if(clients[i].socket != client.socket)
				{
		
					clients[i].socket.emit(command, data);
				}
			}
		});
	}
	
	function broadcast(command, data, socket) {
		for(var i = 0; i < clients.length; i++) {
			// don't send the same command to the originating socket
			if(clients[i].socket != socket)
			{
				clients[i].socket.emit(command, data);
			}
		}
	}

	function join(socket, username) {
		
		if(!username || username.length == 0) {
			socket.emit('joinerror', { message: 'You need to enter a name to join' });
			return;
		}
		
		if(!users[username]) {
			
			users[username] = { name: username, socket: socket };
			
			console.log(socket.id + " joins board: " + name);
			
			var client = { name: username, socket: socket };
			
			clients.push(client);
			
			// attach all message handlers to this socket
			
			for(var j = 0; j < commands.length; j++)
			{
				register(client, commands[j]);
			}
			
			socket.emit('welcome', { } );
			
			broadcast('joined', { name: username }, socket);
			
			socket.emit('replay', { objects: objects, messages: messages });
		} else {
			socket.emit('joinerror', { message: 'That name is already in use!' });
		}
			
	}
	
	return {
		id: id,
		name: name,
		messages: messages,
		clients: clients,
		objects: objects,
		join: join
	}
}

module.exports = Board