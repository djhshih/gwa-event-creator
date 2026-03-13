/*
interface Interval {
	start: string,
	end: string
}
*/

/**
 * Return string after eating token in string.
 * @param s        string
 * @param token    RegExp object
 * @param tokenEnd RegExp object
 **/
function eatToken(s, token, tokenEnd) {
	var i = s.search(token);
	if (i == -1) {
		return s;
	}
	var end = endOf(s, tokenEnd, i);
	return s.substring(end);
}

/**
 * Return parsed token after prefix in string.
 * @param s       string
 * @param prefix  RegExp object
 * @param token   RegExp object
 **/
function parsePrefixedToken(s, prefix, token) {
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

/**
 * @param c string
 */
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
 * @param s       string
 * @param prefix  RegExp object
 **/
function parsePrefixedParagraph(s, prefix) {
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

/**
 * Normalize time string and return Interval object.
 * @param time  string
 * @return string
 */
function parseTimeInterval(time) {

	// Utilities.parseDate cannot handle 'a.m.' and 'p.m.',
	// so remove the '.'
	time = time.replaceAll('.', '');

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

	var suffix = /(a|p).?m.?/i;

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

/**
 * @param date  string
 * @return string
 */
function normalizeDate(date) {
	// remove 'st', 'nd, 'rd, and 'th' from numbers
	date = date.replace(/(\d+)(st|nd|rd|th)/g, '$1');

	// remove commas and parentheses
	date = date.replaceAll(',', '')
		.replaceAll('(', '').replaceAll(')', '')
		.replaceAll('[', '').replaceAll(']', '')

	// remove day of week
	date = date.replace(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\w*\s*/ig, '');

	return date;
}

/**
 * @param date  string
 * @return Date object
 */
function parseDate(date) {
	var y = null;
	var formats = ['yyyy-MM-dd', 'd MMM yyyy', 'MMM d yyyy'];
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
function normalizeTime(time) {
	if (time == '') {
		return time;
	}

	var i;

	// Insert space between time and am/pm suffix
	i = time.search(/(a|p).?m.?/i);
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
 * @param time  string
 * @return Date object
 */
function parseTime(time) {
	var y = null;
	var formats = ['h:mm a', 'HH:mm'];
	var parsed = false;
	for (var i = 0; i < formats.length; ++i) {
		try {
			y = Utilities.parseDate(time, "GMT", formats[i]);
			parsed = true;
		} catch {
			// do nothing
		}
		if (parsed) break;
	}
	return y;
}

/**
 * @param s      string
 * @param token  string
 * @param start  number
 */
function endOf(s, token, start) {
	var i = s.indexOf(token, start);
	if (i == -1) {
		return s.length;
	}
	return i;
}

/**
 * Truncate a string to specified length.
 * @param str   string
 * @return truncated string
 */
function truncate(str, length=40) {
	if (str.length > length) {
		str = str.slice(0, length);
		str = str.slice(0, str.lastIndexOf(' ')) + '...';
	}
	return str;
}

function parseBody(body) {
	// Remove possible email header
	body = eatToken(body, /Subject: /, '\n');

	// Remove return characters, which makes \n\n detection difficult
	body = body.replaceAll('\r', '');

	var title = parsePrefixedToken(body, /title\s*:/i, /\s*.+/);

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

	var times = normalizeTimeInterval(time);

	// parse time and date and output in standardized string format

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

	// attempt to parse date here
	var dateObj = parseDate(normalizeDate(date));
	if (dateObj != null) {
		date = Utilities.formatDate(dateObj, 'GMT', DATE_FORMAT);
	} else {
		// add note that date failed to parse)
		error += 'Error: Unrecognized date format. Please re-write in ' + DATE_FORMAT + ' format.\n';
	}

	return {
		title: title, date: date, times: times,
		location: location,
		description: description, error: error
	}
}
