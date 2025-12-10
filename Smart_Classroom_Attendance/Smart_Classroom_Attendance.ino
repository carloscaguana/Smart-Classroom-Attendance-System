#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <time.h>
#include <HTTPClient.h>

// RFID (MFRC522) config
#define RST_PIN 27
#define SS_PIN 5

MFRC522 mfrc522(SS_PIN, RST_PIN);

// WiFi config
const char* WIFI_SSID = "";
const char* WIFI_PASSWORD = "";

// Time/NTP config
bool timeInitialized = false;

// card state tracking
struct CardState {
  String uid;
  time_t lastArrival;
  time_t lastLeave;
  unsigned long totalSeconds;  // total accumulated time inside
  bool inside;                 // true if currently "inside"
                               // Checks if a card has arrived already or not
};

const int MAX_CARDS = 50;
CardState cards[MAX_CARDS];
int cardCount = 0;

// LED
const int LED_PIN = 26;

// void ledBlink() {
//   digitalWrite(LED_PIN, HIGH);
//   delay(150);
//   digitalWrite(LED_PIN, LOW);
// }

// Buzzer
const int BUZZER_PIN = 25;
const int BUZZER_CHANNEL = 0;
const int FREQUENCY = 2000;
const int RESOLUTION = 8;
// void buzzerSound() {
//   digitalWrite(BUZZER_PIN, HIGH);
//   delay(150);
//   digitalWrite(BUZZER_PIN, LOW);
// }


// SERVER
const char* BRIDGE_URL = "https://esp32-bridge-3g2o.onrender.com/api/attendance"; // Server code on Render website
const char* COURSE_DOC_ID = "R9Ihxv88OJ8C1SCvC7LF"; // CS410 ID under professor ID Fletcher01

void sendAttendanceToServer(CardState& card, const char* event, time_t now) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, skipping send.");
    return;
  }

  HTTPClient http;
  Serial.print("Connecting to: ");
  Serial.println(BRIDGE_URL);

  if (!http.begin(BRIDGE_URL)) {
    Serial.println("http.begin() failed");
    return;
  }

  http.addHeader("Content-Type", "application/json");

  String ts = formatTimestamp(now);

  String body = "{";
  body += "\"uid\":\"" + card.uid + "\",";
  body += "\"event\":\"" + String(event) + "\",";
  body += "\"timestamp\":\"" + ts + "\",";
  body += "\"totalSeconds\":" + String(card.totalSeconds) + ",";
  body += "\"courseDocId\":\"" + String(COURSE_DOC_ID) + "\"";
  body += "}";

  Serial.print("Request body: ");
  Serial.println(body);

  int code = http.POST(body);
  Serial.print("POST /api/attendance => ");
  Serial.println(code);

  if (code > 0) {
    Serial.print("HTTP status = ");
    Serial.println(code);

    // 204 is valid.
    if (code < 200 || code >= 300) {
      if (code == 404) {
        Serial.println("Card UID rejected by the server:");
        Serial.print(" UID = ");
        Serial.println(card.uid);
        Serial.print(" courseDocId = ");
        Serial.println(COURSE_DOC_ID);
        Serial.println("Check if the UID is registered for the course.");

        card.inside = false;
        card.lastArrival = 0;
        card.lastLeave = 0;
        card.totalSeconds = 0;

        http.end();
        return;
      }

      // user tried to log in
      if (card.inside) {
        card.inside = false;
        Serial.println("Logging in failed (server error). Please try again.");
      } else {
        // user tried to log out
        card.inside = true;
        Serial.println("Logging out failed (server error). Please try again.");
      }

      http.end();
      return;
    }
  } else {
    Serial.print("HTTP error: ");
    Serial.println(HTTPClient::errorToString(code));

    // Same retry logic as above: flip inside so the next scan
    // re-attempts the same logical action (arrival or exit)
    if (card.inside) {
      card.inside = false;
      Serial.println("Logging in failed (network). Please try again.");
    } else {
      card.inside = true;
      Serial.println("Logging out failed (network). Please try again.");
    }

    http.end();
    return;
  }

  http.end();

  if (strcmp(event, "arrival") == 0) {
    Serial.println("Attendance arrival successfully sent to the server!");
  } else if (strcmp(event, "exit") == 0) {
    Serial.println("Attendance exit successfully sent to the server!");
  } else {
    Serial.println("Attendance event successfully sent to the server!");
  }
}

// Helper functions

void audibleOn() {
  digitalWrite(LED_PIN, HIGH);
  //digitalWrite(BUZZER_PIN, HIGH);
  //ledcWriteTone(BUZZER_CHANNEL, 2000);
  tone(BUZZER_PIN, 1000);
}

