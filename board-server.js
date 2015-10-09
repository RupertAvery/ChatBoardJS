var Helpers = require("./common/helpers.js")();

function Board(boardname) {
	var id = Helpers.makeid();
	var name = boardname;
	var messages = [];
	var objects = {};
	var users = {};
	var images = {};
	var polls = {};
	
	var commands = [ 'chat', 'path', 'line', 'ellipse', 'rectangle', 'point', 'move', 'scale', 'remove', 'image', 'text', 'transform', 'update', 'update-points', 'points' ];

	function getImage(imgid) {
		return images[imgid];
	}
  
    function handleObject(user, data) {
		data.createdBy = user.name;
		data.createdDate = new Date();
		objects[data.id] = data;
    }

	function updateObject(object, name, attributes) {
		Helpers.extend(object, {
			updatedBy: name,
			updatedDate: new Date()
		});
		Helpers.extend(object, attributes);
	}
	
	var commandHandlers = {
		'chat' : function(user, data) {
			data.from = getUserDetails(user);
			messages.push(data)
		},
		'update': function(user, data) {
			if(Array.isArray(data.id)) {
				for(var i = 0; i < data.id.length; i++) {
					updateObject(objects[data.id[i]], user.name, data.attributes);
				}
			} else {
				updateObject(objects[data.id], user.name, data.attributes);
			}
		},
		'path' : function (user, data) {
			handleObject(user, data);
			objects[data.id].points = [];
		},
		'line' : handleObject,
		'ellipse' : handleObject,
		'rectangle' : handleObject,
		'image' : function(user, data) {
			if (data.href.substring(0,5) == 'data:') {
				var imgid = Helpers.makeid();
				var regex = /^data:.(.+);base64,(.*)$/;
				var matches = data.href.match(regex);
				images[imgid] = {
					contentType : matches[1],
					data: Helpers.atob(matches[2])
				};
				data.href = '/images/?board=' + id + '&img=' + imgid;
				console.log("Saved image: " + data.href);
			}
			handleObject(user, data);
		},
		'text'  : handleObject,
		'point' : function(user, data) {
			objects[data.id].points.push(data.point);
		}, 
		'update-points' : function(user, data) {
			if(data.diff.length < objects[data.id].points.length) {
				objects[data.id].points.splice(data.diff.length, objects[data.id].points.length - data.diff.length)
			}
			for(var i = 0; i < data.diff.points.length; i++) {
				var point = data.diff.points[i];
				objects[data.id].points[point.index] = { x: point.x, y: point.y };
			}
		},
		'move'  : function(user, data) {
			if (Array.isArray(data.id)) {
				for (var i = 0; i < data.id.length; i++) {
					var offset = objects[data.id[i]].offset;
					if (offset) {
						offset.x += data.x;
						offset.y += data.y;
					}
				}
			} else {
				var offset = objects[data.id].offset;
				if (offset) {
					offset.x += data.x;
					offset.y += data.y;
				}
			}
			
		},
		'scale' : function(user, data) {
			var scale = objects[data.id].scale;
            if(scale) {
				scale.x = data.x;
				scale.y = data.y;
            }
		},
		'transform' : function(user, data) {
			var object = objects[data.id];
            if(object.scale && data.scale) {
				object.scale.x = data.scale.x;
				object.scale.y = data.scale.y;
            }
            if(object.offset && data.offset) {
                object.offset.x = data.offset.x;
                object.offset.y = data.offset.y;
            }
		},
		'remove' : function(user, data) {
			if(objects[data.id].type == 'image') {
				var matchid = objects[data.id].href.match(/\/images\/\?board=[A-Za-z0-9]+&img=([A-Za-z0-9]+)/);
				if(matchid && matchid.index >= 0) {
					imgid = matchid[1]; 
					delete images[imgid]
					console.log("Removed image: " + objects[data.id].href); 
				}
			}
			delete objects[data.id];
		}
	}

	function broadcast(command, data, socket) {
		for(var key in users) {
			if(users[key].socket != socket)
			{
				users[key].socket.emit(command, data);
			}
		}
	}
	
	function register(user, command) {
		user.socket.on(command, function (data) {

			if(commandHandlers[command]) {
				commandHandlers[command](user, data);
			}

			broadcast(command, data, user.socket);
		});
	}
	

	// Gets only relevant user information (strips out socket)
	function getUserDetails(user){
		return {
			id: user.id,
			name: user.name, 
			gravatarId: user.gravatarId, 
			facebookId: user.facebookId  
		}
	}

	function User(data, socket) {
		return {
			id: Helpers.makeid(),
			name: data.name, 
			gravatarId: data.gravatarId, 
			facebookId: data.facebookId,
			socket: socket
		}
	}
	
	function init_connection(socket, user) {
		// attach all message handlers to this socket
		for(var j = 0; j < commands.length; j++)
		{
			register(user, commands[j]);
		}

		var details = getUserDetails(user);
		
		socket.emit('welcome', details);
		
		// notify everyone else that someone has joined
		broadcast('joined', details, socket);

		socket.emit('replay', { 
			objects: objects, 
			messages: messages, 
			users: getUsers() 
		});
		
		socket.on('disconnect', function() {
			broadcast('left', { id: user.id, name: user.name }, socket);
			delete users[user.id];
		});	
	}
	
	function rejoin(socket, sessionId) {
		
		for(var key in users) {
			var user = users[key];
			
			if(user.id == sessionId) {
				user.socket = socket;

				console.log(socket.id + " rejoins board: " + name + " as " + user.name);

				init_connection(socket, user);
				return;
			}
		}

		socket.emit('joinerror', { message: 'Invalid session' });
	}

    function getUsers() {
        var userlist = [];
        for(var key in users)
        {
			var user = users[key];
            userlist.push(getUserDetails(user));
        }
        return userlist;
    }

	function isNotUndefinedOrNull(value){
		return value !== undefined && value !== null
	}

	function isNotEmptyString(value){
		return value !== "";
	}
	
	function userExists(data) {
		if(users[data.id] !== undefined && users[data.id] !== null) return true;
		for(var key in users) {
			if(isNotUndefinedOrNull(users[key].facebookId) && users[key].facebookId === data.facebookId) return true;
			if(isNotUndefinedOrNull(users[key].gravatarId) && isNotEmptyString(users[key].gravatarId) && users[key].gravatarId === data.gravatarId) return true;
		}
		return false;
	}

	function join(socket, data) {
		if(!data.name || data.name.length == 0) {
			socket.emit('joinerror', { message: 'You need to enter a name to join' });
			return;
		}

		if(!userExists(data)) {
			var newUser = new User(data, socket); 
			
			users[newUser.id] = newUser;

			console.log(socket.id + " joins board: " + name);

			init_connection(socket, newUser);

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
