var chatterbox = function(socket) {
	
	var chatBoardName = '';
	var me = { };
	
	
	socket.on('chat', function(data){
		addMessage(data);
	})			
	
	socket.on('joined', function(data){
		var messageText = $("<div style='color: green'>* <strong>" + data.name + "</strong> has joined " + chatBoardName + "</div>");
		$("#chatspace").append(messageText);
		$("#chatspace").scrollTop($("#chatspace").scrollTop() + messageText.position().top);
        addUser(data);
	})
	
	socket.on('left', function(data){
		var messageText = $("<div style='color: green'>* <strong>" + data.name + "</strong> has left " + chatBoardName + "</div>");
		$("#chatspace").append(messageText);
		$("#chatspace").scrollTop($("#chatspace").scrollTop() + messageText.position().top);
        removeUser(data);
	})

	socket.on('replay', function(data) {
		var messageText = $("<div style='color: green'>* Welcome to " + chatBoardName + "!</div>");
		$("#chatspace").append(messageText);
		var lastFrom = null;
		for(var i = 0; i < data.messages.length; i++) {
			addMessage(data.messages[i]);
			lastFrom = data.messages[i].from;
		}
        
        for(var i = 0; i < data.users.length; i++) {
			addUser(data.users[i]);
		}
	});

	$("#chatinput").keypress(function(e) {
	  if ((event.which || event.keyCode) == 13) {
		var msg = $("#chatinput").val();
		if(msg.length > 0)
		{
			addMessage({ from: me,  message: msg });
			socket.emit("chat", { message: msg });
			$("#chatinput").val("");
		}
	  }
	});

	var lastMessageFrom = null;
	var lastAvatar = null;
	function isSameUser(user1, user2) {
		if(user1.facebookId && user2.facebookId)
			return user1.facebookId == user2.facebookId;
		if(user1.gravatarId && user2.gravatarId)
			return user1.gravatarId == user2.gravatarId;
		return user1.name == user2.name;
	}
	
	function getEmoticon(cssClass) {
		return "<span class='fse2-emoticon fse2" + cssClass + "'></span>";
	}
	
	function surrogatePairToCodepoint(lead, trail) {
		return (lead - 0xD800) * 0x400 + (trail - 0xDC00) + 0x10000;
	}

	var smileymapping = {
		"O:)":  "angel",
		":)":  "smile",
		":(":  "frown",
		":P":  "tongue",
		":p":  "tongue",
		":D":  "grin",
		">:o":  "upset",
		":o":  "gasp",
		":O":  "gasp",
		";)":  "wink",
		"8-)":  "glasses",
		"B|":  "sunglasses",
		">:(":  "grumpy",
		":/":  "unsure",
		":\\":  "unsure",
		":'(":  "cry",
		":*":  "kiss",
		"^_^":  "kiki",
		"-_-":  "squint",
		"o.O":  "confused",
		"O.o":  "confused_rev",
		":3":  "colonthree",
		":v":  "pacman"
	}
	
	function emoticonify(data) {
		var emojipattern = /([\ud800-\udbff])([\udc00-\udfff])/g;
		var smileypattern = /:(?:\)|D|P|p|O|o|\\|\/|\(|\'\(|\*|3|v)|;\)|>:(?:\\|O|o|\()|B\||8-\)|O:\)|\^_\^|-_-/g;
		
		data.message = data.message
			.replace(emojipattern, function(match, p1, p2) {
				var codepoint = surrogatePairToCodepoint(p1.charCodeAt(0), p2.charCodeAt(0));
				return getEmoticon(codepoint.toString(16));
			})
			.replace(smileypattern, function(match) {
				if(smileymapping[match])	
					return getEmoticon(smileymapping[match]);
				else	
					return match;
			})
			.replace(/o\.O/g,  getEmoticon("confused"))
			.replace(/O\.o/g,  getEmoticon("confused_rev"))
			;
	}
	
	function addMessage(data) {
		emoticonify(data);
		
		if(isSameUser(me, data.from)) {
			var messageText = $("<div class='my-chat-message'><div class='chat-message'>" + data.message + "</div></div>");
			$("#chatspace").append(messageText);
			
		} else {
			if(!lastMessageFrom || !isSameUser(lastMessageFrom, data.from))
			{
				$("#chatspace").append("<div class='chat-name-header'>" + data.from.name + "</div>");
			} else {
				if(lastAvatar)
					lastAvatar.remove();
			}
			var imgUrl = getUserImgUrl(data.from);			
			var messageContainer = $("<div class='other-chat-message'></div>");
			var avatarContainer = $("<div class='chat-avatar-container'></div>");
			var messageText = $("<div class='chat-message'>" + data.message + "</div>");

			var avatar = $("<img class='chat-avatar' src='" + imgUrl + "'/>");
			avatarContainer.append(avatar);

			messageContainer.append(avatarContainer);
			messageContainer.append(messageText);
			lastAvatar = avatar;
			$("#chatspace").append(messageContainer);
		}
		
		$("#chatspace").scrollTop($("#chatspace").scrollTop() + messageText.position().top);
		lastMessageFrom = data.from;
	}
    
	function getUserImgUrl(user) {
		if(user.facebookId) {
			return "https://graph.facebook.com/" + user.facebookId + "/picture?type=square";
		} else if(user.gravatarId) {
			return "http://www.gravatar.com/avatar/" + user.gravatarId;
		}
	}
	
    function addUser(user) {
		var imgUrl = getUserImgUrl(user);
        $("#users").append("<img id=\"user-" + user.id + "\" src=\"" + imgUrl + "\" style=\"width: 64px; height: 64px\" title=\"" + user.name + "\"/>");
	}
	
	function removeUser(user) {
        $("#user-" + user.id).remove();
	}
	
	return {
		setBoardName: function(name) {
			chatBoardName = name;
		},
		getBoardName: function() {
			return chatBoardName;
		},
		setUserInfo: function(data) {
			me = data;
		}
	}
}