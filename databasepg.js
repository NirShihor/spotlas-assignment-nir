const { Client } = require('pg/lib');

const client = new Client({
	host: 'localhost',
	user: 'postgres',
	port: 5432,
	password: process.env.PASSWORD,
	database: 'postgis_test',
});
client.connect();

module.exports = client;
