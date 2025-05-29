const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

module.exports = {
  username: process.env.POSTGRES_USER,
  host: process.env.HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,               
  dialect: 'postgres',      
  schema: 'public',      
  views: true,
  define: {
    timestamps: false, 
  },
};
