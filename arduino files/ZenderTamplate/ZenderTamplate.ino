#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>

#define ZENDER_ID 67
#define WIFI_CHANNEL 1

uint8_t RECEIVER_MAC[] = {0xA4, 0xF0, 0x0F, 0x8E, 0x67, 0x9C};

void setup() {
  Serial.begin(115200);

  WiFi.mode(WIFI_STA);
  esp_wifi_set_channel(WIFI_CHANNEL, WIFI_SECOND_CHAN_NONE);

  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init mislukt");
    while (true);
  }

  esp_now_peer_info_t peer = {};
  memcpy(peer.peer_addr, RECEIVER_MAC, 6);
  peer.channel = WIFI_CHANNEL;
  peer.encrypt = false;

  if (esp_now_add_peer(&peer) != ESP_OK) {
    Serial.println("Peer toevoegen mislukt");
  }
}

// === LOOP ===
void loop() {
  float waarde1 = random(200, 300) / 10.0;
  float waarde2 = random(400, 600) / 10.0;

  char payload[128];
  snprintf(payload, sizeof(payload),
           "{\"id\":%d,\"temp\":%.1f,\"hum\":%.1f}",
           ZENDER_ID, waarde1, waarde2);

  esp_now_send(RECEIVER_MAC, (uint8_t *)payload, strlen(payload));

 // Serial.println(payload);
  delay(1000);
}