const Establishment = require('../models/establishment');
const Song = require('../models/song')
const google = require('@googleapis/youtube');
const youtube = google.youtube({ version: 'v3', auth: process.env.AUTH_KEY });
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
        if (!establishment) return res.status(400).send('Establishment does not exist')
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
        const { name, colors, logo, slogan, playlists } = req.body;
        const establishment = await Establishment.findOne({ name });
        if (!establishment) return res.status(400).send('There is no establishment with that name')
        const updateObj = {};
        if (colors && colors.prime) updateObj.colors = colors;
        if (logo) updateObj.logo = logo;
        if (slogan) updateObj.slogan = slogan;
        if (playlists && playlists.length > 0) {
            if (!playlists.some(v => !/^(https\:\/\/www\.youtube\.com\/watch\?).*(list=)/.test(v))) updateObj.playlists = playlists;
            else return res.status(400).send('Playlists must be a valid youtube playlist link')
        }
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
 * @param {String} acceptedSong The ID of the song that is transfering from "requested" to "accepted"
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
 * @returns an array of the requested songs objects.
 */

exports.getRequested = async (req, res) => {
    try {
        const { establishment, today } = req.body
        const thisEstablishment = await Establishment.findOne({ name: establishment }).populate({
            path: "history",
            populate: {
                path: today,
                populate: {
                    path: "requested",
                    model: "Song"
                }
            }
        })
        thisEstablishment.history[today].requested.sort((a, b) => b.numOfSuggests.length - a.numOfSuggests.length)
        res.status(200).send(thisEstablishment.history[today].requested)
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

/**
 * 
 * @param {String} establishemnt The name of the specific establishment.
 * @param {String} today Today's date (in order to place it at the right day in "history").
 * @param {String} checkedSong an array of songs id's.
 */

exports.removeRequest = async (req, res) => {
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
        let { checkedSong } = data
        const checkedSongArray = await Song.find({ _id: { $in: checkedSong } })
        await Establishment.findOneAndUpdate(
            { name: data.establishment },
            { $set: { [`history.${data.today}.requested`]: establishment.history[data.today].requested.filter(v => !checkedSongArray.some(j => j._id.toString() === v._id.toString())) } }
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

/**
 * 
 * @param {String} establishemnt The name of the specific establishment.
 * @param {String} today Today's date (in order to place it at the right day in "history").
 * @param {String} checkedSong an array of songs id's.
 */

exports.removeAccept = async (req, res) => {
    try {
        const data = req.body
        const establishment = await Establishment.findOne({ name: data.establishment }).populate({
            path: 'history',
            populate: {
                path: data.today,
                populate: {
                    path: 'accepted',
                    model: "Song"
                }
            }
        })
        let { checkedSong } = data
        const checkedSongArray = await Song.find({ _id: { $in: checkedSong } })
        await Establishment.findOneAndUpdate(
            { name: data.establishment },
            { $set: { [`history.${data.today}.accepted`]: establishment.history[data.today].accepted.filter(v => !checkedSongArray.some(j => j._id.toString() === v._id.toString())) } }
        )
        res.status(200).send('ok')
    }
    catch (err) {
        res.status(500).send(err.message)
    }
}

/**
 * @param establishment The establishment to change
 * @param today The day to change in
 * @param accepted The new array to be saved containing the mongo ids
 */
exports.changeAccepted = async (req, res) => {
    try {
        const { establishment, today, accepted } = req.body
        const thisEstablishment = await Establishment.findOne({ name: establishment }).populate({
            path: 'history',
            populate: {
                path: today,
                populate: {
                    path: 'requested',
                    model: "Song"
                }
            }
        })
        if (!thisEstablishment) return res.status(400).send('This establishment does not exist');
        const acceptedSongArray = await Song.find({ _id: { $in: accepted } });
        if (acceptedSongArray.length <= 0) return res.status(400).send('No valid songs were sent');
        acceptedSongArray.sort((a, b) => accepted.indexOf(a._id.toString()) - accepted.indexOf(b._id.toString()));
        const newEstablishment = await Establishment.findOneAndUpdate(
            { _id: thisEstablishment._id },
            { $set: { [`history.${today}.accepted`]: acceptedSongArray.map(v => v._id) } },
            { new: true }
        ).populate({
            path: 'history',
            populate: {
                path: today,
                populate: {
                    path: 'accepted',
                    model: "Song"
                }
            }
        })
        await Establishment.findOneAndUpdate(
            { _id: thisEstablishment._id },
            { $set: { [`history.${today}.requested`]: thisEstablishment.history[today].requested.filter(v => !acceptedSongArray.some(j => j._id.toString() === v._id.toString())) } }
        )
        res.status(200).send(newEstablishment)
    }
    catch (err) {
        res.status(500).send(err.message)
    }
}

/**
 * @param establishment The establishment to change
 * @param today The day to change in
 * @param requested The new array to be saved containing the mongo ids
 */
exports.changeRequested = async (req, res) => {
    try {
        const { establishment, today, requested } = req.body
        const thisEstablishment = await Establishment.findOne({ name: establishment });
        if (!thisEstablishment) return res.status(400).send('This establishment does not exist');
        const requestedSongArray = await Song.find({ _id: { $in: requested } });
        if (requestedSongArray.length <= 0) return res.status(400).send('No valid songs were sent');
        requestedSongArray.sort((a, b) => requested.indexOf(a._id.toString()) - requested.indexOf(b._id.toString()));
        await Establishment.findOneAndUpdate(
            { _id: thisEstablishment._id },
            { $set: { [`history.${today}.requested`]: requestedSongArray.map(v => v._id) } }
        )
        res.status(200).send('Success')
    }
    catch (err) {
        res.status(500).send(err.message)
    }
}

/** 
* @param {String} establishemnt The name of the specific establishment.
* @param {String} splice an integer which represent the length of the desired quntity of songs will be displayed. if a splice will not be mentioned the default length is 20
* @returns an array of objects, each object contains the song's details: name (of the song), artist, time uploaded to youtube, youtube url, video img.
*/

exports.getEstabBest = async (req, res) => {
    try {
        const data = req.body;
        const totalAccepted = [];
        const thisEstablishment = await Establishment.findOne({ name: data.establishment });

        const allSongIds = Object.values(thisEstablishment.history).flatMap(day => day.accepted);
        const allSongs = await Song.find({
            _id: { $in: allSongIds }
        });

        const songMap = allSongs.reduce((map, song) => map.set(String(song._id), song), new Map());

        for (let date in thisEstablishment.history) {
            thisEstablishment.history[date].accepted = thisEstablishment.history[date].accepted.map(songId => songMap.get(String(songId)));
            totalAccepted.push(thisEstablishment.history[date].accepted);
        }

        const playCountMap = new Map();

        totalAccepted.forEach(day => {
            day.forEach(song => {
                if (playCountMap.has(song.name)) {
                    playCountMap.set(song.name, playCountMap.get(song.name) + 1);
                } else {
                    playCountMap.set(song.name, 1);
                }
            });
        });

        const sortedStats = Array.from(playCountMap)
            .map(([song, count]) => {
                const songDetails = allSongs.find(s => s.name === song);
                return {
                    name: song,
                    count,
                    url: songDetails.url,
                    artist: songDetails.artist,
                    img: songDetails.img,
                    uploaded: songDetails.uploaded
                };
            })
            .sort((a, b) => b.count - a.count);

        const splice = req.body.splice
        req.body.splice ?
            sortedStats.splice(splice, sortedStats.length)
            :
            sortedStats.splice(19, sortedStats.length)
        res.status(200).send(sortedStats);
    }
    catch (err) {
        res.status(500).send(err.message);
    }
};

/**
 * @param playlist The string of the playlist
 * @param today Todays date
 * @param establishemnt The establishment to push the songs
 * @returns An array of the first 50 songs of that playlist
 */
exports.getSongsFromPlaylist = async (req, res) => {
    try {
        let songArr = []
        const { playlist, today, establishment } = req.body;
        const [playlistId] = playlist.match(/(?<=list=)[^&]*/)
        const thisEstablishment = await Establishment.findOne({ name: establishment }).populate({
            path: 'history',
            populate: {
                path: today,
                populate: [{
                    path: 'requested',
                    model: 'Song'
                }, {
                    path: 'users',
                    model: 'User'
                }, {
                    path: 'statistics',
                    model: 'Song'
                }]
            }
        })
        if(!thisEstablishment) return res.status(400).send('Establishment does not exist')
        const ytObj = {
            part: 'snippet',
            playlistId,
            maxResults: 50
        }
        let stop = false
        while (!stop) {
            const { data } = await youtube.playlistItems.list(ytObj)
            songArr = songArr.concat(data.items.map(v => {
                return (
                    {
                        name: v.snippet.title,
                        artist: v.snippet.videoOwnerChannelTitle,
                        url: `https://www.youtube.com/watch?v=${v.snippet.resourceId.videoId}`,
                        img: v.snippet.thumbnails.default.url,
                        uploaded: v.snippet.publishedAt,
                    }
                )
            }))
            if (!data.nextPageToken) stop = true
            else ytObj.pageToken = data.nextPageToken
        }
        const mongoSongArray = await Song.create(songArr)
        if (thisEstablishment.history && Object.keys(thisEstablishment.history).includes(today)) {
            await Establishment.findOneAndUpdate({ name: establishment },
                {
                    $set: {
                        [`history.${today}.accepted`]: thisEstablishment.history[today].accepted.concat(mongoSongArray.map(v => v._id)),
                        [`history.${today}.statistics`]: thisEstablishment.history[today].statistics.concat(mongoSongArray.map(v => v._id)),
                    }
                }
            )
        }
        else {
            if (!thisEstablishment.history) thisEstablishment.history = {}
            await Establishment.findOneAndUpdate(
                { name: establishment },
                {
                    $set: {
                        [`history.${today}`]: {
                            requested: [],
                            accepted: mongoSongArray.map(v => v._id),
                            statistics: mongoSongArray.map(v => v._id),
                            users: []
                        }
                    }
                }
            );
        }
        res.status(200).send('Success');
    }
    catch (err) {
        res.status(500).send(err.message)
    }
}

exports.pushToPlayed = async (req, res) => {
    try {
        const { today, establishemnt, song } = req.body;
        const thisEstablishment = await Establishment.findOne({ name: establishemnt });
        if (!thisEstablishment) return res.status(400).send('')
    }
    catch (err) {
        res.status(500).send(err.message)
    }
}