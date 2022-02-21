require('dotenv').config();
const express = require('express');
const Postgres = require('postgres');
const client = require('./databasepg');

const app = express();

const port = process.env.PORT || 3000;

app.get('/data', (req, res) => {
	const postgres = 'SELECT * FROM PUBLIC."MY_TABLE"';

	client.query(postgres, (err, result) => {
		if (err) throw err;
		res.send(result);
	});
});

// TASK 1

// 1. Change the website field to contain only domain
app.patch('/domain', (req, res) => {
	const stripUrl = `UPDATE PUBLIC."MY_TABLE" SET website = substring(website from '(?:.*://)?(?:www\.)?(?:inbox\.)?([^/]*)')`;
	client.query(stripUrl, (err, result) => {
		if (err) throw err;
		res.send(result);
	});
});

// 2. Count how many spots contain the same domain
app.get('/same-domains-total', (req, res) => {
	client.query(
		`SELECT COUNT(*)
        FROM PUBLIC."MY_TABLE"
        GROUP BY website
        HAVING COUNT(*)> 1`,
		(err, result) => {
			if (err) throw err;
			res.send(result);
		}
	);
});

// 3. Return spots which have a domain with a count greater than 1
app.get('/same-domains', (req, res) => {
	client.query(
		`SELECT website, COUNT(*)
        FROM PUBLIC."MY_TABLE"
        GROUP BY website
        HAVING COUNT(*)> 1`,
		(err, result) => {
			if (err) throw err;
			res.send(result);
		}
	);
});

// 4. Make a PL/SQL function for point 1 above
// function creation syntax:
// create or replace function get_domain() returns setof public."MY_TABLE" as $$
// begin
// UPDATE public."MY_TABLE" SET website =  substring(website from '(?:.*://)?(?:www\.)?(?:inbox\.)?([^/]*)');
// end
// $$ language plpgsql;

// Calling the function:
app.patch('/use-function', (req, res) => {
	client.query(`SELECT * FROM get_domain()`, (err, result) => {
		if (err) throw err;
		res.send(result);
	});
});

// TASK 2
// 1. Endpoint + 2. Find spots + 3. Order results by distance
// + 4. Return array
app.get('/area', (req, res) => {
	const latitude = req.query.lat;
	const longitude = req.query.lon;
	const radius = req.query.rad;
	const type = req.query.type;

	client.query(
		`SELECT name, website, coordinates, description, rating
    FROM public."MY_TABLE"
    WHERE ST_DWithin(coordinates, ST_MakePoint(${latitude}, ${longitude})::geography, ${radius})
    ORDER BY 
    CASE
    WHEN ST_DWithin(coordinates, ST_MakePoint(${latitude}, ${longitude})::geography, 5000)
    THEN coordinates::geography <-> ST_MakePoint(0.0,0.0)::geography end,
    CASE
    WHEN ST_DWithin(coordinates, ST_MakePoint(${latitude}, ${longitude})::geography, 50)
    THEN rating end;`,
		(err, result) => {
			if (err) throw err;
			res.send(Array(result));
		}
	);
});

app.listen(port, console.log(`Server started on port ${port}`));
