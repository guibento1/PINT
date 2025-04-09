const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

module.exports = {
  username: process.env.POSTGRES_USER,
  host: '127.0.0.1',
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,               
  dialect: 'postgres',      
  define: {
    timestamps: false, 
  },
};
