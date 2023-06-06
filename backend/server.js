const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');

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
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + connection.threadId);
});

app.use(cors());
// Use body-parser middleware to parse request bodies
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Endpoint for getting all cats from the database
app.get('/cats/get', (req, res) => {
  const query = 'SELECT * FROM cats';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error executing MySQL query: ' + error.stack);
      res.status(500).json({ error: 'Unable to retrieve cats' });
    } else {
      res.json(results);
    }
  });
});

// Endpoint for adding a new cat to the database
app.post('/cats/post', (req, res) => {
  const { name, age, breed} = req.body;
  const query = 'INSERT INTO cats (name, age, breed) VALUES (?, ?, ?)';
  const values = [name, age, breed];
  connection.query(query, values, (error, result) => {
    if (error) {
      console.error('Error executing MySQL query: ' + error.stack);
      res.status(500).json({ error: 'Unable to add cat' });
    } else {
      res.json({ id: result.insertId });
    }
  });
});

// Endpoint for updating an existing cat
app.put('/cats/put/:id', (req, res) => {
  const { name, age, breed } = req.body;
  const { id } = req.params;
  const query = 'UPDATE cats SET name = ?, age = ?, breed = ? WHERE id = ?';
  const values = [name, age, breed, id];
  connection.query(query, values, (error, result) => {
    if (error) {
      console.error('Error executing MySQL query: ' + error.stack);
      res.status(500).json({ error: 'Unable to update cat' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Cat not found' });
    } else {
      res.status(204).end();
    }
  });
});

// Endpoint for deleting an existing cat
app.delete('/cats/delete/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM cats WHERE id = ?';
  const values = [id];
  connection.query(query, values, (error, result) => {
    if (error) {
      console.error('Error executing MySQL query: ' + error.stack);
      res.status(500).json({ error: 'Unable to delete cat' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Cat not found' });
    } else {
      res.status(204).end();
    }
  });
});

// Start listening for requests
app.listen(3001, () => {
  console.log('Server listening on port 3001');
});