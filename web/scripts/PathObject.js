function PathObject (svg, options) {
	var pathData = [],
		scaledPathData = [];
	var minX = 9999, minY = 9999, maxX = 0, maxY = 0;

	options.offset = options.offset || { x: 0, y: 0 };
	options.scale = options.scale || { x: 1.0, y: 1.0 };
	options.fill = options.fill || "none";

	var lineFunction = d3.svg.line()
		.x(function(d) { return d.x; })
		.y(function(d) { return d.y; })
		.interpolate("linear");

	options.type = "path";

	// var group = svg.append("g");
	// var realPathObject = group.append("path")
			// .attr("vector-effect", "non-scaling-stroke");

	var pathObject = svg.append("path")
			.attr("vector-effect", "non-scaling-stroke");

			
	function applyAttributes() {
		pathObject
			.attr("stroke", options.color)
			.attr("stroke-width", options.lineWeight)
			.attr("fill", options.fill);
		// realPathObject
			// .attr("stroke", "red")
			// .attr("stroke-width", options.lineWeight)
			// .attr("fill", "none");
	}

	function transform() {
		pathObject.attr("transform", "translate(" + options.offset.x + " " + options.offset.y + ") translate(" + minX + " " + minY + ") scale(" + options.scale.x + " " + options.scale.y + ") translate(-" + minX + " -" + minY + ")");
		scaledPathData = simplifyPath(transformToLocal(pathData), 1);
//		realPathObject.attr("transform", "translate(" + options.offset.x + " " + options.offset.y + ") translate(" + minX + " " + minY + ") scale(" + options.scale.x + " " + options.scale.y + ") translate(-" + minX + " -" + minY + ")");
	}
	
	minX = maxX = options.x;
	minY = maxY = options.y;
	var isSelected = false;
	var origColor = options.color;

	function addPoint(point) {
		var origPath = [];
		for(var i = 0; i < pathData.length; i++)
		{
			origPath.push({ x: pathData[i].x, y: pathData[i].y });
		}
		addPointInternal(point);
		var newPath = simplifyPath(pathData, 1);
		var diffPath = [];
		for(var i = 0; i < newPath.length; i++)
		{
			if(origPath[i] === undefined || newPath[i].x !== origPath[i].x || newPath[i].y !== origPath[i].y) {
				diffPath.push({index: i, x: newPath[i].x, y: newPath[i].y });
			}
		}
		pathData = newPath;
		pathObject.attr("d", lineFunction(pathData));
		scaledPathData = simplifyPath(transformToLocal(pathData), 1);
		return { length: newPath.length, points: diffPath };
//		realPathObject.attr("d", lineFunction(pathData));
	}
	
	function updatePoints(length, points) {
		if(length < pathData.length) {
			pathData.splice(length, pathData.length - length)
		}		
		for(var i = 0; i < points.length; i++)
		{
			pathData[points[i].index] = { x: points[i].x, y: points[i].y };
		}
		pathObject.attr("d", lineFunction(pathData));
		scaledPathData = simplifyPath(transformToLocal(pathData), 1);
	}
	
	function addPointInternal(point) {
		if (point.x < minX) { minX = point.x; }; 
		if (point.x > maxX) { maxX = point.x; };
		if (point.y < minY) { minY = point.y; }; 
		if (point.y > maxY) { maxY = point.y; };
		pathData.push(point);
	}
	
	function addPointExternal(point) {
		addPointInternal(point);
		pathObject.attr("d", lineFunction(pathData));
	}
	
	if(options.points)
	{
		for(var i = 0; i < options.points.length; i++) {
			addPointInternal(options.points[i], true);
		}
		pathObject.attr("d", lineFunction(pathData));
//		realPathObject.attr("d", lineFunction(pathData));
	}

	applyAttributes();
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
	
	function transformToLocal(path)
	{
		var transformedPath = []
		for(var i = 0; i < path.length; i++) {
			var scaleOffsetX = minX + options.scale.x * (path[i].x - minX);
			var scaleOffsetY = minY + options.scale.y * (path[i].y - minY);
			transformedPath.push({ x: options.offset.x + scaleOffsetX, y: options.offset.y + scaleOffsetY });
		}
		return transformedPath;
	}
	
	return {
		type: 'path',
		id: options.id,
		options: options,
		addPoint: addPoint,
		addPointExternal: addPointExternal,
		updatePoints: updatePoints,
		update: function(newOptions) {
			console.log(this);
			options.color = newOptions.color || options.color;
			options.lineWeight = newOptions.lineWeight || options.lineWeight;
			options.fill = newOptions.fill || options.fill;
			applyAttributes();
		},
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
				if(options.fill === 'none') {
					for(var i = 1; i < scaledPathData.length; i++) {
						if(lineCircleCollide(scaledPathData[i], scaledPathData[i - 1], { x: x, y: y }, 5))
						{
							return true;
						}
					}

					return false;
				} else {
					return pointInPolygon({ x: x, y: y }, scaledPathData);
				}
					
			}
		},
		isSelected: function() { return isSelected; },
		arrayLength: function() {
			return pathData.length;
		},		
		length: function() {
			var _lastPoint = pathData[0];
			var length = 0;
			for(var i = 1; i < pathData.length; i++) {
				var point = pathData[i];
				length += distance(point, _lastPoint);
				_lastPoint = point;
			}
			return length;
		},
		getExtents: getExtents,
		select: function() {
			isSelected = true;
			pathObject.attr("opacity","0.5");
		},
		deselect: function() {
			isSelected = false;
			pathObject.attr("opacity","1.0");
		},
		remove: function() {
			//group.remove();
			pathObject.remove();
		},
		move: function(x, y) {
			options.offset.x += x;
			options.offset.y += y;
			transform();
		},
		transform: function(offset, scale) {
			options.offset.x = offset.x;
			options.offset.y = offset.y;
			options.scale.x = scale.x;
			options.scale.y = scale.y;
			transform();
		},
		resize: function(x, y, constrain) {
			var w1 = (maxX - minX) * options.scale.x;
			var w2 = w1 + x;
			var h1 = (maxY - minY) * options.scale.y;
			var h2 = h1 + y;
			var scaleX = w2 / w1;
			var scaleY = h2 / h1;
			if (constrain) {
				var vx = Math.sign(scaleX);
				var vy = Math.sign(scaleY);
				var sx = Math.abs(scaleX);
				var sy = Math.abs(scaleY);
				if (sx < sy) scaleX = sy * vx;
				if (sy < sx) scaleY = sx * vy;
			}
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

