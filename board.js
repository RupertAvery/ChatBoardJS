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

	var messages = [ 'chat', 'newline', 'addpoint', 'move', 'remove', 'image'];

	var messageProcessor = {
		'chat' : function(client, data) {
			return data;
		}
	}

	var messageHandlers = {
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

	function register(socket, message, processor){
		
		socket.on(message, function (data) {
			if(messageHandlers[message]) {
				messageHandlers[message](data);
			}

			for(var i = 0; i < clients.length; i++){
				// don't send the same message to the originating socket
				if(clients[i] != socket)
				{
					if (messageProcessor[message]) {
						data = messageProcessor[message](clients[i], data)
					}
					
					clients[i].emit(message, data);
				}
			}
		});
	}

	function join(socket, name) {
		
		if(!name || name.length == 0) {
			socket.emit('joinerror', { message: 'You need to enter a name to join' });
			return;
		}
		
		if(!board.users[data.name]) {
			
			board.users[data.name] = { name: data.name, socket: socket };
			
			console.log(socket.id + " joins board: " + name);
			
			clients.push(socket);
			
			// attach all message handlers to this socket
			
			for(var j = 0; j < messages.length; j++)
			{
				register(socket, messages[j], board);
			}
			
			socket.emit('welcome', { } );
			
			for(var i = 0; i < clients.length; i++){
				// don't send the same message to the originating socket
				if(clients[i] != socket)
				{
					clients[i].emit('joined', { name: data.name });
				}
			}
			
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
	}
}

module.exports = Board