let express = require('express');
let { SerialPort } = require('serialport');
let { ReadlineParser } = require('@serialport/parser-readline');
let WebSocket = require('ws');

//-----------test mode--------------
let USE_FAKE_DATA = true;
//-----------------------------------------

let app = express();
let port = 3000;

app.use(express.static('public'));

let server = app.listen(port, () => {
  console.log(`Server draait op http://localhost:${port}`);
});

let wss = new WebSocket.Server({ server });

// sensor state opslaan
let sensors = {};



if (USE_FAKE_DATA) {

// ---- FAKE SENSOR DATA (tijdelijk) ----
setInterval(() => {
  let fakeData = [
    { id: "2", pressure: (1000 + Math.random() * 50).toFixed(2) },
    { id: "3", light: (300 + Math.random() * 100).toFixed(1) }
  ];

  fakeData.forEach(data => {
    sensors[data.id] = {
      ...sensors[data.id],
      ...data,
      timestamp: Date.now()
    };
  });

  let payload = JSON.stringify({
    type: 'update',
    sensors
  });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });

}, 1000);


} else {


// serial (activeren wanneer ESP32 er is)
let serial = new SerialPort({
  path: '/dev/ttyUSB0',
  baudRate: 115200
});

let parser = serial.pipe(new ReadlineParser({ delimiter: '\n' }));

parser.on('data', line => {
  try {
    let data = JSON.parse(line);

    if (!data.id) return;

    sensors[data.id] = {
      ...sensors[data.id],
      ...data,
      timestamp: Date.now()
    };

    // push naar webclients
    let payload = JSON.stringify({
      type: 'update',
      sensors
    });

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });

  } catch (err) {
    console.warn('Ongeldige JSON:', line);
  }
});


}
