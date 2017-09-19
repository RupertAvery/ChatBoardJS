/*
	@name:
		TextEditor
	@description:
		
	@parameters:
		textObject - the TextObject instance that will be edited
*/
function TextEditor(svg, textObject, callback)
{
	var options = textObject.options;
	var insertionPoint = 0;
	var cursor = { x: 0, y: 0 };
	var currentline = 0;
	
	var metrics = textObject.getFontMetrics();
	
	var textCursor = new TextCursor(svg, options.offset.x + options.x, options.offset.y + options.y, metrics);

	function updateTextCursor() {
		textCursor.setOffset(cursor.x, cursor.y);
	}
	
	return {
		remove: function() {
			textCursor.remove();
			textCursor = null;
		},
		back: function() {
			if(insertionPoint > 0) {
				textObject.deleteText(currentline, --insertionPoint, 1);
				cursor.x = textObject.getLineWidth(currentline, 0, insertionPoint);
				callback({ 
					id: textObject.id, 
					changes: [
						{ line: currentline, type: "update", text: textObject.getLine(currentline) }
					]
				})						
			} else {
				if(currentline > 0) {
					var temp = textObject.getLine(currentline);
					textObject.removeLine(currentline);
					currentline--;
					insertionPoint = textObject.getLine(currentline).length;
					textObject.insertText(currentline, insertionPoint, 0, temp);
					cursor.x = textObject.getLineWidth(currentline, 0, insertionPoint);
					cursor.y -= 1.25 * options.size;
					callback({ 
						id: textObject.id, 
						changes: [
							{ line: currentline + 1, type: "delete" },
							{ line: currentline, type: "update", text: textObject.getLine(currentline) }
						]
					})		
				}
			}
	
			updateTextCursor();
		},
		up: function() {
			if(currentline > 0) {
				currentline--;
				if(insertionPoint > textObject.getLine(currentline).length)
				{
					insertionPoint = textObject.getLine(currentline).length;
				}
				cursor.x = textObject.getLineWidth(currentline, 0, insertionPoint);
				cursor.y -= 1.25 * options.size;
			}
			updateTextCursor();
		},
		down: function() {
			if(currentline < textObject.getLines().length - 1) {
				currentline++;
				if(insertionPoint > textObject.getLine(currentline).length)
				{
					insertionPoint = textObject.getLine(currentline).length;
				}
				cursor.x = textObject.getLineWidth(currentline, 0, insertionPoint);
				cursor.y += 1.25 * options.size;
			}
			updateTextCursor();
		},
		left: function() {
			if(insertionPoint > 0) {
				insertionPoint--;
				cursor.x = textObject.getLineWidth(currentline, 0, insertionPoint);
			} else {
				if(currentline > 0) {
					currentline--;
					insertionPoint = textObject.getLine(currentline).length; 
					cursor.x = textObject.getLineWidth(currentline, 0, insertionPoint);
					cursor.y -= 1.25 * options.size;
				}
			}
			updateTextCursor();
		},
		right: function() {
			if(insertionPoint < textObject.getLine(currentline).length) {
				insertionPoint++;
				cursor.x = textObject.getLineWidth(currentline, 0, insertionPoint);
			} else {
				if(currentline < textObject.getLines().length - 1) {
					currentline++;
					insertionPoint = 0; 
					cursor.x = 0;
					cursor.y += 1.25 * options.size;
				}
			}
			updateTextCursor();
		},
		del: function() {
			var temp = textObject.getLine(currentline);
			if(insertionPoint < temp.length) {
				textObject.deleteText(currentline, insertionPoint, 1);
				callback({ 
					id: textObject.id, 
					changes: [
						{ line: currentline, type: "update", text: textObject.getLine(currentline) }
					]
				})	
			} else {
				if(currentline + 1 < textObject.getLines().length) {
					var temp = textObject.getLine(currentline + 1);
					textObject.removeLine(currentline + 1);
					textObject.insertText(currentline, insertionPoint, 0, temp)
					callback({ 
						id: textObject.id, 
						changes: [
							{ line: currentline - 1, type: "delete" },
							{ line: currentline, type: "update", text: textObject.getLine(currentline) }
						]
					})		
				
				}
			}
			updateTextCursor();
		},
		edit: function(ex, ey) {
			var hit = false;
			var lines = textObject.getLines();
			
			for(var i = 0; i < lines.length; i++) {
				
				if(ey >= options.offset.y + options.y + cursor.y - metrics.height && ey <= options.offset.y + options.y + cursor.y ) {
					currentline = i;
					hit = true;
					break;
				}

				cursor.y += 1.25 * options.size;
			}
			if(hit) {
				var lastcursorx = 0;
				hit = false;
				for(var j = 0; j < lines[currentline].length; j++)
				{
					cursor.x = textObject.getLineWidth(currentline, 0 , j);
					if(options.offset.x + options.x + cursor.x > ex) {
						insertionPoint = j - 1;
						cursor.x = lastcursorx;
						hit = true;
						break;
					}
					lastcursorx = cursor.x;
				}
				if(!hit) {
					insertionPoint = lines[currentline].length;
					cursor.x = textObject.getLineWidth(currentline);
				}
			}
			updateTextCursor();
		},
		newline: function() {
			var temp = textObject.getLine(currentline).substring(insertionPoint);
			textObject.deleteText(currentline, insertionPoint, temp.length);
			currentline++;
			textObject.insertLine(currentline, temp);
			callback({ 
				id: textObject.id, 
				changes: [
					{ line: currentline - 1, type: "update", text: textObject.getLine(currentline - 1) },
					{ line: currentline, type: "insert", text: temp }
				]
			});
			insertionPoint = 0;
			cursor.y += 1.25 * options.size;
			cursor.x = textObject.getLineWidth(currentline, 0, insertionPoint);
			updateTextCursor();

		},
		insertspace: function() {
			textObject.insertText(currentline, insertionPoint++, 0, ' ');
			callback({ 
				id: textObject.id, 
				changes: [
					{ line: currentline, type: "update", text: textObject.getLine(currentline) }
				]
			})
			cursor.x = textObject.getLineWidth(currentline, 0, insertionPoint);
			updateTextCursor();
		},
		type: function(char) {
			textObject.insertText(currentline, insertionPoint++, 0, char);
			callback({ 
				id: textObject.id, 
				changes: [
					{ line: currentline, type: "update", text: textObject.getLine(currentline) }
				]
			})
			cursor.x = textObject.getLineWidth(currentline, 0, insertionPoint);
			updateTextCursor();
		}				
	}	
}