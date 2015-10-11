/*
	@name:
		TextCursor
	@description:
		Creates a cursor for editing a TextObject and manages its position.
	@parameters:
		svg - the d3 svg that the cursor will be created on
		textObject - the TextObject instance that will be edited
		textEdit - the TextEditor instance
*/
function TextCursor(svg, x, y, fontMetrics) {
		var timeout1 = null, timeout2 = null;
		var cursor = svg.append("line")
			.attr("stroke", "black");
		
		// show and hide facilitates the blinkyness of the cursor
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
		
		// Start blinking!
		show();
		
		function setOffset(px, py) {
			cursor
				.attr("x1", x + px)
				.attr("y1", y + py + fontMetrics.descent)
				.attr("x2", x + px)
				.attr("y2", y + py - fontMetrics.height);
		}
		
		setOffset(0, 0);
		
		return {
			setOffset: setOffset,
			remove: function() {
				clearTimeout(timeout1);
				clearTimeout(timeout2);
				cursor.remove();
				cursor = null;
			}
		}
	}
	