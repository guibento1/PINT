const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });


var Sequelize = require('sequelize');
const db = new Sequelize(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
{
  host: process.env.HOST,
  port: '5432',
  dialect: 'postgres',
  logging: false
}
);

module.exports = db;
