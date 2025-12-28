const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres-svc',
  database: process.env.DB_NAME || 'tododb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  port: 5432
});

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM todos ORDER BY id');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Todo App</title>
        <style>
          body { font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px; }
          h1 { color: #333; }
          form { margin: 20px 0; }
          input[type="text"] { padding: 10px; width: 70%; font-size: 16px; }
          button { padding: 10px 20px; font-size: 16px; cursor: pointer; }
          ul { list-style: none; padding: 0; }
          li { padding: 10px; margin: 5px 0; background: #f4f4f4; border-radius: 5px; }
          .completed { text-decoration: line-through; color: #888; }
          a { margin-left: 10px; color: #007bff; text-decoration: none; }
        </style>
      </head>
      <body>
        <h1>📝 Todo List</h1>
        <form action="/add" method="POST">
          <input type="text" name="task" placeholder="Enter a new task" required>
          <button type="submit">Add</button>
        </form>
        <ul>
          ${result.rows.map(todo => `
            <li>
              <span class="${todo.completed ? 'completed' : ''}">${todo.task}</span>
              <a href="/toggle/${todo.id}">✓</a>
              <a href="/delete/${todo.id}" style="color: red;">✗</a>
            </li>
          `).join('')}
        </ul>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

app.post('/add', async (req, res) => {
  try {
    await pool.query('INSERT INTO todos (task, completed) VALUES ($1, $2)', [req.body.task, false]);
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

app.get('/delete/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM todos WHERE id = $1', [req.params.id]);
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

app.get('/toggle/:id', async (req, res) => {
  try {
    await pool.query('UPDATE todos SET completed = NOT completed WHERE id = $1', [req.params.id]);
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
