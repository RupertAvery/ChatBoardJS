function LineObject (svg, options) {
	var lineData = [];
	var minX = 9999, minY = 9999, maxX = 0, maxY = 0;

	options.offset = options.offset || { x: 0, y: 0 };
	options.scale = options.scale || { x: 1.0, y: 1.0 };

	var lineFunction = d3.svg.line()
		.x(function(d) { return d.x; })
		.y(function(d) { return d.y; })
		.interpolate("linear");

	options.type = "line";

	var lineObject = svg.append("path")
			.attr("d", lineFunction(lineData))
			.attr("stroke", options.color)
			.attr("stroke-width", options.lineWeight)
			.attr("vector-effect", "non-scaling-stroke")
			.attr("fill", "none");

	function transform() {
		lineObject.attr("transform", "translate(" + options.offset.x + " " + options.offset.y + ") translate(" + minX + " " + minY + ") scale(" + options.scale.x + " " + options.scale.y + ") translate(-" + minX + " -" + minY + ")");
	}
	
	minX = maxX = options.x;
	minY = maxY = options.y;
	var isSelected = false;
	var origColor = options.color;

	function addPoint(point) {
		addPointInternal(point);
		lineObject.attr("d", lineFunction(lineData));
	}

	function addPointInternal(point) {
		if (point.x < minX) { minX = point.x; }; 
		if (point.x > maxX) { maxX = point.x; };
		if (point.y < minY) { minY = point.y; }; 
		if (point.y > maxY) { maxY = point.y; };
		lineData.push(point);
	}
	
	if(options.points)
	{
		for(var i = 0; i < options.points.length; i++) {
			addPointInternal(options.points[i], true);
		}
		lineObject.attr("d", lineFunction(lineData));
	}

	transform();
	
	function swap(a, b, c) { var t = a[c]; a[c] = b[c]; b[c] = t; }

	function fixBounds(ret) {
		if(options.scale.x < 0){
			var temp = ret.x2;
			ret.x2 = ret.x1;
			ret.x1 = temp;
		}
		if(options.scale.y < 0){
			var temp = ret.y2;
			ret.y2 = ret.y1;
			ret.y1 = temp;
		}
		return ret;
	}

	function getExtents() {
		return {
			x1: options.offset.x + minX,
			y1: options.offset.y + minY,
			x2: options.offset.x + minX + options.scale.x * (maxX - minX),
			y2: options.offset.y + minY + options.scale.y * (maxY - minY)
		}
	}
	
	return {
		type: 'line',
		id: options.id,
		options: options,
		addPoint: addPoint,
		containedBy: function(p1, p2) {
			var rect = fixBounds(getExtents());
			if(p1.x <= rect.x1 && p2.x >= rect.x2 && p1.y <= rect.y1 && p2.y >= rect.y2)
			{
				return true;
			}
		},
		hitTest: function(x, y) {
			var rect = fixBounds(getExtents());
			if(x >= rect.x1 && x <= rect.x2 && y >= rect.y1 && y <= rect.y2)
			{
				var scaleOffsetX = minX + options.scale.x * (lineData[0].x - minX);
				var scaleOffsetY = minY + options.scale.y * (lineData[0].y - minY);
				var _lastPoint = { x: options.offset.x + scaleOffsetX, y: options.offset.y + scaleOffsetY };

				for(var i = 1; i < lineData.length; i++) {
					var scaleOffsetX = minX + options.scale.x * (lineData[i].x - minX);
					var scaleOffsetY = minY + options.scale.y * (lineData[i].y - minY);
					var point = { x: options.offset.x + scaleOffsetX, y: options.offset.y + scaleOffsetY };

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
		getExtents: getExtents,
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
			options.offset.x += x;
			options.offset.y += y;
			transform();
		},
		resize: function(x, y) {
			var w1 = (maxX - minX) * options.scale.x;
			var w2 = w1 + x;
			var h1 = (maxY - minY) * options.scale.y;
			var h2 = h1 + y;
			var scaleX = w2 / w1;
			var scaleY = h2 / h1;
			options.scale.x *= scaleX;
			options.scale.y *= scaleY;
			transform();
		},
		scale: function(x, y) {
			options.scale.x = x;
			options.scale.y = y;
			transform();
		}
	}
}

