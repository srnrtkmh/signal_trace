//================================================================================================//
//                                                                                                //
// FILE    : SignalTraceNodeTHG.ino                                                               //
// OUTLINE : DHT22とENC-03R、L3GD20のセンサデータを取得してシリアルポートに出力                        //
//                                                                                                //
// Update Log                                                                                     //
// 2019/12/29 : 作成開始。"DHTtester.ino"と"BarometricPressureSensor.ino"を統合させるようなイメージ   //
//                                                                                                //
//                                                                                                //
//                                                                                                //
//                                                                                                //
//                                         Copyright (c) 2019 Kyohei Umemoto All Rights reserved. //
//                                                                                                //
//================================================================================================//

//================================================================================================//
// Include Files                                                                                  //
//================================================================================================//
#include <TimerOne.h>
#include <Wire.h>
#include "DHT.h"

//================================================================================================//
// Global Variables                                                                               //
//================================================================================================//
// DHT22用変数
#define DHTTYPE DHT22     // DHT 22  (AM2302)
const int DHTPIN = 2;     // what pin we're connected to
DHT dht(DHTPIN, DHTTYPE); // Initialize DHT sensor for normal 16mhz Arduino
float h = 0.0, t = 0.0, f = 0.0;

// ENC-03R 出力値読み取り用変数
#define ENC03R_PORT1 A0
#define ENC03R_PORT2 A1
int gyroValue[2] = {0, 0};

// L3GD20読み取り用変数
const byte L3GD20_ADDR = B1101010;  // SA0 = GND
//const byte L3GD20_ADDR = B1101011;// SA0 = VDD_IO
const byte L3GD20_WHOAMI = 0x0f;
const byte L3GD20_CTRL1 = 0x20;
const byte L3GD20_CTRL2 = 0x21;
const byte L3GD20_CTRL3 = 0x22;
const byte L3GD20_CTRL4 = 0x23;
const byte L3GD20_CTRL5 = 0x24;
const byte L3GD20_X_L = 0x28;
const byte L3GD20_X_H = 0x29;
const byte L3GD20_Y_L = 0x2A;
const byte L3GD20_Y_H = 0x2B;
const byte L3GD20_Z_L = 0x2C;
const byte L3GD20_Z_H = 0x2D;
short X = 0, Y = 0, Z = 0;
float x = 0.0, y = 0.0, z = 0.0;


// 周期データ取得用
int n = 0;                    // サンプルカウンタ変数
int start_bit = 0;            // サンプリング開始ビット
long sampling_time = 999999;  // サンプリング時間[us]


//================================================================================================//
// L3GD20書き込み関数                                                                               //
//================================================================================================//
void L3GD20_write(byte reg, byte val)
{
  Wire.beginTransmission(L3GD20_ADDR);
  Wire.write(reg);
  Wire.write(val);
  Wire.endTransmission();  
}

//================================================================================================//
// L3GD20読み込み関数                                                                               //
//================================================================================================//
byte L3GD20_read(byte reg)
{
  byte ret = 0;
  // request the registor
  Wire.beginTransmission(L3GD20_ADDR);
  Wire.write(reg);
  Wire.endTransmission();  

  // read
  Wire.requestFrom((unsigned int)L3GD20_ADDR, 1);
  
  while (Wire.available()) {
    ret = Wire.read();
  }
  
  return ret;
}

//================================================================================================//
// Setups                                                                                         //
//================================================================================================//
void setup(){
    // UARTの初期化
    Serial.begin(115200);           // ボーレートを115.2kbpsに設定

    // Configure DHT22
    dht.begin();

    // L3DG20の設定
    while (!Serial) {}
    
    Wire.begin();
//    Serial.println(L3GD20_read(L3GD20_WHOAMI), HEX); // should show D4
    L3GD20_write(L3GD20_CTRL1, B00001111);
                         //   |||||||+ X axis enable
                         //   ||||||+- Y axis enable
                         //   |||||+-- Z axis enable
                         //   ||||+--- PD: 0: power down, 1: active
                         //   ||++---- BW1-BW0: cut off 12.5[Hz]
                         //   ++------ DR1-DR0: ODR 95[HZ]
    
    // Timer1割込の設定
    Timer1.initialize(sampling_time); // サンプリングタイムを設定して初期化
    Timer1.attachInterrupt(flash);    // 割り込み関数を登録
    
    delay(100) ;                      // 0.1sec経過後開始
}

