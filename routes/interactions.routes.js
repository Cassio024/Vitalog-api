router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    const interactions = await UserInteraction.find({ userId }).sort({ timestamp: -1 });
    res.json(interactions);
});
