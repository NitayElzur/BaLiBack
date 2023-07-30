const express = require('express');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');
app.use(cors());
const songRoute = require('./routes/song');
const userRoute = require('./routes/user');
const establishmentRoute = require('./routes/establishment')
require('dotenv').config();
app.use(express.json());
mongoose.connect(process.env.SERVER_LINK, {})
.then(() => console.log('Connected to mongoDB'))
.catch(err => console.log(err))

app.use('/song', songRoute);
app.use('/user', userRoute);
app.use('/establishment', establishmentRoute);

app.get('/', (req, res) => {
    res.status(200).send('Hello world!')
})
app.listen(3000, () => {
    console.log('Server running');
})