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
		/\s*[0-9]+(:[0-9]+)?\s*((a|p)\.?m\.?)?\s*(-|–|(to))?\s*[0-9]+(:[0-9]+)?\s*((a|p)\.?m\.?)?/i
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

	// attempt to parse time
	var startTimeObj = parseTime(times.start);
	if (startTimeObj != null) {
		times.start = Utilities.formatDate(startTimeObj, 'GMT', TIME_FORMAT);
	}
	var endTimeObj = parseTime(times.end);
	if (endTimeObj != null) {
		times.end = Utilities.formatDate(endTimeObj, 'GMT', TIME_FORMAT);
	}

	if (startTimeObj == null || endTimeObj == null) {
		error += 'Error: Unrecognized time format. Please re-write in ' + TIME_FORMAT + ' format.\n';
	}

	date = normalizeDate(date);

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

