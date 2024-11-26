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

interface Interval {
	start: string,
	end: string
}

/**
 * Return string after eating token in string.
 **/
function eatToken(s: string, token: RegExp, tokenEnd: string) {
	var i = s.search(token);
	if (i == -1) {
		return s;
	}
	var end = endOf(s, tokenEnd, i);
	return s.substring(end);
}

/**
 * Return parsed token after prefix in string.
 **/
function parsePrefixedToken(s: string, prefix: RegExp, token: RegExp) {
	var m1 = prefix.exec(s);
	if (m1 == null) {
		return '';
	}
	var j = m1.index + m1[0].length;
	var m2 = token.exec(s.substring(j));
	if (m2 == null) {
		return '';
	}
	return m2[0].trim();
}

function parseTimeInterval(time: string): Interval {

	// split time string into start and end times
	var startTime;
	var endTime;

	// check for dash
	var j = time.indexOf('-');
	if (j == -1) {
		// check for en dash
		j = time.indexOf('–'); 
	}
	if (j == -1) {
		// check for 'to'
		j = time.indexOf('to');
	}

	if (j != -1) {
		startTime = time.substring(0, j).trim();
		endTime = time.substring(j + 1).trim();
	} else {
		startTime = time;
		endTime = '';
	}

	// normalize format of times

	var suffix = /a|p.?m.?/;

	// infer am/pm of start time if it is missing
	if (startTime.search(suffix) == -1) {
		j = endTime.search(suffix)
		if (j != -1) {
			startTime += ' ' + endTime.substring(j);
		}
	}

	if (endTime == '') {
		endTime = startTime;
	}

	return {start: startTime, end: endTime};
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

	// Get message subject
	// stripping 'Re:', 'Fw:', or similar prefix
	// and anything enclosed in []
	var subject = message.getSubject()
			.replace(/^(re)|(fwd?)\:\s*/i, '')
			.replace(/^\[.*?\]\s*/, '');

	var timeZone = CalendarApp.getTimeZone();

	var body = message.getPlainBody();

	// Remove possible email header
	body = eatToken(body, /Subject: /, '\n');

	var title = parsePrefixedToken(body, /title\s*:/i, /\s*.+/);
	if (title == '') {
		title = subject;
	}

	// remove any parenthesized value (e.g. day of week)
	var date = parsePrefixedToken(body, /date\s*:/i, /\s*[0-9A-Za-z ,./]+/i);
	var time = parsePrefixedToken(body,
		/time\s*:/i,
		/\s*[0-9]+(:[0-9]+)?\s*(a|p\.?m\.?)?\s*(-|(to))?\s*[0-9]+(:[0-9]+)?\s*(a|p\.?m\.?)?/i
	);

	var location = parsePrefixedToken(body, /venue\s*:/i, /\s*.+/);
	if (location == '') {
		location = parsePrefixedToken(body, /location\s*:/i, /\s*.+/);
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

	var times = parseTimeInterval(time);

	return createCard(
		newCalendarEvent(
			title, date, timeZone, times.start, times.end, location, description
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

