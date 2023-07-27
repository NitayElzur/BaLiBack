const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    numOfSongsRequested: [{ type: String }]
})
module.exports = mongoose.model('User', userSchema);