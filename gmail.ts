
/**
 * Callback for when a message is loaded.
 * @param {Object} e The event object.
 */
function onGmailMessage(e) {
	var messageId = e.gmail.messageId;
	
	// get access token and use it for GmailApp calls
	var accessToken = e.gmail.accessToken;
	GmailApp.setCurrentMessageAccessToken(accessToken);

	var message = GmailApp.getMessageById(messageId);

	// get message subject,
	// stripping 'Re:', 'Fw:', or similar prefix
	// and anything enclosed in []
	var title = message.getSubject()
			.replace(/^(re)|(fwd?)\:\s*/i, '')
			.replace(/^\[.*?\]\s*/, '');

	var body = message.getPlainBody();

	var title = '';
	var date = '';
	var startTime = '';
	var endTime = '';
	var location = '';
	var description = '';
	var timeZone = e.userTimezone;

	var i = body.search(/title:/i);
	if (i != -1) {
		body = body.substring(i + 6);
		i = endOfLine(body);
		title = body.substring(0, i).trim();
		body = body.substring(i + 1);
	}

	i = body.search(/date:/i);
	if (i != -1) {
		body = body.substring(i + 5);
		i = endOfLine(body);
		date = body.substring(0, i).replace(/\(.*\)/, '').trim();
		body = body.substring(i + 1);
	}	

	i = body.search(/time:/i);
	if (i != -1) {
		body = body.substring(i + 5);
		i = endOfLine(body);
		time = body.substring(0, i).trim();
		body = body.substring(i + 1);
	}

	i = body.search(/venue:/i);
	if (i == 1) {
		i = body.search(/location:/i);
	}
	if (i != -1) {
		i = body.indexOf(':', i+1) + 1;
		body = body.substring(i);
		i = endOfLine(body);
		location = body.substring(0, i).trim();
		body = body.substring(i + 1);
	}

	i = body.search(/biography/i);
	if (i == 1) {
		i = body.search(/abstract/i);
	}
	if (i != -1) {
		i = body.indexOf('\n', i+1);
		body = body.substring(i);
		i = endOfParagraph(body);
		description = body.substring(0, i).trim();
		body = body.substring(i + 1);
	} else {
		description = body;
	}

	// check for dash
	var j = time.indexOf('-');
	if (j == -1) {
		// check for en dash
		j = time.indexOf('–'); 
	}
	if (j != -1) {
		startTime = time.substring(0, j).trim();
		endTime = time.substring(j + 1).trim();
	} else {
		startTime = time;
	}

	return createCard(title, date, timeZone, startTime, endTime, location, description);
}

function endOfLine(s) {
	var i = s.indexOf('\n');
	if (i == -1) {
		i = s.length;
	}
	return i;
}

function endOfParagraph(s) {
	var i = s.indexOf('\n\n');
	if (i == -1) {
		i = s.length;
	}
	return i;
}

