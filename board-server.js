function atob(str) {
    return new Buffer(str, 'base64').toString('binary');
}
 
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
	var messages = [];
	var objects = {};
	var users = {};
	var images = {};
	
	var commands = [ 'chat', 'newline', 'addpoint', 'move', 'remove', 'image', 'text' ];
	
	function getImage(res, imgid) {
		var image = images[imgid];
		if(image) {
			res.writeHead(200, { 'Content-Type' :  image.contentType });
			res.end(image.data, 'binary');
		}
	}
		
	var commandPreProcessor = {
		'chat' : function(user, data) {
			data.from = user.name; 
			return data;
		}, 
		'image' : function(user, data) {
			if(data.href.substring(0,5) == 'data:') {
				var imgid = makeid();
				var regex = /^data:.(.+);base64,(.*)$/;
				var matches = data.href.match(regex);
				images[imgid] = { 
					contentType : matches[1],
					data: atob(matches[2])
				};
				console.log("Saved image:" + images[imgid]);
				data.href = '/images/?board=' + id + '&img=' + imgid;
			}
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
		'text' : function(data) {
			objects[data.name] = { type: 'text', text: data.text, font: data.font, style: data.style, size: data.size, width: data.width, height: data.height, offset: { x: 0, y: 0 } }
		},
		'remove' : function(data) {
			delete objects[data.name];
		}
	}

	function register(user, command){
		
		user.socket.on(command, function (data) {
			if (commandPreProcessor[command]) {
				data = commandPreProcessor[command](user, data)
			}		

			if(commandHandlers[command]) {
				commandHandlers[command](data);
			}

			for(var cuser in users) {
				if(users[cuser].socket != user.socket)
				{
					users[cuser].socket.emit(command, data);
				}
			}
		});
	}
	
	function broadcast(command, data, socket) {
		for(var cuser in users) {
			if(users[cuser].socket != socket)
			{
				users[cuser].socket.emit(command, data);
			}
		}
	}
	
	function rejoin(socket, sessionId) {
		for(var user in users) {
			if(users[user].sessionId == sessionId) {
				users[user].socket = socket;

				console.log(socket.id + " rejoins board: " + name + " as " + users[user].name);				

				for(var j = 0; j < commands.length; j++)
				{
					register(users[user], commands[j]);
				}
			
				socket.emit('welcome', {  name: users[user].name, sessionId: sessionId } );
				
				broadcast('joined', { name: users[user].name }, socket);
				
				socket.emit('replay', { objects: objects, messages: messages, users: getUsers() });
				return;
			}
		}
		socket.emit('joinerror', { message: 'Invalid session' });
	}
    
    function getUsers() {
        var userlist = [];
        for(var user in users)
        {
            userlist.push({ name: users[user].name, email: users[user].email });
        }
        return userlist;
    }

    
	function join(socket, data) {
		
		if(!data.name || data.name.length == 0) {
			socket.emit('joinerror', { message: 'You need to enter a name to join' });
			return;
		}
		
		if(!users[data.name]) {
			users[data.name] = { name: data.name, email: data.email, socket: socket, sessionId: makeid() };
			            
			console.log(socket.id + " joins board: " + name);
			
			// attach all message handlers to this socket
			
			for(var j = 0; j < commands.length; j++)
			{
				register(users[data.name], commands[j]);
			}
			
			socket.emit('welcome', { name: users[data.name].name, sessionId: users[data.name].sessionId } );
			
			broadcast('joined', { name: data.name, email: data.email }, socket);
			
			socket.emit('replay', { objects: objects, messages: messages, users: getUsers() });
		} else {
			socket.emit('joinerror', { message: 'That name is already in use!' });
		}
			
	}
	
	return {
		id: id,
		name: name,
		messages: messages,
		objects: objects,
		join: join,
		rejoin: rejoin,
		getImage: getImage
	}
}

module.exports = Board