//================================================================================================//
//                                                                                                //
// FILE : SignalTraceNodeMicro_v4.ino                                                             //
//                                                                                                //
// Update     2016/07/01 : たぶんこのあたりの時期から作り始めたと思う                                   //
//            2016/08/14 : 送信するチャンネル数を変数で指定するように変更                               //
//            2016/08/XX : Timer1での割り込みに変えてもっと時間分解能の精度を上げよう                    //
//            2016/10/09 : サンプリングタイム設定変数化(本当にしたのか？)                               //
//            2019/12/24 : サンプリングタイム設定変数化を試みるもTimeroneの使い方(？)でつまづく           //
//            2019/12/25 : TimerOne-r11はNG、TimerOne-1.1.0はOK、TimerOne-masterはOK               //
//                                                                                                //
//                                         Copyright (c) 2020 Kyohei Umemoto All Rights reserved. //
//                                                                                                //
//================================================================================================//
#include <SPI.h>
#include <TimerOne.h>

//================================================================================================//
// Global Variables                                                                               //
//================================================================================================//
#define MCP3208_CS0 0
#define MCP3208_CS1 1
#define DI0  A0
#define DI1  A1
#define DI2  A2
#define DI3  A3
#define DI4  A4
#define DI5  A5
#define DI6  2
#define DI7  3
#define DI8  4
#define DI9  5
#define DI10 6
#define DI11 7
#define DI12 8
#define DI13 9
#define DI14 10
#define DI15 11
#define DI16 12
#define DI17 13

int n = 0;
int start_bit = 0;
int analog_data[16] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
int digital_data[18] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
int achNum = 16;
int dchNum = 18;
long sampling_time = 999999;

//================================================================================================//
// ADC_analogRead(ss,channel)   MCP3208からアナログ値を読み取る処理                               //
//  ss      : SPIのSS(CS)ピン番号を指定する                                                       //
//  channel : 読み取るチャンネルを指定する(0-7ch)                                                 //
//================================================================================================//
int ADC_analogRead(int ss,int channel){
    int d1 , d2 ;

    // ADCから指定チャンネルのデータを読み出す
    digitalWrite(ss,LOW) ;              // SS(CS)ラインをLOWにする
    d1 = SPI.transfer( 0x06 | (channel >> 2) ) ;
    d1 = SPI.transfer( channel << 6 ) ;
    d2 = SPI.transfer(0x00) ;
    digitalWrite(ss,HIGH) ;             // SS(CS)ラインをHIGHにする

    return (d1 & 0x0F)*256 + d2 ;
}

//================================================================================================//
// Setups                                                                                         //
//================================================================================================//
void setup(){
    // I/Oの初期化
    pinMode(MCP3208_CS0, OUTPUT) ;            // SPIのチップセレクト用のポート設定
    pinMode(MCP3208_CS1, OUTPUT) ;
    digitalWrite(MCP3208_CS0, HIGH) ;
    digitalWrite(MCP3208_CS1, HIGH) ;

    pinMode(DI0, INPUT);                      // デジタル入力用のポート設定
    pinMode(DI1, INPUT);
    pinMode(DI2, INPUT);
    pinMode(DI3, INPUT);
    pinMode(DI4, INPUT);
    pinMode(DI5, INPUT);
    pinMode(DI6, INPUT);
    pinMode(DI7, INPUT);
    pinMode(DI8, INPUT);
    pinMode(DI9, INPUT);
    pinMode(DI10, INPUT);
    pinMode(DI11, INPUT);
    pinMode(DI12, INPUT);
    pinMode(DI13, INPUT);
    pinMode(DI14, INPUT);
    pinMode(DI15, INPUT);
    pinMode(DI16, INPUT);
    pinMode(DI17, INPUT);
    
    // UARTの初期化
    Serial.begin(115200);                     // ボーレートを115.2kbpsに設定
    
    // SPIの初期化
    SPI.begin() ;                             // SPIの初期化
    SPI.setBitOrder(MSBFIRST) ;               // ビットオーダーはMSBファースト
    SPI.setDataMode(SPI_MODE1) ;              // CLK極性 0(idle=LOW)　CLK位相 1(LOW > HIGH)
    // SPI.setClockDivider(SPI_CLOCK_DIV8) ;  // SPI通信クロック(CLK)は2MHz
    SPI.setClockDivider(SPI_CLOCK_DIV16) ;    // SPI通信クロック(CLK)は1MHz

    // Timer1割込の設定
    Timer1.initialize(sampling_time);         // サンプリングタイムを設定して初期化
    Timer1.attachInterrupt(flash);            // 割り込み関数の登録
    
    delay(100) ;                              // 0.1Sしたら開始
}

