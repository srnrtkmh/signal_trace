//================================================================================================//
//                                                                                                //
// FILE : SignalTraceNodeAD_test_v1.ino                                                           //
// MEMO : SignalTraceADへのテスト用入力として、PWM DA回路での議事正弦波アナログ電圧と             //
//        8bitのデジタル信号をランダムに出力するプログラム                                        //
//                                                                                                //
// Update     2020/05/03 : SignalTraceADテスト用プログラムとして作成開始                          //
//                                                                                                //
//                                                                                                //
//                                         Copyright (c) 2020 Kyohei Umemoto All Rights reserved. //
//                                                                                                //
//================================================================================================//
#include <TimerOne.h>
#include <MsTimer2.h>

//================================================================================================//
// Global Variables                                                                               //
//================================================================================================//
#define DO0  A5
#define DO1  A4
#define DO2  2
#define DO3  3
#define DO4  4
#define DO5  5
#define DO6  6
#define DO7  7
#define PWM_A_PIN 9
#define PWM_B_PIN 10

long sampling_time = 999999;
word pwm_duty_a = 0;
word pwm_duty_b = 0;

//================================================================================================//
// Setups                                                                                         //
//================================================================================================//
void setup(){
    // I/Oの初期化
    pinMode(DO0, OUTPUT);                      // デジタル入力用のポート設定
    pinMode(DO1, OUTPUT);
    pinMode(DO2, OUTPUT);
    pinMode(DO3, OUTPUT);
    pinMode(DO4, OUTPUT);
    pinMode(DO5, OUTPUT);
    pinMode(DO6, OUTPUT);
    pinMode(DO7, OUTPUT);
    pinMode(PWM_A_PIN, OUTPUT);
    pinMode(PWM_B_PIN, OUTPUT);
    
    // UARTの初期化
    Serial.begin(115200);                     // ボーレートを115.2kbpsに設定
    
    // Timer1 PWMの設定
    Timer1.initialize(400);  // 40 us = 25 kHz
    Timer1.pwm(PWM_A_PIN, 100);
    Timer1.pwm(PWM_B_PIN, 512);
    Timer1.start();
    
    // Timer2割込の設定
    MsTimer2::set(1000, flash);                // 周期：1,000ms
    MsTimer2::start();                        // Timer2を開始
}

//================================================================================================//
// Timer Interrupt Funtion                                                                        //
//================================================================================================//
void flash() {
    static int cnt = 0;
    static long randomNum = 0;
    
    interrupts();         // 次回の割り込みを許可(これがないと次のタイマ割り込み周期がずれる)

    // 割り込み5回毎(5秒毎)にデジタル出力を更新
    if(cnt++ >= 4){
        cnt = 0;
        randomNum = random(0, 256);     // 0～255までの間の擬似乱数を生成

        if((randomNum & (1 << 0)) == 0) digitalWrite(DO0, LOW);
        else                            digitalWrite(DO0, HIGH);
        
        if((randomNum & (1 << 1)) == 0) digitalWrite(DO1, LOW);
        else                            digitalWrite(DO1, HIGH);
        
        if((randomNum & (1 << 2)) == 0) digitalWrite(DO2, LOW);
        else                            digitalWrite(DO2, HIGH);
        
        if((randomNum & (1 << 3)) == 0) digitalWrite(DO3, LOW);
        else                            digitalWrite(DO3, HIGH);
        
        if((randomNum & (1 << 4)) == 0) digitalWrite(DO4, LOW);
        else                            digitalWrite(DO4, HIGH);
        
        if((randomNum & (1 << 5)) == 0) digitalWrite(DO5, LOW);
        else                            digitalWrite(DO5, HIGH);
        
        if((randomNum & (1 << 6)) == 0) digitalWrite(DO6, LOW);
        else                            digitalWrite(DO6, HIGH);
        
        if((randomNum & (1 << 7)) == 0) digitalWrite(DO7, LOW);
        else                            digitalWrite(DO7, HIGH);
    }

    // 割り込み毎にPWM出力のデューティを変更
    pwm_duty_a += 10;
    if(pwm_duty_a > 1000) pwm_duty_a = 0;
    pwm_duty_b += 20;
    if(pwm_duty_b > 1000) pwm_duty_b = 0;
    Timer1.pwm(PWM_A_PIN, pwm_duty_a);
    Timer1.pwm(PWM_B_PIN, pwm_duty_b);
    
    Serial.print("pwm_duty_a = ");
    Serial.print(pwm_duty_a);
    Serial.print(", pwm_duty_b = ");
    Serial.print(pwm_duty_b);
    Serial.print(", randomNum = ");
    Serial.print(randomNum);
    Serial.print("\n");
}

//================================================================================================//
// Main Loop                                                                                      //
//================================================================================================//
void loop(){
    ;
}
