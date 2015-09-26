function WhiteBoard(d3, socket, elementId) {
	var penisdown = false;
	var lastPoint = null;
	var startPoint = null;
	var selectionRect = null;
	var resizeHandles = null;

	var tools = {
		"pen": { name: "pencil", options: { hotspot: 'bottom left' } },
		"eraser": { name: "eraser", options: { hotspot: 'bottom left' } },
		"resize": { name: "hand-paper-o", options: { hotspot: 'top' } },
		"resize-down": { name: "hand-grab-o", options: { hotspot: 'top' } },
		"pointer": { name: "mouse-pointer", options: { hotspot: 'top left' } }
	};
	
	var boardId = "#" + elementId;
	
	var selectedObject = null;
	var selectedLineWeight = 2;
	var currentSelection = null;

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

	$(boardId).on("keydown", function () {
		console.log(event.which);
		if (event.which == 17) {
			ctrlDown = true;
		} else if (event.which == 46) {
			objectManager.removeSelected();
		}
	})

	$(boardId).on("keyup", function () {
		console.log(event.which);
		if (event.which == 17) {
			ctrlDown = false;
		}
	})

	socket.on('line', function (data){
		objectManager.add(new LineObject(svg, data));
	})

	socket.on('image', function (data) {
		objectManager.add(new ImageObject(svg, data));
	})

	socket.on('point', function (data){
		objectManager.getObject(data.id).addPoint(data.point);
	})

	socket.on('replay', function (data) {
		for(var key in data.objects) {
			var object = data.objects[key];
			switch (object.type) {
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

	socket.on('move', function (data){
		objectManager.getObject(data.id).move(data.x, data.y);
	})

	socket.on('scale', function (data){
		objectManager.getObject(data.id).scale(data.x, data.y);
	})
	
	socket.on('remove', function (data){
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
		
		if (penisdown)
		{
			switch (selectedTool) {
			case "pen":
				if (currentSelection && currentSelection.type == 'line')
				{
					currentSelection.addPoint(m);
				}
				socket.emit('point', { id: currentSelection.id, point: m });
				break;
				
			case "eraser":
				objectManager.removeAtPoint(m);
				break;
				
			case "resize":
				if (currentSelection)
				{
					var dx = m.x - lastPoint.x;
					var dy = m.y - lastPoint.y;
					
					
					if (resizeHandles) {
						resizeHandles.move(dx, dy);
					}
					
					// check if the selection is an array
					if (Array.isArray(currentSelection)) {
						var idList = [];
						for(var i =0; i < currentSelection.length; i++)
						{
							currentSelection[i].resize(dx, dy);
							var scale = currentSelection[i].options.scale;
							
							// change this call to move multiple objects in one message?
							socket.emit('scale', { id: currentSelection[i].id, x: scale.x, y: scale.y});
							idList.push(currentSelection[i].id);
						}
					}else {
						currentSelection.resize(dx, dy);
						var scale = currentSelection.options.scale;
						socket.emit('scale', { id: currentSelection.id, x: scale.x, y: scale.y});
					}
				}
				break;
				
			case "select":
				// If we have a selection, then we are probably moving something around
								
				if (currentSelection)
				{
					var dx = m.x - lastPoint.x;
					var dy = m.y - lastPoint.y;
					
					if (resizeHandles) {
						resizeHandles.move(dx, dy);
					}
					
					// check if the selection is an array
					if (Array.isArray(currentSelection)) {
						var idList = [];
						for(var i =0; i < currentSelection.length; i++)
						{
							currentSelection[i].move(dx, dy);
							// change this call to move multiple objects in one message?
							socket.emit('move', { id: currentSelection[i].id, x: dx, y: dy});
							idList.push(currentSelection[i].id);
						}
						socket.emit('move-many', { ids: idList, x: dx, y: dy});
					}else {
						currentSelection.move(dx, dy);
						socket.emit('move', { id: currentSelection.id, x: dx, y: dy});
					}
				} else {
					// otherwise, we are probbaly selecting with a rectangle
					if (selectionRect) {
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
		} else {
			switch (selectedTool) {
			case "select":
				if (resizeHandles && resizeHandles.hitTest(m.x, m.y)) {
					setCursor("resize");
				} else {
					setCursor("pointer");
				}
				break;
			}
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

		switch (selectedTool) {
		case "pen":
			addLine({
				x: m.x, 
				y: m.y, 
				color: selectedColor, 
				lineWeight: selectedLineWeight
			});
			break;
			
		case "select":
			if (selectionRect) {
				selectionRect.remove();
				selectionRect = null;
			}

			if (resizeHandles) {
				if (resizeHandles.hitTest(m.x, m.y))
				{
					selectedTool = "resize";
					setCursor("resize-down");
					return;
				}
			}

			
			var selection = objectManager.getObjectAtPoint(m);
			
			if (selection == null)
			{
				if (resizeHandles) {
					resizeHandles.remove();
					resizeHandles = null;
				}
				
				// nothing found at that point, proceed to select via rectangle
				currentSelection = null;
				objectManager.deselectAll();

				// create the selection rectangle
				selectionRect = svg.append("g");
				selectionRect.append("line").attr("id", "l1").attr("stroke", "black").attr("stroke-width", 2).attr("stroke-dasharray", "5, 5");
				selectionRect.append("line").attr("id", "l2").attr("stroke", "black").attr("stroke-width", 2).attr("stroke-dasharray", "5, 5");
				selectionRect.append("line").attr("id", "l3").attr("stroke", "black").attr("stroke-width", 2).attr("stroke-dasharray", "5, 5");
				selectionRect.append("line").attr("id", "l4").attr("stroke", "black").attr("stroke-width", 2).attr("stroke-dasharray", "5, 5");
			} else {
				selection.select();
				
				if (resizeHandles) {
					resizeHandles.remove();
					resizeHandles = null;
				}
				
				if (!currentSelection) {
					// If nothing is selected, then set the selected object as the current object
					objectManager.deselectAll();
					currentSelection = selection;
				} else {
					if (ctrlDown) {
						if (!Array.isArray(currentSelection)) {
							currentSelection = [currentSelection];
						} 
						currentSelection.push(selection)
					} else {
						objectManager.deselectAll();
						currentSelection = selection;
					}
				}

				var minX = minY = 9999;
				var maxX = maxY = -9999;
				
				if (Array.isArray(currentSelection)) {
					for(var i = 0; i < currentSelection.length; i++) {
						var r = currentSelection[i].getExtents();
						if (r.x1 < minX) minX = r.x1;
						if (r.y1 < minY) minY = r.y1;
						if (r.x2 > maxX) maxX = r.x2;
						if (r.y2 > maxY) maxY = r.y2;
					}
				} else {
					var r = currentSelection.getExtents();
					minX = r.x1;
					minY = r.y1;
					maxX = r.x2;
					maxY = r.y2;
				}
				
				resizeHandles = new ResizeHandle(svg, { 
					offset: { x: maxX, y: maxY }
				});
			}
		}
	}

	/***********************************
		Handle mouseup events
	************************************/
	function mouseUp() {
		penisdown = false;
		var m = toPoint(d3.mouse(this));

		switch (selectedTool) {
		case "pen": 
			// In case we started drawing a line, but didn't move the pen much, 
			// remove the line altogether. This prevents almost invisible lines from
			// polluting the object list
			if (currentSelection.length() < 2) {
				objectManager.remove(currentSelection);
				socket.emit('remove', { id: currentSelection.id });
			}
			currentSelection = null;
			break;
		case "resize":
			selectedTool = "select";
			setCursor("resize");
			break;
		case "select":
			// check if a rectangle selection is in progress
			if (selectionRect) {
				currentSelection = objectManager.getObjectsInRect(startPoint, m)
				if (currentSelection.length == 0) currentSelection = null;
				selectionRect.remove();
			}
			break;
		}
	}
	
	
	function selectColor (color) { 
		selectedColor = color; 
	}
	
	function setCursor(tool) {
		var _tool = tools[tool];
		if (_tool) {
			$(boardId).children("svg").awesomeCursor(_tool.name, _tool.options);
		} else {
			$(boardId).css("cursor", "");
		}
	}
	
	function selectTool (tool) {
		setCursor(tool);
		selectedTool = tool;
	}
	
	function selectLineWeight(weight) {
		selectedLineWeight = weight;
	}

	function addLine(options) {
		currentSelection = new LineObject(svg, {
			id: makeid(),
			x: options.x, 
			y: options.y, 
			color: options.color, 
			lineWeight: options.lineWeight
		});
		objectManager.add(currentSelection);
		socket.emit('line', currentSelection.options);
	}
	
	function addImage(data) {
		var newObject = new ImageObject(svg, { 
			id: makeid(), 
			href: data.href, 
			width: data.width, 
			height: data.height
		});
		objectManager.add(newObject);
		socket.emit('image', newObject.options);
	}

	function addText (data) {
		var newObject = new TextObject(svg, {
			id: makeid(),
			text: data.text, 
			width: data.width, 
			height: data.height
		})
		objectManager.add(newObject);
		socket.emit('text', newObject.options);
	}

	return {
		removeSelected: objectManager.removeSelected,
		deselectAll: objectManager.deselectAll,
		selectColor: selectColor,
		selectTool: selectTool,
		selectLineWeight: selectLineWeight,
		addText: addText,
		addImage: addImage,
		setSize: function (width, height) {
			$(boardId).width(width).height(height);
			//svg.attr("width", width).attr("height", height);
		}
	}
};
