const express = require("express");
const mongoose = require("require");
const cors = require("cors");
const Sensor= require("./models/sensor");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://mongo:27017/dbVdl",{
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection;
db.once("open", () => console.log("MongoDB verbonden!"));

//API test
app.get("/api", (req, res) => {
    console.log('testing')
    res.json({message: "banaan"});
});

//API sensoren
app.get("/sensors", async (req, res) => {
    try {
        const sensors = await Sensor.find();
        res.json(sensors); 
    } catch (error) {
        res.status(500).json({ message: "Fout bij het ophalen van de sensoren", error});
    }
});

app.listen(5000, () => console.log("Server draait op poort 5000"));