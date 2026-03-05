console.log("📱 Website geladen!");

const API_URL = 'http://10.248.206.131:5000';

async function haalData() {
  try {
    const response = await fetch(API_URL + '/realtimedata');
    const data = await response.json();
    
    if (data.success) {
      toonData(data.data);
    } else {
      document.getElementById('realtime').innerHTML = '<p style="color:red">Geen data</p>';
    }
  } catch (fout) {
    document.getElementById('realtime').innerHTML = '<p style="color:red">Kan niet verbinden</p>';
  }
}

function toonData(metingen) {
  let html = '<table><tr><th>Tijd</th><th>Sensor</th><th>Waarde</th><th>Locatie</th></tr>';
  
  for (let m of metingen) {
    let tijd = new Date(m.tijd).toLocaleTimeString();
    html += `<tr>
      <td>${tijd}</td>
      <td>${m.sensor}</td>
      <td>${m.waarde}</td>
      <td>${m.locatie}</td>
    </tr>`;
  }
  
  html += '</table>';
  document.getElementById('realtime').innerHTML = html;
}

async function maakGrafiek() {
  try {
    const response = await fetch(API_URL + '/grafiekendata');
    const data = await response.json();
    
    if (data.labels && data.labels.length > 0) {
      const ctx = document.getElementById('grafiek').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: data,
        options: { responsive: true }
      });
    }
  } catch (fout) {
    console.log("Grafiek fout:", fout);
  }
}

haalData();
maakGrafiek();
setInterval(haalData, 5000);