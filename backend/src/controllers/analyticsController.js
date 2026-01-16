const revelatorService = require('../services/revelatorService');

exports.getDailyTrends = async (req, res) => {
    try {
        const data = await revelatorService.getDailyTrends();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};
