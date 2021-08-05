const express = require('express');
const ical = require('ical-generator');
const logger = require('./logger');
const { Client } = require('@notionhq/client');
require('dotenv').config();

const app = express();

const port = process.env.PORT || 8080;
const interval = process.env.INTERVAL || 300000;
const organisation = process.env.ORGANISATION;
const dateProperty = process.env.DATE_PROPERTY_NAME || 'Due';
const calendar = ical({ name: 'Notion Workspace' });

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const urlFromId = (theId, dbId) => `https://notion.so/${organisation}/${dbId}&p=${theId.replace(/-/g, '')}`;

const refreshCalendar = async () => {
	// might need to alter it in the future for large databases / datasets,
	// given that iterating EVERY SINGLE event can be computationally taxing.
	try {
		calendar.clear();
		const databases = (await notion.databases.list()).results;

		for (const db of databases) {
			// skip if there is no date property on DB
			if (!db.properties[dateProperty]) {
				logger.log(`No date property for database ${db.id}`);
				continue;
			}

			logger.log(`Querying database for ${db.id}`);
			const response = await notion.databases.query({
				database_id: db.id,
				filter: {
					property: dateProperty,
					date: {
						is_not_empty: true,
					},
				},
			});

			const results = response.results;
			for (const event of results) {
				const url = urlFromId(event.id, db.id);
				const start = new Date(Date.parse(event.properties[dateProperty].date.start));
				const end = event.properties[dateProperty].date.end ? new Date(Date.parse(event.properties[dateProperty].date.end)) : new Date(start.getTime() + 3600000);
				const lastChange = event.last_edited_time;
				// It goes:
				// properties -> Name -> id: 'title' -> title Array
				const title = (Object.values(event.properties).find((obj) => obj['id'] == 'title')).title[0].plain_text;
				calendar.createEvent({ url: url, summary: title, start: start, end: end, description: `Last edited at: ${lastChange}` });
			}
			logger.log(`Created ${results.length} events for database ${db.id}`);
		}
	} catch (err) {
		logger.error(err);
	}
};

app.get('/cal', (req, res) => calendar.serve(res));
app.get('/cal/:dbId', (req, res) => calendar.serve(res));

setInterval(refreshCalendar, interval);

app.listen(port, () => {
	logger.log(`Listening on port ${port}`);
	refreshCalendar();
});

process.on('uncaughtException', (err) => logger.error(err));
