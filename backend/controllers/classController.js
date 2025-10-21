const Class = require('../models/Class');
exports.getClasses = async (req, res) => {
    try {
        const items = await Class.find({ schoolId: req.user.id }).select('name');
        res.json(items);
    } catch (err) { res.status(500).send('Server Error'); }
};