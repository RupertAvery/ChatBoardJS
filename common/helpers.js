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

module.exports = {
	atob: atob,
	makeid: makeid
}