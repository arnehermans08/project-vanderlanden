// backend/serialHandler.js
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const axios = require('axios');

// Configuratie
const SERIAL_PORT = '/dev/ttyUSB0';
const BAUD_RATE = 115200;
const API_BE_URL = 'http://localhost:8080/data';  // API-BE endpoint

// 1. Open de seriële poort
const port = new SerialPort({
  path: SERIAL_PORT,
  baudRate: BAUD_RATE,
  autoOpen: true
});

// 2. Gebruik ReadlineParser om elke nieuwe regel als apart bericht te zien
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// 3. Trigger: Bij ELKE nieuwe regel data → stuur naar API-BE
parser.on('data', async (line) => {
  console.log('📥 Nieuwe data ontvangen:', line);
  
  try {
    // Parse de JSON (jouw ESP stuurt JSON)
    const sensorData = JSON.parse(line);
    console.log('✅ JSON geparsed:', sensorData);
    
    // 4. TRIGGER: Stuur direct door naar API-BE
    try {
      const response = await axios.post(API_BE_URL, sensorData);
      console.log(`📤 Doorgestuurd naar API-BE | Status: ${response.status}`);
      
      if (response.status === 200 || response.status === 201) {
        console.log('✅ Data opgeslagen in database!');
      }
    } catch (apiError) {
      console.error('❌ Fout bij doorsturen naar API-BE:', apiError.message);
      if (apiError.response) {
        console.error('API-BE response:', apiError.response.status, apiError.response.data);
      }
    }
    
  } catch (parseError) {
    console.error('❌ Fout bij parsen JSON:', parseError.message);
    console.log('📄 Rauwe data was:', line);
  }
});

// Event listeners voor debugging
port.on('open', () => {
  console.log(`✅ Seriële poort ${SERIAL_PORT} geopend`);
  console.log(`⏳ Wachten op data van ESP...`);
});

port.on('error', (err) => {
  console.error('❌ Seriële poort fout:', err.message);
});

// Houd het script draaiend
console.log('🚀 SerialHandler gestart');
console.log(`📡 Poort: ${SERIAL_PORT} @ ${BAUD_RATE} baud`);
console.log(`🎯 API-BE endpoint: ${API_BE_URL}`);