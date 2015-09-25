function ImageObject(svg, options) {
	options.type = "image";
	
	options.offset = options.offset || { x: 0, y: 0 };
	
	var isSelected = false;
	
	var imgObject = svg.append("image")
			.attr("xlink:href", options.href)
			.attr("x", "0")
			.attr("y", "0")
			.attr("width", options.width + "px")
			.attr("height", options.height + "px")
			.attr("transform", "translate(" + options.offset.x + " " + options.offset.y + ")");

	return {
		type: 'image',
		id: options.id,
		options: options,
		containedBy: function(p1, p2) {
			if(p1.x <= options.offset.x && p2.x >= (options.offset.x + options.width) && p1.y <= options.offset.y && p2.y >= (options.offset.y + options.height))
			{
				return true;
			}
		},
		hitTest: function(x, y) {
			if(x >= options.offset.x && x <= (options.offset.x + options.width) && y >= options.offset.y && y <= (options.offset.y + options.height))
			{
				return true;
			}
		},
		isSelected: function() { return isSelected; },
		select: function() {
			isSelected = true;
			imgObject.attr("opacity","0.5");
		},
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
			imgObject.attr("transform", "translate(" + options.offset.x + " " + options.offset.y + ")");
		}
	}
}
