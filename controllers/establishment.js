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
            if (playlists.some(v => v.name == null)) return res.status(400).send('Playlist must come in pairs of name and value')
            else {
                updateObj.playlists = establishment.playlists ? establishment.playlists.concat(playlists) : playlists
            }
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
        const newEstablishment = await Establishment.findOneAndUpdate(
            { name: data.establishment },
            {
                $set: {
                    [`history.${data.today}.accepted`]: establishment.history[data.today].accepted.concat(acceptedSongArray.map(v => v._id)),
                    [`history.${data.today}.requested`]: establishment.history[data.today].requested.filter(v => !acceptedSongArray.some(j => j._id.toString() === v._id.toString()))
                }
            },
            { new: true }
        ).populate({
            path: "history",
            populate: {
                path: data.today,
                populate: {
                    path: "accepted",
                    model: "Song"
                }
            }
        })
        res.status(200).send(newEstablishment.history[data.today].accepted)
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
        const newEstablishment = await Establishment.findOneAndUpdate(
            { name: data.establishment },
            { $set: { [`history.${data.today}.accepted`]: establishment.history[data.today].accepted.filter(v => !checkedSongArray.some(j => j._id.toString() === v._id.toString())) } },
            { new: true }
        ).populate({
            path: 'history',
            populate: {
                path: data.today,
                populate: {
                    path: 'accepted',
                    model: 'Song'
                }
            }
        })
        res.status(200).send(newEstablishment.history[data.today].accepted)
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
* @param {Number} number The number of days to return the best from
* @returns an array of objects, each object contains the song's details: name (of the song), artist, time uploaded to youtube, youtube url, video img.
*/

exports.getEstabBest = async (req, res) => {
    try {
        const { number, establishment, splice } = req.body
        let totalAccepted = [];
        const thisEstablishment = await Establishment.findOne({ name: establishment });
        if (!thisEstablishment) return res.status(400).send('Establishment does not exist')
        let thisEstablishmentValues = Object.values(thisEstablishment.history)
        if (number) thisEstablishmentValues = thisEstablishmentValues.slice(-number)
        const allSongIds = thisEstablishmentValues.flatMap(day => day?.played);
        const allSongs = await Song.find({
            _id: { $in: allSongIds }
        });
        const songMap = allSongs.reduce((map, song) => map.set(String(song._id), song), new Map());
        for (let date in thisEstablishment.history) {
            if (thisEstablishment.history[date].played) {
                thisEstablishment.history[date].played = thisEstablishment.history[date].played.map(songId => songMap.get(String(songId)));
                totalAccepted.push(thisEstablishment.history[date].played);
            }
        }
        totalAccepted = totalAccepted.filter(v => v[0] != null)
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
        splice ?
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
 * @param playlist The string of the playlist or the date to pull from
 * @param today Todays date or the date to populate
 * @param establishemnt The establishment to push the songs into
 * @returns An array of all the songs of that playlist
 */
exports.getSongsFromPlaylist = async (req, res) => {
    try {
        let songArr = []
        let mongoSongArray;
        const { playlist, today, establishment } = req.body;
        let thisEstablishment = await Establishment.findOne({ name: establishment }).populate({
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
        if (!thisEstablishment) return res.status(400).send('Establishment does not exist')
        const playlistId = playlist.match(/(?<=list=)[^&]*/)
        if (playlistId) {
            const ytObj = {
                part: 'snippet',
                playlistId: playlistId[0],
                maxResults: 50
            }
            let i = 0
            while (i < 4) {
                const { data } = await youtube.playlistItems.list(ytObj)
                songArr = songArr.concat(data.items.map(v => {
                    return (
                        {
                            name: v.snippet.title,
                            artist: v.snippet.videoOwnerChannelTitle,
                            url: `https://www.youtube.com/watch?v=${v.snippet.resourceId.videoId}`,
                            img: v.snippet.thumbnails.default?.url,
                            uploaded: v.snippet.publishedAt,
                        }
                    )
                }))
                if (!data.nextPageToken) i = 4
                else ytObj.pageToken = data.nextPageToken
                i++
            }
            songArr = songArr.filter(v => v.name !== 'Deleted Video' && v.name !== 'Private Video')
            mongoSongArray = await Song.create(songArr.map(v => {
                return { ...v, today }
            }))
        }
        else {
            thisEstablishment = await Establishment.findOne({ _id: thisEstablishment._id }).populate({
                path: 'history',
                populate: {
                    path: playlist,
                    populate: {
                        path: 'played',
                        model: 'Song'
                    }
                }
            })
            mongoSongArray = await Song.create(thisEstablishment.history[playlist].played.map(v => {
                delete v.timePlayed
                delete v.timeRequested
                return ({
                    name: v.name,
                    url: v.url,
                    img: v.img,
                    artist: v.artist,
                    uploaded: v.uploaded,
                    today,
                    numOfVotes: [],
                    numOfSuggests: []
                })
            }))
        }
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
                            users: [],
                            played: []
                        }
                    }
                }
            );
        }
        return res.status(200).send(mongoSongArray);
    }
    catch (err) {
        res.status(500).send(err.message)
    }
}

