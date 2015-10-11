function TextObject(svg, options) {
	options.type = "text";
	options.font = options.font || "Arial";
	options.size = options.size || "16";
	options.color = options.color || "black";

	var fsize = parseInt(options.size, 10) || 16;
	var height = 0, width = 0;

	
	var fontMetrics = getTextHeight(options.font, options.size + "px");	
		
	options.offset = options.offset || { x: 0, y: 0 };
	options.scale = options.scale || { x: 1.0, y: 1.0 };

	var isSelected = false;
	
	options.lines = options.lines || [];
	var spans = [];
	
	var txtObject = svg.append("text")
		.attr("font-family", options.font)
		.attr("font-size", options.size + "px")
		.attr("x", options.x)
		.attr("y", options.y)
		.attr("xml:space","preserve");
	
	if(options.lines.length == 0) {
		spans[0] = txtObject.append("tspan");
		options.lines[0] = "";	
		updateLine(0) ;
	} else {
		for(var i = 0; i < options.lines.length; i++) {
			insertLineInternal(i, options.lines[i]);
		}
		calculateExtents();
	}
	
	function updateLine(line) {
		var t = options.lines[line];
		spans[line].text(t == "" ? " " : t);
		calculateExtents();
	}
	
	function applyAttributes() {
		txtObject
			.attr("font-family", options.font)
			.attr("font-size", options.size)
			.attr("fill", options.color);
	}
	
	function calculateExtents() {
		height = 0;
		width = 0;
		for(var i = 0; i < options.lines.length; i++) {
			height += 1.25 * fsize;
			var w = getTextSize(options.lines[i], options.size + "px " + options.font).width;
			if(w > width) width = w;
		}
	}

	function transform() {
		txtObject.attr("transform", "translate(" + options.offset.x + " " + options.offset.y + ") translate(" + options.x + " " + options.y + ") scale(" + options.scale.x + " " + options.scale.y + ") translate(-" + options.x + " -" + options.y + ")");
	}
	
	applyAttributes();

	transform();


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
			x1: options.offset.x + options.x,
			y1: options.offset.y + options.y - fsize,
			x2: options.offset.x + options.x + (options.scale.x * width),
			y2: options.offset.y + options.y - fsize + (options.scale.y * height)
		}
	}
	
	function removeLine(line) {
		options.lines.splice(line, 1);
		spans[line].remove();
		spans.splice(line, 1);
		calculateExtents();
	}
	
	function insertLineInternal(index, text) {
		var newSpan = null;
		if(index == 0) {
			newSpan = txtObject.append("tspan");
		} else {
			newSpan = txtObject.append("tspan")
				.attr("x", options.x)
				.attr("dy", "1.25em");				
		}
		spans.splice(index, 0, newSpan);
		var t = options.lines[index];
		spans[index].text(t == "" ? " " : t);		
	}	
		
	function insertLine(before, text) {
		var newSpan = null;
		
		if(options.lines[before]) {
			newSpan = txtObject.insert("tspan", ":nth-child(" + (before + 1) + ")");
		} else {
			newSpan = txtObject.append("tspan");
		}
		newSpan.attr("x", options.x)
			.attr("dy", "1.25em");				
		
		options.lines.splice(before, 0, text);
		spans.splice(before, 0, newSpan);
		updateLine(before);			
		calculateExtents();
	}

	return {
		type: 'text',
		id: options.id,
		options: options,
		getFontMetrics: function() { return fontMetrics; },
		isEmpty : function() {
			return (options.lines.length == 0) || (options.lines.length == 1 && options.lines[0] == "");
		},
		getLines: function(line) {
			return options.lines;
		},
		getLine: function(line) {
			return options.lines[line];
		},
		getLineWidth: function(line, start, end) {
			return getTextSize(options.lines[line].substring(start, end), options.size + "px " + options.font).width;			
		},
		deleteText: function(line, position, length) {
			options.lines[line] = options.lines[line].splice(position, length);
			updateLine(line);
		},
		insertText: function(line, position, remove, text) {
			options.lines[line] = options.lines[line].splice(position, remove, text);
			updateLine(line);
		},
		insertLine: insertLine,
		removeLine: removeLine,
		updateText: function(data) {
			for(var i = 0; i < data.changes.length; i++)
			{
				var change = data.changes[i];
				switch(change.type) {
				case 'insert':
					insertLine(change.line, change.text);
					break;
				case 'update':
					options.lines[change.line] = change.text;
					updateLine(change.line);
					calculateExtents();
					break;
				case 'delete':
					removeLine(change.line);
					break;
				}
			}
		},
		update: function(newOptions) {
			options.color = newOptions.color || options.color;
			options.size = newOptions.size || options.size;
			options.font = newOptions.font || options.font;
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
		transform: function(offset, scale) {
			options.offset.x = offset.x;
			options.offset.y = offset.y;
			options.scale.x = scale.x;
			options.scale.y = scale.y;
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


