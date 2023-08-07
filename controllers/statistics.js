const Establishment = require('../models/establishment')
const Song = require('../models/song')

/**
 * @param establishment name of the specific place (establishment)
 * @param date the desired day to pull the playlist from
 * @returns an array of objects of the specofied date's playlist, each object containing the populated song data
 */

exports.getPlaylist = async (req, res) => {
    try {
      const data = req.body;
      const establishment = await Establishment.findOne({ name: data.establishment });
  
      const date = data.date;
      const acceptedSongs = establishment.history[date].accepted;
  
      const populatedSongs = await Song.find({ _id: { $in: acceptedSongs } });
  
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
      dailyConversion = thisEstablishment.history[date].statistics.length / thisEstablishment.history[date].requested.length
    }

    const allAccepted = Object.values(thisEstablishment.history).flatMap(day => day.accepted);
    const allRequested = Object.values(thisEstablishment.history).flatMap(day => day.requested);
    const overallConversion = allAccepted.length / allRequested.length
    

    res.status(200).send({daily: `${dailyConversion}%`, overall: `${overallConversion}%`})
  } catch (err) {
    res.status(500).send(err.message)
  }
}