const mongoose = require('mongoose');

const colorSchema = new mongoose.Schema({
    prime: {
        type: String, validate: {
            validator: v => /[^#]/.test(v),
            message: 'Primary color must be hexidecimal including #'
        }
    },
    second: {
        type: String, validate: {
            validator: v => /[^#]/.test(v),
            message: 'Secondary color must be hexidecimal including #'
        }
    }
})

const establishmentSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    colors: { type: colorSchema },
    logo: { type: String },
    slogan: { type: String },
    playlists: [{
        type: Object, of: {
            type: String
        }
    }],
    history: {
        type: Object, of: {
            accepted: [{ type: mongoose.Types.ObjectId, ref: 'Song' }],
            requested: [{ type: mongoose.Types.ObjectId, ref: 'Song' }],
            statistics: [{ type: mongoose.Types.ObjectId, ref: 'Song' }],
            played: [{ type: mongoose.Types.ObjectId, ref: 'Song' }],
            users: [{ type: mongoose.Types.ObjectId, ref: 'User' }]
        }, validate: {
            validator: obj => {
                const keys = Object.keys(obj);
                const result = keys.every(v => /^(0?[1-9]|[12]\d|3[01])[\/](0?[1-9]|1[0-2])[\/](19|20)\d{2}$/.test(v))
                return result;
            },
            message: 'Keys inside hisory must be formatted by dd/mm/yyyy or d/m/yyyy'
        }
    }
})

module.exports = mongoose.model('Establishment', establishmentSchema);