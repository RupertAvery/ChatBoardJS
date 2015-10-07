var Helpers = require("common/helpers.js");

function Poll(pollname, creator, choice_values, users) {
	var id = Helpers.makeid();
	var name = pollname;
	var moderators = {};
	var choices = {};
	var locklevel = 0;

	function Moderator(user, userlevel) {
		var level = userLevel;
		var socket = user.socket;
		
		return {
			id: user.id,
			getLevel: function() { return level; },
			setLevel: function(newlevel) { level = newlevel; },
			canModify: function() {
				return level > locklevel;
			}
		}		
	};
	
	moderators[creator.id] = new Moderator(creator.id, 9999); // It's over 9000!
	
	for(var i = 0; i < choice_values.length, i++) {
		addChoice(creator.id, choice_values[i]);
	}
	
	function addChoice(userId, description) {
		if((locklevel == 0) || (moderators[userId] && moderators[userId].canModify())) {
			var choiceId = Helpers.makeid(); 
			choices[choiceId] = {
				id: choiceId,
				createdBy: userId,
				modifiedBy: null,
				description: description,
				votes: 0,
				voters: {}
			}
		}
	}
	
	function removeChoice(userId, choiceId) {
		if((locklevel == 0) || (moderators[userId] && moderators[userId].canModify())) {
			var choiceId = Helpers.makeid(); 
			delete choices[choiceId];
		}
	}
	
	var commands = [ 'vote', 'add', 'remove', 'abstain', 'promote', 'demote', 'lock', 'unlock' ];

	function getImage(imgid) {
		return images[imgid];
	}

	var commandPreProcessor = {
		
	}


	var commandHandlers = {
		'vote' : function(user, data) {
			var choice = choices[data.id];
			if(!choice.voters[user.id]) {
				choice.voters[user.id] = user.id;
				choice.votes++;
			};
		},
		'abstain' : function(user, data) {
			
		},
		'add' : function(user, data) {
			if(user.id)
			addChoice(user.id, data.description)
		},
		'remove' : function(user, data) {
			removeChoice(user.id, data.id)
		},
		'promote' : function(user, data) {
			
		},
		'demote' : function(user, data) {
			
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
			if (commandPreProcessor[command]) {
				data = commandPreProcessor[command](user, data)
			}

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
			email: user.email, 
			facebookId: user.facebookId  
		}
	}

	function User(data, socket) {
		return {
			id: Helpers.makeid(),
			name: data.name, 
			email: data.email, 
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
			if(isNotUndefinedOrNull(users[key].email) && isNotEmptyString(users[key].email) && users[key].email === data.email) return true;
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

			init_connection(socket, user);

		} else {
			socket.emit('joinerror', { message: 'That name is already in use!' });
		}

	}

	return {
		id: id,
		name: name,
		choices: choices
	}
}

module.exports = Board