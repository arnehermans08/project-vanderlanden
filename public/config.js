// config.js
let trackConfig = {
    segmentCount: 5, // aantal segmenten
    cartCount: 1, // aantal karretjes
    segmentNames: [],  // optioneel, default= 1,2,3,4,5,...
    colors: ['green', 'orange', 'red'], // opties voor kleuren van karretjes en segmenten
    



    // ----------------------------------------------------------------------------------------------------
    // Sensor Thresholds
    // ----------------------------------------------------------------------------------------------------


    sensorThresholds: { //waardes zijn vanaf gegeven getal
        temp: { green: 0, orange: 40, red: 70 },   // waarde >= 70 → rood, >=40 → oranje, anders groen

        afslijting: { green: 0, orange: 50, red: 80 }, // voorbeeld
        signaal: { green: 0, orange: 200, red: 500 },  // voorbeeld
    }
};