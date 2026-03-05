// config.js
let trackConfig = {
    segmentCount: 4,
    cartCount: 1,
    segmentNames: ["appel"],
    colors: ['#379837', '#ffb339', '#ff2c2c'],  // index 0=green, 1=orange, 2=red
    
    sensorThresholds: {
        temp: { 
            1: 0,    // waarde >=0  → kleur op index 0 (green)
            2: 60,   // waarde >=40 → kleur op index 1 (orange)
            3: 80    // waarde >=70 → kleur op index 2 (red)
        }
    }
};