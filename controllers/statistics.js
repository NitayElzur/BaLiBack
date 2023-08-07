const Establishment = require('../models/establishment')
const Song = require('../models/song')

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