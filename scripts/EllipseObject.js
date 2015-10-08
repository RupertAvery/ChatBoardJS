function EllipseObject (svg, options) {
	var minX = 9999, minY = 9999, maxX = 0, maxY = 0;

	options.offset = options.offset || { x: 0, y: 0 };
	options.scale = options.scale || { x: 1.0, y: 1.0 };
	options.fill = options.fill || "none";

	options.type = "ellipse";

	var pathObject = svg.append("ellipse")
		.attr("cx", options.x)
		.attr("cy", options.y)
		.attr("rx", options.radius.x)
		.attr("ry", options.radius.y)
		.attr("vector-effect", "non-scaling-stroke");
		
	function applyAttributes() {
		pathObject
			.attr("stroke", options.color)
			.attr("stroke-width", options.lineWeight)
			.attr("fill", options.fill);
	}				

	function transform() {
		pathObject.attr("transform", "translate(" + options.offset.x + " " + options.offset.y + ") translate(" + options.x + " " + options.y + ") scale(" + options.scale.x + " " + options.scale.y + ") translate(-" + options.x + " -" + options.y + ")");
	}
	
	var isSelected = false;

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
		var cx = options.offset.x + options.x;
		var cy = options.offset.y + options.y;
		var rx = options.radius.x;
		var ry = options.radius.y;
		return {
			x1: cx - options.scale.x * rx,
			y1: cy - options.scale.y * ry,
			x2: cx + options.scale.x * rx,
			y2: cy + options.scale.y * ry
		}
		
	}
	
	return {
		type: 'ellipse',
		id: options.id,
		options: options,
		update: function(newOptions) {
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
			var x1 = x - options.x - options.offset.x;
			var y1 = y - options.y - options.offset.y;
			var x2 = x1 * x1;
			var y2 = y1 * y1;
			var rx = options.scale.x * options.radius.x;
			var ry = options.scale.y * options.radius.y;
			var a2 = rx * rx;
			var b2 = ry * ry;
			var r = (x2/a2) + (y2/b2);
			if (r >= 0.8 && r <= 1.2) {
				return true;
			}
			return false;
		},
		isSelected: function() { return isSelected; },
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
			var w1 = 2 * options.scale.x * options.radius.x;
			var w2 = w1 + x;
			var h1 = 2 * options.scale.y * options.radius.y;
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
			options.offset.x += x / 2;
			options.offset.y += y / 2;
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

