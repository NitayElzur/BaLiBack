const express = require('express');
const mongoose = require('mongoose');
const app = express();
const songRoute = require('./routes/song')
const userRoute = require('./routes/user')
require('dotenv').config();
app.use(express.json());
mongoose.connect(process.env.SERVER_LINK, {})
    .then(() => console.log('Connected to mongoDB'))
    .catch(err => console.log(err))

app.use('/song', songRoute)
app.use('/user', userRoute)

app.listen(3000, () => {
    console.log('Server running');
})