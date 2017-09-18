var Helpers = require("./common/helpers.js")();
var fs = require("fs");

var mimetypes = {
  "image/bmp": "bmp",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/svg+xml": "svg"
};

function Board(boardname) {
	this.id = Helpers.makeid();
	this.name = boardname;
	this.messages = [];
	this.objects = {};
	this.users = {};
	this.images = {};
	this.polls = {};
	this.onupdate = function() { };
	this.commands = [ 
		'chat', 
		'image', 'text', 'path', 'line', 'ellipse', 'rectangle', 'point', 
		'move', 'scale', 'remove', 'transform', 
		'update', 'update-points', 'update-text', 'points' 
	];
}

Board.prototype.handleObject = function(user, data) {
	data.createdBy = user.name;
	data.createdDate = new Date();
	this.objects[data.id] = data;
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
		data.from = this.getUserDetails(user);
		this.messages.push(data);
		this.onupdate();
	},
	'update': function(user, data) {
		if(Array.isArray(data.id)) {
			for(var i = 0; i < data.id.length; i++) {
				updateObject(this.objects[data.id[i]], user.name, data.attributes);
			}
		} else {
			updateObject(this.objects[data.id], user.name, data.attributes);
		}
		this.onupdate();
	},
	'update-text': function(user, data) {
		var object = this.objects[data.id];
		for(var i = 0; i < data.changes.length; i++)
		{
			var change = data.changes[i];
			switch(change.type) {
			case 'insert':
				object.lines.splice(change.line, 0, change.text);
				break;
			case 'update':
				object.lines[change.line] = change.text;
				break;
			case 'delete':
				object.lines.splice(change.line, 1);
				break;
			}
		}
		this.onupdate();
	},		
	'path' : function (user, data) {
		this.handleObject(user, data);
		this.objects[data.id].points = [];
		this.onupdate();
	},
	'line' : function (user, data) { this.handleObject(user, data); this.onupdate(); },
	'ellipse' :function (user, data) { this.handleObject(user, data); this.onupdate(); },
	'rectangle' : function (user, data) { this.handleObject(user, data); this.onupdate(); },
	'image' : function(user, data) {
		if (data.href.substring(0,5) == 'data:') {
			var imgid = Helpers.makeid();
			var regex = /^data:(.+);base64,(.*)$/;
			var matches = data.href.match(regex);
			this.images[imgid] = {
				contentType : matches[1]
			};
			this.saveImage(imgid, matches[1], Helpers.atob(matches[2]));
			data.href = '/images/?board=' + this.id + '&img=' + imgid;
			console.log("Saved image: " + data.href);
		}
		this.handleObject(user, data);
		this.onupdate();
	},
	'text' : function (user, data) {
		this.handleObject(user, data);
		this.objects[data.id].lines = [];
		this.onupdate();
	},
	'point' : function(user, data) {
		this.objects[data.id].points.push(data.point);
		this.onupdate();
	}, 
	'update-points' : function(user, data) {
		if(data.diff.length < this.objects[data.id].points.length) {
			this.objects[data.id].points.splice(data.diff.length, this.objects[data.id].points.length - data.diff.length)
		}
		for(var i = 0; i < data.diff.points.length; i++) {
			var point = data.diff.points[i];
			this.objects[data.id].points[point.index] = { x: point.x, y: point.y };
		}
		this.onupdate();
	},
	'move'  : function(user, data) {
		if (Array.isArray(data.id)) {
			for (var i = 0; i < data.id.length; i++) {
				var offset = this.objects[data.id[i]].offset;
				if (offset) {
					offset.x += data.x;
					offset.y += data.y;
				}
			}
		} else {
			var offset = this.objects[data.id].offset;
			if (offset) {
				offset.x += data.x;
				offset.y += data.y;
			}
		}
		this.onupdate();
	},
	'scale' : function(user, data) {
		var scale = this.objects[data.id].scale;
		if(scale) {
			scale.x = data.x;
			scale.y = data.y;
		}
		this.onupdate();
	},
	'transform' : function(user, data) {
		var object = this.objects[data.id];
		if(object.scale && data.scale) {
			object.scale.x = data.scale.x;
			object.scale.y = data.scale.y;
		}
		if(object.offset && data.offset) {
			object.offset.x = data.offset.x;
			object.offset.y = data.offset.y;
		}
		this.onupdate();
	},
	'remove' : function(user, data) {
		if(this.objects[data.id].type == 'image') {
			var matchid = this.objects[data.id].href.match(/\/images\/\?board=[A-Za-z0-9]+&img=([A-Za-z0-9]+)/);
			if(matchid && matchid.index >= 0) {
				imgid = matchid[1]; 
				var image = this.images[imgid];
				delete this.images[imgid];
				this.deleteImage(imgid, image.contentType)
				console.log("Removed image: " + this.objects[data.id].href); 
			}
		}
		delete this.objects[data.id];
		this.onupdate();
	}
}

Board.prototype.broadcast = function(command, data, socket) {
	for(var key in this.users) {
		if(this.users[key].socket != socket)
		{
			this.users[key].socket.emit(command, data);
		}
	}
}

Board.prototype.register = function(user, command) {
	var _this = this;
	user.socket.on(command, function (data) {

		if(commandHandlers[command]) {
			commandHandlers[command].call(_this, user, data);
		}

		_this.broadcast(command, data, user.socket);
	});
}


// Gets only relevant user information (strips out socket)
Board.prototype.getUserDetails = function(user){
	return {
		id: user.id,
		name: user.name, 
		gravatarId: user.gravatarId, 
		facebookId: user.facebookId  
	}
}

