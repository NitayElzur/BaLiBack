require('dotenv').config()
const Establishment = require('../models/establishment')
const Song = require('../models/song')
const google = require('@googleapis/youtube');
const youtube = google.youtube({ version: 'v3', auth: process.env.AUTH_KEY });
const User = require('../models/user');


exports.createNewUser = async (req, res) => {
    try {
        const newUser = await User.create({ numOfSongsRequested: [] })
        res.status(200).send(newUser)
    }
    catch (err) {
        res.status(500).send(err.message)
    }
}


/**
 * 
 * @param type Either israel overall, or best
 * @returns An array containing the song objects of the playlist
 */
exports.getPlaylist = async (req, res) => {
    const { type } = req.params
    let playlistId = ''
    if (type === 'israel') {
        playlistId = await youtube.search.list({
            part: "snippet",
            maxResults: 20,
            q: "פלייליסטים",
            order: "viewCount",
            type: "playlist",
            regionCode: "IL"
        })
    }
    else if (type === 'overall') {
        playlistId = await youtube.search.list({
            part: "snippet",
            maxResults: 20,
            q: "greatest songs",
            order: "viewCount",
            type: "playlist"
        })
    }
    else {
        return res.status(400).send(`${type} is not a valid type`)
    }
    youtube.playlistItems.list({
        part: 'snippet',
        playlistId: playlistId.data.items[0].id.playlistId,
        maxResults: 20,
    })
        .then(({ data }) => res.status(200).send(data.items.map(v => {
            return (
                {
                    name: v.snippet.title,
                    artist: v.snippet.videoOwnerChannelTitle,
                    url: `https://www.youtube.com/watch?v=${v.snippet.resourceId.videoId}`,
                    img: v.snippet.thumbnails.default.url,
                    uploaded: v.snippet.publishedAt,
                }
            )
        })))
}

exports.getDummyData = async (req, res) => {
    try {
        let link
        if (req.params.type === 'overall') link = 'PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG';
        else if (req.params.type === 'israel') link = 'PLGl0_ap7UnS9ti7yhKyhUw_JTVYY2TkLJ';
        // fetch(link)
        //     .then(data => data.json();
        //         .then(data => res.status(200).send(data.items.map(v => {
        //             return (
        //                 {
        //                     name: v.snippet.title,
        //                     artist: v.snippet.videoOwnerChannelTitle,
        //                     url: `https://www.youtube.com/watch?v=${v.snippet.resourceId.videoId}`,
        //                     img: v.snippet.thumbnails.default.url,
        //                     uploaded: v.snippet.publishedAt,
        //                 }
        //             )
        //         }))))
        youtube.playlistItems.list({
            part: "snippet",
            playlistId: link,
            maxResults: 20
        })
            .then(({ data }) => res.status(200).send(data.items.map(v => {
                return (
                    {
                        name: v.snippet.title,
                        artist: v.snippet.videoOwnerChannelTitle,
                        url: `https://www.youtube.com/watch?v=${v.snippet.resourceId.videoId}`,
                        img: v.snippet.thumbnails.default.url,
                        uploaded: v.snippet.publishedAt,
                    }
                )
            })))
    }
    catch (err) {
        res.status(500).send(err.message)
    }
}


/**
 * 
 * @param {String} input The query for the song search 
 * @returns An array of objects, each contains a song data
 */

exports.searchSong = async (req, res) => {
    try {
        const { data } = await youtube.search.list({
            part: "snippet",
            maxResults: 20,
            q: req.body.input,
            order: "relevance",
            type: "video",
            regionCode: "IL"
        })
        res.status(200).send(data.items.map(v => {
            return (
                {
                    name: v.snippet.title,
                    artist: v.snippet.channelTitle,
                    url: `https://www.youtube.com/watch?v=${v.id.videoId}`,
                    img: v.snippet.thumbnails.default.url,
                    uploaded: v.snippet.publishedAt,
                }
            )
        }))
    }
    catch (err) {
        res.status(500).send(err.message)
    }
}

/**
 * 
 * @param {String} establishemnt The name of the specific establishment.
 * @param {String} today Today's date (in order to place it at the right day in "history").
 * @param {String} timeRequested in hh:mm format, in order to know how long the user awaits.
 * @param {String} url The url of the song in youtube format
 * @param userId The id of the user that sent the song
 * @returns an object of the song that has been sent.   
 */
exports.sendSong = async (req, res) => {
    try {
        let newSong;
        const data = req.body;
        const { today, userId } = req.body;
        const thisUser = await User.findOne({ _id: userId });
        if (!thisUser) return res.status(400).send('This user does not exist')
        if (thisUser.numOfSongsRequested.length > 19) return res.status(400).send('This user exceeded its songs for today')
        if (!userId) return res.status(400).send('Provide a user id');
        const establishment = await Establishment.findOne({ name: data.establishment }).populate({
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
        if (establishment.history && Object.keys(establishment.history).includes(today)) {
            const repeatedSong = establishment.history[today].requested.find(v => v.name === data.name);
            if (repeatedSong) {
                const existingSong = await Song.findOneAndUpdate(
                    { _id: repeatedSong._id },
                    { $set: { numOfSuggests: [...repeatedSong.numOfSuggests, userId] } },
                    {new: true}
                )
                await User.findOneAndUpdate({ _id: thisUser._id }, { $set: { numOfSongsRequested: [...thisUser.numOfSongsRequested, existingSong._id] } })
                return res.status(200).send(existingSong)
            }
            else {
                newSong = await Song.create({ ...data, numOfSuggests: [userId] })
                await Establishment.findOneAndUpdate({ name: data.establishment },
                    {
                        $set: {
                            [`history.${today}.requested`]: [...establishment.history[today].requested, newSong._id],
                            [`history.${today}.statistics`]: [...establishment.history[today].statistics, newSong._id],
                            [`history.${today}.users`]: [...establishment.history[today].users.filter(v => v._id.toString() !== thisUser._id.toString()), thisUser._id]
                        }
                    }
                )
                await User.findOneAndUpdate({ _id: thisUser._id }, { $set: { numOfSongsRequested: [...thisUser.numOfSongsRequested, newSong._id] } })
            }
        } else {
            newSong = await Song.create({ ...data, numOfSuggests: [userId] })
            if (!establishment.history) establishment.history = {}
            await Establishment.findOneAndUpdate(
                { name: data.establishment },
                {
                    $set: {
                        [`history.${today}`]: {
                            requested: [newSong._id],
                            accepted: [],
                            statistics: [newSong._id],
                            users: [thisUser._id],
                            played: []
                        }
                    }
                }
            );
            await User.findOneAndUpdate({ _id: thisUser._id }, { $set: { numOfSongsRequested: [...thisUser.numOfSongsRequested, newSong._id] } })
        }
        res.status(200).send(newSong)
    }
    catch (err) {
        res.status(500).send(err.message)
    }
}
