function ImageObject(svg, options) {
	options.type = "image";
	
	options.offset = options.offset || { x: 0, y: 0 };
	options.scale = options.scale || { x: 1.0, y: 1.0 };

	var isSelected = false;
	
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
			x1: options.offset.x,
			y1: options.offset.y,
			x2: options.offset.x + options.scale.x * (options.width),
			y2: options.offset.y + options.scale.y * (options.height)
		}
	};
	
	var imgObject = svg.append("image")
			.attr("xlink:href", options.href)
			.attr("x", "0")
			.attr("y", "0")
			.attr("width", options.width + "px")
			.attr("height", options.height + "px");
	
	function transform(){ 
		imgObject.attr("transform", "translate(" + options.offset.x + " " + options.offset.y + ") scale(" + options.scale.x + " " + options.scale.y + ")");
	}
	
	transform();
	
	return {
		type: 'image',
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
			if(x >= rect.x1 && x <= rect.x2 && y >= rect.y1 && y <= rect.y2)
			{
				return true;
			}
		},
		isSelected: function() { return isSelected; },
		select: function() {
			isSelected = true;
			imgObject.attr("opacity","0.5");
		},
		getExtents: getExtents,
		deselect: function() {
			isSelected = false;
			imgObject.attr("opacity","1.0");
		},
		remove: function() {
			imgObject.remove();
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
			var w1 = options.width * options.scale.x;
			var w2 = w1 + x;
			var h1 = options.height * options.scale.y;
			var h2 = h1 + y;
			var scaleX = w2 / w1;
			var scaleY = h2 / h1;
			if (constrain) {
				if (scaleY < scaleX) scaleX = scaleY;
				if (scaleX < scaleY) scaleY = scaleX;
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
