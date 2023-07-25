require('dotenv').config()
const google = require('@googleapis/youtube');
const youtube = google.youtube({ version: 'v3', auth: process.env.AUTH_KEY })
exports.getPopularInIsrael = async (req, res) => {
    const playlistId = await youtube.search.list({
        part: "snippet",
        maxResults: 20,
        q: "פלייליסטים",
        order: "viewCount",
        type: "playlist",
        regionCode: "IL"
    })
    youtube.playlistItems.list({
        part: 'snippet',
        playlistId: playlistId.data.items[0].id.playlistId,
        maxResults: 20,
    })
        // .then(({data}) => res.status(200).send(data.items))
        .then(({ data }) => res.status(200).send(data.items.map(v => {
            return (
                {
                    name: v.snippet.title,
                    artist: v.snippet.videoOwnerChannelTitle,
                    url: `https://www.youtube.com/watch?v=${v.snippet.resourceId.videoId}`,
                    img: v.snippet.thumbnails.default.url,
                    uploaded: v.snippet.publishedAt,
                    timeSent: new Date()
                }
            )
        })))
}