/**
 * 
 * @param today The date to change
 * @param song The id of the song that was played
 * @param establishemnt The establishment to change
 * @returns 
 */
exports.pushToPlayed = async (req, res) => {
    try {
        const { today, establishment, song, time } = req.body;
        const thisEstablishment = await Establishment.findOne({ name: establishment }).populate({
            path: 'history',
            populate: {
                path: today,
                populate: {
                    path: 'played',
                    model: 'Song'
                }
            }
        })
        if (!thisEstablishment) return res.status(400).send('Establishment does not exist');
        const thisSong = await Song.findOne({ _id: song });
        if (!thisSong) return res.status(400).send('Song does not exist')
        if (thisEstablishment.history[today].played.some(v => v._id.toString() === thisSong._id.toString())) return res.status(200).send('Song was already played')
        await Establishment.findOneAndUpdate({ _id: thisEstablishment._id },
            { $set: { [`history.${today}.played`]: [...thisEstablishment.history[today].played, thisSong._id] } }
        )
        const updateObj = { timePlayed: time }
        const newSong = await Song.findOneAndUpdate({ _id: song }, updateObj, { new: true })

        res.status(200).send(newSong)
    }
    catch (err) {
        res.status(500).send(err.message)
    }
}

/**
 * @param today The date to push into
 * @param establishment The establishment to change
 * @param url The url of the song in yt format
 * @returns The updated accepted array
 */
exports.adminSendSong = async (req, res) => {
    try {
        const data = req.body
        const { today, establishment, url } = req.body;
        const thisEstablishment = await Establishment.findOne({ name: establishment })
            .populate({
                path: 'history',
                populate: {
                    path: today,
                    populate: {
                        path: 'accepted',
                        model: 'Song'
                    }
                }
            })
        if (!thisEstablishment) return res.status(400).send('This establishment does not exist');
        if (thisEstablishment.history && Object.keys(thisEstablishment.history).includes(today)) {
            if (thisEstablishment.history[today].accepted.some(v => v.url === url)) {
                const song = thisEstablishment.history[today].accepted[thisEstablishment.history[today].accepted.findIndex(v => v.url === url)];
                thisEstablishment.history[today].accepted.splice(thisEstablishment.history[today].accepted.findIndex(v => v.url === url), 1);
                thisEstablishment.history[today].accepted.splice(1, 0, song);
            }
            else {
                const song = await Song.create(data);
                thisEstablishment.history[today].accepted.splice(1, 0, song);
            }
        }
        else {
            const song = await Song.create(data)
            if (!thisEstablishment.history) thisEstablishment.history = {}
            const newEstablishment = await Establishment.findOneAndUpdate(
                { name: establishment },
                {
                    $set: {
                        [`history.${today}`]: {
                            requested: [],
                            accepted: [song._id],
                            statistics: [],
                            users: [],
                            played: []
                        }
                    }
                },
                { new: true }
            ).populate({
                path: 'history',
                populate: {
                    path: today,
                    populate: {
                        path: 'accepted',
                        model: 'Song'
                    }
                }
            })
            return res.status(200).send(newEstablishment.history[today].accepted)
        }
        const newEstablishment = await Establishment.findOneAndUpdate(
            { name: establishment },
            { $set: { [`history.${today}.accepted`]: [...thisEstablishment.history[today].accepted.map(v => v._id)] } },
            { new: true }
        )
            .populate({
                path: 'history',
                populate: {
                    path: today,
                    populate: {
                        path: 'accepted',
                        model: 'Song'
                    }
                }
            })
        res.status(200).send(newEstablishment.history[today].accepted)
    }
    catch (err) {
        res.status(500).send(err.message)
    }
}