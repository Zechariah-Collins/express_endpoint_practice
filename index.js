const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();

const members = require('./members.json');
const { ppid } = require('process');

require('dotenv').config();

const port = process.env.PORT || 3000;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE
});

app.use(async function(req, res, next) {
  try {
    req.db = await pool.getConnection();
    req.db.connection.config.namedPlaceholders = true;

    await req.db.query(`SET SESSION sql_mode = "TRADITIONAL"`);
    await req.db.query(`SET time_zone = '-8:00'`);

    await next();

    req.db.release();
  } catch (err) {
    console.log(err);

    if (req.db) req.db.release();
    throw err;
  }
});

app.use(cors());

app.use(express.json());

app.get('/cars', async function(req, res) {
  try {
    const [rows] = await pool.execute('SELECT * FROM Database.cars')
    res.json(rows);
  } catch (err) {
    
  }
});

app.use(async function(req, res, next) {
  try {
    console.log('Middleware after the get /cars');
  
    await next();

  } catch (err) {

  }
});

app.post('/car', async function(req, res) {
  try {
    const { make, model, year } = req.body;
  
    const query = await req.db.query(
      `INSERT INTO car (make, model, year) 
       VALUES (:make, :model, :year)`,
      {
        make,
        model,
        year,
      }
    );
  
    res.json({ success: true, message: 'Car successfully created', data: null });
  } catch (err) {
    res.json({ success: false, message: err, data: null })
  }
});

app.delete('/cars/:id', async function(req,res) {
  try {
    console.log('req.params /car/:id', req.params)
    const carId = req.params.id
    
    await req.db.query(
        'UPDATE Database.cars SET deleted_flag = 1 WHERE id = :id',
        {
            id:carId
        }
    )
    res.json('successfully updated deleted_flag')
  } catch (err) {

  }
});

app.put('/cars/:id', async function(req,res) {
  try {
    const carId = req.params.id
    const {model} = req.body
    console.log(model)
    await req.db.query(
        'UPDATE Database.cars SET model = :model WHERE id = :id',
        {
            model,
            id: carId
        });
        res.json({success: true, message: 'Car model updated successfully', data: null});
  } catch (err) {

  }
});


app.listen(port, () => console.log(`212 API Example listening on http://localhost:${port}`));