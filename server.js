const express = require('express');
const { Pool } = require('pg');
const session = require('express-session');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'todo-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres-primary',
  database: process.env.DB_NAME || 'tododb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  port: 5432
});

// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
  if (!req.session.username) {
    return res.redirect('/');
  }
  next();
};

app.get('/', async (req, res) => {
  if (req.session.username) {
    return res.redirect('/todos');
  }
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Todo App - Login</title>
      <style>
        body { 
          font-family: Arial; 
          max-width: 500px; 
          margin: 50px auto; 
          padding: 20px;
          text-align: center;
        }
        .welcome-img { 
          width: 200px; 
          margin: 20px 0;
          border-radius: 10px;
        }
        h1 { color: #333; }
        input[type="text"] { 
          padding: 12px; 
          width: 70%; 
          font-size: 16px;
          border: 2px solid #ddd;
          border-radius: 5px;
        }
        button { 
          padding: 12px 30px; 
          font-size: 16px; 
          cursor: pointer;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 5px;
          margin-top: 10px;
        }
        button:hover { background: #0056b3; }
      </style>
    </head>
    <body>
      <img src="/welcome.jpg" alt="Welcome" class="welcome-img" onerror="this.style.display='none'">
      <h1>🎯 Welcome to Todo App</h1>
      <p>Please enter your name to continue</p>
      <form action="/login" method="POST">
        <input type="text" name="username" placeholder="Enter your name" required minlength="2">
        <br>
        <button type="submit">Start Managing Tasks</button>
      </form>
    </body>
    </html>
  `);
});

app.post('/login', (req, res) => {
  const username = req.body.username.trim();
  if (username.length >= 2) {
    req.session.username = username;
    res.redirect('/todos');
  } else {
    res.redirect('/');
  }
});

app.get('/todos', requireLogin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM todos ORDER BY id DESC');
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Todo App</title>
        <style>
          body { font-family: Arial; max-width: 700px; margin: 50px auto; padding: 20px; }
          h1 { color: #333; }
          .user-info { 
            background: #e3f2fd; 
            padding: 10px; 
            border-radius: 5px; 
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          form { margin: 20px 0; }
          input[type="text"] { padding: 10px; width: 60%; font-size: 16px; }
          button { padding: 10px 20px; font-size: 16px; cursor: pointer; }
          .btn-primary { background: #007bff; color: white; border: none; border-radius: 5px; }
          .btn-logout { background: #dc3545; color: white; border: none; border-radius: 5px; padding: 8px 15px; }
          ul { list-style: none; padding: 0; }
          li { 
            padding: 15px; 
            margin: 10px 0; 
            background: #f8f9fa; 
            border-radius: 5px;
            border-left: 4px solid #007bff;
          }
          .task-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            margin-bottom: 5px;
          }
          .task-owner { 
            font-size: 12px; 
            color: #666;
            font-weight: bold;
          }
          .task-text { 
            font-size: 16px; 
            margin: 5px 0;
          }
          .completed { text-decoration: line-through; color: #888; }
          .my-task { border-left-color: #28a745; background: #e8f5e9; }
          .actions { margin-top: 10px; }
          a { 
            margin-right: 10px; 
            padding: 5px 10px;
            text-decoration: none;
            border-radius: 3px;
            font-size: 14px;
          }
          .btn-toggle { background: #28a745; color: white; }
          .btn-delete { background: #dc3545; color: white; }
          .btn-disabled { background: #ccc; color: #666; cursor: not-allowed; }
          .error { color: #dc3545; background: #f8d7da; padding: 10px; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="user-info">
          <span>👤 Logged in as: <strong>${req.session.username}</strong></span>
          <a href="/logout" class="btn-logout">Logout</a>
        </div>
        <h1>📝 My Todo List</h1>
        <form action="/add" method="POST">
          <input type="text" name="task" placeholder="Enter a new task" required>
          <button type="submit" class="btn-primary">Add Task</button>
        </form>
        ${req.query.error ? `<div class="error">❌ ${req.query.error}</div>` : ''}
        <ul>
          ${result.rows.map(todo => {
            const isOwner = todo.owner === req.session.username;
            return `
            <li class="${isOwner ? 'my-task' : ''}">
              <div class="task-header">
                <span class="task-owner">Created by: ${todo.owner}</span>
                ${isOwner ? '<span style="color: #28a745; font-size: 12px;">✓ Your task</span>' : ''}
              </div>
              <div class="task-text ${todo.completed ? 'completed' : ''}">${todo.task}</div>
              <div class="actions">
                ${isOwner ? `
                  <a href="/toggle/${todo.id}" class="btn-toggle">✓ ${todo.completed ? 'Undo' : 'Complete'}</a>
                  <a href="/delete/${todo.id}" class="btn-delete" onclick="return confirm('Delete this task?')">✗ Delete</a>
                ` : `
                  <span class="btn-disabled">🔒 Only ${todo.owner} can modify this task</span>
                `}
              </div>
            </li>
          `}).join('')}
        </ul>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

app.post('/add', requireLogin, async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO todos (task, completed, owner) VALUES ($1, $2, $3)', 
      [req.body.task, false, req.session.username]
    );
    res.redirect('/todos');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

app.get('/delete/:id', requireLogin, async (req, res) => {
  try {
    const result = await pool.query('SELECT owner FROM todos WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.redirect('/todos?error=Task not found');
    }
    if (result.rows[0].owner !== req.session.username) {
      return res.redirect('/todos?error=You can only delete your own tasks!');
    }
    await pool.query('DELETE FROM todos WHERE id = $1', [req.params.id]);
    res.redirect('/todos');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

app.get('/toggle/:id', requireLogin, async (req, res) => {
  try {
    const result = await pool.query('SELECT owner FROM todos WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.redirect('/todos?error=Task not found');
    }
    if (result.rows[0].owner !== req.session.username) {
      return res.redirect('/todos?error=You can only update your own tasks!');
    }
    await pool.query('UPDATE todos SET completed = NOT completed WHERE id = $1', [req.params.id]);
    res.redirect('/todos');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
