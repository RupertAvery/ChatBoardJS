function TextCursor(svg, textObject, textCallback) {

		var fontMetrics = textObject.options.fontMetrics;
		var x = textObject.options.offset.x + textObject.options.x;
		var y = textObject.options.offset.y + textObject.options.y;
	
		var offsetx = 0, offsety = 0
		
		var cursor = svg.append("line")
			.attr("stroke", "black");
			
		var offsety = 0;
		var timeout1 = null, timeout2 = null;
		function show() {
			if(cursor) {
				cursor.attr("style", "visibility: visible");
				timeout1 = setTimeout(hide, 500);
			}
		}
			
		function hide() {
			if(cursor) {
				cursor.attr("style", "visibility: hidden");
				timeout2 = setTimeout(show, 200);
			}
		}
		
		show();

		
		function updateCursorPosition() {
			cursor
				.attr("x1", x + offsetx)
				.attr("y1", offsety + y + fontMetrics.descent)
				.attr("x2", x + offsetx)
				.attr("y2", offsety + y - fontMetrics.height);
		}
		
		updateCursorPosition();
		
		return {
			setOffset: function(offset) {
				offsetx = offset.x;
				offsety = offset.y;
				updateCursorPosition();
			},
			remove: function() {
				clearTimeout(timeout1);
				clearTimeout(timeout2);
				cursor.remove();
				cursor = null;
			},
			back: function() {
				var offset = textObject.editor.back();
				offsetx = offset.x;
				offsety += offset.y;
				updateCursorPosition();	
				textCallback(offset);
			},
			up: function() {
				var offset = textObject.editor.up();
				offsetx = offset.x;
				offsety += offset.y;
				updateCursorPosition();				
			},
			down: function() {
				var offset = textObject.editor.down();
				offsetx = offset.x;
				offsety += offset.y;
				updateCursorPosition();				
			},
			left: function() {
				var offset = textObject.editor.left();
				offsetx = offset.x;
				offsety += offset.y;
				updateCursorPosition();				
			},
			right: function() {
				var offset = textObject.editor.right();
				offsetx = offset.x;
				offsety += offset.y;
				updateCursorPosition();				
			},
			del: function() {
				var offset = textObject.editor.del();
				offsetx = offset.x;
				offsety += offset.y;
				updateCursorPosition();				
				textCallback(offset);
			},
			edit: function(ex, ey) {
				textObject.editor.edit(ex, ey);
			},
			type: function(shiftDown, key) {
				var offset = textObject.editor.type(shiftDown, key);
				offsetx = offset.x;
				offsety += offset.y;
				updateCursorPosition();				
				textCallback(offset);
			}
		}
	}
	