//================================================================================================//
//                                                                                                //
// FILE    : THBSensorTrace_v1.ino                                                                //
// OUTLINE : DHT22とSCP1000のセンサデータを取得してシリアルポートに出力                            //
//                                                                                                //
// Update Log                                                                                     //
// 2019/12/29 : 作成開始。"DHTtester.ino"と"BarometricPressureSensor.ino"を統合させるようなイメージ   //
//                                                                                                //
//                                         Copyright (c) 2019 Kyohei Umemoto All Rights reserved. //
//                                                                                                //
//================================================================================================//

//================================================================================================//
// Include Files                                                                                  //
//================================================================================================//
#include <SPI.h>
#include <TimerOne.h>
#include "DHT.h"

//================================================================================================//
// Global Variables                                                                               //
//================================================================================================//
// Sensor's memory register addresses
const int PRESSURE = 0x1F;      // 3 most significant bits of pressure
const int PRESSURE_LSB = 0x20;  // 16 least significant bits of pressure
const int TEMPERATURE = 0x21;   // 16 bit temperature reading
const byte READ = 0b11111100;   // SCP1000's read command
const byte WRITE = 0b00000010;  // SCP1000's write command

// pins used for the connection with the sensor
// the other you need are controlled by the SPI library):
const int dataReadyPin = 6;
const int chipSelectPin = 7;

// Temperature and Pressure variables
float realTemp = 0.0;
unsigned long  pressure_data_high = 0, pressure_data_low = 0;
unsigned long pressure = 0;

// DHT22用変数
#define DHTTYPE DHT22     // DHT 22  (AM2302)
const int DHTPIN = 2;     // what pin we're connected to
DHT dht(DHTPIN, DHTTYPE); // Initialize DHT sensor for normal 16mhz Arduino
float h = 0.0, t = 0.0, f = 0.0;

// 周期データ取得用
int n = 0;                    // サンプルカウンタ変数
int start_bit = 0;            // サンプリング開始ビット
long sampling_time = 999999;  // サンプリング時間[us]

//================================================================================================//
// Setups                                                                                         //
//================================================================================================//
void setup(){
    // UARTの初期化
    Serial.begin(115200);           // ボーレートを115.2kbpsに設定

    // SCP-1000用の初期化処理
    SPI.begin();                    // start the SPI library:
    pinMode(dataReadyPin, INPUT);   // データレディピンを入力に設定
    pinMode(chipSelectPin, OUTPUT); // チップセレクトピンを出力に設定
    
    // Configure SCP1000
    writeRegister(0x02, 0x2D);
    writeRegister(0x01, 0x03);
    writeRegister(0x03, 0x0A);  //Select High Resolution Mode

    // Configure DHT22
    dht.begin();
    
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

        // SCP-1000センサのデータ送信 (データ取得はメインループ内、データ取得のタイミングをセンサ側が持っているため)
        Serial.print(",");
        Serial.print(realTemp, 2);
        Serial.print(",");
        Serial.print(pressure, DEC);
        
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
    int tempData;
    
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
    
    if(digitalRead(dataReadyPin) == HIGH){
        tempData = readRegister(0x21, 2);                     // Read the temperature data
        realTemp = (float)tempData / 20.0;                    // convert the temperature to celsius and display it
        pressure_data_high = readRegister(0x1F, 1);           // Read the pressure data highest 3 bits:
        pressure_data_high &= 0b00000111;                     // you only needs bits 2 to 0
        pressure_data_low = readRegister(0x20, 2);            // Read the pressure data lower 16 bits:
        pressure = ((pressure_data_high << 16) | pressure_data_low) / 4; //combine the two parts into one 19-bit number:
    }
}

//================================================================================================//
//Read from or write to register from the SCP1000:                                                //
//================================================================================================//
unsigned int readRegister(byte thisRegister, int bytesToRead) {
  byte inByte = 0;           // incoming byte from the SPI
  unsigned int result = 0;   // result to return
  // Serial.print(thisRegister, BIN);
  // Serial.print("\t");
  // SCP1000 expects the register name in the upper 6 bits
  // of the byte. So shift the bits left by two bits:
  thisRegister = thisRegister << 2;
  // now combine the address and the command into one byte
  byte dataToSend = thisRegister & READ;
  // Serial.print(thisRegister, BIN);
  // Serial.print("\t");
  // take the chip select low to select the device:
  digitalWrite(chipSelectPin, LOW);
  // send the device the register you want to read:
  SPI.transfer(dataToSend);
  // send a value of 0 to read the first byte returned:
  result = SPI.transfer(0x00);
  // decrement the number of bytes left to read:
  bytesToRead--;
  // if you still have another byte to read:
  if (bytesToRead > 0) {
    // shift the first byte left, then get the second byte:
    result = result << 8;
    inByte = SPI.transfer(0x00);
    // combine the byte you just got with the previous one:
    result = result | inByte;
    // decrement the number of bytes left to read:
    bytesToRead--;
  }
  // take the chip select high to de-select:
  digitalWrite(chipSelectPin, HIGH);
  // return the result:
  return (result);
}

//================================================================================================//
//Sends a write command to SCP1000                                                                //
//================================================================================================//
void writeRegister(byte thisRegister, byte thisValue) {

  // SCP1000 expects the register address in the upper 6 bits
  // of the byte. So shift the bits left by two bits:
  thisRegister = thisRegister << 2;
  // now combine the register address and the command into one byte:
  byte dataToSend = thisRegister | WRITE;

  // take the chip select low to select the device:
  digitalWrite(chipSelectPin, LOW);

  SPI.transfer(dataToSend); //Send register location
  SPI.transfer(thisValue);  //Send value to record into register

  // take the chip select high to de-select:
  digitalWrite(chipSelectPin, HIGH);
}
