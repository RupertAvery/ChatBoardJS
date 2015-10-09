/***********************************************************************************

Adapted from:

https://gist.github.com/adammiller/826148 (simplifyPath)
https://github.com/mattdesl/point-circle-collision
https://github.com/mattdesl/line-circle-collision

************************************************************************************/

	  var poly_simplify = function(V, tol) {
		// V ... [[x1,y1],[x2,y2],...] polyline
		// tol  ... approximation tolerance
		// ============================================== 
		// Copyright 2002, softSurfer (www.softsurfer.com)
		// This code may be freely used and modified for any purpose
		// providing that this copyright notice is included with it.
		// SoftSurfer makes no warranty for this code, and cannot be held
		// liable for any real or imagined damage resulting from its use.
		// Users of this code must verify correctness for their application.
		// http://softsurfer.com/Archive/algorithm_0205/algorithm_0205.htm
		var sum = function(u,v) {return [u[0]+v[0], u[1]+v[1]];}
		var diff = function(u,v) {return [u[0]-v[0], u[1]-v[1]];}
		var prod = function(u,v) {return [u[0]*v[0], u[1]*v[1]];}
		var dot = function(u,v) {return u[0]*v[0] + u[1]*v[1];}
		var norm2 = function(v) {return v[0]*v[0] + v[1]*v[1];}
		var norm = function(v) {return Math.sqrt(norm2(v));}
		var d2 = function(u,v) {return norm2(diff(u,v));}
		var d = function(u,v) {return norm(diff(u,v));}

		var simplifyDP = function( tol, v, j, k, mk ) {
		  //  This is the Douglas-Peucker recursive simplification routine
		  //  It just marks vertices that are part of the simplified polyline
		  //  for approximating the polyline subchain v[j] to v[k].
		  //  mk[] ... array of markers matching vertex array v[]
		  if (k <= j+1) { // there is nothing to simplify
			return;
		  }
		  // check for adequate approximation by segment S from v[j] to v[k]
		  var maxi = j;          // index of vertex farthest from S
		  var maxd2 = 0;         // distance squared of farthest vertex
		  var tol2 = tol * tol;  // tolerance squared
		  S = [v[j], v[k]];  // segment from v[j] to v[k]
		  u = diff(S[1], S[0]);   // segment direction vector
		  var cu = norm2(u,u);     // segment length squared
		  // test each vertex v[i] for max distance from S
		  // compute using the Feb 2001 Algorithm's dist_Point_to_Segment()
		  // Note: this works in any dimension (2D, 3D, ...)
		  var  w;           // vector
		  var Pb;                // point, base of perpendicular from v[i] to S
		  var b, cw, dv2;        // dv2 = distance v[i] to S squared
		  for (var i=j+1; i<k; i++) {
			// compute distance squared
			w = diff(v[i], S[0]);
			cw = dot(w,u);
			if ( cw <= 0 ) {
			  dv2 = d2(v[i], S[0]);
			} else if ( cu <= cw ) {
			  dv2 = d2(v[i], S[1]);
			} else {
			  b = cw / cu;
			  Pb = [S[0][0]+b*u[0], S[0][1]+b*u[1]];
			  dv2 = d2(v[i], Pb);
			}
			// test with current max distance squared
			if (dv2 <= maxd2) {
			  continue;
			}
			// v[i] is a new max vertex
			maxi = i;
			maxd2 = dv2;
		  }
		  if (maxd2 > tol2) {      // error is worse than the tolerance
			// split the polyline at the farthest vertex from S
			mk[maxi] = 1;      // mark v[maxi] for the simplified polyline
			// recursively simplify the two subpolylines at v[maxi]
			simplifyDP( tol, v, j, maxi, mk );  // polyline v[j] to v[maxi]
			simplifyDP( tol, v, maxi, k, mk );  // polyline v[maxi] to v[k]
		  }
		  // else the approximation is OK, so ignore intermediate vertices
		  return;
		}    

		var n = V.length;
		var sV = [];    
		var i, k, m, pv;               // misc counters
		var tol2 = tol * tol;          // tolerance squared
		vt = [];                       // vertex buffer, points
		mk = [];                       // marker buffer, ints

		// STAGE 1.  Vertex Reduction within tolerance of prior vertex cluster
		vt[0] = V[0];              // start at the beginning
		for (i=k=1, pv=0; i<n; i++) {
		  if (d2(V[i], V[pv]) < tol2) {
			continue;
		  }
		  vt[k++] = V[i];
		  pv = i;
		}
		if (pv < n-1) {
		  vt[k++] = V[n-1];      // finish at the end
		}

		// STAGE 2.  Douglas-Peucker polyline simplification
		mk[0] = mk[k-1] = 1;       // mark the first and last vertices
		simplifyDP( tol, vt, 0, k-1, mk );

		// copy marked vertices to the output simplified polyline
		for (i=m=0; i<k; i++) {
		  if (mk[i]) {
			sV[m++] = vt[i];
		  }
		}
		return sV;
	  }

	// Ramer-Douglas-Peucker algorithm
	function simplifyPath( points, tolerance ) {
		if(points.length == 0) return points;

		var Line = function( p1, p2 ) {
			this.p1 = p1;
			this.p2 = p2;
			
			this.distanceToPoint = function( point ) {
				// slope
				var m = 0;
				if(Math.abs( this.p2.x - this.p1.x ) > 0) {
					m = ( this.p2.y - this.p1.y ) / ( this.p2.x - this.p1.x );
				}
					// y offset
				var b = this.p1.y - ( m * this.p1.x ),
					d = [];
				// distance to the linear equation
				d.push( Math.abs( point.y - ( m * point.x ) - b ) / Math.sqrt( Math.pow( m, 2 ) + 1 ) );
				// distance to p1
				d.push( Math.sqrt( Math.pow( ( point.x - this.p1.x ), 2 ) + Math.pow( ( point.y - this.p1.y ), 2 ) ) );
				// distance to p2
				d.push( Math.sqrt( Math.pow( ( point.x - this.p2.x ), 2 ) + Math.pow( ( point.y - this.p2.y ), 2 ) ) );
				// return the smallest distance
				return d.sort( function( a, b ) {
					return ( a - b ); //causes an array to be sorted numerically and ascending
				} )[0];
			};
		};
		
		var douglasPeucker = function( points, tolerance ) {
			if ( points.length <= 2 ) {
				return [points[0]];
			}
			var returnPoints = [],
				// make line from start to end 
				line = new Line( points[0], points[points.length - 1] ),
				// find the largest distance from intermediate points to this line
				maxDistance = 0,
				maxDistanceIndex = 0,
				p;
			for( var i = 1; i <= points.length - 2; i++ ) {
				var distance = line.distanceToPoint( points[ i ] );
				if( distance > maxDistance ) {
					maxDistance = distance;
					maxDistanceIndex = i;
				}
			}
			// check if the max distance is greater than our tolerance allows 
			if ( maxDistance >= tolerance ) {
				p = points[maxDistanceIndex];
				line.distanceToPoint( p, true );
				// include this point in the output 
				returnPoints = returnPoints.concat( douglasPeucker( points.slice( 0, maxDistanceIndex + 1 ), tolerance ) );
				// returnPoints.push( points[maxDistanceIndex] );
				returnPoints = returnPoints.concat( douglasPeucker( points.slice( maxDistanceIndex, points.length ), tolerance ) );
			} else {
				// ditching this point
				p = points[maxDistanceIndex];
				line.distanceToPoint( p, true );
				returnPoints = [points[0]];
			}
			return returnPoints;
		};
		var arr = douglasPeucker( points, tolerance );
		// always have to push the very last point on so it doesn't get left off
		arr.push( points[points.length - 1 ] );
		
		return arr;
	};

	function pointInPolygon(point, polygon) {
		var i = 0, j = polygon.length - 1;
		var result = false;

		for (i = 0; i < polygon.length; i++) {
			if (polygon[i].y < point.y && polygon[j].y >= point.y ||  polygon[j].y < point.y && polygon[i].y >= point.y) {
				if (polygon[i].x +(point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) * (polygon[j].x-polygon[i].x) < point.x) {
				result = !result; 
				}
			}
			j = i; 
		}

	  return result; 
	}


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
