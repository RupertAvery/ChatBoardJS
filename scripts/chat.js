var chatterbox = function(socket) {

	socket.on('chat', function(data){
		addMessage(data);
	})			

	socket.on('replay', function(data) {
		for(var i = 0; i < data.messages.length; i++) {
			addMessage(data.messages[i]);
		}
	});

	$("#chatinput").keypress(function(e) {
	  if ( event.which == 13 ) {
		var msg = $("#chatinput").val();
		addMessage({ from: "Me",  message: msg });
		socket.emit("chat", { from: myName, message: msg });
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
}