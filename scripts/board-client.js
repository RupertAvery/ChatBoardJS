function WhiteBoard(d3, socket, elementId) {
	var penisdown = false;
	var lastPoint = null;
	var startPoint = null;
	var selectionRect = null;
	var resizeHandles = null;
	var preDrawObject = null;
	
	var tools = {
		"pen": { name: "pencil", options: { hotspot: 'bottom left' } },
		"line": { name: "pencil", options: { hotspot: 'bottom left' } },
		"circle": { name: "pencil", options: { hotspot: 'bottom left' } },
		"rectangle": { name: "pencil", options: { hotspot: 'bottom left' } },
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
	var selectedColor = "";
	var selectedFill = "none";

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

	socket.on('path', function (data) {
		objectManager.add(new PathObject(svg, data));
	})

	socket.on('line', function (data) {
		objectManager.add(new LineObject(svg, data));
	})
    
	socket.on('text', function (data) {
		objectManager.add(new TextObject(svg, data));
	})
    
	socket.on('ellipse', function (data) {
		objectManager.add(new EllipseObject(svg, data));
	})
    
	socket.on('rectangle', function (data) {
		objectManager.add(new RectangleObject(svg, data));
	})
    
	socket.on('image', function (data) {
		objectManager.add(new ImageObject(svg, data));
	})

	socket.on('point', function (data){
		objectManager.getObject(data.id).addPoint(data.point);
	})
	
	socket.on('update', function (data){
		objectManager.getObject(data.id).update(data);
	})

	socket.on('replay', function (data) {
		for(var key in data.objects) {
			var object = data.objects[key];
			switch (object.type) {
			case 'path':
				objectManager.add(new PathObject(svg, object));
				break;
			case 'line':
				objectManager.add(new LineObject(svg, object));
				break;
			case 'ellipse':
				objectManager.add(new EllipseObject(svg, object));
				break;
			case 'rectangle':
				objectManager.add(new RectangleObject(svg, object));
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
		if (Array.isArray(data.id)) {
			for (var i = 0; i < data.id.length; i++) {
				objectManager.getObject(data.id[i]).move(data.x, data.y);
			}
		} else {
			objectManager.getObject(data.id).move(data.x, data.y);
		}
	})

	socket.on('scale', function (data){
		objectManager.getObject(data.id).scale(data.x, data.y);
	})

	socket.on('transform', function (data){
		if (Array.isArray(data.id)) {
			for (var i = 0; i < data.id.length; i++) {
				objectManager.getObject(data.id[i]).transform(data.offset, data.scale);
			}
		} else {
			objectManager.getObject(data.id).transform(data.offset, data.scale);
		}
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
		var offset = object.options.offset;
        var o = resizeHandles.options;


		socket.emit('transform', 
			{ 
				id: object.id, 
				scale: {
					x: scale.x, 
					y: scale.y
				},
				offset: {
					x: offset.x, 
					y: offset.y
				},
			});
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
				if (currentSelection && currentSelection.type == 'path')
				{
					currentSelection.addPoint(m);
				}
				socket.emit('point', { id: currentSelection.id, point: m });
				break;
			case "line":
				preDrawObject.attr("x2", m.x).attr("y2", m.y);
				break;
				
			case "ellipse":
				preDrawObject
					.attr("cx", startPoint.x + ((m.x - startPoint.x) / 2))
					.attr("cy", startPoint.y + ((m.y - startPoint.y) / 2))
					.attr("rx", Math.abs(m.x - startPoint.x) / 2)
					.attr("ry", Math.abs(m.y - startPoint.y) / 2);
				break;
				
			case "rectangle":
				preDrawObject.attr("width", m.x - startPoint.x).attr("height", m.y - startPoint.y);
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
							idList.push(currentSelection[i].id);
						}
						socket.emit('move', 
							{ 
								id: idList, 
								x: dx, 
								y: dy
							});						
					} else {
						currentSelection.move(dx, dy);
						socket.emit('move', 
							{ 
								id: currentSelection.id, 
								x: dx, 
								y: dy
							});						
					}
				} else {
					// otherwise, we are probably selecting with a rectangle
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
			addPath({
				x: m.x, 
				y: m.y, 
				color: selectedColor, 
				fill: selectedFill, 
				lineWeight: selectedLineWeight
			});
			break;
		case "line":
			preDrawObject = svg.append("line")
				.attr("x1", m.x)
				.attr("y1", m.y)
				.attr("x2", m.x)
				.attr("y2", m.y)
				.attr("stroke", selectedColor)
				.attr("stroke-width", selectedLineWeight);
			break;
		case "ellipse":
			preDrawObject = svg.append("ellipse")
				.attr("cx", m.x)
				.attr("cy", m.y)
				.attr("rx", 0)
				.attr("ry", 0)
				.attr("stroke", selectedColor)
				.attr("stroke-width", selectedLineWeight)
				.attr("fill", selectedFill);
			break;
		case "rectangle":
			preDrawObject = svg.append("rect")
				.attr("x", m.x)
				.attr("y", m.y)
				.attr("width", 0)
				.attr("height", 0)
				.attr("stroke", selectedColor)
				.attr("stroke-width", selectedLineWeight)
				.attr("fill", selectedFill);
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
			// In case we started drawing a path, but didn't move the pen much, 
			// remove the path altogether. This prevents almost invisible lines from
			// polluting the object list
			if (currentSelection.length() < 2) {
				objectManager.remove(currentSelection);
				socket.emit('remove', { id: currentSelection.id });
			}
			currentSelection = null;
			break;
		case "line": 
			preDrawObject.remove();
            addLine({
                x: startPoint.x, 
                y: startPoint.y, 
                width: m.x - startPoint.x,
                height: m.y - startPoint.y,
                color: selectedColor, 
                lineWeight: selectedLineWeight
            });
			currentSelection = null;
			break;
		case "ellipse": 
			preDrawObject.remove();
            addEllipse({
                x: startPoint.x + ((m.x - startPoint.x) / 2),
                y: startPoint.y + ((m.y - startPoint.y) / 2), 
                radius: {
					x: Math.abs(m.x - startPoint.x) / 2,
					y: Math.abs(m.y - startPoint.y) / 2
				},
                color: selectedColor, 
                fill: selectedFill, 
                lineWeight: selectedLineWeight
            });
			currentSelection = null;
			break;
		case "rectangle": 
			preDrawObject.remove();
            addRectangle({
                x: startPoint.x, 
                y: startPoint.y, 
                width: m.x - startPoint.x,
                height: m.y - startPoint.y,
                color: selectedColor, 
                fill: selectedFill, 
                lineWeight: selectedLineWeight
            });
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
	
	function updateSelection(attributes) {
		if(currentSelection) {
			if(Array.isArray(currentSelection)) {
				for(var i = 0; i < currentSelection.length; i++) {
					currentSelection[i].update(attributes);
				}
			} else {
				currentSelection.update(attributes);
			}
			createResizeHandler();
			socket.emit('update', currentSelection.options);
		}
	}
	
	function selectColor (color) { 
		selectedColor = color; 
		updateSelection({ color: selectedColor });
	}
	
	function selectFill (color) { 
		selectedFill = color; 
		updateSelection({ fill: selectedFill });
	}
	
	function selectLineWeight(weight) {
		selectedLineWeight = weight;
		updateSelection({ lineWeight: selectedLineWeight });
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

	function addPath(options) {
		currentSelection = new PathObject(svg, {
			id: makeid(),
			x: options.x, 
			y: options.y, 
			color: options.color, 
			fill: options.fill,
			lineWeight: options.lineWeight
		});
		objectManager.add(currentSelection);
		socket.emit('path', currentSelection.options);
	}
    
	function addLine(options) {
		currentSelection = new LineObject(svg, {
			id: makeid(),
			x: options.x, 
			y: options.y,
			width: options.width,
			height: options.height,
			color: options.color, 
			lineWeight: options.lineWeight
		});
		objectManager.add(currentSelection);
		socket.emit('line', currentSelection.options);
	}
    
	function addEllipse(options) {
		currentSelection = new EllipseObject(svg, {
			id: makeid(),
			x: options.x, 
			y: options.y, 
			radius: {
				x: options.radius.x,
				y: options.radius.y
			},
			color: options.color, 
			fill: options.fill,
			lineWeight: options.lineWeight
		});
		objectManager.add(currentSelection);
		socket.emit('ellipse', currentSelection.options);
	}
    
	function addRectangle(options) {
		currentSelection = new RectangleObject(svg, {
			id: makeid(),
			x: options.x, 
			y: options.y, 
			width: options.width,
			height: options.height,
			color: options.color, 
			fill: options.fill,
			lineWeight: options.lineWeight
		});
		objectManager.add(currentSelection);
		socket.emit('rectangle', currentSelection.options);
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
	
	var _callbacks = {}
	
	return {
		getSelection: function() {
			return currentSelection;
		},
		removeSelected: removeSelected,
		deselectAll: objectManager.deselectAll,
		selectColor: selectColor,
		selectFill: selectFill,
		selectTool: selectTool,
		selectLineWeight: selectLineWeight,
		addText: addText,
		updateSelection: updateSelection,
		addImage: addImage,
		setSize: function (width, height) {
			$(boardId).width(width).height(height);
			//svg.attr("width", width).attr("height", height);
		}
	}
};
