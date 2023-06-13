import express from 'express';
import mysql from 'mysql';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import { Request, Response, NextFunction } from 'express';
import YAML from 'yamljs';
import multer from 'multer';

const axios = require('axios');
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
    // User is authenticated, continue to next
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

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// Endpoint for adding a new cat to the database
app.post('/cats/post', upload.single('image'), async (req: express.Request, res: express.Response) => {
  const { name, age, breed } = req.body;
  const image = req.file?.buffer;
  try {
    const query = 'INSERT INTO cats (name, age, breed, image) VALUES (?, ?, ?, ?)';
    const values = [name, age, breed, image];
    await connection.query(query, values);
    res.status(200).json({ message: 'Cat added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  } 
});

// Endpoint for updating an existing cat
app.put('/cats/put/:id', upload.single('image'), requireLogin, (req: express.Request, res: express.Response) => {
  const { name, age, breed} = req.body;
  const image = req.file?.buffer;
  const { id } = req.params;
  const query = 'UPDATE cats SET name = ?, age = ?, breed = ?, image = ? WHERE id = ?';
  const values = [name, age, breed,image, id];
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
      const staffs = results.map((staff: any) => {
        return {
          id: staff.id,
          username: staff.username,
          email: staff.email
        };
      });
      // Remove null values from the array
      const validstaff = staffs.filter((staff: any) => staff !== null);
      // Return the array of cat objects with the data URLs
      res.json(validstaff);
    }
  });
});


// staff sign up
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

// user login
app.post('/user/login', (req: express.Request, res: express.Response) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM user WHERE username = ? AND password = ?';
  const values = [username, password];
  connection.query(query, values, (error: any, results: any) => {
    if (error) {
      console.error('Error executing MySQL query: ' + error.stack);
      res.status(500).json({ error: 'Unable to login' });
    } else if (results.length === 0) {
      res.status(401).json({ error: 'Invalid username or password' });
    } else {
      const users = results.map((user: any) => {
        return {
          id: user.id,
          username: user.username,
          email: user.email
        };
      });

      // Remove null values from the array
      const validuser = users.filter((user: any) => user !== null);
      // Return the array of cat objects with the data URLs
      res.status(200).json(validuser);
    }
  });
});


// user sign up
app.post('/user/signup', (req: express.Request, res: express.Response) => {
  const { username, email, password, code, salt } = req.body;
  const query = 'INSERT INTO user (username, email, password) VALUES (?, ?, ?)';
  const values = [username, email, password];
  connection.query(query, values, (error: any, result: any) => {
    if (error) {
      console.error('Error executing MySQL query: ' + error.stack);
      res.status(500).json({ error: 'Unable to update user member' });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ error: 'User member not found' });
    } else {
      res.status(200).send(`User member Sign Up successfully.`);
    }
  });
});


// user google sign up
app.post('/user/signup/google', (req: express.Request, res: express.Response) => {
  const { codeResponse } = req.body;
  const link = ('https://www.googleapis.com/oauth2/v3/userinfo?access_token='+codeResponse.access_token)
  axios.get(link)
  .then(response => {
    //console.log(response.data);

    const query = 'INSERT INTO user (username, email) VALUES (?, ?)';
    const values = [response.data.name, response.data.email];
    connection.query(query, values, (error: any, result: any) => {
      if (error) {
        console.error('Error executing MySQL query: ' + error.stack);
        res.status(500).json({ error: 'Unable to update user member' });
      } else if (result.affectedRows === 0) {
        res.status(404).json({ error: 'User member not found' });
      } else {
        res.status(200).send(`User member Sign Up successfully.`);
      }
    });
  })
  .catch(error => {
    console.log(error);
  });
  //console.log(data);
});


// user google login
app.post('/user/login/google', (req: express.Request, res: express.Response) => {
  const { codeResponse } = req.body;
  const link = ('https://www.googleapis.com/oauth2/v3/userinfo?access_token='+codeResponse.access_token)
  axios.get(link)
  .then(response => {

    const query = 'SELECT * FROM user WHERE email = ?';
    const values = [response.data.email];
    connection.query(query, values, (error: any, result: any) => {
      if (error) {
        console.error('Error executing MySQL query: ' + error.stack);
        res.status(500).json({ error: 'Unable to login' });
      } else if (result.length === 0) {
        res.status(401).json({ error: 'Invalid google account' });
      } else {
        const users = result.map((user: any) => {
          return {
            id: user.id,
            username: user.username,
            email: user.email
          };
        });
        // Remove null values from the array
        const validuser = users.filter((user: any) => user !== null);
        // Return the array of cat objects with the data URLs
        res.json(validuser);
      }
    });
  })
  .catch(error => {
    console.log(error);
  });
  //console.log(data);
});






app.post('/cat/chatroom/get', (req: Request, res: Response) => {
  const query = 'SELECT * FROM chat_messages WHERE cat_id = ?';
  const { id } = req.body;
  const values = [id];
  connection.query(query, values, (error: any, result: any) => {
    if (error) {
      console.error('Error executing MySQL query: ' + error.stack);
      res.status(500).json({ error: 'Unable to fetch chat messages' });
    } else {
      const messages = result.map((chat: any) => {
        return {
          id: chat.id,
          cat_id: chat.cat_id,
          user_id: chat.user_id,
          staff_id: chat.staff_id,
          text: chat.text
        };
      });
      // Remove null values from the array
      const validmessages = messages.filter((message: any) => message !== null);
      // Return the array of cat objects with the data URLs
      res.json(validmessages);
    }
  });
});




app.post('/cat/chatroom/post', (req: Request, res: Response) => {
  const query = 'INSERT INTO chat_messages (text, cat_id, staff_id, user_id) VALUES (?, ?, ?, ?)';
  const { text,id,staff_id,user_id } = req.body;
  
  const value = [text,id,staff_id,user_id];
  connection.query(query, value, (error: any, result: any) => {
    if (error) {
      console.error('Error executing MySQL query: ' + error.stack);
      res.status(500).json({ error: 'Unable to login' });
    } else if (result.length === 0) {
      res.status(401).json({ error: 'Invalid google account' });
    } else {
      res.json({ message: 'Login successful' });
    }
  });
});




// Start listening for requests
app.listen(3001, () => {
  console.log('Server listening on port 3001');
});