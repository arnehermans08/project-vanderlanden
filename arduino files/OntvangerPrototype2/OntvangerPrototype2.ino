#include <esp_now.h>
#include <WiFi.h>
#include <ArduinoJson.h>
#include <esp_wifi.h>

// -----------------------------
// Config
// -----------------------------
#define MSG_POOL_SIZE 8
#define MSG_MAX_LEN 250
#define JSON_DOC_SIZE 512
#define WIFI_CHANNEL 1   // MOET MATCHEN MET DE ZENDER

// -----------------------------
// Structs (optioneel, voor herkenning)
// -----------------------------
typedef struct __attribute__((packed)) {
  uint8_t r, g, b;
  uint32_t timestamp;
} ColorDataPacked;

typedef struct __attribute__((packed)) {
  int16_t temp_x10;
  uint16_t hum_x10;
  uint32_t timestamp;
} DHTPacked;

typedef struct __attribute__((packed)) {
  int16_t ax, ay, az;
  int16_t gx, gy, gz;
  uint32_t timestamp;
} IMUPacked;

typedef struct __attribute__((packed)) {
  int32_t lat_e7;
  int32_t lon_e7;
  int32_t alt_mm;
  uint32_t timestamp;
} GPSPacked;

// -----------------------------
// Message pool
// -----------------------------
typedef struct {
  bool used;
  uint8_t mac[6];
  int8_t rssi;
  uint8_t len;
  uint8_t data[MSG_MAX_LEN];
} MsgSlot;

static MsgSlot msgPool[MSG_POOL_SIZE];
static QueueHandle_t msgQueue;
StaticJsonDocument<JSON_DOC_SIZE> jsonDoc;

// -----------------------------
// Helpers
// -----------------------------
bool isPrintableAscii(const uint8_t* data, size_t len) {
  for (size_t i = 0; i < len; ++i) {
    uint8_t c = data[i];
    if ((c >= 0x20 && c <= 0x7E) || c == '\r' || c == '\n' || c == '\t') continue;
    return false;
  }
  return true;
}

void handleJSON(const uint8_t *buf, size_t len) {
  jsonDoc.clear();
  static char tmp[MSG_MAX_LEN];
  size_t copyLen = min(len, (size_t)MSG_MAX_LEN - 1);
  memcpy(tmp, buf, copyLen);
  tmp[copyLen] = '\0';

  DeserializationError err = deserializeJson(jsonDoc, tmp);
  if (!err) {
    Serial.print(" JSON: ");
    serializeJson(jsonDoc, Serial);
    Serial.println();
  } else {
    Serial.print(" JSON parse error: ");
    Serial.println(err.c_str());
  }
}

void handleColorData(const uint8_t *buf) {
  ColorDataPacked cd;
  memcpy(&cd, buf, sizeof(cd));
  Serial.printf(
    " {\"r\":%u,\"g\":%u,\"b\":%u,\"ts\":%u}\n",
    cd.r, cd.g, cd.b, (unsigned)cd.timestamp
  );
}

void handleDHT(const uint8_t *buf) {
  DHTPacked d;
  memcpy(&d, buf, sizeof(d));
  Serial.printf(
    " {\"temp\":%.1f,\"hum\":%.1f,\"ts\":%u}\n",
    d.temp_x10 / 10.0f,
    d.hum_x10 / 10.0f,
    (unsigned)d.timestamp
  );
}

void handleIMU(const uint8_t *buf) {
  IMUPacked im;
  memcpy(&im, buf, sizeof(im));
  Serial.printf(
    " {\"ax\":%d,\"ay\":%d,\"az\":%d,\"gx\":%d,\"gy\":%d,\"gz\":%d,\"ts\":%u}\n",
    im.ax, im.ay, im.az, im.gx, im.gy, im.gz,
    (unsigned)im.timestamp
  );
}

void handleGPS(const uint8_t *buf) {
  GPSPacked g;
  memcpy(&g, buf, sizeof(g));
  Serial.printf(
    " {\"lat\":%.7f,\"lon\":%.7f,\"alt\":%.2f,\"ts\":%u}\n",
    g.lat_e7 / 1e7,
    g.lon_e7 / 1e7,
    g.alt_mm / 1000.0,
    (unsigned)g.timestamp
  );
}

