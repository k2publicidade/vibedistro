const revelatorService = require('../services/revelatorService');

exports.getReleases = async (req, res) => {
    try {
        const data = await revelatorService.getReleases(req.query);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch releases' });
    }
};

exports.getReleaseDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await revelatorService.getReleaseDetails(id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch release details' });
    }
};
