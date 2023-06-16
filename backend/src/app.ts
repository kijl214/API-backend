import { Request, Response, NextFunction } from 'express';

const bodyParser = require('body-parser');
const mysql = require('mysql');
const express = require('express');
const app = express();
const cors = require('cors');

// Set up MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'api'
});

// Connect to MySQL
connection.connect();



app.use(cors());

// Use body-parser middleware to parse request bodies
app.use(bodyParser.json());




// Endpoint for getting all cats from the database
app.get('/cats/get', (req: any, res: any) => {
  const query = 'SELECT * FROM cats';
  connection.query(query, (error: any, results: any) => {
    if (error) {
      console.error('Error executing MySQL query: ' + error.stack);
      res.status(500).json({ error: 'Unable to retrieve cats' });
    } else {
      // Loop through the results and process each row
      const cats = results.map((cat: any) => {
        if (!cat.image) {
          console.error('Error: image data is missing for cat ' + cat.id);
          return null;
        }
      
        // Convert the binary data to a base64-encoded string
        const base64String = Buffer.from(cat.image).toString('base64');
      
        // Create a data URL from the base64-encoded string
        const dataUrl = `data:image/jpeg;base64,${base64String}`;
      
        // Return a new object with the data URL
        return {
          id: cat.id,
          name: cat.name,
          age:cat.age,
          breed:cat.breed,
          picture: dataUrl
        };
      });
      
      // Remove null values from the array
      const validCats = cats.filter((cat: any) => cat !== null);
      
      // Return the array of cat objects with the data URLs
      res.json(validCats);
    }
  });
});

// Start listening for requests
app.listen(3001, () => {
  console.log('Server listening on port 3001');
});

export default app;