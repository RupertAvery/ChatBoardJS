function LineObject (svg, options) {
	var lineData = [];
	var minX = 9999, minY = 9999, maxX = 0, maxY = 0;

	options.offset = options.offset || { x: 0, y: 0 };

	var lineFunction = d3.svg.line()
		.x(function(d) { return d.x; })
		.y(function(d) { return d.y; })
		.interpolate("linear");

	options.type = "line";

	var lineObject = svg.append("path")
			.attr("d", lineFunction(lineData))
			.attr("stroke", options.color)
			.attr("stroke-width", options.lineWeight)
			.attr("fill", "none")
			.attr("transform", "translate(" + options.offset.x + " " + options.offset.y + ")");

	minX = maxX = options.x;
	minY = maxY = options.y;

	var isSelected = false;

	var origColor = options.color;

	function addPoint(point) {
		addPointInternal(point);
		lineObject.attr("d", lineFunction(lineData));
	}

	function addPointInternal(point) {
		if(point.x < minX) { minX = point.x; } else if (point.x > maxX) { maxX = point.x; }
		if(point.y < minY) { minY = point.y; } else if (point.y > maxY) { maxY = point.y; }
		lineData.push(point);
	}
	
	if(options.points)
	{
		for(var i = 0; i < options.points.length; i++) {
			addPointInternal(options.points[i], true);
		}
		lineObject.attr("d", lineFunction(lineData));
	}

	function swap(a, b, c) { var t = a[c]; a[c] = b[c]; b[c] = t; }

	return {
		type: 'line',
		id: options.id,
		options: options,
		addPoint: addPoint,
		containedBy: function(p1, p2) {
			if(p1.x <= (options.offset.x + minX) && p2.x >= (options.offset.x + maxX) && p1.y <= (options.offset.y + minY) && p2.y >= (options.offset.y + maxY))
			{
				return true;
			}
		},
		hitTest: function(x, y) {
			if(x >= (options.offset.x + minX) && x <= (options.offset.x + maxX) && y >= (options.offset.y + minY) && y <= (options.offset.y + maxY))
			{
				var _lastPoint = { x: lineData[0].x + options.offset.x, y: lineData[0].y + options.offset.y };

				for(var i = 1; i < lineData.length; i++) {
					var point = { x: lineData[i].x + options.offset.x, y: lineData[i].y + options.offset.y };

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
			options.offset.x += x;
			options.offset.y += y;
			lineObject.attr("transform", "translate(" + options.offset.x + " " + options.offset.y + ")");
		}
	}
}

