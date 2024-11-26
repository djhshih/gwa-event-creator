interface CalendarEvent {
	title: string,
	date: string,
	timeZone: string,
	startTime: string,
	endTime: string,
	location: string,
	description: string
}

function newCalendarEvent(
	title, date, timeZone,
	startTime, endTime,
	location, description) {
	return {
		title: title,
		date: date,
		timeZone: timeZone,
		startTime: startTime,
		endTime: endTime,
		location: location,
		description: description
	};
}

/**
 * Callback for when a message is loaded.
 * @param {Object} e The event object.
 */
function onGmailMessage(e) {
	var messageId = e.gmail.messageId;
	
	// Get access token and use it for GmailApp calls
	var accessToken = e.gmail.accessToken;
	GmailApp.setCurrentMessageAccessToken(accessToken);

	var message = GmailApp.getMessageById(messageId);

	// Use message subject as tentative title,
	// stripping 'Re:', 'Fw:', or similar prefix
	// and anything enclosed in []
	var title = message.getSubject()
			.replace(/^(re)|(fwd?)\:\s*/i, '')
			.replace(/^\[.*?\]\s*/, '');

	var body = message.getPlainBody();

	var date = '';
	var startTime = '';
	var endTime = '';
	var location = '';
	var description = '';
	var timeZone = CalendarApp.getTimeZone();

	var i = body.search(/title:/i);
	if (i != -1) {
		var part = body.substring(i + 6);
		i = endOfLine(part);
		title = part.substring(0, i).trim();
	}

	i = body.search(/date:/i);
	if (i != -1) {
		var part = body.substring(i + 5);
		i = endOfLine(part);
		date = part.substring(0, i).replace(/\(.*\)/, '').trim();
	}	

	i = body.search(/time:/i);
	if (i != -1) {
		var part = body.substring(i + 5);
		i = endOfLine(part);
		time = part.substring(0, i).trim();
	}

	i = body.search(/venue:/i);
	if (i == 1) {
		i = body.search(/location:/i);
	}
	if (i != -1) {
		i = body.indexOf(':', i+1) + 1;
		var part = body.substring(i);
		i = endOfLine(part);
		location = part.substring(0, i).trim();
	}

	i = body.search(/biography:?/i);
	if (i == -1) {
		i = body.search(/abstract:?/i);
	}
	if (i != -1) {
		i = body.indexOf('\n', i+1);
		var part = body.substring(i);
		i = endOfParagraph(part);
		description = part.substring(0, i).trim();
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
	
	// infer am/pm for start time if it is missing
	if (startTime.search(/a|pm/) == -1) {
		j = endTime.search(/a|pm/)
		startTime += ' ' + endTime.substring(j);
	}

	return createCard(
		newCalendarEvent(
			title, date, timeZone, startTime, endTime, location, description
		)
	);
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

