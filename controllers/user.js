require('dotenv').config()
const Establishment = require('../models/establishment')
const Song = require('../models/song')
const google = require('@googleapis/youtube');
const youtube = google.youtube({ version: 'v3', auth: process.env.AUTH_KEY })
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
    else if (type === 'best') {
        getPlaceBest(req.body.params.establishment)
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
/**
 * 
 * @param {string} establishmentName The name of the establishment
 * @param req The request body
 * @returns The overall most played songs in a an array
 * 
 */
async function getPlaceBest(establishmentName, req) {
    const establishment = await Establishment.findOne({})
}

exports.getDummyData = async (req, res) => {
    try {
        let link
        if (req.params.type === 'overall') link = 'https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG&maxResults=20&key=' + process.env.AUTH_KEY;
        else if (req.params.type === 'israel') link = "https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=PLGl0_ap7UnS9ti7yhKyhUw_JTVYY2TkLJ&maxResults=20&key=" + process.env.AUTH_KEY;
        fetch(link)
            .then(data => data.json()
                .then(data => res.status(200).send(data.items.map(v => {
                    return (
                        {
                            name: v.snippet.title,
                            artist: v.snippet.videoOwnerChannelTitle,
                            url: `https://www.youtube.com/watch?v=${v.snippet.resourceId.videoId}`,
                            img: v.snippet.thumbnails.default.url,
                            uploaded: v.snippet.publishedAt,
                        }
                    )
                }))))
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
        res.status(200).send(data.items)
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
 * @returns an object of the song that has been sent.   
 */

exports.sendSong = async (req, res) => {
    try {
        const data = req.body
        const { today } = req.body
        const newSong = await Song.create(data)
        const establishment = await Establishment.findOne({ name: data.establishment })
        if (establishment.history && Object.keys(establishment.history).includes(today)) {
            console.log(establishment.history[today].requested);
            await Establishment.findOneAndUpdate({ name: data.establishment },
                { $set: { [`history.${today}.requested`]: [...establishment.history[today].requested, newSong._id] } }
            )
            await Establishment.findOneAndUpdate({ name: data.establishment },
                { $set: { [`history.${today}.statistics`]: [...establishment.history[today].requested, newSong._id] } }
            )
        } else {
            const newSong = await Song.create(data)
            if (!establishment.history) establishment.history = {}
            await Establishment.findOneAndUpdate(
                { name: data.establishment },
                {
                    $set: {
                        [`history.${today}`]: {
                            requested: [newSong._id],
                            accepted: [],
                            statistics: [newSong._id]
                        }
                    }
                }
            );
        }
        res.status(200).send(newSong)
    }
    catch (err) {
        res.status(500).send(err.message)
    }
}


