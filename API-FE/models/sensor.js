const mongoose = require("mongoose");
const ServerSchema = new mongoose.Schema({
    id: Number,
    cartID: Number,
    segmentID: Number, 
    type: String,
    value: [Schema,Types,Mixed]
});

module.exports = mongoose.model("Server", ServerSchema);