var User =  function(data, socket) {
	return {
		id: Helpers.makeid(),
		name: data.name, 
		gravatarId: data.gravatarId, 
		facebookId: data.facebookId,
		socket: socket
	}
}

Board.prototype.init_connection = function(socket, user) {
	var _this = this;
	// attach all message handlers to this socket
	for(var j = 0; j < this.commands.length; j++)
	{
		this.register(user, this.commands[j]);
	}

	var details = this.getUserDetails(user);
	
	socket.emit('welcome', details);
	
	// notify everyone else that someone has joined
	this.broadcast('joined', details, socket);

	socket.emit('replay', { 
		objects: this.objects, 
		messages: this.messages, 
		users: this.getUsers() 
	});
	
	socket.on('disconnect', function() {
		_this.broadcast('left', { id: user.id, name: user.name }, socket);
		delete _this.users[user.id];
	});	
}


Board.prototype.getUsers = function() {
	var userlist = [];
	for(var key in this.users)
	{
		var user = this.users[key];
		userlist.push(this.getUserDetails(user));
	}
	return userlist;
}

function isNotUndefinedOrNull (value){
	return value !== undefined && value !== null
}

function isNotEmptyString (value){
	return value !== "";
}

function isNotNullOrEmpty (value){
	return isNotUndefinedOrNull(value) && isNotEmptyString(value);
}

function areEqual (value1, value2){
	return 
		isNotNullOrEmpty(value1) && isNotNullOrEmpty(value2) &&
		value1 === value2;
}

Board.prototype.userExists = function(data) {
	if(this.users[data.id] !== undefined && this.users[data.id] !== null) return true;
	for(var key in this.users) {
		if(areEqual(this.users[key].facebookId, data.facebookId)) return true;
		if(areEqual(this.users[key].gravatarId, data.gravatarId)) return true;
		if(areEqual(this.users[key].name, data.name)) return true;
	}
	return false;
}


Board.prototype.saveImage = function(filename, contentType, data) {
	var ext = '.' + mimetypes[contentType];

	var path = 'boards/' + this.id + '/images';
	var imagefile = path + '/' + filename + ext;

	fs.writeFile(imagefile, data, 'binary', function(err) {
		if(err) {
			if(err.errno == -4058){
				ensurePathExists(path, function() {
					fs.writeFile(imagefile, data, 'binary',function(err) {
						if(err) {
							return console.log(err)
						}
					});
				});
			} else {
				return console.log(err)
			}
		}
	});
}

Board.prototype.deleteImage = function(filename, contentType) {
	var ext = '.' + mimetypes[contentType];

	var path = 'boards/' + this.id + '/images';
	var imagefile = path + '/' + filename + ext;

	fs.unlink(imagefile, function(err) {
		if(err) {
				return console.log(err)
		}
	});
}


function ensurePathExists(path, callback){
	fs.mkdir(path, function(err){
		if(err){
			return console.log(err)
		}
		callback();
	});		
}



Board.prototype.join = function(socket, data) {
	if(!data.name || data.name.length == 0) {
		socket.emit('joinerror', { message: 'You need to enter a name to join' });
		return;
	}

	if(!this.userExists(data)) {
		var newUser = new User(data, socket); 
		
		this.users[newUser.id] = newUser;
		this.init_connection(socket, newUser);

	} else {
		socket.emit('joinerror', { message: 'That name is already in use!' });
	}

}

		
Board.prototype.rejoin = function(socket, sessionId) {
		
		for(var key in this.users) {
			var user = this.users[key];
			
			if(user.id == sessionId) {
				user.socket = socket;

				console.log(socket.id + " rejoins board: " + this.name + " as " + user.name);

				init_connection(socket, user);
				return;
			}
		}

		socket.emit('joinerror', { message: 'Invalid session' });
	}
	
Board.prototype.save = function() {

	var board = {
		id: this.id,
		name : this.name,
		messages : this.messages, 
		objects : this.objects,
		images: this.images,
		polls : this.polls,
	}

	var boardJson = JSON.stringify(board);

	var path = 'boards/' + this.id;
	var datafile = path + '/data.json';

	fs.writeFile(datafile, boardJson, 'utf8', function(err) {
		if(err) {
			if(err.errno == -4058){
				ensurePathExists(path, function(){
					fs.writeFile(datafile, boardJson, 'utf8', function(err) {
						if(err) {
							return console.log(err)
						}
					});
				});
			} else {
				return console.log(err)
			}
		}
	});

}


Board.prototype.init = function(boardJson) {
	var board = JSON.parse(boardJson);

	this.id = board.id;
	this.name = board.name;
	this.messages = board.messages;
	this.objects = board.objects; 
	this.images = board.images,
	this.polls = board.polls;
}

Board.prototype.getImage = function(imgid, callback) {
	var image = this.images[imgid];
	if(image) {
		var ext = '.' + mimetypes[image.contentType];

		fs.readFile('boards/' + this.id + '/images/' + imgid + ext, function(err, data) {
			if(err){
				return callback(null);
			}
			callback({
				contentType: image.contentType,
				data: data
			});
		});
	} else {
		callback(null);
	}
}
  

Board.load = function (id, callback) {
	try {
		var data = fs.readFileSync('boards/' + id + '/data.json', 'utf8');
		var board = new Board();
		board.init(data);
		return board;
	} catch(err) {
		if(err.errno = -4058) {
			return null;
		}
		console.log(err)
		return null;
	}
}

module.exports = Board
