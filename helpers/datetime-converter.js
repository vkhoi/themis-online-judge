var moment = require('moment');
var humanizeDuration = require('humanize-duration');

function toDuration(startTime, endTime) {
	var duration = moment(endTime, "DD/MM/YYYY HH:mm")-moment(startTime, "DD/MM/YYYY HH:mm");
	return humanizeDuration(duration, {language: 'vi'});
}

module.exports = {
	toDuration: toDuration,
};