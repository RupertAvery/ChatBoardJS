function TextObject(svg, options) {
	options.type = "text";
	options.font = options.font || "Arial";
	options.size = options.size || "16";
	options.color = options.color || "black";
	var height = parseInt(options.size, 10) || 16;
	var extents = getTextSize(options.text, height + "px " + options.font);
	var width = extents.width;

	options.offset = options.offset || { x: 20, y: height };
	options.scale = options.scale || { x: 1.0, y: 1.0 };

	var isSelected = false;

	var txtObject = svg.append("text")
			.attr("x", "0")
			.attr("y", "0")
			.attr("font-family", options.font)
			.attr("font-size", options.size)
			.attr("fill", options.color)
			.text(options.text);
	
	function transform() {
		txtObject.attr("transform", "translate(" + options.offset.x + " " + options.offset.y + ") scale(" + options.scale.x + " " + options.scale.y + ")");
	}
	
	transform();

	function getTextSize(text, font) {
    // re-use canvas object for better performance
		var canvas = getTextSize.canvas || (getTextSize.canvas = document.createElement("canvas"));
		var context = canvas.getContext("2d");
		context.font = font;
		return context.measureText(text);
	};
	
	

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
			y1: options.offset.y - (options.scale.y * height),
			x2: options.offset.x + (options.scale.x * width),
			y2: options.offset.y 
		}
	}
		
	return {
		type: 'text',
		id: options.id,
		options: options,
		editText: function (options) {
			options.font = options.font || "Arial";
			options.size = options.size || "16";
			options.color = options.color || "black";
			height = parseInt(options.size, 10) || 16;
			txtObject.text(options.text);
			extents = getTextSize(options.text, height + "px " + options.font);
			width = extents.width;
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
				return true;
			}
		},
		isSelected: function() { return isSelected; },
		select: function() {
			isSelected = true;
			txtObject.attr("opacity","0.5");
		},
		getExtents: getExtents,
		deselect: function() {
			isSelected = false;
			txtObject.attr("opacity","1.0");
		},
		remove: function() {
			txtObject.remove();
		},
		move: function(x, y) {
			options.offset.x += x;
			options.offset.y += y;
			transform();
		},
		resize: function(x, y, constrain) {
			var w1 = width * options.scale.x;
			var w2 = w1 + x;
			var h1 = height * options.scale.y;
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


