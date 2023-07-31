const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: {
        type: String, required: true, validate: {
            validator: v => /^https:\/\/www.youtube.com\/watch\?v=/.test(v),
            message: 'Url must be a valid youtube link'
        }
    },
    timePlayed: {
        type: String, validate: {
            validator: v => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
            message: 'Time Played must be in HH/MM format'
        }
    },
    timeRequested: {
        type: String, validate: {
            validator: v => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
            message: 'Time Played must be in HH/MM format'
        }
    },
    today: {type: String},
    numOfVotes: [{ type: String }],
    numOfSuggests: [{ type: String }],
    numPlayed: { type: Number },
    genre: { type: String },
    artist: { type: String },
    img: { type: String }
})

module.exports = mongoose.model('Song', songSchema);