var moment = require('moment');
var humanizeDuration = require('humanize-duration');

function toDuration(startTime, endTime) {
	var duration = moment(endTime, "HH:mm, DD/MM/YYYY")-moment(startTime, "HH:mm, DD/MM/YYYY");
	return humanizeDuration(duration, {language: 'vi'});
}

module.exports = {
	toDuration: toDuration,
};