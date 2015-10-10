function Poll(socket, options) {
	
	socket.emit("poll", { id: makeid(), options: options })
	
	return {
		removeOption: function() {
			
		},
		addOption: function() {
			
		}
	}
}