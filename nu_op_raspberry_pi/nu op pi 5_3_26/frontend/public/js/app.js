console.log("📱 Website geladen met Track Visual!");

const API_URL = 'http://10.248.206.131:5000';

// ===========================================
// KARRETJE VERPLAATSEN
// ===========================================
function moveCartTo(cartId, segmentNumber) {
    let cart = document.getElementById(cartId.toString());
    if (!cart) return;

    let container = cart.parentElement;
    let track = container.querySelector('.track');
    if (!track) return;

    let trackWidth = track.offsetWidth;
    if (trackWidth === 0) {
        // Track nog niet zichtbaar, probeer later opnieuw
        setTimeout(() => moveCartTo(cartId, segmentNumber), 100);
        return;
    }

    let segments = track.children.length;
    let segmentWidth = trackWidth / segments;
    let cartWidth = cart.offsetWidth;

    let left = (segmentNumber - 1) * segmentWidth + (segmentWidth - cartWidth) / 2;
    cart.style.left = `${left}px`;
    cart.dataset.segment = segmentNumber;
    
    console.log(`karretje ${cartId} naar segment ${segmentNumber}`);
}

// ===========================================
// SEGMENT KLEUR AANPASSEN
// ===========================================
function setSegmentColor(segmentNumber, color) {
    let segment = document.getElementById('segment' + segmentNumber);
    if (segment) {
        segment.style.backgroundColor = color;
    }
}

// ===========================================
// KLEUR BEPALEN (met thresholds 1,2,3)
// ===========================================
function bepaalKleur(sensorType, waarde) {
    if (!trackConfig || !trackConfig.sensorThresholds || !trackConfig.colors) {
        return 'green';
    }
    
    let thresholds = trackConfig.sensorThresholds[sensorType];
    if (!thresholds) return trackConfig.colors[0];
    
    // thresholds: {1:0, 2:40, 3:70}
    if (waarde >= thresholds[3]) {
        return trackConfig.colors[2];  // rood
    } else if (waarde >= thresholds[2]) {
        return trackConfig.colors[1];  // oranje
    } else {
        return trackConfig.colors[0];  // groen
    }
}

// ===========================================
// DATA VERWERKEN - ALLEEN DE NIEUWSTE METING
// ===========================================
async function haalData() {
    try {
        const response = await fetch(API_URL + '/realtimedata');
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            // Alleen de ALLEREERSTE (nieuwste) meting gebruiken!
            let nieuwste = data.data[0];
            
            console.log("Nieuwste meting:", nieuwste);
            
            // Tabel met ALLE data (voor overzicht)
            toonData(data.data);
            
            // ALLEEN DE NIEUWSTE gebruiken voor cart en segment
            moveCartTo(nieuwste.id, nieuwste.locatie);
            
            let kleur = bepaalKleur(nieuwste.type, nieuwste.waarde);
            setSegmentColor(nieuwste.locatie, kleur);
            
        } else {
            document.getElementById('realtime').innerHTML = '<p style="color:red">Geen data</p>';
        }
    } catch (fout) {
        document.getElementById('realtime').innerHTML = '<p style="color:red">Kan niet verbinden</p>';
        console.error("Fout:", fout);
    }
}

// ===========================================
// TABEL MAKEN (optioneel, maar handig voor overzicht)
// ===========================================
function toonData(metingen) {
    let html = '<table><tr><th>Tijd</th><th>type</th><th>Waarde</th><th>Locatie</th></tr>';
    
    for (let m of metingen) {
        let tijd = new Date(m.tijd).toLocaleTimeString();
        html += `<tr>
            <td>${tijd}</td>
            <td>${m.type}</td>
            <td>${m.waarde}</td>
            <td>${m.locatie}</td>
        </tr>`;
    }
    
    document.getElementById('realtime').innerHTML = html;
}

// ===========================================
// TRACK AANMAKEN
// ===========================================
function createTrack() {
    let container = document.getElementById('homeTrackContainer');
    if (!container) return;

    container.innerHTML = '';

    // Track
    let track = document.createElement('div');
    track.className = 'track';
    container.appendChild(track);

    // 4 segmenten
    for (let i = 1; i <= 4; i++) {
        let segment = document.createElement('div');
        segment.className = 'track-segment';
        segment.id = 'segment' + i;
        segment.textContent = 'Segment ' + i;
        track.appendChild(segment);
    }

    // 1 karretje met id = "1"
    let cart = document.createElement('div');
    cart.className = 'cart';
    cart.id = '1';
    container.appendChild(cart);
    
    let lading = document.createElement('div');
    lading.className = 'lading';
    cart.appendChild(lading);

    console.log("Track klaar - karretje heeft id='1'");
    
    // Zet karretje in segment 1 als start
    setTimeout(() => moveCartTo(1, 1), 200);
}

// ===========================================
// GRAFIEK
// ===========================================
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

// ===========================================
// SHOW PAGE FUNCTIE
// ===========================================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('visible'));
    document.getElementById(pageId).classList.add('visible');
}

// ===========================================
// WINDOW RESIZE
// ===========================================
window.addEventListener('resize', () => {
    let cart = document.getElementById('1');
    if (cart && cart.dataset.segment) {
        moveCartTo(1, parseInt(cart.dataset.segment));
    }
});

// ===========================================
// SCROLL FUNCTIE - MET EXTRA RUIMTE BOVEN
// ===========================================
function scrollToSection(sectionId) {
    let element = document.getElementById(sectionId);
    if (!element) return;
    
    // Bereken de positie van het element
    let elementPosition = element.getBoundingClientRect().top + window.scrollY;
    
    // Scroll 20px extra naar boven (zodat de titel goed zichtbaar is)
    let offsetPosition = elementPosition - 80;
    
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

// ===========================================
// STARTUP
// ===========================================
window.addEventListener('DOMContentLoaded', () => {
    createTrack();
    haalData();
    maakGrafiek();
    setInterval(haalData, 1000);
});