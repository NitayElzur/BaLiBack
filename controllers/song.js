const Song = require('../models/song')
/**
 * @param name A string name of the song
 * @param url A string in the format of youtube link
 * @returns On success returns success and the new user otherwise returns the error
 */
exports.createSong = async (req, res) => {
    try {
        const { url, name } = req.body;
        if (!url || !name) {
            return res.status(400).send('Song must contain both name and url')
        }
        else if (!/^https:\/\/www.youtube.com\/watch\?v=/.test(url)) {
            return res.status(400).send('Url must be a valid youtube link')
        }
        const newSong = await Song.create({ url, name });
        res.status(200).send({ message: 'success', data: newSong })
    }
    catch (err) {
        res.status(500).send(err.message)
    }
}

/**
 * @param estbName The name of the establishment
 * @param songName The name of the song
 * @param timePlayed A date object
 * @param numOfVotes An array of user id strings
 * @param numOfSuggests An array of user id strings
 * @returns On success returns the updated song, otherwise returns the error
 */
exports.updateByKeys = async (req, res) => {
    try {
        const { estbName, name, timePlayed, numOfVotes, numOfSuggests } = req.body;
        let updateObj = {}
        if (timePlayed) {
            updateObj.timePlayed = timePlayed
        }
        if (numOfVotes) {

        }
        if (numOfSuggests) {

        }
    }
    catch (err) {
        res.status(500).send(err.message)
    }
}