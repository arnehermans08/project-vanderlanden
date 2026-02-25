// ---------------------------
// script.js
// ---------------------------

// Functie om pagina te tonen
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('visible'));
    document.getElementById(pageId).classList.add('visible');
}

// ---------------------------
// Track + Karretjes dynamisch maken
// ---------------------------
function createTrack(trackContainerId) {
    let container = document.getElementById(trackContainerId);
    if (!container) return;

    // Maak track
    let track = document.createElement('div');
    track.classList.add('track');
    container.appendChild(track);

    // Voeg segmenten toe
    for (let i = 1; i <= trackConfig.segmentCount; i++) {
        let segment = document.createElement('div');
        segment.classList.add('track-segment');
        segment.id = 'segment' + i;
        segment.textContent = trackConfig.segmentNames[i - 1] || 'Segment ' + i;
        track.appendChild(segment);
    }

    // Voeg karretjes toe
    for (let j = 1; j <= trackConfig.cartCount; j++) {
        let cart = document.createElement('div');
        cart.classList.add('cart');
        cart.id = 'cart' + j;
        container.appendChild(cart);

        let lading = document.createElement('div');
        lading.classList.add('lading');
        cart.appendChild(lading);
    }

    // Verspreid karretjes over segmenten
    let carts = container.querySelectorAll('.cart');
    let segmentCount = trackConfig.segmentCount;

    carts.forEach((cart, index) => {
        let segmentNumber = Math.floor(index * segmentCount / carts.length) + 1;
        cart.dataset.segment = segmentNumber;
        moveCartTo(cart.id, segmentNumber);
    });
}

// ---------------------------
// Karretje verplaatsen
// ---------------------------
function moveCartTo(cartId, segmentNumber) {
    let cart = document.getElementById(cartId);
    if (!cart) return;

    let container = cart.parentElement;
    let track = container.querySelector('.track');
    if (!track) return;

    let trackWidth = track.offsetWidth;
    if (trackWidth === 0) {
        // Wacht tot track breedte beschikbaar is
        requestAnimationFrame(() => moveCartTo(cartId, segmentNumber));
        return;
    }

    let segments = track.children.length;
    let segmentWidth = trackWidth / segments;
    let cartWidth = cart.offsetWidth;

    // Center het karretje in het segment
    let left = (segmentNumber - 1) * segmentWidth + (segmentWidth - cartWidth) / 2;
    cart.style.left = `${left}px`;
}

// ---------------------------
// Karretje kleur aanpassen
// ---------------------------
function setCartColor(cartId, color) {
    let cart = document.getElementById(cartId);
    if (cart) cart.style.backgroundColor = color;
}

// ---------------------------
// Segment kleur aanpassen
// ---------------------------
function setSegmentColor(segmentNumber, color) {
    let segment = document.getElementById('segment' + segmentNumber);
    if (segment) segment.style.backgroundColor = color;
}


// ---------------------------
// Dynamische dropdowns op basis van config
// ---------------------------
function setupDropdowns() {
    // Cart dropdowns
    let cartDropdowns = [
        document.getElementById('cartMoveSelect'),
        document.getElementById('cartColorSelect')
    ];

    cartDropdowns.forEach(dropdown => {
        if (!dropdown) return;
        dropdown.innerHTML = ''; // leegmaken
        for (let i = 1; i <= trackConfig.cartCount; i++) {
            let option = document.createElement('option');
            option.value = 'cart' + i;
            option.textContent = 'Karretje ' + i;
            dropdown.appendChild(option);
        }
    });

    // Segment dropdowns
    let segmentDropdowns = [
        document.getElementById('cartMoveSegment'),
        document.getElementById('segmentColorSelect')
    ];

    segmentDropdowns.forEach(dropdown => {
        if (!dropdown) return;
        dropdown.innerHTML = '';
        for (let i = 1; i <= trackConfig.segmentCount; i++) {
            let option = document.createElement('option');
            option.value = i;
            option.textContent = trackConfig.segmentNames[i - 1] || 'Segment ' + i;
            dropdown.appendChild(option);
        }
    });

    // Kleur dropdowns (optioneel, vullen met trackConfig.colors)
    let colorDropdowns = [
        document.getElementById('cartColorChoose'),
        document.getElementById('colorSelect')
    ];

    colorDropdowns.forEach(dropdown => {
        if (!dropdown) return;
        dropdown.innerHTML = '';
        trackConfig.colors.forEach(color => {
            let option = document.createElement('option');
            option.value = color;
            option.textContent = color.charAt(0).toUpperCase() + color.slice(1);
            dropdown.appendChild(option);
        });
    });
}

// ---------------------------
// Dropdown helpers
// ---------------------------
function moveSelectedCart() {
    let cartId = document.getElementById('cartMoveSelect').value;
    let segmentNumber = document.getElementById('cartMoveSegment').value;
    let cart = document.getElementById(cartId);
    if (!cart) return;

    cart.dataset.segment = segmentNumber;
    moveCartTo(cartId, segmentNumber);
}

function colorSelectedCart() {
    let cartId = document.getElementById('cartColorSelect').value;
    let color = document.getElementById('cartColorChoose').value;
    setCartColor(cartId, color);
}

function applySegmentColor() {
    let segmentNumber = document.getElementById('segmentColorSelect').value;
    let color = document.getElementById('colorSelect').value;
    setSegmentColor(segmentNumber, color);
}

// ---------------------------
// Window resize: karretjes opnieuw positioneren
// ---------------------------
window.addEventListener('resize', () => {
    document.querySelectorAll('.cart').forEach(cart => {
        let segment = cart.dataset.segment;
        if (segment) moveCartTo(cart.id, segment);
    });
});

// ---------------------------
// Startup: track en karretjes opbouwen
// ---------------------------
window.addEventListener('DOMContentLoaded', () => {
    setupDropdowns();                  // Dropdowns dynamisch vullen
    createTrack('homeTrackContainer'); // Track en karretjes opbouwen
});










// ----------------------------------------------------------------------------------
// functies van raspberry pi
// voorbeeld input: JSON: {"esp":"1","sensor":"temp","waarde":50,"locatie":2}
// ----------------------------------------------------------------------------------


// updateCart functie
function updateCart(data) {
    let cartId = 'cart' + data.esp;
    let cart = document.getElementById(cartId);
    if (!cart) return;

    // Verplaats karretje als locatie beschikbaar
    if (data.locatie) {
        moveCartTo(cartId, data.locatie);
        cart.dataset.segment = data.locatie;
    }

    // Kleur aanpassen op basis van sensor en config
    if (data.sensor && trackConfig.sensorThresholds[data.sensor]) {
        let thresholds = trackConfig.sensorThresholds[data.sensor];
        let color = trackConfig.colors[0]; // standaardkleur

        if (data.waarde >= thresholds.red) color = 'red';
        else if (data.waarde >= thresholds.orange) color = 'orange';
        else color = 'green';

        setCartColor(cartId, color);
    }
}

