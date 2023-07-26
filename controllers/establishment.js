const Establishment = require('../models/establishment')

exports.findAll = async (req, res) => {
    try {
        const data = await Establishment.find({})
        res.status(200).send(data)
    }
    catch(err) {
        res.status(500).send(err.message)
    }
}