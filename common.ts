/**
 * Callback for rendering the homepage card.
 * @return {CardService.Card}
 */
function onHomepage(e) {
	console.log(e);
	var hour = Number(Utilities.formatDate(new Date(), e.userTimezone.id, 'H'));
	var message;
	if (hour >= 6 && hour < 12) {
		message = 'Good morning';
	} else if (hour >= 12 && hour < 18) {
		message = 'Good afternoon';
	} else {
		message = 'Good night';
	}
	message += ' ' + e.hostApp;
	return createCard(message, true);
}

/**
 * Callback for Creating a card to add an event
 * @return {CardService.Card}
 */
function createCard(title, date, startTime, endTime, location, description) {
	var titleText = CardService.newTextInput()
		.setFieldName('title')
		.setTitle('Title')
		.setValue(title);

	var dateText = CardService.newTextInput()
		.setFieldName('date')
		.setTitle('Date')
		.setValue(date);

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
	var button = CardService.newTextButton()
			.setText('Add')
			.setOnClickAction(action)
			.setTextButtonStyle(CardService.TextButtonStyle.FILLED);
	var buttonSet = CardService.newButtonSet()
			.addButton(button);

	// Assemble the widgets and return the card.
	var section = CardService.newCardSection()
			.addWidget(titleText)
			.addWidget(dateText)
			.addWidget(startText)
			.addWidget(endText)
			.addWidget(locationText)
			.addWidget(buttonSet)
			.addWidget(descriptionText);
	var card = CardService.newCardBuilder()
			.addSection(section);

	// Create the header shown when the card is minimized,
	// but only when this card is a contextual card. Peek headers
	// are never used by non-contexual cards like homepages.
	var peekHeader = CardService.newCardHeader()
		.setTitle('Event')
		.setImageUrl('https://www.gstatic.com/images/icons/material/system/1x/pets_black_48dp.png')
		.setSubtitle(title);
	card.setPeekCardHeader(peekHeader)

	return card.build();
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

	var timeZone = Session.getScriptTimeZone();
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
	
	var navigation = CardService.newNavigation()
		.updateCard(card);
	var response = CardService.newActionResponseBuilder()
		.setNavigation(navigation);
	return response.build();	
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

