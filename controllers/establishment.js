const Establishment = require('../models/establishment')
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
        if(!name) return res.status(400).send('Name must be provided');
        estabObj.name = name;
        if (logo) estabObj.logo = logo;
        if (slogan) estabObj.slogan = slogan;
        if (colors?.prime && colors?.second) estabObj.colors = colors;
        const newEstablishment = await Establishment.create(estabObj);
        res.status(200).send({message: 'Success', data: newEstablishment});
    }
    catch (err) {
        if(err.message.includes('E11000 duplicate key error collection: test.establishments index: name_1 dup key: { name:')) {
            return res.status(400).send('That name is taken');
        }
        res.status(500).send(err.message);
    }
}