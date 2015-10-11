String.prototype.splice = function( idx, rem, s ) {
	return (this.slice(0,idx) + (!!s ? s : "") + this.slice(idx + Math.abs(rem)));
};
	
function TextObject(svg, options) {
	options.type = "text";
	options.font = options.font || "Arial";
	options.size = options.size || "16";
	options.color = options.color || "black";

	var fsize = parseInt(options.size, 10) || 16;
	//var extents = getTextSize(options.text, fsize + "px " + options.font);
	var height = 0, width = 0;
	var insertionPoint = 0;
	
	options.fontMetrics = getTextHeight(options.font, options.size + "px");	
		
	options.offset = options.offset || { x: 0, y: 0 };
	options.scale = options.scale || { x: 1.0, y: 1.0 };

	var isSelected = false;
	
	var lines = [];
	var currentline = 0;
	
	var txtObject = svg.append("text")
		.attr("font-family", options.font)
		.attr("font-size", options.size + "px")
		.attr("x", options.x)
		.attr("y", options.y)
		.attr("xml:space","preserve");
		
	lines[currentline] = { span: txtObject.append("tspan"), text: "" };	
	updateCurrentLine() ;
	
	function updateCurrentLine() {
		lines[currentline].span.text(lines[currentline].text == "" ? " " : lines[currentline].text);
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
		for(var i = 0; i < lines.length; i++) {
			height += 1.25 * fsize;
			var w = getTextSize(lines[i].text, options.size + "px " + options.font).width;
			if(w > width) width = w;
		}
	}

	function transform() {
		txtObject.attr("transform", "translate(" + options.offset.x + " " + options.offset.y + ") translate(" + options.x + " " + options.y + ") scale(" + options.scale.x + " " + options.scale.y + ") translate(-" + options.x + " -" + options.y + ")");
	}
	
	applyAttributes();

	transform();

	function getTextSize(text, font) {
    // re-use canvas object for better performance
		var canvas = getTextSize.canvas || (getTextSize.canvas = document.createElement("canvas"));
		var context = canvas.getContext("2d");
		context.font = font;
		return context.measureText(text);
	};
	
	
	function getTextHeight(font, size) {

		  var text = $('<span>Hg</span>').css({ fontFamily: font, fontSize: size });
		  var block = $('<div style="display: inline-block; width: 1px; height: 0px;"></div>');

		  var div = $('<div></div>');
		  div.append(text, block);

		  var body = $('body');
		  body.append(div);

		  try {

			var result = {};

			block.css({ verticalAlign: 'baseline' });
			result.ascent = block.offset().top - text.offset().top;

			block.css({ verticalAlign: 'bottom' });
			result.height = block.offset().top - text.offset().top;

			result.descent = result.height - result.ascent;

		  } finally {
			div.remove();
		  }

		  return result;
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
			x1: options.offset.x + options.x,
			y1: options.offset.y + options.y - fsize,
			x2: options.offset.x + options.x + (options.scale.x * width),
			y2: options.offset.y + options.y - fsize + (options.scale.y * height)
		}
	}
	
	var editor = {
		back: function() {
			var cursor = { x:0, y:0 };
			if(insertionPoint > 0) {
				lines[currentline].text = lines[currentline].text.splice(--insertionPoint, 1);
				cursor.x = getTextSize(lines[currentline].text.substring(0,insertionPoint), options.size + "px " + options.font).width;
				updateCurrentLine();
			} else {
				if(currentline > 0) {
					var temp = lines[currentline].text;
					lines[currentline].span.remove();
					currentline--;
					insertionPoint = lines[currentline].text.length; 
					lines[currentline].text += temp;
					cursor.x = getTextSize(lines[currentline].text.substring(0,insertionPoint), options.size + "px " + options.font).width;
					cursor.y -= 1.25 * options.size;
					updateCurrentLine();
					lines.splice(currentline + 1, 1);
				}
			}
			calculateExtents();
			return cursor;
		},
		up: function() {
			var cursor = { x:0, y:0 };
			if(currentline > 0) {
				currentline--;
				if(insertionPoint > lines[currentline].text.length)
				{
					insertionPoint = lines[currentline].text.length;
				}
				cursor.x = getTextSize(lines[currentline].text.substring(0,insertionPoint), options.size + "px " + options.font).width;
				cursor.y -= 1.25 * options.size;
			}
			return cursor;
		},
		down: function() {
			var cursor = { x:0, y:0 };
			if(currentline < lines.length - 1) {
				currentline++;
				if(insertionPoint > lines[currentline].text.length)
				{
					insertionPoint = lines[currentline].text.length;
				}
				cursor.x = getTextSize(lines[currentline].text.substring(0,insertionPoint), options.size + "px " + options.font).width;
				cursor.y += 1.25 * options.size;
			}
			return cursor;
		},
		left: function() {
			var cursor = { x:0, y:0 };
			if(insertionPoint > 0) {
				insertionPoint--;
				cursor.x = getTextSize(lines[currentline].text.substring(0,insertionPoint), options.size + "px " + options.font).width;
			} else {
				if(currentline > 0) {
					currentline--;
					insertionPoint = lines[currentline].text.length; 
					cursor.x = getTextSize(lines[currentline].text.substring(0,insertionPoint), options.size + "px " + options.font).width;
					cursor.y -= 1.25 * options.size;
				}
			}
			return cursor;
		},
		right: function() {
			var cursor = { x:0, y:0 };
			if(insertionPoint < lines[currentline].text.length) {
				insertionPoint++;
				cursor.x = getTextSize(lines[currentline].text.substring(0,insertionPoint), options.size + "px " + options.font).width;
			} else {
				if(currentline < lines.length - 1) {
					currentline++;
					insertionPoint = 0; 
					cursor.x = 0;
					cursor.y += 1.25 * options.size;
				}
			}
			return cursor;
		},
		del: function() {
			var cursor = { x:0, y:0 };
			if(insertionPoint < lines[currentline].text.length) {
				lines[currentline].text = lines[currentline].text.splice(insertionPoint, 1);
				cursor.x = getTextSize(lines[currentline].text.substring(0,insertionPoint), options.size + "px " + options.font).width;
				updateCurrentLine();
			} else {
				if(currentline + 1 < lines.length) {
					var temp = lines[currentline + 1].text;
					lines[currentline + 1].span.remove();
					lines[currentline].text += temp;
					cursor.x = getTextSize(lines[currentline].text.substring(0,insertionPoint), options.size + "px " + options.font).width;
					updateCurrentLine();
					lines.splice(currentline + 1, 1);
				}
			}
			calculateExtents();
			return cursor;
		},
		edit: function(ex, ey) {
			var cursor = { x:0, y:0 };
			var hit = false;
			for(var i = 0; i < lines.length; i++) {
				var width = getTextSize(lines[i].text, options.size + "px " + options.font).width;
				if(ey >= options.offset.y + options.y + cursor.y - options.fontMetrics.height && ey <= options.offset.y + options.y + cursor.y ) {
					currentline = i;
					hit = true;
					break;
				}

				cursor.y += 1.25 * options.size;
			}
			if(hit) {
				var lastcursorx = 0;
				hit = false;
				for(var j = 0; j < lines[currentline].text.length; j++)
				{
					var subtext = lines[currentline].text.substring(0, j);
					cursor.x = getTextSize(subtext, options.size + "px " + options.font).width;
					if(options.offset.x + options.x + cursor.x > ex) {
						insertionPoint = j-1;
						cursor.x = lastcursorx;
						hit = true;
						break;
					}
					lastcursorx = cursor.x;
				}
				if(!hit) {
					insertionPoint = lines[currentline].text.length;
					var subtext = lines[currentline].text.substring(0, insertionPoint);
					cursor.x = getTextSize(subtext, options.size + "px " + options.font).width;
				}
			}
			return cursor;
		},
		type: function(shiftDown, key) {
			var cursor = { x:0, y:0 };
			if(key == 13) {
				var temp = lines[currentline].text.substring(insertionPoint);
				lines[currentline].text = lines[currentline].text.splice(insertionPoint, temp.length);
				updateCurrentLine();
				currentline++;
				for(var i = lines.length; i > currentline; i--) {
					lines[i] = lines[i-1];
				}
				if(lines[currentline]) {
					lines[currentline] = { 
						span: txtObject.insert("tspan", ":nth-child(" + (currentline  + 1) + ")")
							.attr("x", options.x)
							.attr("dy", "1.25em"),
						text: temp
					};
				} else {
					lines[currentline] = { 
						span: txtObject.append("tspan")
							.attr("x", options.x)
							.attr("dy", "1.25em"),
						text: temp
					};
				}
				insertionPoint = 0;
				cursor.y += 1.25 * options.size;
				cursor.newLine = true;
			} else {
				var chr = String.fromCharCode(key);
				if(!shiftDown) chr = chr.toLowerCase();
				lines[currentline].text = lines[currentline].text.splice(insertionPoint++, 0 , chr);
			}
			cursor.x = getTextSize(lines[currentline].text.substring(0, insertionPoint), options.size + "px " + options.font).width;
			updateCurrentLine();
			calculateExtents();
			return cursor;
		}				
	}
		
	return {
		type: 'text',
		id: options.id,
		options: options,
		isEmpty : function() {
			return (lines.length == 0) || (lines.length == 1 && lines[0].text == "");
		},
		updateText: function(data) {
			lines[data.line].text = data.text;
			lines[data.line].span.text(lines[data.line].text == "" ? " " : lines[data.line].text);
		}
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
		},
		editor: editor
	}
}


