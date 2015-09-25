function TextObject(svg, options) {
	options.type = "text";
	options.fontfamily = options.fontfamily || "Arial";
	options.size = options.size || "16";
	options.offset = options.offset || { x: 20, y: 16 };

	var isSelected = false;

	var txtObject = svg.append("text")
			.attr("x", "0")
			.attr("y", "0")
			.attr("font-family", options.fontfamily)
			.attr("font-size", options.size)
			.attr("transform", "translate(" + options.offset.x + " " + options.offset.y + ")");

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
			if(p1.x <= options.offset.x && p2.x >= (options.offset.x + width) && p1.y <= (options.offset.y - height / 2) && p2.y >= (options.offset.y + height / 2))
			{
				return true;
			}
		},
		hitTest: function(x, y) {
			if(x >= options.offset.x && x <= (options.offset.x + width) && y >= (options.offset.y - height / 2) && y <= (options.offset.y + height / 2))
			{
				return true;
			}
		},
		isSelected: function() { return isSelected; },
		select: function() {
			isSelected = true;
			txtObject.attr("opacity","0.5");
		},
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
			txtObject.attr("transform", "translate(" + options.offset.x + " " + options.offset.y + ")");
		}
	}
}


