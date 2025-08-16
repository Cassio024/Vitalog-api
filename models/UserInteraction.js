const mongoose = require('mongoose');

const UserInteractionSchema = new mongoose.Schema({
    userId: String,
    timestamp: Date,
    action: String,
    details: Object,
});

module.exports = mongoose.model('UserInteraction', UserInteractionSchema);