void audibleOff() {
  digitalWrite(LED_PIN, LOW);
  //digitalWrite(BUZZER_PIN, LOW);
  //ledcWriteTone(BUZZER_CHANNEL, 0);
  noTone(BUZZER_PIN);
}
void audibleIndicator() {
  audibleOn();
  delay(200);
  audibleOff();
}
void setupTime() {
  if (timeInitialized) return;

  // NTP: UTC time
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");

  // Set timezone to America/New_York (handles EST/EDT)
  setenv("TZ", "EST5EDT,M3.2.0/2,M11.1.0/2", 1);
  tzset();

  Serial.print("Waiting for NTP time");
  int retries = 0;
  time_t now;
  do {
    now = time(nullptr);
    if (now > 100000) break;  // is time valid check
    delay(500);
    Serial.print(".");
    retries++;
  } while (retries < 20);
  Serial.println();

  if (now > 100000) {
    Serial.println("Time synced from NTP.");
    timeInitialized = true;
  } else {
    Serial.println("Failed to sync time. Timestamps may be invalid.");
  }
}

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected.");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());

    // Initialize NTP time once we have WiFi
    setupTime();
  } else {
    Serial.println("WiFi FAILED. Check network.");
  }
}

// Conversta a student's card uid to a string
String uidToString(MFRC522::Uid uid) {
  String result = "";
  for (byte i = 0; i < uid.size; i++) {
    if (uid.uidByte[i] < 0x10) result += "0";
    result += String(uid.uidByte[i], HEX);
    if (i < uid.size - 1) result += ":";
  }
  result.toUpperCase();
  return result;
}

int findCardIndex(const String& uid) {
  for (int i = 0; i < cardCount; i++) {
    if (cards[i].uid == uid) {
      return i;
    }
  }
  return -1;
}

int addCard(const String& uid) {
  if (cardCount >= MAX_CARDS) {
    Serial.println("ERROR: Card table full. Increase MAX_CARDS.");
    return -1;
  }
  cards[cardCount].uid = uid;
  cards[cardCount].lastArrival = 0;
  cards[cardCount].lastLeave = 0;
  cards[cardCount].totalSeconds = 0;
  cards[cardCount].inside = false;
  cardCount++;
  return cardCount - 1;
}

// Formats a time to YY-MM-DD HH:MM:SS format
String formatTimestamp(time_t t) {
  if (t == 0) return String("UNKNOWN");
  struct tm timeinfo;
  localtime_r(&t, &timeinfo);  // EST
  char buf[25];
  strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(buf);
}

void logArrival(CardState& card, time_t now) {
  Serial.println();
  card.lastArrival = now;
  card.inside = true;
  card.totalSeconds = 0;

  Serial.println("---- ARRIVAL ----");
  Serial.print("UID: ");
  Serial.println(card.uid);
  Serial.print("Arrival: ");
  Serial.println(formatTimestamp(card.lastArrival));

  // send to backend
  sendAttendanceToServer(card, "arrival", now);
}

void logExit(CardState& card, time_t now) {
  Serial.println();
  card.lastLeave = now;
  card.inside = false;

  unsigned long duration = 0;
  if (card.lastArrival != 0 && card.lastLeave >= card.lastArrival) {
    duration = (unsigned long)(card.lastLeave - card.lastArrival);
  }
  card.totalSeconds = duration;

  Serial.println("---- EXIT ----");
  Serial.print("UID: ");
  Serial.println(card.uid);
  Serial.print("Arrival: ");
  Serial.println(formatTimestamp(card.lastArrival));
  Serial.print("Leave: ");
  Serial.println(formatTimestamp(card.lastLeave));
  Serial.print("Total time (s): ");
  Serial.println(card.totalSeconds);

  // send to backend
  sendAttendanceToServer(card, "exit", now);
}

void setup() {
  Serial.begin(115200);
  while (!Serial) {}

  // RFID
  SPI.begin();
  mfrc522.PCD_Init();
  Serial.println("MFRC522 initialized.");

  // LED
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // BUZZER
  pinMode(BUZZER_PIN, OUTPUT);
  // ledcAttachChannel(BUZZER_PIN, FREQUENCY, RESOLUTION, BUZZER_CHANNEL);
  // ledcWriteTone(BUZZER_CHANNEL, 0);

  // BUZZER
  //digitalWrite(BUZZER_PIN, LOW);
  noTone(BUZZER_PIN);

  // WiFi (and NTP)
  connectWiFi();

  Serial.println("Ready. Scan a card.");
}

void loop() {
  // Auto-reconnect WiFi if disconnected (and re-sync time if needed)
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  //Serial.print("Loop top");
  // Wait for a new card
  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial()) return;

  String cardUID = uidToString(mfrc522.uid);
  Serial.print("Card detected: ");
  Serial.println(cardUID);
  audibleIndicator();
  time_t now = time(nullptr);

  int idx = findCardIndex(cardUID);
  if (idx == -1) {
    // first time we've ever seen this card
    idx = addCard(cardUID);
    if (idx == -1) {
      // table full. Return
      mfrc522.PICC_HaltA();
      mfrc522.PCD_StopCrypto1();
      return;
    }
  }

  CardState& card = cards[idx];

  // Toggles the card state. If the card is not inside, it arrived. Otherwise, the card exited
  if (!card.inside) {
    logArrival(card, now);
  } else {
    // Edge case: exit without a valid arrival
    if (card.lastArrival == 0) {
      Serial.println("WARNING: Exit scan but no recorded arrival. Resetting state.");
      logArrival(card, now);  // treat this as (re)arrival instead
    } else {
      // Card exited with a valid arrival
      logExit(card, now);
    }
  }

  // Halt card & stop encryption
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  //Serial.print("Bottom");
}