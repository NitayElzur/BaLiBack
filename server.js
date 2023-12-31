const express = require('express');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');
app.use(cors());
const songRoute = require('./routes/song');
const userRoute = require('./routes/user');
const establishmentRoute = require('./routes/establishment');
const statisticsRoute = require('./routes/statistics')
require('dotenv').config();
app.use(express.json());
mongoose.connect(process.env.SERVER_LINK, {})
    .then(() => console.log('Connected to mongoDB'))
    .catch(err => console.log(err))

app.use('/song', songRoute);
app.use('/user', userRoute);
app.use('/establishment', establishmentRoute);
app.use('/statistics', statisticsRoute);

app.get('/', (req, res) => {
    res.status(200).send('Hello world')
})
const server = app.listen(3000, () => {
    console.log('Server running');
})
require('dotenv').config()
const io = require('socket.io')(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
    }
});
io.on('connection', socket => {
    console.log(socket.id);
    socket.on('test', (obj, room) => {
        socket.to(room).emit('song-request', obj)
    })
    socket.on('join-room', (room) => {
        socket.join(room)
    })
})