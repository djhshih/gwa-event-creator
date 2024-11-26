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
	title: string, date: string, timeZone: string,
	startTime: string, endTime: string,
	location:string , description: string
) {
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

function parseToken(s: string, prefix: RegExp, prefixEnd: string, tokenEnd: string) {
	var i = s.search(prefix);
	if (i == -1) {
		return '';
	}
	var start = s.indexOf(prefixEnd, i + 1) + 1;
	var end = endOf(s, tokenEnd, start);
	return s.substring(start, end).trim();
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


	var body = message.getPlainBody();

	var timeZone = CalendarApp.getTimeZone();

	var title = parseToken(body, /title:/i, ':', '\n');
	if (title == '') {
		// Use message subject as tentative title,
		// stripping 'Re:', 'Fw:', or similar prefix
		// and anything enclosed in []
		title = message.getSubject()
			.replace(/^(re)|(fwd?)\:\s*/i, '')
			.replace(/^\[.*?\]\s*/, '');
	}

	// remove any parenthesized value (e.g. day of week)
	var date = parseToken(body, /date:/i, ':', '\n')
		.replace(/\(.*\)/, '');
	var time = parseToken(body, /time:/i, ':', '\n');

	var location = parseToken(body, /venue:/i, ':', '\n');
	if (location == '') {
		location = parseToken(body, /location:/i, ':', '\n');
	}

	var description = '';
	var startTime = '';
	var endTime = '';

	var i;

	i = body.search(/biography:?/i);
	if (i == -1) {
		i = body.search(/abstract:?/i);
	}
	if (i != -1) {
		i = body.indexOf('\n', i+1);
		var part = body.substring(i);
		i = endOf(part, '\n\n', i);
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

function endOf(s: string, token: string, start: number) {
	var i = s.indexOf(token, start);
	if (i == -1) {
		return s.length;
	}
	return i;
}

