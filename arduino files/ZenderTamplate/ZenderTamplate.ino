#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <ArduinoJson.h>

// =======================
// Instellingen
// =======================
#define ZENDER_ID 42
#define WIFI_CHANNEL 1
uint8_t RECEIVER_MAC[] = {0xA4,0xF0,0x0F,0x8E,0x67,0x9C};

// Dummy sensoren
struct Sensor { const char* naam; float waarde; };
Sensor sensoren[] = { {"temp",0} };
const int AANTAL_SENSOREN = sizeof(sensoren)/sizeof(sensoren[0]);

// Locatie variabelen
float locatie = 1;
int zendingTeller = 0;
const int ZENDINGEN_PER_LOCATIE = 10;

// =======================
// Setup
// =======================
void setup() {
  Serial.begin(9600);
  WiFi.mode(WIFI_STA);
  esp_wifi_set_channel(WIFI_CHANNEL, WIFI_SECOND_CHAN_NONE);

  if (esp_now_init() != ESP_OK) { while(true); }

  esp_now_peer_info_t peer = {};
  memcpy(peer.peer_addr, RECEIVER_MAC, 6);
  peer.channel = WIFI_CHANNEL;
  peer.encrypt = false;
  esp_now_add_peer(&peer);

  Serial.println("ESP-NOW Sender ready");
}

// =======================
// Functie om locatie te updaten
// =======================
void updateLocatie() {
  zendingTeller++;
  if (zendingTeller % ZENDINGEN_PER_LOCATIE == 0) {
    locatie++;
    if (locatie > 4) locatie = 1;
  }
}

// =======================
// Functie om sensor te verzenden
// =======================
void sendSensor(const char* sensorNaam, float waarde) {
  StaticJsonDocument<128> doc;

  doc["id"] = ZENDER_ID;
  doc["type"] = sensorNaam;
  doc["waarde"] = waarde;
  doc["locatie"] = locatie;

  char payload[128];
  size_t n = serializeJson(doc, payload, sizeof(payload));
  esp_now_send(RECEIVER_MAC, (uint8_t*)payload, n);

  Serial.println(payload);
  updateLocatie();
}

// =======================
// Loop
// =======================
void loop() {
  sensoren[0].waarde = random(20,100);

  for (int i=0;i<AANTAL_SENSOREN;i++) {
    sendSensor(sensoren[i].naam,sensoren[i].waarde);
    delay(200);
  }

  delay(1000);
}