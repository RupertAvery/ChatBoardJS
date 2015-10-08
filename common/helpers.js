var Helpers;

(function (factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) { // AMD
        define([], factory);
    }
    else if (typeof exports == "object" && typeof module == "object") { // CommonJS
        module.exports = factory;
    }
    else { // Browser
        Helpers = factory();
    }
})(function() {
	function atob(str) {
		return new Buffer(str, 'base64').toString('binary');
	}

	function makeid()
	{
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		for( var i=0; i < 24; i++ )
			text += possible.charAt(Math.floor(Math.random() * possible.length));

		return text;
	}

	function extend(a, b) {
		for(var p in b) {
			if(typeof(b[p]) === 'object' && b[p] !== null) {
				extend(a[p] || (a[p] = {}), b[p]);
			} else {
				a[p] = b[p];
			}
		}
	}
	
	
	return {
		atob: atob,
		makeid: makeid,
		extend: extend
	}
})