//================================================================================================//
// Timer Interrupt Funtion                                                                        //
//================================================================================================//
void flash() {
    int i;
    
    interrupts();         // 次回の割り込みを許可(これがないと次のタイマ割り込み周期がずれる)

    if(start_bit == 1){
        // MCP3208のCH0～8からアナログ値を読み込む
        for(i = 0; i<8; i++)  analog_data[i] = ADC_analogRead(MCP3208_CS0,i) ;
        for(i = 8; i<16; i++) analog_data[i] = ADC_analogRead(MCP3208_CS1,i) ;

        // I/Oポートからデジタル値を読み込む
        digital_data[0]  = digitalRead(DI0);
        digital_data[1]  = digitalRead(DI1);
        digital_data[2]  = digitalRead(DI2);
        digital_data[3]  = digitalRead(DI3);
        digital_data[4]  = digitalRead(DI4);
        digital_data[5]  = digitalRead(DI5);
        digital_data[6]  = digitalRead(DI6);
        digital_data[7]  = digitalRead(DI7);
        digital_data[8]  = digitalRead(DI8);
        digital_data[9]  = digitalRead(DI9);
        digital_data[10] = digitalRead(DI10);
        digital_data[11] = digitalRead(DI11);
        digital_data[12] = digitalRead(DI12);
        digital_data[13] = digitalRead(DI13);
        digital_data[14] = digitalRead(DI14);
        digital_data[15] = digitalRead(DI15);
        digital_data[16] = digitalRead(DI16);
        digital_data[17] = digitalRead(DI17);

        // 読み取りデータを送信
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

        // サンプルカウンタの更新
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

        // 条件分岐①：サンプリング開始
        if(a == 's'){
            n = 0;
            start_bit = 1;
            Serial.print('s');
            Timer1.start();
        }
        
        // 条件分岐②：サンプリング停止
        else if(a == 't'){
            start_bit = 0;                      // 割り込み時の処理なし
            Timer1.stop();                      // Timer1停止
            Serial.print('t');                 // エコーバック
        }

        // 条件分岐③：サンプリングタイム変更(10ms)
        else if(a == 'd'){
            start_bit = 0;                      // 割り込み時の処理なし
            sampling_time = 9999;               // サンプリングタイム10ms
            Timer1.stop();                      // 条件変更のためTimer1割込一時停止
            Timer1.setPeriod(sampling_time);   // Timer1割込の設定
            Serial.print('d');                 // エコーバック
        }
        
        // 条件分岐④：サンプリングタイム変更(100ms)
        else if(a == 'h'){
            start_bit = 0;                      // 割り込み時の処理なし
            sampling_time = 99999;              // サンプリングタイム100ms
            Timer1.stop();                      // 条件変更のためTimer1割込一時停止
            Timer1.setPeriod(sampling_time);   // Timer1割込の設定
            Serial.print('h');                 // エコーバック
        }
        
        // 条件分岐⑤：サンプリングタイム変更(1,000ms)
        else if(a == 'k'){
            start_bit = 0;                      // 割り込み時の処理なし
            sampling_time = 999999;             // サンプリングタイム1000ms
            Timer1.stop();                      // 条件変更のためTimer1割込一時停止
            Timer1.setPeriod(sampling_time);   // Timer1割込の設定
            Serial.print('k');                 // エコーバック
        }
        
        // 条件分岐⑥：サンプリングタイム変更(10,000ms)
        else if(a == 'j'){
            start_bit = 0;                      // 割り込み時の処理なし
            sampling_time = 9999999;            // サンプリングタイム10,000ms
            Timer1.stop();                      // 条件変更のためTimer1割込一時停止
            Timer1.setPeriod(sampling_time);   // Timer1割込の設定
            Serial.print('j');                 // エコーバック
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
