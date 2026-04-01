const fs = require("fs");
const vm = require("vm");

const parseSrc = fs.readFileSync(__dirname + "/parse.js", "utf8");

// Simple Utilities mock implementing parseDate and formatDate
const Utilities = {
	parseDate: function (s, tz, format) {
		if (!s) throw new Error("Empty date");
		s = s.trim();
		const monthNames = {
			jan: 0,
			feb: 1,
			mar: 2,
			apr: 3,
			may: 4,
			jun: 5,
			jul: 6,
			aug: 7,
			sep: 8,
			oct: 9,
			nov: 10,
			dec: 11,
		};
		// yyyy-MM-dd
		if (format === "yyyy-MM-dd") {
			const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
			if (!m) throw new Error("Invalid date");
			return new Date(
				Date.UTC(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3])),
			);
		}
		// d MMM yyyy or MMM d yyyy
		if (format === "d MMM yyyy" || format === "MMM d yyyy") {
			let m = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
			if (!m) m = s.match(/^([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})$/);
			if (!m) throw new Error("Invalid date");
			let day, mon, year;
			if (m.length === 4) {
				if (/^\d/.test(m[1])) {
					// d MMM yyyy
					day = parseInt(m[1]);
					mon = m[2].substring(0, 3).toLowerCase();
					year = parseInt(m[3]);
				} else {
					// MMM d yyyy
					mon = m[1].substring(0, 3).toLowerCase();
					day = parseInt(m[2]);
					year = parseInt(m[3]);
				}
			}
			if (monthNames[mon] === undefined) throw new Error("Invalid month");
			return new Date(Date.UTC(year, monthNames[mon], day));
		}
		// time formats
		if (format === "h:mm a") {
			const m = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
			if (!m) throw new Error("Invalid time");
			let h = parseInt(m[1]);
			const min = parseInt(m[2]);
			const ampm = m[3].toLowerCase();
			if (ampm === "pm" && h !== 12) h += 12;
			if (ampm === "am" && h === 12) h = 0;
			return new Date(Date.UTC(1970, 0, 1, h, min));
		}
		if (format === "HH:mm") {
			const m = s.match(/^(\d{1,2}):(\d{2})$/);
			if (!m) throw new Error("Invalid time");
			const h = parseInt(m[1]);
			const min = parseInt(m[2]);
			return new Date(Date.UTC(1970, 0, 1, h, min));
		}
		throw new Error("Unsupported format: " + format);
	},
	formatDate: function (d, tz, format) {
		// assume d is a Date
		function pad(n) {
			return n < 10 ? "0" + n : "" + n;
		}
		if (format === "h:mm a") {
			const h = d.getUTCHours();
			const m = d.getUTCMinutes();
			const ampm = h >= 12 ? "PM" : "AM";
			const hh = h % 12 === 0 ? 12 : h % 12;
			return hh + ":" + pad(m) + " " + ampm;
		}
		if (format === "yyyy-MM-dd") {
			return (
				d.getUTCFullYear() +
				"-" +
				pad(d.getUTCMonth() + 1) +
				"-" +
				pad(d.getUTCDate())
			);
		}
		throw new Error("Unsupported format: " + format);
	},
};

// Provide constants expected by parse.js
const DATE_FORMAT = "yyyy-MM-dd";
const TIME_FORMAT = "h:mm a";

// Create VM context and inject Utilities and constants
const context = {
	Utilities: Utilities,
	DATE_FORMAT: DATE_FORMAT,
	TIME_FORMAT: TIME_FORMAT,
	console: console,
};
vm.createContext(context);

// Run parse.js in VM
const script = new vm.Script(parseSrc, { filename: "parse.js" });
script.runInContext(context);

// Now call extractDateTime on the given string
const input = "Time: May 9, 2024, 10:00 - 16:00";
const result = context.extractDateTime(input);
console.log(JSON.stringify(result, null, 2));
