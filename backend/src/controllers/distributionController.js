const revelatorService = require('../services/revelatorService');

exports.distributeRelease = async (req, res) => {
    try {
        const { releaseId, dsps } = req.body;
        if (!releaseId || !dsps) {
            return res.status(400).json({ error: 'Missing releaseId or dsps' });
        }
        const data = await revelatorService.distributeRelease(releaseId, dsps);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to distribute release' });
    }
};
