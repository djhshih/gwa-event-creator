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
		return "";
	}
	var j = m1.index + m1[0].length;
	var m2 = token.exec(s.substring(j));
	if (m2 == null) {
		return "";
	}
	return m2[0].trim();
}

/**
 * @param c string
 */
function isWhitespace(c) {
	return (
		c === " " ||
		c === "\n" ||
		c === "\t" ||
		c === "\r" ||
		c === "\f" ||
		c === "\v" ||
		c === "\u00a0" ||
		c === "\u1680" ||
		c === "\u2000" ||
		c === "\u200a" ||
		c === "\u2028" ||
		c === "\u2029" ||
		c === "\u202f" ||
		c === "\u205f" ||
		c === "\u3000" ||
		c === "\ufeff"
	);
}

/**
 * Return paragraph after prefix in string.
 * @param s       string
 * @param prefix  RegExp object
 **/
function parsePrefixedParagraph(s, prefix) {
	var m = prefix.exec(s);
	if (m == null) {
		return "";
	}
	var start = m.index + m[0].length;
	// ignore whitespace
	while (isWhitespace(s[start])) {
		++start;
	}
	var end = endOf(s, "\n\n", start);
	return s.substring(start, end);
}

/**
 * Normalize time string and return Interval object.
 * @param time  string
 * @return { startTime, endTime }
 */
function normalizeTimeInterval(time) {
	// split time string into start and end times
	var startTime;
	var endTime;

	// check for dash
	var j = time.indexOf("-");
	var offset = 1;
	if (j == -1) {
		// check for en dash
		j = time.indexOf("–");
	}
	if (j == -1) {
		// check for 'to'
		j = time.indexOf("to");
		offset = 2;
	}

	if (j != -1) {
		startTime = time.substring(0, j).trim();
		endTime = time.substring(j + offset).trim();
	} else {
		startTime = time;
		endTime = "";
	}

	// normalize format of times

	var suffix = /(a|p).?m.?/i;

	// infer am/pm of start time from end time
	if (startTime.search(suffix) == -1) {
		j = endTime.search(suffix);
		if (j != -1) {
			startTime += " " + endTime.substring(j);
		}
	}

	startTime = normalizeTime(startTime);
	endTime = normalizeTime(endTime);

	return { start: startTime, end: endTime };
}

/**
 * @param date  string
 * @return string
 */
function normalizeDate(date) {
	// remove 'st', 'nd, 'rd, and 'th' from numbers
	date = date.replace(/(\d+)(st|nd|rd|th)/g, "$1");

	// remove commas and parenthesized elements
	date = date
		.replaceAll(",", "")
		.replace(/\(.*?\)/, "")
		.replace(/\[.*?\]/, "")

	// remove day of week
	date = date.replace(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\w*\s*/gi, "");

	return date;
}

/**
 * @param date  string
 * @return Date object
 */
function parseDate(date) {
	var y = null;
	var formats = ["yyyy-MM-dd", "d MMM yyyy", "MMM d yyyy"];
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
	if (time == "") {
		return time;
	}

	var i;

	// insert space between time and am/pm suffix
	i = time.search(/(a|p).?m.?/i);
	if (i > 0) {
		if (time[i - 1] != " ") {
			// insert space
			time = time.substring(0, i) + " " + time.substring(i);
		}
	}

	// add minutes if omitted
	i = time.search(/:\d+/);
	if (i == -1) {
		var j = time.indexOf(" ");
		if (j != -1) {
			// insert minutes
			time = time.substring(0, j) + ":00" + time.substring(j);
		} else {
			time += ":00";
		}
	}

	// normalize 'noon' and 'midnight' carefully:
	// "12:30 noon" -> "12:30 pm", standalone "noon" -> "12:00 pm"
	time = time
		.replace(/(\d{1,2}:\d{2})\s*noon/gi, "$1 pm")
		.replace(/\bnoon\b/gi, "12:00 pm")
		.replace(/(\d{1,2}:\d{2})\s*midnight/gi, "$1 am")
		.replace(/\bmidnight\b/gi, "12:00 am");

	// Utilities.parseDate cannot handle 'a.m.' and 'p.m.',
	// so remove all '.'
	time = time.replaceAll(".", "");

	return time;
}

/**
 * @param time  string
 * @return Date object
 */