void handleBinaryAsJson(const uint8_t *buf, size_t len) {
  StaticJsonDocument<JSON_DOC_SIZE> doc;
  JsonArray arr = doc.createNestedArray("data");

  for (size_t i = 0; i + 3 < len; i += 4) {
    float f;
    memcpy(&f, buf + i, 4);
    arr.add(f);
  }

  Serial.print(" ");
  serializeJson(doc, Serial);
  Serial.println();
}

// -----------------------------
// Message processing
// -----------------------------
void processMessage(MsgSlot *m) {
  Serial.print(" Processing message, len=");
  Serial.println(m->len);

  size_t i = 0;
  while (i < m->len && isspace(m->data[i])) i++;

  if (i < m->len && (m->data[i] == '{' || m->data[i] == '[')) {
    handleJSON(m->data + i, m->len - i);
    return;
  }

  if (isPrintableAscii(m->data, m->len)) {
    Serial.print(" TEXT: ");
    Serial.write(m->data, m->len);
    Serial.println();
    return;
  }

  if (m->len == sizeof(ColorDataPacked)) return handleColorData(m->data);
  if (m->len == sizeof(DHTPacked))      return handleDHT(m->data);
  if (m->len == sizeof(IMUPacked))      return handleIMU(m->data);
  if (m->len == sizeof(GPSPacked))      return handleGPS(m->data);

  if (m->len % 4 == 0 && m->len <= 32) {
    handleBinaryAsJson(m->data, m->len);
    return;
  }

  Serial.print(" RAW: [");
  for (int j = 0; j < m->len; ++j) {
    Serial.print(m->data[j]);
    if (j < m->len - 1) Serial.print(",");
  }
  Serial.println("]");
}

// -----------------------------
// ESP-NOW receive callback
// -----------------------------
void onReceive(const esp_now_recv_info_t *info,
               const uint8_t *incomingData,
               int len) {

  Serial.print(" RX len=");
  Serial.print(len);
  Serial.print(" RSSI=");
  Serial.println(info->rx_ctrl ? info->rx_ctrl->rssi : 0);

  if (len <= 0 || len > MSG_MAX_LEN) return;

  int idx = -1;
  noInterrupts();
  for (int i = 0; i < MSG_POOL_SIZE; ++i) {
    if (!msgPool[i].used) {
      idx = i;
      msgPool[i].used = true;
      break;
    }
  }
  interrupts();

  if (idx < 0) {
    Serial.println(" Message pool full");
    return;
  }

  memcpy(msgPool[idx].mac, info->src_addr, 6);
  msgPool[idx].rssi = info->rx_ctrl ? info->rx_ctrl->rssi : 0;
  msgPool[idx].len = (uint8_t)len;
  memcpy(msgPool[idx].data, incomingData, len);

  xQueueSendFromISR(msgQueue, &idx, NULL);
}

// -----------------------------
// Setup & loop
// -----------------------------
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n ESP-NOW Receiver starting...");
  WiFi.mode(WIFI_STA);
  esp_wifi_set_channel(WIFI_CHANNEL, WIFI_SECOND_CHAN_NONE);

  Serial.print(" MAC: ");
  Serial.println(WiFi.macAddress());

  if (esp_now_init() != ESP_OK) {
    Serial.println(" ESP-NOW init failed");
    return;
  }
  Serial.println(" ESP-NOW ready");

  for (int i = 0; i < MSG_POOL_SIZE; ++i) msgPool[i].used = false;

  msgQueue = xQueueCreate(MSG_POOL_SIZE, sizeof(uint8_t));
  if (!msgQueue) {
    Serial.println(" Queue create failed");
    return;
  }

  esp_now_register_recv_cb(onReceive);
  Serial.println(" Waiting for ESP-NOW packets...");
}

void loop() {
  uint8_t idx;
  while (xQueueReceive(msgQueue, &idx, 0) == pdTRUE) {
    if (idx >= MSG_POOL_SIZE) continue;
    MsgSlot *m = &msgPool[idx];
    processMessage(m);
    noInterrupts();
    m->used = false;
    interrupts();
  }
  delay(10);
}