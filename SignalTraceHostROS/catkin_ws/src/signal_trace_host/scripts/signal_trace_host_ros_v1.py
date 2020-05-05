#!/usr/bin/env python
# coding: UTF-8
#==================================================================================================#
#                                                                                                  #
# FILE : SignalTraceHostCUI_v2.py                                                                  #
# Memo : 16/07/18 wxPython03.pyをベースに作成開始                                                  #
#                                                                                                  #
# Updated     : 2016/07/18                                                                         #
#             : 2016/07/31 Signal Trace Interface v2 に切り替えて作成中                            #
#             : 2016/07/18 ...                                                                     #
#             : 2016/08/02 些細な改造(シリアルポートデバイス文字列を変数化したり)                  #
#             : 2016/08/07 CUIバージョン作成開始                                                   #
#             : 2016/08/07 デバイス指定の機構・通信開始時のエコーバック確認処理                    #
#                          読み取り値の妥当性確認処理・各種エラー処理などを追加                    #
#             : 2016/08/14 チャンネル数を設定できるように引数処理追加                              #
#             : 2016/09/18 容量が逼迫してきたら古いファイルを削除するロジックを追加しようと        #
#                          別プログラムにすることにした                                            #
#             : 2016/09/18 サンプリングタイム間隔に時刻を割り当てる変更を試みる ⇒ とりあえずOK    #
#                          サンプルタイムとpython定周期実行開始時刻の差分を逐次修正する処理を      #
#                          追加して経過観察中、10ms間隔対応をどうするかな．．．                    #
#             : 2016/09/19 ログファイルを月毎に切り替える処理を追加                                #
#             : 2016/10/01 csvファイルを切り替える基準時間をcurrentDateからdateCurrentSampleに変更 #
#             : 2019/12/21 再開発スタート                                                          #
#             : 2019/12/29 csvファイルのデータラベルを外部ファイルから読み込むように変更           #
#             : 2019/12/29 SignalTraaceNode_THBCに対応するようなソースコードを追加中               #
#             : 2019/12/30 SignalTraaceNode_THBC, SignalTraceNode_THBに対応するように修正しようと  #
#                          思ったがサンプル数を指定するだけで特別にコードを用意する必要はなし      #
#                          データファイル名へのシリアルデバイス名の入れ方をプレフィックスではなく  #
#                          サフィックスとするように変更                                            #
#                          Arduino Nanoではシリアルポートの開き方を別途用意しなければならくなった  #
#                          ため、Arduino MicroとArduino Nanoを実行時の引数で指定するように変更     #
#             : 2020/05/02 ROS化を試行                                                             #
# LastUpdated : 2020/05/03 ROS化できたものの1時間ごとにファイルが区切られない不具合が発生          #
#                          global変数の記述の仕方に誤りがあり、dtをglobalにして解決                #
#                                                                                                  #
#                                                                       (C) 2020 Kyohei Umemoto    #
# How to execute :                                                                                 #
#     python SignalTraceHostCUI_v2.py [Serial device name] [Label file]                            #
#                                        [Number of channels] [Sampling time(us)] [Arduino number] #
#         or                                                                                       #
#     nohup python SignalTraceHostCUI_v2.py [Serial device name] [Label file]                      #
#                      [Number of channels] [Sampling time(us)] [Arduino number] > [tty????.txt] & #
#                                                                                                  #
# Argument Discription :                                                                           #
#     Serial device name : 接続するシリアルデバイス名(絶対パス) 例:"/dev/ttyACM0", "/dev/ttyUSB1"  #
#     Label file         : データファイルのラベルとして使用するファイル名(相対パス)                #
#     Number of channels : シリアルデバイスから送付されてくるデータ項目数                          #
#     Sampling time(us)  : シリアルデバイスから送付されてくるデータのサンプリングタイム[us]        #
#     Arduino number     : 使用するarduinoに合わせた数値　例 : Arduino Micro : 0, Arduino nano : 1 #
#                                                                                                  #
# How to end                                                                                       #
#     kill -INT [PID]                                                                              #
#     * PID is written [Devicename]_PID.txt                                                        #
#                                                                                                  #
# I/O assign :                                                                                     #
# 01 : 3.3V                                       02 : 5.0V                                        #
# 03 : NC                                         04 : 5.0V                                        #
# 05 : NC                                         06 : GND                                         #
# 07 : NC                                         08 : NC                                          #
# 09 : NC                                         10 : NC                                          #
# 11 : NC                                         12 : NC                                          #
# 13 : NC                                         14 : NC                                          #
# 15 : NC                                         16 : NC                                          #
# 17 : NC                                         18 : NC                                          #
# 19 : NC                                         20 : NC                                          #
# 21 : NC                                         22 : NC                                          #
# 23 : NC                                         24 : NC                                          #
# 25 : GND                                        26 : NC                                          #
#                                                                                                  #
#==================================================================================================#

