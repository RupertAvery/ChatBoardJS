function RectangleObject (svg, options) {

	options.offset = options.offset || { x: 0, y: 0 };
	options.scale = options.scale || { x: 1.0, y: 1.0 };

	options.type = "rectangle";

	var pathObject = svg.append("rect")
            .attr("x", options.x)
            .attr("y", options.y)
            .attr("width", options.width)
            .attr("height", options.height)
			.attr("stroke", options.color)
			.attr("stroke-width", options.lineWeight)
			.attr("vector-effect", "non-scaling-stroke")
			.attr("fill", "none");

	function transform() {
		pathObject.attr("transform", "translate(" + options.offset.x + " " + options.offset.y + ") translate(" + options.x + " " + options.y + ") scale(" + options.scale.x + " " + options.scale.y + ") translate(-" + options.x + " -" + options.y + ")");
	}
	
	var isSelected = false;

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
			x1: options.x + options.offset.x,
			y1: options.y + options.offset.y,
			x2: options.x + options.offset.x + options.scale.x * (options.width),
			y2: options.y + options.offset.y + options.scale.y * (options.height)
		}
	}
	
	return {
		type: 'rectangle',
		id: options.id,
		options: options,
		containedBy: function(p1, p2) {
			var rect = fixBounds(getExtents());
			if(p1.x <= rect.x1 && p2.x >= rect.x2 && p1.y <= rect.y1 && p2.y >= rect.y2)
			{
				return true;
			}
		},
		hitTest: function(x, y) {
			var rect = fixBounds(getExtents());
            if(lineCircleCollide({ x: rect.x1, y: rect.y1 }, { x: rect.x2, y: rect.y1 }, { x: x, y: y }, 5))
            {
                return true;
            }
            if(lineCircleCollide({ x: rect.x2, y: rect.y1 }, { x: rect.x2, y: rect.y2 }, { x: x, y: y }, 5))
            {
                return true;
            }			
            if(lineCircleCollide({ x: rect.x2, y: rect.y2 }, { x: rect.x1, y: rect.y2 }, { x: x, y: y }, 5))
            {
                return true;
            }
            if(lineCircleCollide({ x: rect.x1, y: rect.y2 }, { x: rect.x1, y: rect.y1 }, { x: x, y: y }, 5))
            {
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
		resize: function(x, y, constrain) {
			var w1 = (options.width) * options.scale.x;
			var w2 = w1 + x;
			var h1 = (options.height) * options.scale.y;
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

