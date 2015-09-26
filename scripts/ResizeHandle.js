function ResizeHandle (svg, options) {
	//options.width = 10;
	//options.height = 10;
	var w = options.x2 - options.x1;
	var h = options.y2 - options.y1;
	
	var resizeHandles = svg.append("g");
	var handle1 = resizeHandles.append("rect").attr("id", "r1").attr("stroke", "black").attr("stroke-width", 2).attr("x", -5).attr("y", -5).attr("width", 10).attr("height", 10);
	var handle2 = resizeHandles.append("rect").attr("id", "r2").attr("stroke", "black").attr("stroke-width", 2).attr("x", -5).attr("y", -5).attr("width", 10).attr("height", 10);
	var handle3 = resizeHandles.append("rect").attr("id", "r2").attr("stroke", "black").attr("stroke-width", 2).attr("x", -5).attr("y", -5).attr("width", 10).attr("height", 10);
	var handle4 = resizeHandles.append("rect").attr("id", "r2").attr("stroke", "black").attr("stroke-width", 2).attr("x", -5).attr("y", -5).attr("width", 10).attr("height", 10);
	var handle5 = resizeHandles.append("rect").attr("id", "r2").attr("stroke", "black").attr("stroke-width", 2).attr("x", -5).attr("y", -5).attr("width", 10).attr("height", 10);
	var handle6 = resizeHandles.append("rect").attr("id", "r2").attr("stroke", "black").attr("stroke-width", 2).attr("x", -5).attr("y", -5).attr("width", 10).attr("height", 10);
	var handle7 = resizeHandles.append("rect").attr("id", "r2").attr("stroke", "black").attr("stroke-width", 2).attr("x", -5).attr("y", -5).attr("width", 10).attr("height", 10);
	var handle8 = resizeHandles.append("rect").attr("id", "r2").attr("stroke", "black").attr("stroke-width", 2).attr("x", -5).attr("y", -5).attr("width", 10).attr("height", 10);

	function transform() {
		resizeHandles.attr("transform", "translate(" + options.x1 + " " + options.y1 + ")");
		handle2.attr("transform", "translate(" + w / 2 + " 0)");
		handle3.attr("transform", "translate(" + w + " 0)");
		handle4.attr("transform", "translate(" + w + " " + h / 2 + ")");
		handle5.attr("transform", "translate(" + w + " " + h + ")");
		handle6.attr("transform", "translate(" + w / 2 + " " + h + ")");
		handle7.attr("transform", "translate(0 " + h + ")");
		handle8.attr("transform", "translate(0 " + h / 2 + ")");
	}
	
	transform();
	
	var dragHandle = null;
	var currentDragHandle = null;

	function internalHitTest(x, y, px, py) {
		return x >= options.x1 + px - 5 && x <= options.x1 + px + 5 && y >= options.y1 + py - 5 && y <= options.y1 + py + 5;
	}
	
	return  {
		getDragHandle: function () { return currentDragHandle; },
		remove: function () {
			resizeHandles.remove();
		},
		setDragHandle: function() {
			currentDragHandle = dragHandle;
		},
		hitTest: function (x, y) {
			if (internalHitTest(x, y, 0,0))
			{
				dragHandle = "handle1";
				return true;
			}
			if (internalHitTest(x, y, w/2,0))
			{
				dragHandle = "handle2";
				return true;
			}
			if (internalHitTest(x, y, w,0))
			{
				dragHandle = "handle3";
				return true;
			}
			if (internalHitTest(x, y, w,h/2))
			{
				dragHandle = "handle4";
				return true;
			}
			if (internalHitTest(x, y, w,h))
			{
				dragHandle = "handle5";
				return true;
			}
			if (internalHitTest(x, y, w/2,h))
			{
				dragHandle = "handle6";
				return true;
			}
			if (internalHitTest(x, y, 0,h))
			{
				dragHandle = "handle7";
				return true;
			}
			if (internalHitTest(x, y, 0,h/2))
			{
				dragHandle = "handle8";
				return true;
			}
			dragHandle = null;
			return false;
		},
		move: function (x, y) {
			switch (currentDragHandle) { 
			case "handle1" :
				options.x1 += x;
				options.y1 += y;
				w = options.x2 - options.x1;
				h = options.y2 - options.y1;
				transform();
				break;
			case "handle2" :
				options.y1 += y;
				h = options.y2 - options.y1;
				transform();
				break;
			case "handle3" :
				options.x2 += x;
				options.y1 += y;
				w = options.x2 - options.x1;
				h = options.y2 - options.y1;
				transform();
				break;
			case "handle4" :
				options.x2 += x;
				w = options.x2 - options.x1;
				transform();
				break;
			case "handle5" :
				options.x2 += x;
				options.y2 += y;
				w = options.x2 - options.x1;
				h = options.y2 - options.y1;
				transform();
				break;
			case "handle6" :
				options.y2 += y;
				h = options.y2 - options.y1;
				transform();
				break;
			case "handle7" :
				options.x1 += x;
				options.y2 += y;
				w = options.x2 - options.x1;
				h = options.y2 - options.y1;
				transform();
				break;
			case "handle8" :
				options.x1 += x;
				w = options.x2 - options.x1;
				transform();
				break;
			case null : 
				options.x1 += x;
				options.y1 += y;
				options.x2 += x;
				options.y2 += y;
				w = options.x2 - options.x1;
				h = options.y2 - options.y1;
				transform();
				break;
			}
		},
		resize: function (x, y) {
			w += x;
			h += y;
			handle2.attr("transform", "translate(" + w + " " + h + ")");
			//resizeHandles.attr("transform", "translate(" + options.offset.x + " " + options.offset.y + ")");
		}
	}
} 
