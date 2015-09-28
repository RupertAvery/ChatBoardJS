function WhiteBoard(d3, socket, elementId) {
	var penisdown = false;
	var lastPoint = null;
	var startPoint = null;
	var selectionRect = null;
	var resizeHandles = null;

	var tools = {
		"pen": { name: "pencil", options: { hotspot: 'bottom left' } },
		"eraser": { name: "eraser", options: { hotspot: 'bottom left' } },
		"resize": { name: "hand-paper-o", options: { hotspot: 'center' } },
		"resize-down": { name: "hand-grab-o", options: { hotspot: 'center' } },
		"pointer": { name: "mouse-pointer", options: { hotspot: 'top left' } },
		"arrows": { name: "arrows", options: { hotspot: 'center' } },
		"arrows-ew": { name: "arrows-h", options: { hotspot: 'center' } },
		"arrows-nwse": { name: "arrows-h", options: { hotspot: 'center', rotate: 45 } },
		"arrows-nesw": { name: "arrows-h", options: { hotspot: 'center', rotate: -45 } },
		"arrows-ns": { name: "arrows-v", options: { hotspot: 'center' } },
	};
	
	var handleTools = {
		"handle1": "arrows-nwse",
		"handle2": "arrows-ns",
		"handle3": "arrows-nesw",
		"handle4": "arrows-ew",
		"handle5": "arrows-nwse",
		"handle6": "arrows-ns",
		"handle7": "arrows-nesw",
		"handle8": "arrows-ew"
	}

	var invertedHandleTools = {
		"handle1": "arrows-nesw",
		"handle2": "arrows-ns",
		"handle3": "arrows-nwse",
		"handle4": "arrows-ew",
		"handle5": "arrows-nesw",
		"handle6": "arrows-ns",
		"handle7": "arrows-nwse",
		"handle8": "arrows-ew"
	}

	
	var boardId = "#" + elementId;
	
	var selectedObject = null;
	var selectedLineWeight = 2;
	var currentSelection = null;

	var svg = d3.select(boardId)
				.append("svg")
				.attr("class", "noselect")
				.attr("oncontextmenu", "return false")
				.attr("width", 1920)
				.attr("height", 1080)
				.on("mousemove", mouseMove)
				.on("mousedown", mouseDown)
				.on("mouseup", mouseUp);

	var objectManager = new ObjectManager();

	var ctrlDown = false;
	var shiftDown = false;
    var shiftKey = 16, ctrlKey = 17, vKey = 86, cKey = 67, deleteKey = 46;

	$(boardId).on("keydown", function () {
		switch(event.which || event.keyCode) {
		case ctrlKey:
			ctrlDown = true;
			break;
		case shiftKey:
			shiftDown = true;
			break;
		case deleteKey:
			removeSelected();
			break;
		}
	})

	$(boardId).on("keyup", function () {
		switch(event.which || event.keyCode) {
		case ctrlKey:
			ctrlDown = false;
			break;
		case shiftKey:
			shiftDown = false;
			break;
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

	var resizeMatrix = {
		"handle1" : [ [ 1, 1 ], [-1,-1 ] ],
		"handle2" : [ [ 0, 1 ], [ 0,-1 ] ],
		"handle3" : [ [ 0, 1 ], [ 1,-1 ] ],
		"handle4" : [ [ 0, 0 ], [ 1, 0 ] ],
		"handle5" : [ [ 0, 0 ], [ 1, 1 ] ],
		"handle6" : [ [ 0, 0 ], [ 0, 1 ] ],
		"handle7" : [ [ 1, 0 ], [-1, 1 ] ],
		"handle8" : [ [ 1, 0 ], [-1, 0 ] ]
	}

	var textResizeMatrix = {
		"handle1" : [ [ 1, 0 ], [-1,-1 ] ],
		"handle2" : [ [ 0, 0 ], [ 0,-1 ] ],
		"handle3" : [ [ 0, 0 ], [ 1,-1 ] ],
		"handle4" : [ [ 0, 0 ], [ 1, 0 ] ],
		"handle5" : [ [ 0, 1 ], [ 1, 1 ] ],
		"handle6" : [ [ 0, 1 ], [ 0, 1 ] ],
		"handle7" : [ [ 1, 1 ], [-1, 1 ] ],
		"handle8" : [ [ 1, 0 ], [-1, 0 ] ]
	}

	var limitMatrix = {
		"handle1" : [ [ 1, 1 ], [-1,-1 ] ],
		"handle2" : [ [ 0, 1 ], [ 0,-1 ] ],
		"handle3" : [ [ 1,-1 ], [-1, 1 ] ],
		"handle4" : [ [ 1, 0 ], [-1, 0 ] ],
		"handle5" : [ [ 1, 1 ], [-1,-1 ] ],
		"handle6" : [ [ 0, 1 ], [ 0,-1 ] ],
		"handle7" : [ [ 1,-1 ], [-1, 1 ] ],
		"handle8" : [ [ 1, 0 ], [-1, 0 ] ]
	}
	
	function resize(object, dx, dy) {
		var matrix = [];
		var handle = resizeHandles.getDragHandle();
		
		if(object.type == "text") {
			matrix = textResizeMatrix[handle];
		} else {
			matrix = resizeMatrix[handle];
		}
		
		var mx = dx * matrix[0][0];
		var my = dy * matrix[0][1];
		var sx = dx * matrix[1][0];
		var sy = dy * matrix[1][1];
		
		object.move(mx, my);
		object.resize(sx, sy, shiftDown && (matrix[1][0] * matrix[1][1] != 0));
		
		var scale = object.options.scale;
		socket.emit('move', { id: object.id, x: mx, y: my});
		socket.emit('scale', { id: object.id, x: scale.x, y: scale.y});
	}
	
	function setResizeCursor() {
		if (resizeHandles) {
			var handle = resizeHandles.getDragHandle();
			var handleLookup;
			if (Math.sign(resizeHandles.getWidth() * resizeHandles.getHeight()) == -1) {
				handleLookup = invertedHandleTools;
			} else {
				handleLookup = handleTools;
			}
			setCursor(handleLookup[handle]);
		}
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
					
					if (shiftDown) {
						var limits = limitMatrix[resizeHandles.getDragHandle()];
						
						var vx = Math.sign(dx);
						var vy = Math.sign(dy);
						var sx = Math.abs(dx);
						var sy = Math.abs(dy);
						if (sx < sy) dx = sy * vx;
						if (sy < sx) dy = sx * vy;
						
						if (!((vx == limits[0][0] && vy == limits[0][1]) || (vx == limits[1][0] && vy == limits[1][1]))) {
							return;
						}
					}
					
					if (resizeHandles) {
						setResizeCursor()
						resizeHandles.move(dx, dy);
					}
					
					// check if the selection is an array
					if (Array.isArray(currentSelection)) {
						var idList = [];
						for(var i =0; i < currentSelection.length; i++)
						{
							resize(currentSelection[i], dx, dy);
						}
					} else {
						resize(currentSelection, dx, dy);
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
					setResizeCursor();
				} else {
					var selection = objectManager.getObjectAtPoint(m);
					
					if (selection != null && selection.isSelected()) {
						setCursor("arrows");
					}
					else {
						setCursor("pointer");
					}
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
					resizeHandles.setDragHandle();
					selectedTool = "resize";
					return;
				}
			}

			
			var selection = objectManager.getObjectAtPoint(m);
			
			if (selection == null)
			{
				if (!ctrlDown) {
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
				}
			} else {
				
				if (!currentSelection) {
					// If nothing is selected, then set the selected object as the current object
					objectManager.deselectAll();
					selection.select();
					currentSelection = selection;
				} else {
					if (ctrlDown) {
						if (!Array.isArray(currentSelection)) {
							currentSelection = [currentSelection];
						} 
						selection.select();
						currentSelection.push(selection)
					} else {
						if(!selection.isSelected()){
							objectManager.deselectAll();
							selection.select();
							currentSelection = selection;
						}						
					}
				}
				createResizeHandler();
			}
		}
	}

	function createResizeHandler() {
		if (resizeHandles) {
			resizeHandles.remove();
			resizeHandles = null;
		}

		if(currentSelection){
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
				x1: minX, 
				y1: minY,
				x2: maxX,
				y2: maxY
			});
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
			createResizeHandler();
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
		if (resizeHandles) {
			resizeHandles.remove();
			resizeHandles = null;
		}
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
		selectTool("select");
	}

	function addText (data) {
		var newObject = new TextObject(svg, {
			id: makeid(),
			text: data.text, 
			font: data.font, 
			color: selectedColor,
			size: data.size, 
			width: data.width, 
			height: data.height
		})
		objectManager.add(newObject);
		socket.emit('text', newObject.options);
		selectTool("select");
	}

	function removeSelected () { 
		objectManager.removeSelected()
		if (resizeHandles) {
			resizeHandles.remove();
			resizeHandles = null;
		}
	}
	
	return {
		removeSelected: removeSelected,
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
