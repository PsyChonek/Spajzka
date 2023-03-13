const mongoose = require('mongoose');
require('dotenv').config();
const express = require('express');

const app = express();

app.use(express.json());

app.listen(3001, () => {
    console.log(`Server Started at ${3001}`)
})

const mongoConnectionsString = process.env.CONNECTION_STRING;

mongoose.connect(mongoConnectionsString)

const db = mongoose.connection;

db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to Database'));

const Model = require('./models/model');
//
// const data = new Model({ 
//     name: 'Test',
//     age: 20
// });
//
// const dataToSave = data.save();

