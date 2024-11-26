const DATE_FORMAT = 'yyyy-MM-dd';

interface CalendarEvent {
	title: string,
	date: string,
	timeZone: string,
	startTime: string,
	endTime: string,
	location: string,
	description: string,
	error: string
}

function newCalendarEvent(
	title: string, date: string, timeZone: string,
	startTime: string, endTime: string,
	location: string , description: string,
	error: string
) {
	return {
		title: title,
		date: date,
		timeZone: timeZone,
		startTime: startTime,
		endTime: endTime,
		location: location,
		description: description,
		error: error
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
export function parsePrefixedToken(s: string, prefix: RegExp, token: RegExp) {
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

function isWhitespace(c) {
	return c === ' '
		|| c === '\n'
		|| c === '\t'
		|| c === '\r'
		|| c === '\f'
		|| c === '\v'
		|| c === '\u00a0'
		|| c === '\u1680'
		|| c === '\u2000'
		|| c === '\u200a'
		|| c === '\u2028'
		|| c === '\u2029'
		|| c === '\u202f'
		|| c === '\u205f'
		|| c === '\u3000'
		|| c === '\ufeff';
}

/**
 * Return paragraph after prefix in string.
 **/
export function parsePrefixedParagraph(s: string, prefix: RegExp) {
	var m = prefix.exec(s);
	if (m == null) {
		return '';
	}
	var start = m.index + m[0].length;
	// ignore whitespace
	while (isWhitespace(s[start])) {
		++start;
	}
	var end = endOf(s, '\n\n', start);
	return s.substring(start, end);
}

function parseTimeInterval(time: string): Interval {

	// Utilities.parseDate cannot handle 'a.m.' and 'p.m.',
	// so remove the '.'
	time = time.replace(/\./g, '');

	// split time string into start and end times
	var startTime;
	var endTime;

	// check for dash
	var j = time.indexOf('-');
	var offset = 1;
	if (j == -1) {
		// check for en dash
		j = time.indexOf('–'); 
	}
	if (j == -1) {
		// check for 'to'
		j = time.indexOf('to');
		offset = 2;
	}

	if (j != -1) {
		startTime = time.substring(0, j).trim();
		endTime = time.substring(j + offset).trim();
	} else {
		startTime = time;
		endTime = '';
	}

	// normalize format of times

	var suffix = /a|p.?m.?/i;

	// infer am/pm of start time if it is missing
	if (startTime.search(suffix) == -1) {
		j = endTime.search(suffix)
		if (j != -1) {
			startTime += ' ' + endTime.substring(j);
		}
	}

	startTime = normalizeTime(startTime);
	if (endTime == '') {
		endTime = startTime;
	} else {
		endTime = normalizeTime(endTime);
	}

	return {start: startTime, end: endTime};
}

function parseDate(date: string): Date {
	var y = null;
	var formats = ['d MMM yyyy', 'd MMM, yyy', 'MMM d, yyyy', 'yyyy-MM-dd'];
	var parsed = false;
	for (var i = 0; i < formats.length; ++i) {
		try {
			y = Utilities.parseDate(date, "GMT", formats[i]);
			parsed = true;
		} catch {
			// do nothing
		}
		if (parsed) break;
	}
	return y;
}

/**
 * Normalize time string.
 */
function normalizeTime(time: string) {

	var i;

	// Insert space between time and am/pm suffix
	i = time.search(/a|p.?m.?/i);
	if (i > 0) {
		if (time[i - 1] != ' ') {
			// insert space
			time = time.substring(0, i) + ' ' + time.substring(i);
		}
	}

	// Add minutes if omitted
	i = time.search(/:\d+/);
	if (i == -1) {
		var j = time.indexOf(' ');
		if (j != -1) {
			// insert minutes
			time = time.substring(0, j) + ':00' + time.substring(j);
		} else {
			time += ':00';
		}
	}

	return time;
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

	// Remove return characters, which makes \n\n detection difficult
	body = body.replace(/\r/g, '');

	var title = parsePrefixedToken(body, /title\s*:/i, /\s*.+/);
	if (title == '') {
		title = subject;
	}

	// remove any parenthesized value (e.g. day of week)
	var date = parsePrefixedToken(body, /date\s*:/i, /\s*[0-9A-Za-z ,./]+/i);
	var time = parsePrefixedToken(body,
		/time\s*:/i,
		/\s*[0-9]+(:[0-9]+)?\s*(a|p\.?m\.?)?\s*(-|–|(to))?\s*[0-9]+(:[0-9]+)?\s*(a|p\.?m\.?)?/i
	);

	var location = parsePrefixedToken(body, /venue\s*:/i, /\s*.+/);
	if (location == '') {
		location = parsePrefixedToken(body, /location\s*:/i, /\s*.+/);
	}

	var error = '';
	var description = '';
	var startTime = '';
	var endTime = '';

	var i;

	var biography = parsePrefixedParagraph(body, /^ *biography:?\s*$/im);
	if (biography == '') {
		biography = parsePrefixedParagraph(body, /^ *speakers?:?\s*$/im);
	}

	var abstract = parsePrefixedParagraph(body, /^ *abstract:?\s*$/im);
	if (abstract == '') {
		abstract = parsePrefixedParagraph(body, /^ *(seminar )?overview?:?\s*$/im);
	}

	if (biography != '') {
		description += 'Biography:\n' + biography + '\n\n';
	}

	if (abstract != '') {
		description += 'Abstract:\n' + abstract + '\n\n';
	}

	var times = parseTimeInterval(time);

	// attempt to parse date here
	var dateObj = parseDate(date);
	if (dateObj != null) {
		// standardize format
		date = Utilities.formatDate(dateObj, 'GMT', DATE_FORMAT);
	} else {
		// add note that date failed to parse)
		error += 'Error: Unrecognized date format. Please re-write in ' + DATE_FORMAT + ' format.\n';
	}

	return createCard(
		newCalendarEvent(
			title, date, timeZone, times.start, times.end, location, description, error
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

