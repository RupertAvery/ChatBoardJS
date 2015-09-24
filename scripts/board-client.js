var whiteboard = function(d3, socket) {

	var penisdown = false;
	var lastPoint = null;
	var startPoint = null;
	var selectionRect = null;

	var tools = {
		"pen": { name: "pencil", options: { hotspot: 'bottom left' } },
		"eraser": { name: "eraser", options: { hotspot: 'bottom left' } }
	};

	var objects = {};

	var selectedObject = null;
	var selectedLineWeight = 2;
	var currentObject = null;

	var svg = d3.select("#whiteboard")
				.append("svg")
				.attr("class", "noselect")
				.attr("width", 900)
				.attr("height", 600)
				.on("mousemove", mouseMove)
				.on("mousedown", mouseDown)
				.on("mouseup", mouseUp)
				.on("click", mouseClick)
	;

	var ctrlDown = false;
    var ctrlKey = 17, vKey = 86, cKey = 67;

	$('#whiteboard').on("keydown", function() {
		console.log(event.which);
		if(event.which == 17) {
			ctrlDown = true;
		} else if (event.which == 46) {
			removeSelected();
		}
	})

	$('#whiteboard').on("keyup", function() {
		console.log(event.which);
		if(event.which == 17) {
			ctrlDown = false;
		}
	})

	socket.on('newline', function(data){
		objects[data.name] = new Line(data.x, data.y, data.color);
		objects[data.name].name = data.name;
	})

	socket.on('image', function(data) {
		objects[data.name] = new ImageObject(data.href, data.width, data.height, data.offset.x, data.offset.y);
		objects[data.name].name = name;
	})

	socket.on('addpoint', function(data){
		objects[data.name].addPoint(data.x, data.y);
	})

	socket.on('replay', function(data) {
		for(var obj in data.objects) {
			var current = data.objects[obj];
			if(current.type == 'line') {
				objects[current.name] = new Line(current.x, current.y, current.color, current.offset.x, current.offset.y);
				objects[current.name].name = current.name;
				for(var i = 0; i < current.points.length; i++) {
					objects[current.name].addPoint(current.points[i].x, current.points[i].y);
				}
			} else
			if(current.type == 'image') {
				objects[current.name] = new ImageObject(current.href, current.width, current.height, current.offset.x, current.offset.y);
				objects[current.name].name = current.name;
			} else
			if(current.type == 'text') {
				objects[current.name] = new TextObject(current.text, current.width, current.height, current.offset.x, current.offset.y);
				objects[current.name].name = current.name;
			}
		}
	});

	socket.on('move', function(data){
		objects[data.name].move(data.x, data.y);
	})

	socket.on('remove', function(data){
		objects[data.name].remove();
		delete objects[data.name];
	})


	function makeid()
	{
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		for( var i=0; i < 24; i++ )
			text += possible.charAt(Math.floor(Math.random() * possible.length));

		return text;
	}

	function getTextSize(text, font) {
    // re-use canvas object for better performance
		var canvas = getTextSize.canvas || (getTextSize.canvas = document.createElement("canvas"));
		var context = canvas.getContext("2d");
		context.font = font;
		return context.measureText(text);
	};

	function TextObject(text, width, height, offsetx, offsety) {
		var offset = { x: offsetx || 20, y: offsety || 16 };
		var isSelected = false;
		var txtObject = svg.append("text")
				.attr("x", "0")
				.attr("y", "0")
				.attr("font-family", "Arial")
				.attr("font-size", "16")
				.attr("transform", "translate(" + offset.x + " " + offset.y + ")");
		txtObject.text(text);

		var extents = getTextSize(text, "16px Arial");

		width = extents.width;
		height = 16;


		return {
			editText: function (text) {
				txtObject.text(text);
				extents = getTextSize(text, "16px Arial");
				width = extents.width;
			},
			containedBy: function(p1, p2) {
				if(p1.x <= offset.x && p2.x >= (offset.x + width) && p1.y <= (offset.y - height / 2) && p2.y >= (offset.y + height / 2))
				{
					return true;
				}
			},
			hitTest: function(x, y) {
				if(x >= offset.x && x <= (offset.x + width) && y >= (offset.y - height / 2) && y <= (offset.y + height / 2))
				{
					return true;
				}
			},
			isSelected: function() { return isSelected; },
			select: function() {
				isSelected = true;
				txtObject.attr("opacity","0.5");
			},
			deselect: function() {
				isSelected = false;
				txtObject.attr("opacity","1.0");
			},
			remove: function() {
				txtObject.remove();
			},
			move: function(x, y) {
				offset.x += x;
				offset.y += y;
				txtObject.attr("transform", "translate(" + offset.x + " " + offset.y + ")");
			}
		}
	}

	function ImageObject(data, width, height, offsetx, offsety) {

		var offset = { x: offsetx || 0, y: offsety || 0 };
		var isSelected = false;
		var imgObject = svg.append("image")
				.attr("xlink:href", data)
				.attr("x", "0")
				.attr("y", "0")
				.attr("width", width + "px")
				.attr("height", height + "px")
				.attr("transform", "translate(" + offset.x + " " + offset.y + ")");

		return {
			containedBy: function(p1, p2) {
				if(p1.x <= offset.x && p2.x >= (offset.x + width) && p1.y <= offset.y && p2.y >= (offset.y + height))
				{
					return true;
				}
			},
			hitTest: function(x, y) {
				if(x >= offset.x && x <= (offset.x + width) && y >= offset.y && y <= (offset.y + height))
				{
					return true;
				}
			},
			isSelected: function() { return isSelected; },
			select: function() {
				isSelected = true;
				imgObject.attr("opacity","0.5");
			},
			deselect: function() {
				isSelected = false;
				imgObject.attr("opacity","1.0");
			},
			remove: function() {
				imgObject.remove();
			},
			move: function(x, y) {
				offset.x += x;
				offset.y += y;
				imgObject.attr("transform", "translate(" + offset.x + " " + offset.y + ")");
			}
		}
	}

	function Line(x, y, color, offsetx, offsety) {
		var lineData = [];
		var minX = 9999, minY = 9999, maxX = 0, maxY = 0;

		var lineFunction = d3.svg.line()
			.x(function(d) { return d.x; })
			.y(function(d) { return d.y; })
			.interpolate("linear");

		var offset = { x: offsetx || 0, y: offsety || 0 };

		var lineObject = svg.append("path")
				.attr("d", lineFunction(lineData))
				.attr("stroke", color)
				.attr("stroke-width", selectedLineWeight)
				.attr("fill", "none")
				.attr("transform", "translate(" + offset.x + " " + offset.y + ")");

		minX = maxX = x;
		minY = maxY = y;

		var isSelected = false;

		var origColor = color;


		function swap(a, b, c) { var t = a[c]; a[c] = b[c]; b[c] = t; }

		return {
			type: 'line',
			addPoint: function(x, y) {
				if(x < minX) minX = x;
				if(x > maxX) maxX = x;
				if(y < minY) minY = y;
				if(y > maxY) maxY = y;
				lineData.push({x: x, y: y});
				lineObject.attr("d", lineFunction(lineData));
			},
			containedBy: function(p1, p2) {
				if(p1.x <= (offset.x + minX) && p2.x >= (offset.x + maxX) && p1.y <= (offset.y + minY) && p2.y >= (offset.y + maxY))
				{
					return true;
				}
			},
			hitTest: function(x, y) {
				if(x >= (offset.x + minX) && x <= (offset.x + maxX) && y >= (offset.y + minY) && y <= (offset.y + maxY))
				{
					var _lastPoint = { x: lineData[0].x + offset.x, y: lineData[0].y + offset.y };

					for(var i = 1; i < lineData.length; i++) {
						var point = { x: lineData[i].x + offset.x, y: lineData[i].y + offset.y };

						if(lineCircleCollide(point, _lastPoint, { x: x, y: y }, 5))
						{
							return true;
						}
						_lastPoint = point;
					}

					return false;
				}
			},
			isSelected: function() { return isSelected; },
			length: function() {
				var _lastPoint = lineData[0];
				var length = 0;
				for(var i = 1; i < lineData.length; i++) {
					var point = lineData[i];
					length += distance(point, _lastPoint);
					_lastPoint = point;
				}
				return length;
			},
			select: function() {
				isSelected = true;
				lineObject.attr("opacity","0.5");
			},
			deselect: function() {
				isSelected = false;
				lineObject.attr("opacity","1.0");
			},
			remove: function() {
				lineObject.remove();
			},
			move: function(x, y) {
				offset.x += x;
				offset.y += y;
				lineObject.attr("transform", "translate(" + offset.x + " " + offset.y + ")");
			}
		}
	}

	function mouseMove() {
		var m = d3.mouse(this);
		if(penisdown)
		{
			if(selectedTool == "pen")
			{
				if(currentObject && currentObject.type == 'line')
				{
					currentObject.addPoint(m[0], m[1]);
				}
				socket.emit('addpoint', { name: currentObject.name, x: m[0], y: m[1] });
			}
		   else if(selectedTool == "eraser")
			{
				for(var obj in objects) {
					if(objects[obj].hitTest(m[0], m[1]))
					{
						objects[obj].remove();
						socket.emit('remove', { name: objects[obj].name });
						delete objects[obj];
					}
				}
		   }
			else if(selectedTool == "select")
			{
				if(currentObject)
				{
					var dx = m[0] - lastPoint.x;
					var dy = m[1] - lastPoint.y;
					if( Object.prototype.toString.call( currentObject ) === '[object Array]' ) {
						for(var i =0; i < currentObject.length; i++)
						{
							currentObject[i].move(dx, dy);
							socket.emit('move', { name: currentObject[i].name, x: dx, y: dy});
						}
					}else {
						currentObject.move(dx, dy);
						socket.emit('move', { name: currentObject.name, x: dx, y: dy});
					}
				} else {
					if(selectionRect) {
						selectionRect.select("#l1").attr("x1", startPoint.x).attr("y1", startPoint.y).attr("x2", m[0]).attr("y2", startPoint.y);
						selectionRect.select("#l2").attr("x1", m[0]).attr("y1", startPoint.y).attr("x2", m[0]).attr("y2", m[1]);
						selectionRect.select("#l3").attr("x1", m[0]).attr("y1", m[1]).attr("x2", startPoint.x).attr("y2", m[1]);
						selectionRect.select("#l4").attr("x1", startPoint.x).attr("y1", m[1]).attr("x2", startPoint.x).attr("y2", startPoint.y);

					}
				}
			}
			lastPoint = { x: m[0], y: m[1] }
		}
	}

	function reverseForIn(obj, f) {
		var arr = [];
		for (var key in obj) {
			arr.push(key);
		}
		for (var i=arr.length-1; i>=0; i--) {
			if(!f.call(obj, arr[i])) {
				break;
			}
		}
	}

	function mouseDown() {
		$('#whiteboard').focus();
		penisdown = true;

		var m = d3.mouse(this);
		lastPoint = { x: m[0], y: m[1] };
		startPoint = lastPoint;

		if(selectedTool == "pen")
		{
			currentObject = new Line(m[0], m[1], selectedColor);
			var name = makeid();
			currentObject.name = name;
			objects[name] = currentObject;
			socket.emit('newline', { name: name, x: m[0], y: m[1], color: selectedColor });
		}
		else if(selectedTool == "select")
		{
			if(selectionRect) {
				selectionRect.remove();
			}
			var selection = null

			reverseForIn(objects, function(obj) {
				if(objects[obj].hitTest(m[0], m[1]))
				{
					selection = objects[obj];
					return false;
				}
				return true;
			})

			if(selection == null)
			{
				currentObject = null;

				deselectAll();

				selectionRect = svg.append("g");
				selectionRect.append("line").attr("id", "l1").attr("stroke", "black").attr("stroke-width", 2).attr("stroke-dasharray", "5, 5")
				selectionRect.append("line").attr("id", "l2").attr("stroke", "black").attr("stroke-width", 2).attr("stroke-dasharray", "5, 5")
				selectionRect.append("line").attr("id", "l3").attr("stroke", "black").attr("stroke-width", 2).attr("stroke-dasharray", "5, 5")
				selectionRect.append("line").attr("id", "l4").attr("stroke", "black").attr("stroke-width", 2).attr("stroke-dasharray", "5, 5")
			} else {
				if(currentObject) {

				} else {
					currentObject = selection;
					deselectAll();
					selection.select();
				}
			}


		}


	}

	function mouseUp() {
		penisdown = false;

		var m = d3.mouse(this);

		if(selectedTool == "pen") {
			if(objects[currentObject.name].length() < 2) {
				objects[currentObject.name].remove();
				socket.emit('remove', { name: currentObject.name });
				delete objects[currentObject.name];
			}
			currentObject = null;
		}
		else if(selectedTool == "select")
		{
			if(selectionRect) {
				currentObject = [];

				for(var obj in objects) {
					if(objects[obj].containedBy(startPoint, { x: m[0], y: m[1] }))
					{
						objects[obj].select();
						currentObject.push(objects[obj]);
					}
				}

				if(currentObject.length == 0) currentObject = null;
				selectionRect.remove();
				//selectionRect = null;
			} else {
				//deselectAll();
			}
		}
	}

	function mouseClick() {

	}

	function removeSelected() {
		for(var obj in objects) {
			if(objects[obj].isSelected()) {
				objects[obj].remove();
				socket.emit('remove', { name: objects[obj].name });
				delete objects[obj];
			}
		}
	}

	function deselectAll() {
		for(var obj in objects) {
			objects[obj].deselect();
		}
	}

	return {
		removeSelected: removeSelected,
		deselectAll: deselectAll,
		selectColor: function(color) { selectedColor = color; },
		selectTool: function(tool) {
			var _tool = tools[tool];

			if (_tool) $('#whiteboard').awesomeCursor(_tool.name, _tool.options);

			selectedTool = tool;
		},
		selectLineWeight: function (weight) {
			selectedLineWeight = weight;
		},
		addText: function(data) {
			currentObject = new TextObject(data.text, data.width, data.height, data.offset.x, data.offset.y);
			var name = makeid();
			currentObject.name = name;
			objects[name] = currentObject;
			socket.emit('text', { name: name, text: data.text, width: data.width, height: data.height, offset: { x: 0, y: 0 } });
		},
		addImage: function(data) {
			currentObject = new ImageObject(data.href, data.width, data.height, data.offset.x, data.offset.y);
			var name = makeid();
			currentObject.name = name;
			objects[name] = currentObject;
			socket.emit('image', { name: name, href: data.href, width: data.width, height: data.height, offset: { x: 0, y: 0 } });
		},
		setSize: function(width, height) {
			svg.attr("width", width).attr("height",height);
		}
	}
};
