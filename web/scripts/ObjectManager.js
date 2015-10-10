function ObjectManager() {
	var objects = {};

	function reverseForIn(obj, f) {
		var arr = [];
		for (var key in obj) {
			arr.push(key);
		}
		for (var i=arr.length-1; i>=0; i--) {
			if(!f.call(obj, arr[i])) {
				break;
			}
		}
	}
	
	return {
		add: function(object) {
			objects[object.id] = object;
		}, 
		addLocal: function(object) {
			objects[object.id] = object;
			socket.emit(object.type, object.options);
		}, 
		remove: function(object) {
			delete objects[object.id];
		},
		getObject: function(id) {
			return objects[id];
		},
		removeAtPoint: function(point) {
			for(var obj in objects) {
				if(objects[obj].hitTest(point.x, point.y))
				{
					objects[obj].remove();
					socket.emit('remove', { id: objects[obj].id });
					delete objects[obj];
				}
			}
		},
		removeSelected: function() {
			for(var obj in objects) {
				if(objects[obj].isSelected()) {
					objects[obj].remove();
					socket.emit('remove', { id: objects[obj].id });
					delete objects[obj];
				}
			}
		},
		deselectAll: function () {
			for(var obj in objects) {
				objects[obj].deselect();
			}
		},
		getObjectAtPoint: function(point) {
			var object = null;
			
			reverseForIn(objects, function(obj) {
				if(objects[obj].hitTest(point.x, point.y))
				{
					object = objects[obj];
					return false;
				}
				return true;
			})
			
			return object;
		},
		getObjectsInRect: function(point1, point2) {
			var selection = [];
			if (point1.x > point2.x) { 
				var temp = point2.x; point2.x = point1.x; point1.x = temp;
			}
			if (point1.y > point2.y) { 
				var temp = point2.y; point2.y = point1.y; point1.y = temp;
			}
			
			for(var obj in objects) {
				if(objects[obj].containedBy(point1, point2))
				{
					objects[obj].select();
					selection.push(objects[obj]);
				}
			}
			return selection;
		}
	}
}