#==================================================================================================#
# Import Module                                                                                    #
#==================================================================================================#
import sys				# sys(exit()の使用, 引数取得のために必要)
import os				# OS(ファイルの各種処理のために必要)
import locale			# local(!)
import datetime			# datetimeモジュール
import time				# 時刻取得用モジュール
import pwd				# ユーザーID取得用モジュール
import threading		# マルチスレッドプログラミング用モジュール
from math import *		# 算術演算用モジュール
import serial			# Arduinoとの通信で使用するシリアル通信用モジュール
import signal			# シグナル受信に使用するモジュール
import shutil			# ディレクトリが空でなくても削除するために使うモジュール

import rospy
from std_msgs.msg import String

#==================================================================================================#
# Global variables                                                                                 #
#==================================================================================================#
global serialDeviceName
global labelFileName
global ioChNum
global dt
global arduinoNum
global data_file
global pid_file

#==================================================================================================#
# Signal Receive Function                                                                          #
#==================================================================================================#
def receive_signal(signum, stack):
	global data_file
	global log_file
	global pid_file
	
	print "Received signal :", signum
	currentDate = datetime.datetime.today()	# today()メソッドで現在日付・時刻のdatetime型データの変数を取得
	log_file.write(str(currentDate) + " : Received signal " + str(signum) + ". End this process/\n")
	con.write("t")
	data_file.close()
	log_file.close()
	pid_file.close()
	sys.exit(0)

#==================================================================================================#
# signal_trace_init Function                                                                       #
#==================================================================================================#
def signal_trace_init():
	print "Future works..."

