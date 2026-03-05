console.log("🚀 SerialHandler gestart");
console.log("📡 Wachten op data van ESP...");

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const axios = require('axios');

// Maak verbinding met ESP32
const poort = new SerialPort({
  path: '/dev/ttyUSB0',
  baudRate: 9600
});


// Elke nieuwe regel is 1 bericht
const parser = poort.pipe(new ReadlineParser({ delimiter: '\n' }));

// Als er data binnenkomt...
parser.on('data', async (regel) => {
  const data = regel.trim();
  if (data) {
    console.log("📥 Van ESP:", data);
    
    try {
      // Stuur door naar API-BE
      await axios.post('http://localhost:8080/data', JSON.parse(data));
      console.log("✅ Doorgestuurd naar API-BE");
    } catch (fout) {
      console.log("❌ Fout bij doorsturen:", fout.message);
    }
  }
});

// Als de poort opent
poort.on('open', () => {
  console.log("✅ USB poort geopend!");
});

// Als er een fout is
poort.on('error', (fout) => {
  console.log("❌ USB poort fout:", fout.message);
});