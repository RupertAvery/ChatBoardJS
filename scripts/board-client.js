 function WhiteBoard(d3, socket, elementId) {
	var penisdown = false;
	var lastPoint = null;
	var startPoint = null;
	var selectionRect = null;

	var tools = {
		"pen": { name: "pencil", options: { hotspot: 'bottom left' } },
		"eraser": { name: "eraser", options: { hotspot: 'bottom left' } }
	};
	
	var boardId = "#" + elementId;
	
	var selectedObject = null;
	var selectedLineWeight = 2;
	var currentObject = null;

	var svg = d3.select(boardId)
				.append("svg")
				.attr("class", "noselect")
				.attr("width", 1920)
				.attr("height", 1080)
				.on("mousemove", mouseMove)
				.on("mousedown", mouseDown)
				.on("mouseup", mouseUp);

	var objectManager = new ObjectManager();

	var ctrlDown = false;
    var ctrlKey = 17, vKey = 86, cKey = 67;

	$(boardId).on("keydown", function() {
		console.log(event.which);
		if(event.which == 17) {
			ctrlDown = true;
		} else if (event.which == 46) {
			objectManager.removeSelected();
		}
	})

	$(boardId).on("keyup", function() {
		console.log(event.which);
		if(event.which == 17) {
			ctrlDown = false;
		}
	})

	socket.on('line', function(data){
		objectManager.add(new LineObject(svg, data));
	})

	socket.on('image', function(data) {
		objectManager.add(new ImageObject(svg, data));
	})

	socket.on('point', function(data){
		objectManager.getObject(data.id).addPoint(data.point);
	})

	socket.on('replay', function(data) {
		for(var key in data.objects) {
			var object = data.objects[key];
			switch(object.type) {
			case 'line':
				objectManager.add(new LineObject(svg, object));
				break;
			case 'image':
				objectManager.add(new ImageObject(svg, object));
				break;
			case 'text':
				objectManager.add(new TextObject(svg, object));
				break;
			}
		}
	});

	socket.on('move', function(data){
		objectManager.getObject(data.id).move(data.x, data.y);
	})

	socket.on('remove', function(data){
		objectManager.getObject(data.id).remove();
		objectManager.remove(data.id)
	})


	function makeid()
	{
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		for( var i=0; i < 24; i++ )
			text += possible.charAt(Math.floor(Math.random() * possible.length));

		return text;
	}

	function toPoint(m) {
		return { x: m[0], y: m[1] };
	}

	/***********************************
		Handle mouse move events
	************************************/
	function mouseMove() {
		var m = toPoint(d3.mouse(this));
		
		if(penisdown)
		{
			switch(selectedTool) {
			case "pen":
				if(currentObject && currentObject.type == 'line')
				{
					currentObject.addPoint(m);
				}
				socket.emit('point', { id: currentObject.id, point: m });
				break;
				
			case "eraser":
				objectManager.removeAtPoint(m);
				break;
				
			case "select":
				// If we have a selection, then we are probably moving something around
				if(currentObject)
				{
					var dx = m.x - lastPoint.x;
					var dy = m.y - lastPoint.y;
					
					// check if the selection is an array
					if( Object.prototype.toString.call( currentObject ) === '[object Array]' ) {
						var idList = [];
						for(var i =0; i < currentObject.length; i++)
						{
							currentObject[i].move(dx, dy);
							// change this call to move multiple objects in one message?
							socket.emit('move', { id: currentObject[i].id, x: dx, y: dy});
							idList.push(currentObject[i].id);
						}
						socket.emit('move-many', { ids: idList, x: dx, y: dy});
					}else {
						currentObject.move(dx, dy);
						socket.emit('move', { id: currentObject.id, x: dx, y: dy});
					}
				} else {
					// otherwise, we are probbaly selecting with a rectangle
					if(selectionRect) {
						// update the selection rectangle
						selectionRect.select("#l1").attr("x1", startPoint.x).attr("y1", startPoint.y).attr("x2", m.x).attr("y2", startPoint.y);
						selectionRect.select("#l2").attr("x1", m.x).attr("y1", startPoint.y).attr("x2", m.x).attr("y2", m.y);
						selectionRect.select("#l3").attr("x1", m.x).attr("y1", m.y).attr("x2", startPoint.x).attr("y2", m.y);
						selectionRect.select("#l4").attr("x1", startPoint.x).attr("y1", m.y).attr("x2", startPoint.x).attr("y2", startPoint.y);
					}
				}
				break;
				
			}
			lastPoint = { x: m.x, y: m.y };
		}
	}

	/***********************************
		Handle mouse down events
	************************************/
	function mouseDown() {
		$(boardId).focus();
		
		penisdown = true;

		var m = toPoint(d3.mouse(this));
		lastPoint = { x: m.x, y: m.y };
		startPoint = lastPoint;

		switch(selectedTool) {
		case "pen":
			addLine({
				x: m.x, 
				y: m.y, 
				color: selectedColor, 
				lineWeight: selectedLineWeight
			});
			break;
			
		case "select":
			if(selectionRect) {
				selectionRect.remove();
			}
			
			var selection = objectManager.getObjectAtPoint(m);
			
			if(selection == null)
			{
				// nothing found at that point, proceed to select via rectangle
				currentObject = null;
				objectManager.deselectAll();

				// create the selection rectangle
				selectionRect = svg.append("g");
				selectionRect.append("line").attr("id", "l1").attr("stroke", "black").attr("stroke-width", 2).attr("stroke-dasharray", "5, 5")
				selectionRect.append("line").attr("id", "l2").attr("stroke", "black").attr("stroke-width", 2).attr("stroke-dasharray", "5, 5")
				selectionRect.append("line").attr("id", "l3").attr("stroke", "black").attr("stroke-width", 2).attr("stroke-dasharray", "5, 5")
				selectionRect.append("line").attr("id", "l4").attr("stroke", "black").attr("stroke-width", 2).attr("stroke-dasharray", "5, 5")
			} else {
				// If nothing is selected, then set the selected object as the current object
				if(!currentObject) {
					objectManager.deselectAll();
					currentObject = selection;
					currentObject.select();
				}
			}
		}
	}

	/***********************************
		Handle mouseup events
	************************************/
	function mouseUp() {
		penisdown = false;
		var m = toPoint(d3.mouse(this));

		switch(selectedTool) {
		case "pen": 
			// In case we started drawing a line, but didn't move the pen much, 
			// remove the line altogether. This prevents almost invisible lines from
			// polluting the object list
			if(currentObject.length() < 2) {
				objectManager.remove(currentObject);
				socket.emit('remove', { id: currentObject.id });
			}
			currentObject = null;
			break;
			
		case "select":
			// check if a rectangle selection is in progress
			if(selectionRect) {
				currentObject = objectManager.getObjectsInRect(startPoint, m)
				if(currentObject.length == 0) currentObject = null;
				selectionRect.remove();
			}
			break;
		}
	}
	
	
	function selectColor (color) { 
		selectedColor = color; 
	}
	
	function selectTool (tool) {
		var _tool = tools[tool];
		if (_tool) $(boardId).awesomeCursor(_tool.name, _tool.options);
		selectedTool = tool;
	}
	
	function selectLineWeight(weight) {
		selectedLineWeight = weight;
	}

	function addLine(options) {
		currentObject = new LineObject(svg, {
			id: makeid(),
			x: options.x, 
			y: options.y, 
			color: options.color, 
			lineWeight: options.lineWeight
		});
		objectManager.add(currentObject);
		socket.emit('line', currentObject.options);
	}
	
	function addImage(data) {
		currentObject = new ImageObject(svg, { 
			id: makeid(), 
			href: data.href, 
			width: data.width, 
			height: data.height
		});
		objectManager.add(currentObject);
		socket.emit('image', currentObject.options);
	}

	function addText (data) {
		currentObject = new TextObject(svg, {
			id: makeid(),
			text: data.text, 
			width: data.width, 
			height: data.height
		})
		objectManager.add(currentObject);
		socket.emit('text', currentObject.options);
	}

	return {
		removeSelected: objectManager.removeSelected,
		deselectAll: objectManager.deselectAll,
		selectColor: selectColor,
		selectTool: selectTool,
		selectLineWeight: selectLineWeight,
		addText: addText,
		addImage: addImage,
		setSize: function(width, height) {
			$(boardId).width(width).height(height);
			//svg.attr("width", width).attr("height", height);
		}
	}
};
