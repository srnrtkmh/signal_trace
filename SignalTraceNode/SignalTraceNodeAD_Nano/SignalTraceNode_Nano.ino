//================================================================================================//
//                                                                                                //
// FILE : SignalTraceNodeNano_v2.ino                                                              //
//                                                                                                //
// Update       16/07/17 : たぶんこのくらいの時期に作り始めたと思う．．．                         //
//              16/08/14 : Micro用の変更に合わせてNanoも変更                                      //
// Last Updated 16/10/09 : Micro用の変更に合わせてNanoも変更(サンプリングタイム設定変数化など)    //
//                                                                                                //
//                                         Copyright (C) 2016 Kyohei Umemoto All Rights Reserved. //
//                                                                                                //
//================================================================================================//
#include <MsTimer2.h>
#include <TimerOne.h>

//================================================================================================//
// Global Variables                                                                               //
//================================================================================================//
#define DI0  2
#define DI1  3
#define DI2  4
#define DI3  5
#define DI4  6
#define DI5  7
#define DI6  8
#define DI7  9
#define AI0  A0
#define AI1  A1
#define AI2  A2
#define AI3  A3
#define AI4  A4
#define AI5  A5
#define AI6  A6
#define AI7  A7

int n = 0;
int start_bit = 0;
int analog_data[16] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
int digital_data[16] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
int achNum = 8;
int dchNum = 8;
long sampling_time = 9999;

//================================================================================================//
// Setups                                                                                         //
//================================================================================================//
void setup(){
    // I/Oの初期化(アナログピンに関しては不要？)
    pinMode(DI0, INPUT);
    pinMode(DI1, INPUT);
    pinMode(DI2, INPUT);
    pinMode(DI3, INPUT);
    pinMode(DI4, INPUT);
    pinMode(DI5, INPUT);
    pinMode(DI6, INPUT);
    pinMode(DI7, INPUT);
    
    // UARTの初期化
    Serial.begin(115200);                   // ボーレートを115.2kbpsに設定

    // Timer2の初期化
    MsTimer2::set(100, flash);              // 100ms period
    
    // Timer1割込の設定
    Timer1.initialize(sampling_time);
    Timer1.attachInterrupt(flash);
    
    delay(100) ;                              // 0.1Sしたら開始
}

//================================================================================================//
// Timer Interrupt Funtion                                                                        //
//================================================================================================//
void flash() {
    int i;

    interrupts();

    if(start_bit == 1){
        // ポートピンからアナログ値を読み込む
        analog_data[0] = analogRead(AI0) ;
        analog_data[1] = analogRead(AI1) ;
        analog_data[2] = analogRead(AI2) ;
        analog_data[3] = analogRead(AI3) ;
        analog_data[4] = analogRead(AI4) ;
        analog_data[5] = analogRead(AI5) ;
        analog_data[6] = analogRead(AI6) ;
        analog_data[7] = analogRead(AI7) ;

        // ポートピンからデジタル値を読み込む
        digital_data[0] = digitalRead(DI0);
        digital_data[1] = digitalRead(DI1);
        digital_data[2] = digitalRead(DI2);
        digital_data[3] = digitalRead(DI3);
        digital_data[4] = digitalRead(DI4);
        digital_data[5] = digitalRead(DI5);
        digital_data[6] = digitalRead(DI6);
        digital_data[7] = digitalRead(DI7);

        // 読み取りデータの送信
        Serial.print(n);
        Serial.print(",");
        for(i=0; i<achNum; i++){
            Serial.print(analog_data[i]);
            Serial.print(",");
        }
        for(i=0; i<dchNum; i++){
            Serial.print(digital_data[i]);
            Serial.print(",");
        }
        Serial.print(n);
        Serial.print("\n");

        // サンプルNoの更新
        n++;
        if(n == 1000){
            n = 0;
        }
    }
}

//================================================================================================//
// Main Loop                                                                                      //
//================================================================================================//
void loop(){
    char a;
    
    if(Serial.available()){
        a = char(Serial.read());
        if(a == 's'){
            n = 0;
            start_bit = 1;
            Serial.print('s');
            // MsTimer2::start();
            Timer1.start();
        }else if(a == 't'){
            start_bit = 0;
            // MsTimer2::stop();
            Timer1.stop();
            Serial.print('t');
        }
    }
}

