function ResizeHandle (svg, options) {
	options.width = 10;
	options.height = 10;
	var resizeHandles = svg.append("g");
	resizeHandles.append("line").attr("id", "r1").attr("stroke", "magenta").attr("stroke-width", 3).attr("x1", 2).attr("y1", 2).attr("x2", 2).attr("y2", -9);
	resizeHandles.append("line").attr("id", "r2").attr("stroke", "magenta").attr("stroke-width", 3).attr("x1", 2).attr("y1", 2).attr("x2", - 9).attr("y2", 2);
	resizeHandles.attr("transform", "translate(" + options.offset.x + " " + options.offset.y + ")");
	
	return  {
		remove: function () {
			resizeHandles.remove();
		},
		hitTest: function (x, y) {
			if (x >= options.offset.x - options.width && x <= options.offset.x && y >= options.offset.y - options.height && y <= options.offset.y)
			{
				return true;
			}
		},
		move: function (x, y) {
			options.offset.x += x;
			options.offset.y += y;
			resizeHandles.attr("transform", "translate(" + options.offset.x + " " + options.offset.y + ")");
		}
	}
} 
