var myName;
var socket = io.connect(window.location.origin);
var chat = new chatterbox(socket);
var board = new whiteboard(d3, socket);

function getUrlVars() {
	var vars = [],
		hash;
	var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
	for (var i = 0; i < hashes.length; i++) {
		hash = hashes[i].split('=');
		vars.push(hash[0]);
		vars[hash[0]] = hash[1];
	}
	return vars;
}
        
var id = getUrlVars()['id'];

socket.emit('getBoardInfo', {
	id: id
});

socket.on('errorhandler', function(data) {
	$("#content").hide();
	$("#errormessage").html(data.message).show();
});

socket.on('joinerror', function(data) {
	if (data.message == "Invalid session") {
		$('#myModal').modal('show');
	} else {
		$('#joinErrorMessage').html(data.message).show();
	}
});

socket.on('welcome', function(data) {
	chat.setUserInfo(data);
	Cookies.set(id + '-sessionId', data.sessionId, {
		path: location.pathname
	});
	$('#joinErrorMessage').hide();
	$('#myModal').modal('hide');
	$("#content").show();
});

$('#closeName').click(function() {
	socket.emit('join', {
		id: id,
		name: $('#myName').val(),
		email: $('#myEmail').val()
	});
});

socket.on('boardInfo', function(data) {
	$('#boardName').html(data.name);
	document.title = "Welcome to " + data.name;
	chat.setBoardName(data.name);
	var oldSessionId = Cookies.get(id + '-sessionId');
	if (oldSessionId) {
		socket.emit('rejoin', {
			id: id,
			sessionId: oldSessionId
		});
	} else {
		$('#myModal').modal('show');
	}
});

$(window).load(function() {
	board.selectTool("pen");
	board.selectColor("black");
});

$("#fblogin").click(function() {
	FB.login(function(response) {
		if (response.status === 'connected') {
			FB.api('/me', function(response) {
				socket.emit('join', {
					id: id,
					name: response.name,
					facebookId: response.id
				});
			});
		} else if (response.status === 'not_authorized') {
			// The person is logged into Facebook, but not your app.
		} else {
			// The person is not logged into Facebook, so we're not sure if
			// they are logged into this app or not.
		}
	}, {
		scope: 'public_profile,email'
	});
});

$('#colorPicker').spectrum({
	change: function(color) {
		board.selectColor(color.toHexString());
		$(this).children('span').css("background-color", color.toHexString());
	}
});

$("#red").click(function() {
	board.selectColor("red");
	$('#colorPicker').children('span').css("background-color", "red");
});

$("#green").click(function() {
	board.selectColor("green");
	$('#colorPicker').children('span').css("background-color", "green");
});

$("#blue").click(function() {
	board.selectColor("blue");
	$('#colorPicker').children('span').css("background-color", "blue");
});

$("#black").click(function() {
	board.selectColor("black");
	$('#colorPicker').children('span').css("background-color", "black");
});

$("#yellow").click(function() {
	board.selectColor("yellow");
	$('#colorPicker').children('span').css("background-color", "yellow");
});

$("#penTool").click(function() {
	board.selectTool("pen");
	board.deselectAll();
});

$("#eraserTool").click(function() {
	board.selectTool("eraser");
	board.deselectAll();
});

$("#textTool").click(function() {
	//board.selectTool("text");
	board.deselectAll();
	$("#textModal").modal("show")
});

$("#cancelTextBtn").click(function() {
	$("#textModal").modal("hide");
});

$("#selectTool").click(function() {
	board.selectTool("select");
	$('#whiteboard').css('cursor', 'crosshair');
	board.deselectAll();
});

$("#deleteAction").click(function() {
	board.removeSelected();
});

$("#imgAction").click(function() {
	$("#imgUploadModal").modal("show")
});

$("#cancelImageBtn").click(function() {
	$("#imgUploadModal").modal("hide")
});

$("#selectTool").click();

board.selectColor("black");

function convertImgToBase64URL(url, callback, outputFormat) {
	var img = new Image();
	img.crossOrigin = 'Anonymous';
	img.onload = function() {
		var canvas = document.createElement('CANVAS'),
			ctx = canvas.getContext('2d'),
			dataURL;
		canvas.height = this.height;
		canvas.width = this.width;
		ctx.drawImage(this, 0, 0);
		dataURL = canvas.toDataURL(outputFormat);
		callback(dataURL);
		canvas = null;
	};
	img.src = url;
}

function loadImage(url) {
	var preloadImg = new Image();
	preloadImg.onload = function() {
		board.addImage({
			href: url,
			width: preloadImg.width,
			height: preloadImg.height,
			offset: {
				x: 0,
				y: 0
			}
		});
		$("#imgUploadModal").modal("hide")
	}
	preloadImg.src = url;
}

$("#addTextBtn").click(function() {
	board.addText({
		text: $("#myText").val(),
		width: null,
		height: null,
		offset: {
			x: 0,
			y: 0
		}
	});
	$("#textModal").modal("hide");
	$("#myText").val(null);
});

$("#uploadImageBtn").click(function() {
	if ($("#url-tab").hasClass("active")) {
		loadImage($('#imageUploadUrl').val());
		$('#imageUploadUrl').val(null);
	} else {
		var file = $('#fileupload')[0].files[0];
		fr = new FileReader();
		fr.onload = function() {
			loadImage(this.result);
			$("#imgUploadModal").modal("hide")
		}
		fr.readAsDataURL(file);
	}
});

function resize() {
	var win = $(window);
	var chat = $("#chatspace");
	chat.height(win.height() - 50 - 80 - $("nav").height());
	board.setSize(win.width() - 450, win.height() - 50 - 80 - $("nav").height());
}

$(window).resize(function() {
	resize();
});

$(window).load(function() {
	resize();
});