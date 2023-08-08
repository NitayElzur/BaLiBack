const Establishment = require('../models/establishment')
const Song = require('../models/song')

/**
 * @param establishment name of the specific place (establishment)
 * @param date the desired day to pull the playlist from
 * @returns an array of objects of the specified date's playlist, each object containing the populated song data
 */

exports.getPlaylist = async (req, res) => {
    try {
      const data = req.body;
      const date = data.date;
      const establishment = await Establishment.findOne({ name: data.establishment });
      let populatedSongs
      if (establishment.history[date]?.played) {
        const playedSongs = establishment.history[date].played;
        populatedSongs = await Song.find({ _id: { $in: playedSongs } });
      } else {
        populatedSongs = null
      }
      res.status(200).send(populatedSongs);
    } catch (err) {
      res.status(500).send(err.message);
    }
  };


exports.conversionRate = async (req, res) => {
  try {
    const data = req.body;
    const date = data.date
    const thisEstablishment = await Establishment.findOne({ name: data.establishment });
    let dailyConversion

    if (thisEstablishment.history[date]) {
      dailyConversion = thisEstablishment.history[date].accepted.length / thisEstablishment.history[date].statistics.length
    }

    const allAccepted = Object.values(thisEstablishment.history).flatMap(day => day.accepted);
    const allStatistics = Object.values(thisEstablishment.history).flatMap(day => day.statistics);
    const overallConversion = allAccepted.length / allStatistics.length
    

    res.status(200).send({daily: dailyConversion, overall: overallConversion})
  } catch (err) {
    res.status(500).send(err.message)
  }
}