function parseTime(time) {
	var y = null;
	var formats = ["h:mm a", "HH:mm"];
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
function truncate(str, length = 40) {
	if (str.length > length) {
		str = str.slice(0, length);
		str = str.slice(0, str.lastIndexOf(" ")) + "...";
	}
	return str;
}

/**
 * @param body  string of message body
 * @param date  date object obtained from email header
 */
function parseBody(body, date) {
	// Remove possible email header
	body = eatToken(body, /Subject: /, "\n");

	// Remove return characters, which makes \n\n detection difficult
	body = body.replaceAll("\r", "");

	var title = parsePrefixedToken(body, /title\s*:/i, /\s*.+/);

	var location = parsePrefixedToken(body, /venue\s*:/i, /\s*.+/);
	if (location == "") {
		location = parsePrefixedToken(body, /location\s*:/i, /\s*.+/);
	}

	var description = extractDescription(body);
	var dt = extractDateTime(body, date);

	return {
		title: title,
		date: dt.date,
		times: dt.times,
		location: location,
		description: description,
		error: dt.error,
	};
}

/**
 * Extract speaker description, if any
 */
function extractDescription(body) {
	var description = "";

	var biography = parsePrefixedParagraph(body, /^ *biography:?\s*$/im);
	if (biography == "") {
		biography = parsePrefixedParagraph(body, /^ *speakers?:?\s*$/im);
	}

	var abstract = parsePrefixedParagraph(body, /^ *abstract:?\s*$/im);
	if (abstract == "") {
		abstract = parsePrefixedParagraph(body, /^ *(seminar )?overview?:?\s*$/im);
	}

	if (biography != "") {
		description += "Biography:\n" + biography + "\n\n";
	}

	if (abstract != "") {
		description += "Abstract:\n" + abstract + "\n\n";
	}

	return description;
}

/**
 * Parse time and date and output in standardized string format
 * @param body   string
 * @param date   date of message
 * @param error  string for logging errors
 */
function extractDateTime(body, date) {
	var error = "";

	// extract date
	var date = parsePrefixedToken(body, /date(\s(and|&)\stime)?\s*:/i, /\s*.+/i);
	date = date.replace(/\s+/g, " ").trim();

	var time = "";

	// if time is empty, try to extract time from date field
	if (date) {
		var parens = date.match(/\([^)]*\)/g);
		if (parens) {
			for (var i = 0; i < parens.length; ++i) {
				var grp = parens[i].replace(/[()]/g, "").trim();
				if (grp.search(/\d{1,2}:\d{2}/) != -1) {
					time = grp;
					break;
				}
			}
		}
		// if time is still empty, try to extract trailing time
		if (time == "") {
			// .*? is a non-greedy match for smallest possible string
			var m = date.match(/(.*?)(\d{1,2}:\d{2}.*)$/);
			if (m) {
				date = m[1].trim();
				time = m[2].trim();
			}
		}
	}
	
	// fallback: extract time first
	
	if (time == "") {
		time = parsePrefixedToken(body, /time(\s(and|&)\sdate)?\s*:/i, /\s*.+/i);
		time.replace(/\s+/g, " ").trim();
	}

	// if date is empty, try to extract date from time field
	if (date == "" && time) {
		// use 4-digit year to separate date and time
		var m = time.match(/^\s*(.*?\d{4})\s*,?\s*(.*)$/);
		if (m) {
			date = m[1].trim();
			time = m[2].trim();
		}
	}

	var times = normalizeTimeInterval(time);

	// attempt to parse time
	var startTimeObj = parseTime(times.start);
	if (startTimeObj != null) {
		times.start = Utilities.formatDate(startTimeObj, "GMT", TIME_FORMAT);
	}
	var endTimeObj = parseTime(times.end);
	if (endTimeObj != null) {
		times.end = Utilities.formatDate(endTimeObj, "GMT", TIME_FORMAT);
	}

	if (startTimeObj == null || (times.end && endTimeObj == null)) {
		error +=
			"Error: Unrecognized time format. Please re-write in " +
			TIME_FORMAT +
			" format.\n";
	}

	// attempt to parse date here
	var dateObj = parseDate(normalizeDate(date));
	if (dateObj != null) {
		date = Utilities.formatDate(dateObj, "GMT", DATE_FORMAT);
	} else {
		// add note that date failed to parse)
		error +=
			"Error: Unrecognized date format. Please re-write in " +
			DATE_FORMAT +
			" format.\n";
	}

	return {
		date: date,
		times: times,
		error: error,
	};
}
