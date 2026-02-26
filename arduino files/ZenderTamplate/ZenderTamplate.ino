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
Sensor sensoren[] = { {"temp",0}, {"hum",0}, {"licht",0} };
const int AANTAL_SENSOREN = sizeof(sensoren)/sizeof(sensoren[0]);

// Locatie als enkel getal
float locatie = 3;

// =======================
// Setup
// =======================
void setup() {
  Serial.begin(115200);
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
// Functie om sensor te verzenden
// =======================
void sendSensor(const char* sensorNaam, float waarde) {
  StaticJsonDocument<128> doc;

  doc["id"] = ZENDER_ID;
  doc["sensor"] = sensorNaam;
  doc["waarde"] = waarde;
  doc["locatie"] = locatie;  //getal

  char payload[128];
  size_t n = serializeJson(doc, payload, sizeof(payload));
  esp_now_send(RECEIVER_MAC, (uint8_t*)payload, n);

  Serial.print("Sent -> ");
  Serial.println(payload);
}

// =======================
// Loop
// =======================
void loop() {
  // Dummy sensorwaarden
  sensoren[0].waarde = random(200,300)/10.0;
  sensoren[1].waarde = random(400,600)/10.0;
  sensoren[2].waarde = random(0,1023);

  for (int i=0;i<AANTAL_SENSOREN;i++) {
    sendSensor(sensoren[i].naam,sensoren[i].waarde);
    delay(200);
  }

  delay(1000);
}