#==================================================================================================#
# signal_trace_host Function                                                                       #
#==================================================================================================#
def signal_trace_host():
	global serialDeviceName
	global labelFileName
	global ioChNum
	global dt
	global arduinoNum
	
	global con
	global log_file
	global currentDate
	global dateCurrentSample
	global data_file
	global pid_file
	
	# SignalTraceInterface用変数
	data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	before_data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	volts = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
	before_volts = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
	di_data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	before_di_data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	
	global serialDeviceName						# シリアルデバイスの設定
	serialChNum = 32							# I/Oチャンネル数の設定
	baudrate = 115200							# ボーレート設定
	parentPath = "/home/pi/Desktop/Share/"		# 親ディレクトリの設定
	dataPath = "/home/pi/Desktop/Share/Data/"	# データ用ディレクトリの設定
	global labelFileName						# ラベルファイル名の設定
	data_file = []										# CSV出力用ファイルオブジェクト
	strCsvName = ""								# ファイル名用変数
	file_header = ""							# CSVファイルのヘッダー
	preffix = ""								# ファイル名プレフィックス
	suffix = ""									# ファイル名サフィックス
	
	before_nokori = ""
	one_hour_cnt = 0
	global dt							# サンプリングタイムの設定(デフォルトは100ms、引数にて設定するので実質無効)
	plus_cnt = 0						# サンプルタイムと定周期実行時間の差がプラス方向にオーバーしている回数を数えるカウンタ
	minus_cnt = 0						# サンプルタイムと定周期実行時間の差がマイナス方向にオーバーしている回数を数えるカウンタ
	
	dateCurrentMonth = 0				# 月毎にログファイルを切り替えるための変数
	dateBeforeMonth = 0					# 月毎にログファイルを切り替えるための変数
	
	current_sample_number1 = 999		# 最初の1レコード目はサンプルナンバー"0"が来るはずなので初期今回値は"999"
	current_sample_number2 = 999		# 最初の1レコード目はサンプルナンバー"0"が来るはずなので初期今回値は"999"
	before_sample_number1 = 999			# どうせ書き換えられてしまうので初期値は適当
	before_sample_number2 = 999			# どうせ書き換えられてしまうので初期値は適当
	
	# シグナル受信処理用変数
	pid = 0
	pid_file = []
	
	# 初期設定
	currentDate = datetime.datetime.today()	# today()メソッドで現在日付・時刻のdatetime型データの変数を取得
	user_id = pwd.getpwnam('pi')			# ユーザー"pi"のUID、GIDを取得
	preffix = ""							# csvファイル、logファイルのプレフィックスをデバイス名にて設定
	suffix = "_" + param[1][5:12]			# csvファイル、logファイルのサフィックスをデバイス名にて設定
	pid = os.getpid()						# 実行プロセスのPIDを取得
	
	# csvファイルのラベルを読み込み
	label_file = open(os.path.dirname(__file__) + "/" + labelFileName, "r")
	label_list = label_file.readlines()
	file_header = label_list[0].replace("\n", "") + "\n"
	
	# dataPathが存在しなければ作成
	if not os.path.exists(dataPath):
		os.mkdir(dataPath)									# ディレクトリを作成
		os.chown(dataPath, user_id.pw_uid, user_id.pw_gid)	# ユーザーIDを"pi"に変更
		os.chmod(dataPath, 0777)							# 権限変更"-rwxrwxrwx
	
	# シグナルハンドル関係の設定
	pid_file_name = unicode(parentPath + preffix + "PID" + suffix + ".txt", encoding='shift-jis')	# PID表示用のファイル名を設定
	pid_file = open(pid_file_name, 'w')																# PID表示用ファイルを新規作成
	pid_file.write(str(pid))																		# PID表示用ファイルにPID書き込み
	pid_file.flush()																				# PID表示用ファイルへの書き込み反映
	signal.signal(signal.SIGINT, receive_signal)													# SIGINTを受け取ったら指定関数を呼び出すように設定
	
	# ログファイルを開く
	# log_file_name = unicode(parentPath + preffix + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + suffix + ".log", encoding='shift-jis')
	log_file_name = unicode(os.path.dirname(__file__) + "/" + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + suffix + ".log", encoding='shift-jis')
	log_file = open(log_file_name, 'w')							# ログファイルを新規作成
	log_file.close												# ユーザーIDを変更するためにいったん閉じる
	os.chown(log_file_name, user_id.pw_uid, user_id.pw_gid)		# ユーザーIDを"pi"に変更
	os.chmod(log_file_name, 0777)								# 権限変更"-rwxrwxrwx
	log_file = open(log_file_name, 'w')							# 再度開く
	log_file.write(str(currentDate) + " : Started Signal Trace." + "\n")
	
	# シリアル通信ポートをセットアップ
	try:
		if arduinoNum == 0:
			con = serial.Serial(serialDeviceName, baudrate, timeout=0.2, rtscts=True, dsrdtr=True)	# ポートのオープン(timeoutの設定は適当、rtsctsとdsrdtrはTrueにしておかないとArduinoMicroとは通信できない)
		elif arduinoNum == 1:
			con = serial.Serial(serialDeviceName, baudrate, timeout=0.2, rtscts=False, dsrdtr=False)	# ポートのオープン(timeoutの設定は適当、rtsctsとdsrdtrはFalseにしておかないとArduinoNanoとは通信できない)
		else:
			log_file.write(str(currentDate) + " : arduino number is incorrect. arduinoNum = " + arduinoNum + "\n")
			log_file.write(str(currentDate) + " : arduino number should be 0 (Arduino Micro) or 1 (Arduino Nano)\n")
		time.sleep(1.0)
	except serial.SerialException as e:
		print "SerialException : " + str(e)
		sys.exit(1)
	# print con.portstr						# ポートネームの確認
	tmp_str = con.read(con.inWaiting())		# 読み取りバッファを空にしておく
	log_file.write(str(currentDate) + " : Serial port opened successfully. Port name = " + con.portstr + "\n")
	
	# 実行開始直後のディレクトリ設定
	currentDate = datetime.datetime.today()	# today()メソッドで現在日付・時刻のdatetime型データの変数を取得
	monthPath = currentDate.strftime(dataPath + '%Y_%m/')
	if os.path.exists(monthPath) == False:
		os.mkdir(monthPath)
		os.chown(monthPath, user_id.pw_uid, user_id.pw_gid)	# ユーザーIDを"pi"に変更
		os.chmod(monthPath, 0777)							# 権限変更"-rwxrwxrwx
	dayPath = currentDate.strftime(monthPath + '%d/')
	if os.path.exists(dayPath) == False:
		os.mkdir(dayPath)
		os.chown(dayPath, user_id.pw_uid, user_id.pw_gid)	# ユーザーIDを"pi"に変更
		os.chmod(dayPath, 0777)							# 権限変更"-rwxrwxrwx
	
	# 実行開始直後使用ファイルを開き、所有者を変更
	strCsvName = unicode(dayPath + preffix + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + suffix + ".csv", encoding='shift-jis')	# ファイル名の設定
	data_file = open(strCsvName, 'w')								# ファイルを作成
	data_file.close													# ユーザーIDを変更するためにいったん閉じる
	os.chown(strCsvName, user_id.pw_uid, user_id.pw_gid)	# ユーザーIDを"pi"に変更
	os.chmod(strCsvName, 0777)								# 権限変更"-rwxrwxrwx
	data_file = open(strCsvName, 'w')								# 再度開く
	data_file.write(file_header)									# ヘッダーを書き込む
	log_file.write(str(currentDate) + " : New file opened successfully. File name = " + strCsvName + "\n")
	
	# 日付・時間の初期値
	currentDate = datetime.datetime.today()
	currentHour = currentDate.hour
	beforeHour = currentHour
	currentDay = currentDate.day
	beforeDay = currentDay
	dateCurrentMonth = currentDate.month
	dateBeforeMonth = dateCurrentMonth
	
	# サンプルタイムの初期値設定
	dateCurrentSample = datetime.datetime.today()
	tmp_microsecond = dateCurrentSample.microsecond
	dateCurrentSample = dateCurrentSample.replace(microsecond = (tmp_microsecond / 100000) * 100000)
	dateCurrentSample = dateCurrentSample + datetime.timedelta(microseconds=100000)
	
	# 最初に1回だけスタートコマンドを送信
	tmp_str = con.read(con.inWaiting())		# 読み取りバッファを空にしておく(前に記述した1回だけだと空にならない時がある(?))
	con.write("s")							# スタートコマンドを送信(1回目)
	log_file.write(str(currentDate) + " : Start command transmitted (1st try).\n")			# スタートコマンドを送った旨ログ
	time.sleep(2.0)							# スタートコマンドのコールバックまで1秒間待ち
	tmp_str = con.read()					# スタートコマンドのコールバックを確認
	if tmp_str != "s":
		con.write("s")						# スタートコマンドを送信(2回目)
		log_file.write(str(currentDate) + " : Start command transmitted (2nd try).\n")		# スタートコマンドを送った旨ログ
		time.sleep(2.0)						# スタートコマンドのコールバックまで1秒間待ち
		tmp_str = con.read()				# スタートコマンドのコールバックを確認
		if tmp_str != "s":
			con.write("s")					# スタートコマンドを送信(3回目)
			log_file.write(str(currentDate) + " : Start command transmitted (3rd try).\n")	# スタートコマンドを送った旨ログ
			time.sleep(2.0)					# スタートコマンドのコールバックまで1秒間待ち
			tmp_str = con.read()			# スタートコマンドのコールバックを確認
			if tmp_str != "s":
				print "Serial Device did not transmit call back : " + tmp_str
				con.write("t")				# 念のためストップコマンドを送っておく
				sys.exit(1)
	log_file.write(str(currentDate) + " : Start command echo back received.\n")
	
	# パブリッシャー設定
	pub = rospy.Publisher('chatter', String, queue_size=10)
	rospy.init_node('signl_trace_host', anonymous=True)
	rate = rospy.Rate(1) # 1hz
	log_file.write(str(currentDate) + " : ROS Settings finished.\n")
	
	# 周期処理開始
	try:
		while not rospy.is_shutdown():
			# 現在の日時を取得
			currentDate = datetime.datetime.today()
			
			# 読み取りデータをファイルに書き込み
			tmp_str = con.read(con.inWaiting())
			tmp_list = []										# 配列の中身をクリアしておく(必要かどうかは明確ではない)
			tmp_list = (before_nokori + tmp_str).split('\n')	# 前回サンプル残りと今回サンプルをつなぎ合わせて改行で分割
			if len(tmp_list) >= 2:
				for i in range(0, len(tmp_list) - 1):
					# data_file.write(dateCurrentSample.strftime("%Y/%m/%d %H:%M:%S") + ".%03d" % (dateCurrentSample.microsecond // 1000) + ',' + tmp_list[i] + '\n')
					tmpDataRow = currentDate.strftime("%Y/%m/%d %H:%M:%S") + ".%03d" % (currentDate.microsecond // 1000) + ',' + dateCurrentSample.strftime("%Y/%m/%d %H:%M:%S") + ".%03d" % (dateCurrentSample.microsecond // 1000) + ',' + tmp_list[i] + '\n'
					data_file.write(tmpDataRow)
					dateCurrentSample = dateCurrentSample + datetime.timedelta(microseconds=dt)
					one_hour_cnt = one_hour_cnt + 1
					
					# サンプルナンバーの妥当性評価(1レコード中に先頭・尾端サンプルナンバーが一致かつ今回ナンバーは前回ナンバー+1をチェック)
					before_sample_number1 = current_sample_number1
					before_sample_number2 = current_sample_number2
					current_sample_number1 = int(data[0])
					current_sample_number2 = int(data[ioChNum + 1])
					if current_sample_number1 != current_sample_number2:
						log_file.write(str(currentDate) + " : Sample number error. num1 = " + str(current_sample_number1) + ", num2 = " + str(current_sample_number2) + "\n")
					
					if current_sample_number1 != 0:
						if current_sample_number1 != (before_sample_number1 + 1):
							log_file.write(str(currentDate) + " : Sample number error. cur_num = " + str(current_sample_number1) + ", bef_num = " + str(before_sample_number1) + "\n")
					elif before_sample_number1 != 999:
							log_file.write(str(currentDate) + " : Sample number error. cur_num = " + str(current_sample_number1) + ", bef_num = " + str(before_sample_number1) + "\n")
					
					# 個々のデータを取得
					tmp_value_list = tmp_list[i].split(",")
					if len(tmp_value_list) == ioChNum + 2:
						for j in range(0, len(tmp_value_list)):
							# data[j] = int(tmp_value_list[j])
							data[j] = tmp_value_list[j]
					else:
						log_file.write(str(currentDate) + " : " + "record bytes not invalid. len(tmp_value_list) = " + str(len(tmp_value_list)) + "\n")
					
					# 日付が変化したらディレクトリを切り替える
					currentDay = dateCurrentSample.day
					if currentDay != beforeDay:
						monthPath = dateCurrentSample.strftime(dataPath + '%Y_%m/')
						if os.path.exists(monthPath) == False:
							os.mkdir(monthPath)
							os.chown(monthPath, user_id.pw_uid, user_id.pw_gid)	# ユーザーIDを"pi"に変更
							os.chmod(monthPath, 0777)							# 権限変更"-rwxrwxrwx
							log_file.write(str(currentDate) + " : New directory generated. Directory name = " + monthPath + "\n")
						dayPath = dateCurrentSample.strftime(monthPath + '%d/')
						if os.path.exists(dayPath) == False:
							os.mkdir(dayPath)
							os.chown(dayPath, user_id.pw_uid, user_id.pw_gid)	# ユーザーIDを"pi"に変更
							os.chmod(dayPath, 0777)								# 権限変更"-rwxrwxrwx
							log_file.write(str(currentDate) + " : New directory generated. Directory name = " + dayPath + "\n")
					beforeDay = currentDay
					
					# 時間が変化したらファイルを閉じて新しいファイルに切り替える
					beforeHour = currentHour
					currentHour = dateCurrentSample.hour
					# print "beforeHour = " + str(beforeHour) + "  " + "currentHour = " + str(currentHour)
					if currentHour != beforeHour:
						data_file.close()												# 従来ファイルを閉じる
						strCsvName = unicode(dayPath + preffix + dateCurrentSample.strftime('%Y_%m_%d_%H_%M_%S') + suffix + ".csv", encoding='shift-jis')	# ファイル名の設定
						data_file = open(strCsvName, 'w')								# ファイルを作成
						data_file.close													# ユーザーIDを変更するためにいったん閉じる
						os.chown(strCsvName, user_id.pw_uid, user_id.pw_gid)	# ユーザーIDを"pi"に変更
						os.chmod(strCsvName, 0777)								# 権限変更"-rwxrwxrwx
						data_file = open(strCsvName, 'w')								# 再度開く
						data_file.write(file_header)									# ヘッダーを書き込む
						log_file.write(str(currentDate) + " : " + str(one_hour_cnt) + " sampled previous 1 hour. ")
						log_file.write(" New file opened successfully. File name = " + unicode(dayPath + dateCurrentSample.strftime('%Y_%m_%d_%H_%M_%S') + ".csv") + "\n")
						one_hour_cnt = 0
					
				# リアルタイム表示
				# print str(tmp_list[len(tmp_list) - 2]),
				# print "\r",
				
			before_nokori = tmp_list[len(tmp_list) - 1]
			
			# 現在のサンプルタイムと本周期実行開始時刻のずれを補正
			if (currentDate - dateCurrentSample).total_seconds() < -0.1:
				minus_cnt = minus_cnt + 1
				if minus_cnt >= 5:
					dateCurrentSample = dateCurrentSample - datetime.timedelta(microseconds=1000)
					minus_cnt = 0
					# print "datetime minus"
					# print (currentDate - dateCurrentSample).total_seconds()
			else:
				minus_cnt = 0
			
			if (currentDate - dateCurrentSample).total_seconds() > 0.1:
				plus_cnt = plus_cnt + 1
				if plus_cnt >= 5:
					dateCurrentSample = dateCurrentSample + datetime.timedelta(microseconds=1000)
					plus_cnt = 0
					# print "datetime plus"
					# print (currentDate - dateCurrentSample).total_seconds()
			else:
				plus_cnt = 0
			
			# 月が替わったらログファイルを別名に切り替える
			dateCurrentMonth = currentDate.month
			if dateCurrentMonth != dateBeforeMonth:
				log_file.close()
				log_file_name = unicode(parentPath + preffix + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + suffix + ".log", encoding='shift-jis')
				log_file = open(log_file_name, 'w')							# ログファイルを新規作成
				log_file.close												# ユーザーIDを変更するためにいったん閉じる
				os.chown(log_file_name, user_id.pw_uid, user_id.pw_gid)		# ユーザーIDを"pi"に変更
				os.chmod(log_file_name, 0777)								# 権限変更"-rwxrwxrwx
				log_file = open(log_file_name, 'w')							# 再度開く
				log_file.write(str(currentDate) + " : Log file changed." + "\n")
			dateBeforeMonth = dateCurrentMonth
			
			log_file.flush()			# ログファイルへの書き込みを反映
			beforeDate = currentDate	# 前回処理時刻を更新
			
			hello_str = tmpDataRow
			rospy.loginfo(hello_str)
			pub.publish(hello_str)
			
			rate.sleep()
	
	except KeyboardInterrupt:
		con.write("t")
		data_file.close()
		currentDate = datetime.datetime.today()										# 現在の日時を取得
		log_file.write(str(currentDate) + " : Exit by the keyboard input" + "\n")	# キーボード入力で閉じたことをログに記載
		log_file.close()
		sys.exit(0)

#==================================================================================================#
# Main Function                                                                                    #
#==================================================================================================#
if __name__ == '__main__':
	global serialDeviceName
	global labelFileName
	global ioChNum
	global dt
	global arduinoNum
	
	### Test Code ###
	# print sys.argv[0]
	
	# 引数処理
	param = sys.argv
	if len(param) >= 4:
		serialDeviceName = param[1]		# シリアルデバイスへのパス
		labelFileName = param[2]		# ラベルとして使用するcsvファイル
		ioChNum = int(param[3])			# 取得するデータの項目数
		dt = int(param[4])				# 取得するデータの周期
		arduinoNum = int(param[5]);		# 使用するArduino区分　0:Arduino Micro　1:Arduino Nano ※シリアルポートのセットアップに差異あり
	else:
		print "Invalid argument. Valid command : \"" + param[0] + " [Serial device name] [Label file] [Number of I/O channels] [Sampling time (microseconds)]\""
		sys.exit(1)
	
	# ROS用関数に移行
	try:
		signal_trace_host()
	except rospy.ROSInterruptException:
		pass
