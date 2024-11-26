/**
 * Callback for rendering the homepage card.
 * @return {CardService.Card}
 */
function onHomepage(e) {
	var introText = CardService.newTextParagraph()
		.setText('Open a message to add an event.');
	var section = CardService.newCardSection()
		.addWidget(introText);
	var card = CardService.newCardBuilder()
		.addSection(section)
		.build();
	return card;
}

/**
 * Callback for Creating a card to add an event
 * @return {CardService.Card}
 */
function createCard(title, date, timeZone, startTime, endTime, location, description) {
	var titleText = CardService.newTextInput()
		.setFieldName('title')
		.setTitle('Title')
		.setValue(title);

	var dateText = CardService.newTextInput()
		.setFieldName('date')
		.setTitle('Date')
		.setValue(date);

	var timeZoneText = CardService.newTextInput()
		.setFieldName('timeZone')
		.setTitle('Time Zone')
		.setValue(timeZone.id);

	var startText = CardService.newTextInput()
		.setFieldName('startTime')
		.setTitle('Start')
		.setValue(startTime);

	var endText = CardService.newTextInput()
		.setFieldName('endTime')
		.setTitle('End')
		.setValue(endTime);

	var locationText = CardService.newTextInput()
		.setFieldName('location')
		.setTitle('Location')
		.setValue(location);

	var descriptionText = CardService.newTextParagraph()
		.setText(description);

	// Create a button for adding event
	// Note: Action parameter keys and values must be strings.
	var action = CardService.newAction()
			.setFunctionName('doAddEvent')
			.setParameters({description: description});
	var addButton = CardService.newTextButton()
			.setText('Add')
			.setOnClickAction(action)
			.setTextButtonStyle(CardService.TextButtonStyle.FILLED);

	// Assemble the widgets
	var section = CardService.newCardSection()
			.addWidget(titleText)
			.addWidget(dateText)
			.addWidget(timeZoneText)
			.addWidget(startText)
			.addWidget(endText)
			.addWidget(locationText)
			.addWidget(descriptionText);

	// Add button to footer
	var footer = CardService.newFixedFooter()
		.setPrimaryButton(addButton);

	var builder = CardService.newCardBuilder()
			.addSection(section)
			.setFixedFooter(footer);

	// Create the header shown when the card is minimized,
	// but only when this card is a contextual card. Peek headers
	// are never used by non-contexual cards like homepages.
	var peekHeader = CardService.newCardHeader()
		.setTitle('Event')
		.setSubtitle(title);
	builder.setPeekCardHeader(peekHeader)

	return builder.build();
}

function combineDateTime(date, time) {
	date = new Date(date);
	date.setHours(time.getHours());
	date.setMinutes(time.getMinutes());
	return date;
}

function doAddEvent(e) {
	var title = e.formInput.title;
	var location = e.formInput.location;

	var timeZone = e.formInput.timeZone;

	var date = Utilities.parseDate(e.formInput.date, timeZone, "d MMM yyyy");
	var startTime = combineDateTime(
		date, Utilities.parseDate(e.formInput.startTime, timeZone, "h:mm a")
	);
	var endTime = combineDateTime(
		date, Utilities.parseDate(e.formInput.endTime, timeZone, "h:mm a")
	);
	var description = e.parameters.description;

	// create event
	var calendar = CalendarApp.getDefaultCalendar();
	var event = calendar.createEvent(
		title,
		startTime,
		endTime,
		{
			location: location,
			description: description
		}
	);

	var section = CardService.newCardSection()
		.addWidget(
			CardService.newTextParagraph().setText(
				'Event added to calendar: ' + calendar.getId()
			)
		);

	var card = CardService.newCardBuilder()
		.addSection(section)
		.build();

	return card;
}

/**
 * Truncate a string to specified length.
 * @param {string} string
 * @return {string} truncated string
 */
function truncate(str, length=40) {
	if (str.length > length) {
		str = str.slice(0, length);
		str = str.slice(0, str.lastIndexOf(' ')) + '...';
	}
	return str;
}

