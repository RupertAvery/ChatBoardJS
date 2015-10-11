String.prototype.splice = function( idx, rem, s ) {
	return (this.slice(0,idx) + (!!s ? s : "") + this.slice(idx + Math.abs(rem)));
};

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

