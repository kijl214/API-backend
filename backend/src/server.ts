import express from 'express';
import mysql from 'mysql';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import { Request, Response, NextFunction } from 'express';
import YAML from 'yamljs';

const swaggerDocument = YAML.load('./openapi.yaml');
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

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(cors());

// Use body-parser middleware to parse request bodies
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});



// Middleware function to check if user is logged in
const requireLogin = (req: Request, res: Response, next: NextFunction) => {
  // Check if user is authenticated
  const isAuthenticated = true; // Replace with actual authentication logic
  if (isAuthenticated) {
    // User is authenticated, continue to next middleware function or endpoint logic
    next();
  } else {
    // User is not authenticated, return an error response
    res.status(401).json({ error: 'Unauthorized' });
  }
};




// Endpoint for getting all cats from the database
app.get('/cats/get', (req: express.Request, res: express.Response) => {
  const query = 'SELECT * FROM cats';
  connection.query(query, (error: any, results: any) => {
    if (error) {
      console.error('Error executing MySQL query: ' + error.stack);
      res.status(500).json({ error: 'Unable to retrieve cats' });
    } else {
      res.json(results);
    }
  });
});

// Endpoint for adding a new cat to the database
app.post('/cats/post', requireLogin, (req: express.Request, res: express.Response) => {
  const { name, age, breed } = req.body;
  if (typeof age !== 'number') {
    res.status(400).json({ error: 'Age must be a number' });
    return;
  }
  const query = 'INSERT INTO cats (name, age, breed) VALUES (?, ?, ?)';
  const values = [name, age, breed];
  connection.query(query, values, (error: any, result: any) => {
    if (error) {
      console.error('Error executing MySQL query: ' + error.stack);
      res.status(500).json({ error: 'Unable to add cat' });
    } else {
      res.json({ id: result.insertId });
    }
  });
});

// Endpoint for updating an existing cat
app.put('/cats/put/:id', requireLogin, (req: express.Request, res: express.Response) => {
  const { name, age, breed } = req.body;
  const { id } = req.params;
  const query = 'UPDATE cats SET name = ?, age = ?, breed = ? WHERE id = ?';
  const values = [name, age, breed, id];
  connection.query(query, values, (error: any, result: any) => {
    if (error) {
      console.error('Error executing MySQL query: ' + error.stack);
      res.status(500).json({ error: 'Unable to update cat' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Cat not found' });
    } else {
      res.status(200).send(`Item ${id} updated successfully.`);
    }
  });
});

// Endpoint for deleting an existing cat
app.delete('/cats/delete/:id', requireLogin, (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const query = 'DELETE FROM cats WHERE id = ?';
  const values = [id];
  connection.query(query, values, (error: any, result: any) => {
    if (error) {
      console.error('Error executing MySQL query: ' + error.stack);
      res.status(500).json({ error: 'Unable to delete cat' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Cat not found' });
    } else {
      res.status(200).send(`Item ${id} deleted successfully.`);
    }
  });
});


// Endpoint for staff login
app.post('/staff/login', (req: express.Request, res: express.Response) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM staff WHERE username = ? AND password = ?';
  const values = [username, password];
  connection.query(query, values, (error: any, results: any) => {
    if (error) {
      console.error('Error executing MySQL query: ' + error.stack);
      res.status(500).json({ error: 'Unable to login' });
    } else if (results.length === 0) {
      res.status(401).json({ error: 'Invalid username or password' });
    } else {
      res.json({ message: 'Login successful' });
    }
  });
});


// Endpoint for staff sign up
app.put('/staff/signup', (req: express.Request, res: express.Response) => {
  const { username, email, password, code, salt } = req.body;
  const query = 'UPDATE staff SET username = ?, email = ?, password = ?, salt = ?, code = NULL WHERE code = ?';
  const values = [username, email, password, salt, code];
  connection.query(query, values, (error: any, result: any) => {
    if (error) {
      console.error('Error executing MySQL query: ' + error.stack);
      res.status(500).json({ error: 'Unable to update staff member' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Staff member not found' });
    } else {
      res.status(200).send(`Staff member Sign Up successfully.`);
    }
  });
});






// Start listening for requests
app.listen(3001, () => {
  console.log('Server listening on port 3001');
});