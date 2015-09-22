var chatterbox = function(socket) {
	
	var chatBoardName = '';
	var userInfo = { name: '', sessionId: '' };
	
	
	socket.on('chat', function(data){
		addMessage(data);
	})			
	
	socket.on('joined', function(data){
		var messageText = $("<div style='color: green'>* <strong>" + data.name + "</strong> has joined " + chatBoardName + "</div>");
		$("#chatspace").append(messageText);
		$("#chatspace").scrollTop($("#chatspace").scrollTop() + messageText.position().top);
        addUser(data);
	})

	socket.on('replay', function(data) {
		for(var i = 0; i < data.messages.length; i++) {
			addMessage(data.messages[i]);
		}
		var messageText = $("<div style='color: green'>* Welcome to " + chatBoardName + "</div>");
		$("#chatspace").append(messageText);
		$("#chatspace").scrollTop($("#chatspace").scrollTop() + messageText.position().top);
        
        for(var i = 0; i < data.users.length; i++) {
			addUser(data.users[i]);
		}
	});

	$("#chatinput").keypress(function(e) {
	  if ( event.which == 13 ) {
		var msg = $("#chatinput").val();
		addMessage({ from: userInfo.name,  message: msg });
		socket.emit("chat", { message: msg });
		$("#chatinput").val("");
	  }
	});

	var lastMessageFrom = null;

	function addMessage(data) {
		if(lastMessageFrom != data.from)
		{
			$("#chatspace").append("<div style='font-weight: bold'>" + data.from + "</div>");
		}
		
		var messageText = $("<div style='padding-left: 10px'>" + data.message + "</div>");
		$("#chatspace").append(messageText);
		$("#chatspace").scrollTop($("#chatspace").scrollTop() + messageText.position().top);
		lastMessageFrom = data.from;
	}
    
    function addUser(user) {
        var hash = window.md5(user.email.toLowerCase());
        var url = "http://www.gravatar.com/avatar/" + hash;
        $("#users").append("<img src=\"" + url + "\" style=\"width: 64px; height: 64px\" title=\"" + user.name + "\"/>");
	}
	
	return {
		setBoardName: function(name) {
			chatBoardName = name;
		},
		setUserInfo: function(data) {
			userInfo = data;
		}
	}
}