const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
    timePlayed: {
        type: String, required: true, validate: {
            validator: v => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
            message: 'Time Played must be in HH/MM format'
        }
    },
    numOfVotes: [{ type: String }],
    numOfSuggests: [{ type: String }],
    numPlayed: { type: Number },
    genre: { type: String }
})

module.exports = mongoose.model('Song', songSchema);