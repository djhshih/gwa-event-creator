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

	var p = parseBody(message.getPlainBody());

	return createCard(
		newCalendarEvent(
			p.title == '' ? subject : p.title,
			p.date, timeZone, p.times.start, p.times.end, p.location, p.description, p.error
		)
	);
}

