const express = require('express');
const ical = require('ical-generator');
const { Client } = require('@notionhq/client');
require('dotenv').config();

const app = express();

const port = process.env.PORT || 8080;
const interval = process.env.INTERVAL || 300000;
const dbId = process.env.NOTION_DATABASE_ID;
const organisation = process.env.ORGANISATION;
const dateProperty = process.env.DATE_PROPERTY_NAME || 'Due';
const calendar = ical({ name: 'Notion Workspace' });

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const urlFromId = (theId) => `https://notion.so/${organisation}/${dbId}&p=${theId.replace(/-/g, '')}`;

const refreshCalendar = async () => {
	calendar.clear()
	const response = await notion.databases.query({
		database_id: dbId,
		filter: {
			property: dateProperty,
			date: {
				is_not_empty: true,
			},
		},
	});

	const results = response.results;
	for (const event of results) {
		const url = urlFromId(event.id);
		const start = new Date(Date.parse(event.properties[dateProperty].date.start));
		const end = event.properties[dateProperty].date.end ? new Date(Date.parse(event.properties[dateProperty].date.end)) : new Date(start.getTime() + 3600000);
		const lastChange = event.last_edited_time;
		// It goes:
		// properties -> Name -> id: 'title' -> title Array
		const title = (Object.values(event.properties).find((obj) => obj['id'] == 'title')).title[0].plain_text;
		// if (calendar.events().some((e) => e.description == `Last edited at: ${lastChange}` && e.url == url)) {
		// 	console.log(`No change to event ${url}`);
		// } else {
		// 	console.log('creating new event...');
		// 	const newEvent = calendar.events().find((event) => event.url == url);
		// 	const eventIndex = calendar.events().findIndex((event) => event.url == url);
		// 	eventIndex > -1 ? calendar.events[eventIndex] = newEvent :
		calendar.createEvent({ url: url, summary: title, start: start, end: end, description: `Last edited at: ${lastChange}` });
		// }
	}
};

app.get('/cal/:dbId', (req, res) => calendar.serve(res));

setInterval(refreshCalendar, interval);

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
	refreshCalendar();
});

process.on('uncaughtException', (err) => console.error(err));