//================================================================================================//
// Timer Interrupt Funtion                                                                        //
//================================================================================================//
void flash() {
    interrupts();                             // 次回の割り込みを許可(これがないと次のタイマ割り込み周期がずれる)

    if(start_bit == 1){
        Serial.print(n);                      // サンプルナンバーを送信

        // ENC-03Rの出力をA/D変換して読み取り・送信
        gyroValue[0] = analogRead(ENC03R_PORT1);
        gyroValue[1] = analogRead(ENC03R_PORT2);
        Serial.print(",");
        Serial.print(gyroValue[0]);
        Serial.print(",");
        Serial.print(gyroValue[1]);
        
        X = L3GD20_read(L3GD20_X_H);
        x = X = (X << 8) | L3GD20_read(L3GD20_X_L);
        Y = L3GD20_read(L3GD20_Y_H);
        y = Y = (Y << 8) | L3GD20_read(L3GD20_Y_L);
        Z = L3GD20_read(L3GD20_Z_H);
        z = Z = (Z << 8) | L3GD20_read(L3GD20_Z_L);
        Serial.print(",");
          Serial.print(X);    // X axis (reading)
        Serial.print(",");
        Serial.print(Y);    // Y axis (reading)
        Serial.print(",");
        Serial.print(Z);    // Z axis (reading)
        
        // DHT22センサのデータ取得・送信
        // Reading temperature or humidity takes about 250 milliseconds!
        // Sensor readings may also be up to 2 seconds 'old' (its a very slow sensor)
        t = dht.readTemperature();      // Read temperature as Celsius [℃]
        f = dht.readTemperature(true);  // Read temperature as Fahrenheit [℉]
        h = dht.readHumidity();         // Read humidity [%]

        // Check if any reads failed and exit early (to try again).
        if (isnan(h) || isnan(t) || isnan(f)) {
            Serial.println("Failed to read from DHT sensor!");
        }

        // Send data
        Serial.print(",");
        Serial.print(t, 2);
        Serial.print(",");
        Serial.print(f, 2);
        Serial.print(",");
        Serial.print(h, 2);

        // 付加情報送信
        Serial.print(",");
        Serial.print(n);                      // サンプルナンバーを送信
        Serial.print("\n");                   // 改行コードを送信

        // サンプルカウンタの更新
        n++;
        if(n == 1000) n = 0;
    }
}

//================================================================================================//
// Main Loop                                                                                      //
//================================================================================================//
void loop(){
    char a;
    
    if(Serial.available()){
        a = char(Serial.read());

        // 条件分岐①：サンプリング開始
        if(a == 's'){
            n = 0;                              // サンプルカウンタをリセット
            start_bit = 1;                      // 割り込み時の処理あり
            Serial.print('s');                  // エコーバック
            Timer1.start();                     // Timer1開始
        }
        
        // 条件分岐②：サンプリング停止
        else if(a == 't'){
            start_bit = 0;                      // 割り込み時の処理なし
            Timer1.stop();                      // Timer1停止
            Serial.print('t');                  // エコーバック
        }

        // 条件分岐③：サンプリングタイム変更(10ms)
        else if(a == 'd'){
            start_bit = 0;                      // 割り込み時の処理なし
            sampling_time = 9999;               // サンプリングタイム10ms
            Timer1.stop();                      // 条件変更のためTimer1割込一時停止
            Timer1.setPeriod(sampling_time);    // Timer1割込の設定
            Serial.print('d');                  // エコーバック
        }
        
        // 条件分岐④：サンプリングタイム変更(100ms)
        else if(a == 'h'){
            start_bit = 0;                      // 割り込み時の処理なし
            sampling_time = 99999;              // サンプリングタイム100ms
            Timer1.stop();                      // 条件変更のためTimer1割込一時停止
            Timer1.setPeriod(sampling_time);    // Timer1割込の設定
            Serial.print('h');                  // エコーバック
        }
        
        // 条件分岐⑤：サンプリングタイム変更(1,000ms)
        else if(a == 'k'){
            start_bit = 0;                      // 割り込み時の処理なし
            sampling_time = 999999;             // サンプリングタイム1000ms
            Timer1.stop();                      // 条件変更のためTimer1割込一時停止
            Timer1.setPeriod(sampling_time);    // Timer1割込の設定
            Serial.print('k');                  // エコーバック
        }
        
        // 条件分岐⑥：サンプリングタイム変更(10,000ms)
        else if(a == 'j'){
            start_bit = 0;                      // 割り込み時の処理なし
            sampling_time = 9999999;            // サンプリングタイム10,000ms
            Timer1.stop();                      // 条件変更のためTimer1割込一時停止
            Timer1.setPeriod(sampling_time);    // Timer1割込の設定
            Serial.print('j');                  // エコーバック
        }
        
        // 条件分岐⑦：サンプリングタイム変更(2,000ms)
        else if(a == '2'){
            start_bit = 0;                      // 割り込み時の処理なし
            sampling_time = 1999999;            // サンプリングタイム2,000ms
            Timer1.stop();                      // 条件変更のためTimer1割込一時停止
            Timer1.setPeriod(sampling_time);    // Timer1割込の設定
            Serial.print('2');                  // エコーバック
        }
        
        // 条件分岐⑧：サンプリングタイム変更(5,000ms)
        else if(a == '5'){
            start_bit = 0;                      // 割り込み時の処理なし
            sampling_time = 4999999;            // サンプリングタイム5,000ms
            Timer1.stop();                      // 条件変更のためTimer1割込一時停止
            Timer1.setPeriod(sampling_time);    // Timer1割込の設定
            Serial.print('5');                  // エコーバック
        }
    }
}
