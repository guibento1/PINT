const fs = require('fs');
const path = require('path');

const controllers = {};

const jsonFilePath = path.join(__dirname, '../../openapi.json');

controllers.root = (req, res) => {

  fs.readFile(jsonFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error("Error reading JSON file:", err);
      return res.status(500).json({ error: "Unable to read JSON file" });
    }

    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      return res.status(500).json({ error: "Error parsing JSON file" });
    }
  });
};

module.exports = controllers;
