//================================================================================================//
//                                                                                                //
// FILE    : THBCSensorTrace_v1.ino                                                               //
// OUTLINE : BME280とS9706のセンサデータを取得してシリアルポートに出力                            //
//                                                                                                //
// Update Log                                                                                     //
// 2019/12/29 : 作成開始。"testS9706.ino"と"testBME280.ino"を統合させるようなイメージ             //
//                                                                                                //
//                                         Copyright (c) 2019 Kyohei Umemoto All Rights reserved. //
//                                                                                                //
//================================================================================================//

//================================================================================================//
// Include Files                                                                                  //
//================================================================================================//
#include <SPI.h>
#include <TimerOne.h>
#include "SparkFunBME280.h"

//================================================================================================//
// Global Variables                                                                               //
//================================================================================================//
// S9706センサ用
#define GATE  2               // 2番ピンをGate接続端子に設定
#define CK    3               // 3番ピンをCK接続端子に設定
#define RANGE 4               // 4番ピンをRange接続端子に設定
#define DOUT  5               // 5番ピンをDout接続端子に設定
#define VR    0               // 0番ピンを可変抵抗をつないだチャンネルに設定
int red,green,blue;           // RGB三色の変数を用意

// BME280センサ用
const int SPI_CS_PIN = 10;    // 10番ピンをチップセレクトに設定
BME280 sensor;                // "SparkFunBME280.h"に記載されたオブジェクト

// 周期データ取得用
int n = 0;                    // サンプルカウンタ変数
int start_bit = 0;            // サンプリング開始ビット
long sampling_time = 999999;  // サンプリング時間[us]

//================================================================================================//
// Setups                                                                                         //
//================================================================================================//
void setup(){
    // I/Oの初期化
    pinMode(GATE,OUTPUT);       // GATE接続端子は出力
    digitalWrite(GATE, LOW);    // GATE接続端子の初期値はLOW(光量積算をOFF)
    pinMode(CK,OUTPUT);         // CK接続端子は出力
    digitalWrite(CK, LOW);      // CK接続端子の初期値はLOW(クロックなしの時はLOW)
    pinMode(RANGE,OUTPUT);      // RANGE接続端子は出力
    digitalWrite(RANGE, HIGH);  // RANGNE接続端子はHIGH(高感度に設定)
    pinMode(DOUT,INPUT);        // DOUT接続端子は入力
    
    // BME280センサオブジェクトをSPI仕様にて初期化
    sensor.beginSPI(SPI_CS_PIN);

    // UARTの初期化
    Serial.begin(115200);       // ボーレートを115.2kbpsに設定

    // Timer1割込の設定
    Timer1.initialize(sampling_time); // サンプリングタイムを設定して初期化
    Timer1.attachInterrupt(flash);    // 割り込み関数を登録
    
    delay(100) ;                      // 0.1sec経過後開始
}

//================================================================================================//
// Timer Interrupt Funtion                                                                        //
//================================================================================================//
void flash() {
    int i, val;
    
    interrupts();                             // 次回の割り込みを許可(これがないと次のタイマ割り込み周期がずれる)

    if(start_bit == 1){
        Serial.print(n);                      // サンプルナンバーを送信

        // BME280センサデータを取得・送信
        Serial.print(",");
        Serial.print(sensor.readTempC(), 2);  // 気温データを取得・送信
        Serial.print(",");
        Serial.print(sensor.readFloatHumidity(), 2);        // 湿度データを取得・送信
        Serial.print(",");
        Serial.print(sensor.readFloatPressure()/100.0, 2);  // 気圧データを取得・送信
        
        // S9706センサデータを取得・送信
        val = analogRead(VR);                 // 測光時間用の可変抵抗器の読み込み
        digitalWrite(GATE, HIGH);             // 測光開始（光量の積算を開始）
        delay(val + 1);                       // 測光時間（valを代入し可変的に設定）
        digitalWrite(GATE, LOW);              // 測光終了（光量の積算を終了） 
        delayMicroseconds(4);                 // 4マイクロ秒待機
        red=shiftIn();                        // 赤色情報を取得
        green=shiftIn();                      // 緑色情報を取得
        blue=shiftIn();                       // 青色情報を取得
        digitalWrite(GATE,HIGH);              // Gate端子をHighに戻す  
        
        Serial.print(",");
        Serial.print(red, DEC);               // 赤色情報を送信
        Serial.print(",");
        Serial.print(green, DEC);             // 緑色情報を送信
        Serial.print(",");
        Serial.print(blue, DEC);              // 青色情報を送信
        Serial.print(",");
        Serial.print(val, DEC);               // 測光時間[us]を送信

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
    }
}

//================================================================================================//
// ReadS9706()    12ビット分のパルス送信と読み込み処理                                                 //
// 引数　：　なし
// 戻値　：　
//================================================================================================//
int shiftIn(){
    int result=0;                 //検出結果用の変数を用意（0：初期化）

    //12ビット分の繰り返し処理
    for(int i = 0; i < 12; i++){
        digitalWrite(CK, HIGH);    //1ビット分のクロックパルス出力（HIGH）
        delayMicroseconds(1);     //1マイクロ秒待機
        
        // Dout端子からの出力がHighの場合は数値に反映
        if(digitalRead(DOUT) == HIGH){
          result += (1 << i);     //12ビットのi桁目に1を代入（i桁分だけ左にシフト）
        }
        
        digitalWrite(CK, LOW);     //1ビット分のクロックパルス出力（LOW）
        delayMicroseconds(1);     //1マイクロ秒待機
    }
    
    delayMicroseconds(3);//3マイクロ秒待機
    return result;//結果を出力
}
