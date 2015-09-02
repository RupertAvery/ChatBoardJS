
	var tmp = [0, 0]

	function distance(a, b) {
			var dx = b.x - a.x
			var dy = b.y - a.y
			return Math.sqrt(dx * dx + dy * dy);
	}
		
	function pointCircleCollide(point, circle, r) {
		if (r===0) return false
		var dx = circle.x - point.x
		var dy = circle.y - point.y
		return dx * dx + dy * dy <= r * r
	}

	function lineCircleCollide(a, b, circle, radius, nearest) {
		//check to see if start or end points lie within circle 
		if (pointCircleCollide(a, circle, radius)) {
			if (nearest) {
				nearest.x = a.x
				nearest.y = a.y
			}
			return true
		} if (pointCircleCollide(b, circle, radius)) {
			if (nearest) {
				nearest.x = b.x
				nearest.y = b.y
			}
			return true
		}
		
		var x1 = a.x,
			y1 = a.y,
			x2 = b.x,
			y2 = b.y,
			cx = circle.x,
			cy = circle.y

		//vector d
		var dx = x2 - x1
		var dy = y2 - y1
		
		//vector lc
		var lcx = cx - x1
		var lcy = cy - y1
		
		//project lc onto d, resulting in vector p
		var dLen2 = dx * dx + dy * dy //len2 of d
		var px = dx
		var py = dy
		if (dLen2 > 0) {
			var dp = (lcx * dx + lcy * dy) / dLen2
			px *= dp
			py *= dp
		}
		
		if (!nearest)
			nearest = tmp
		nearest.x = x1 + px
		nearest.y = y1 + py
		
		//len2 of p
		var pLen2 = px * px + py * py
		
		//check collision
		return pointCircleCollide(nearest, circle, radius)
				&& pLen2 <= dLen2 && (px * dx + py * dy) >= 0
	}
