const Establishment = require('../models/establishment')
/**
 * @returns All the establishments in the DB
 */
exports.fetchAll = async (req, res) => {
    try {
        const data = await Establishment.find({});
        res.status(200).send(data);
    }
    catch (err) {
        res.status(500).send(err.message);
    }
}

/**
 * @param name The name of the establishment
 * @param logo The logo 
 * @param slogan The slogan
 * @param colors The prime and secondary color of the establishment
 * @returns The new establishment
 */
exports.create = async (req, res) => {
    try {
        const estabObj = {}
        const { name, logo, slogan, colors } = req.body;
        if (!name) return res.status(400).send('Name must be provided');
        estabObj.name = name;
        if (logo) estabObj.logo = logo;
        if (slogan) estabObj.slogan = slogan;
        if (colors?.prime && colors?.second) estabObj.colors = colors;
        const newEstablishment = await Establishment.create(estabObj);
        res.status(200).send({ message: 'Success', data: newEstablishment });
    }
    catch (err) {
        if (err.message.includes('E11000 duplicate key error collection: test.establishments index: name_1 dup key: { name:')) {
            return res.status(400).send('That name is taken');
        }
        res.status(500).send(err.message);
    }
}

/**
 * 
 * @param name The name of the establishment
 * @returns The relevant establishment with its non populated data
 */
exports.fetchSpecific = async (req, res) => {
    try {
        const { name } = req.body;
        const establishment = await Establishment.findOne({ name });
        res.status(200).send(establishment)
    }
    catch (err) {
        res.status(500).send(err.message)
    }
}

/**
 * 
 * @param name The name of the establishment
 * @param colors The primary and secondary colors in hexadecimal
 * @param logo The logo of the establishment
 * @param slogan The slogan of the establishment
 * @returns The updated establishment mongo object
 */
exports.updateEstablishment = async (req, res) => {
    try {
        const { name, colors, logo, slogan } = req.body;
        const establishment = await Establishment.findOne({ name });
        if (!establishment) return res.status(400).send('There is no establishment with that name')
        const updateObj = {};
        if (colors && colors.prime) updateObj.colors = colors;
        if (logo) updateObj.logo = logo;
        if (slogan) updateObj.slogan = slogan;
        const result = await Establishment.findOneAndUpdate({ name }, updateObj, { new: true })
        res.status(200).send(result)
    }
    catch (err) {
        res.status(500).send(err.message)
    }
}

/**
 * 
 * @param {String} establishemnt The name of the specific establishment.
 * @param {String} today Today's date (in order to place it at the right day in "history").
 * @returns an array of the requested songs objects.
 */

exports.getRequested = async (req, res) => {
    try {
        const data = req.body
        const establishment = await Establishment.findOne({ name: data.establishment }).populate({
            path: "history",
            populate: {
                path: data.today,
                populate: {
                    path: "requested",
                    model: "Song"
                }
            }
        })
        res.status(200).send(establishment.history[data.today].requested)
    }
    catch (err) {
        res.status(500).send(err.message)
    }
}

/**
 * 
 * @param {String} establishemnt The name of the specific establishment.
 * @param {String} today Today's date (in order to place it at the right day in "history").
 * @param {String} acceptedSong The ID of the send that is transfering from "requested" to "accepted"
 * @returns an object of the song that has been sent.
 */

exports.acceptSong = async (req, res) => {
    try {
        const data = req.body
        const establishment = await Establishment.findOne({ name: data.establishment }).populate({
            path: 'history',
            populate: {
                path: data.today,
                populate: {
                    path: 'requested',
                    model: "Song"
                }
            }
        })
        let { acceptedSong } = data
        const acceptedSongArray = await Song.find({ _id: { $in: acceptedSong } })
        await Establishment.findOneAndUpdate(
            { name: data.establishment },
            { $set: { [`history.${data.today}.accepted`]: establishment.history[data.today].accepted.concat(acceptedSongArray.map(v => v._id)) } }
        )
        await Establishment.findOneAndUpdate(
            { name: data.establishment },
            { $set: { [`history.${data.today}.requested`]: establishment.history[data.today].requested.filter(v => !acceptedSongArray.some(j => j._id.toString() === v._id.toString())) } }
        )
        res.status(200).send('ok')
    }
    catch (err) {
        res.status(500).send(err.message)
    }
}

/**
 * 
 * @param {String} establishemnt The name of the specific establishment.
 * @param {String} today Today's date (in order to place it at the right day in "history").
 * @returns an array of the accepted songs objects.
 */

exports.getAccepted = async (req, res) => {
    try {
        const data = req.body
        const establishment = await Establishment.findOne({ name: data.establishment }).populate({
            path: "history",
            populate: {
                path: data.today,
                populate: {
                    path: "accepted",
                    model: "Song"
                }
            }
        })
        res.status(200).send(establishment.history[data.today].accepted)
    }
    catch (err) {
        res.status(500).send(err.message)
    }
}