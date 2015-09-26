function TextObject(svg, options) {
	options.type = "text";
	options.fontfamily = options.fontfamily || "Arial";
	options.size = options.size || "16";
	options.offset = options.offset || { x: 20, y: 16 };
	options.scale = options.scale || { x: 1.0, y: 1.0 };

	var isSelected = false;

	var txtObject = svg.append("text")
			.attr("x", "0")
			.attr("y", "0")
			.attr("font-family", options.fontfamily)
			.attr("font-size", options.size);
	
	function transform() {
		txtObject.attr("transform", "translate(" + options.offset.x + " " + options.offset.y + ") scale(" + options.scale.x + " " + options.scale.y + ")");
	}
	
	transform();
	txtObject.text(options.text);

	function getTextSize(text, font) {
    // re-use canvas object for better performance
		var canvas = getTextSize.canvas || (getTextSize.canvas = document.createElement("canvas"));
		var context = canvas.getContext("2d");
		context.font = font;
		return context.measureText(text);
	};
	
	
	var extents = getTextSize(options.text, "16px Arial");

	var width = extents.width;
	var height = options.size || 16;

	function getExtents() {
		return {
			x1: options.offset.x,
			y1: options.offset.y - height / 2,
			x2: options.offset.x + (options.scale.x * width),
			y2: options.offset.y + (options.scale.y * height / 2)
		}
	}
		
	return {
		type: 'text',
		id: options.id,
		options: options,
		editText: function (text) {
			txtObject.text(text);
			extents = getTextSize(text, "16px Arial");
			width = extents.width;
		},
		containedBy: function(p1, p2) {
			var rect = getExtents();
			if(p1.x <= rect.x1 && p2.x >= rect.x2 && p1.y <= rect.y1 && p2.y >= rect.y2)
			{
				return true;
			}
		},
		hitTest: function(x, y) {
			var rect = getExtents();
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
		resize: function(x, y) {
			var w1 = options.width * options.scale.x;
			var w2 = w1 + x;
			var h1 = options.height * options.scale.y;
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


