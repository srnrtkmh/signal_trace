#!/usr/bin/env python
# coding: cp932
####################################################################################################
#                                                                                                  #
# FILE : SignalTraceHost_v1.py                                                                     #
# Updated     : 2016/07/18                                                                         #
#             : 2016/07/31 Signal Trace Interface v2 に切り替えて作成中                                     #
#             : 2016/07/18 ...                                                                     #
# LastUpdated : 2016/08/02 些細な改造(シリアルポートデバイス文字列を変数化したり)                                #
#                                                                       (C) 2016 Kyohei Umemoto    #
#                                                                                                  #
# Memo :                                                                                           #
#   16/07/18 wxPython03.pyをベースに作成開始                                                        #
#                                                                                                  #
# How to execute :                                                                                 #
#     nohup sudo python SignalTraceHost_v1.py &                                                    #
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
####################################################################################################

####################################################################################################
# Import Module                                                                                    #
####################################################################################################
import sys				# sys(!)
import os				# OS(!)
import locale			# local(!)
import datetime			# datetimeモジュール
import time				# 時刻取得用モジュール
import pwd				# ユーザーID取得用モジュール
import threading		# マルチスレッドプログラミング用モジュール
from math import *		# 算術演算用モジュール
import wx				# GUIプログラミング用モジュール
import serial			# Arduinoとの通信で使用するシリアル通信用モジュール
import run				# wxPythonのウィンドウ表示のために使用(wxPythonのサンプルより)

####################################################################################################
# Global variables                                                                                 #
####################################################################################################
time_resolution = 100000		# 時間分解能[us]、25000us時は抜け多数あり、50000us時も少々抜けあり、100000us時もぬけがあるな．．．
data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
before_data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
volts = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
before_volts = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
di_data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
before_di_data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

# SignalTraceInterface用変数
f = []
file_name = ""
file_header = "日時,N,A0,A1,A2,A3,A4,A5,A6,A7,D0,D1,D2,D3,D4,D5,D6,D7,N\n"
suffix = ""
preffix = "test1_"
serialDeviceName = "/dev/ttyACM0"
baudrate = 115200

data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
volts = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
di_data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
start_bit = 0
start_stop_pulse = 0
before_nokori = ""
one_hour_cnt = 0


# グラフ描画用の変数
t = 0.0
dt = 1.0
canvas_size_x = 800
canvas_size_y = 400
graph_area_x = 580
graph_area_y = 380
offset = 10
char_size = 16

lines = []
back_scale_x = []
back_scale_y = []

enable_graph_num = 0
data_max = [0 for i in range(16)]
data_min = [0 for i in range(16)]
disp_max = [0 for i in range(16)]
disp_min = [0 for i in range(16)]

raw_data_x = []
raw_data_y = []
plot_data_x = [[0 for i in range(291)] for j in range(16)]
plot_data_y = [[0 for i in range(291)] for j in range(16)]
graph_offset = [0 for i in range(16)]

####################################################################################################
# Thread for receive data from Signal Trace Interface                                              #
####################################################################################################
class TestThread(threading.Thread):
	"""docstring for TestThread"""
	
	def __init__(self, n, t):
		global start_bit, start_stop_pulse
		super(TestThread, self).__init__()
		self.n = n
		self.t = t
	
	def run(self):
		global f
		global data, volts, di_data
		global plot_data_y
		global start_bit, start_stop_pulse
		global before_nokori
		global one_hour_cnt
		
		print " === start sub thread (sub class) === "
		
		parentPath = "/home/pi/Desktop/share/"	# 親ディレクトリの設定
		currentDate = datetime.datetime.today()	# today()メソッドで現在日付・時刻のdatetime型データの変数を取得
		user_id = pwd.getpwnam('pi')			# ユーザー"pi"のUID、GIDを取得
		
		# ログファイルを開く
		log_file = open(unicode(parentPath + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + ".log", encoding='shift-jis'), 'w')
		log_file.close																											# ユーザーIDを変更するためにいったん閉じる
		os.chown(unicode(parentPath + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + ".log"), user_id.pw_uid, user_id.pw_gid)	# ユーザーIDを"pi"に変更
		os.chmod(unicode(parentPath + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + ".log"), 0777)							# 権限変更"-rwxrwxrwx
		log_file = open(unicode(parentPath + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + ".log", encoding='shift-jis'), 'w')		# 再度開く
		log_file.write(str(currentDate) + " : Started Signal Trace." + "\n")
		
		# シリアル通信ポートをセットアップ
		con = serial.Serial(serialDeviceName, baudrate, timeout=0.2, rtscts=True, dsrdtr=True)
		print con.portstr
		log_file.write(str(currentDate) + " : Serial port opened successfully. Port name = " + con.portstr + "\n")
		
		# 実行開始直後のディレクトリ設定
		currentDate = datetime.datetime.today()	# today()メソッドで現在日付・時刻のdatetime型データの変数を取得
		monthPath = currentDate.strftime(parentPath + '%Y_%m/')
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
		file_name = unicode(dayPath + preffix + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + suffix + ".csv", encoding='shift-jis')
		f = open(file_name, 'w')							# ファイルを作成
		f.close												# ユーザーIDを変更するためにいったん閉じる
		os.chown(file_name, user_id.pw_uid, user_id.pw_gid)	# ユーザーIDを"pi"に変更
		os.chmod(file_name, 0777)							# 権限変更"-rwxrwxrwx
		f = open(file_name, 'w')							# 再度開く
		f.write(file_header)
		log_file.write(str(currentDate) + " : New file opened successfully. File name = " + file_name + "\n")
		
		# 日付・時間の初期値
		currentDate = datetime.datetime.today()
		currentHour = currentDate.hour
		beforeHour = currentHour
		currentDay = currentDate.day
		beforeDay = currentDay
		
		try:
			while True:
				if start_bit == 1:
					# 最初に1回だけスタートコマンドを送信
					if start_stop_pulse == 1:
						con.write("s")
						start_stop_pulse = 0
						print "=== send start cmd s ==="
					
					# 現在の日時を取得
					currentDate = datetime.datetime.today()
					
					# 日付が変化したらディレクトリを切り替える
					currentDay = currentDate.day
					if currentDay != beforeDay:
						monthPath = currentDate.strftime(parentPath + '%Y_%m/')
						if os.path.exists(monthPath) == False:
							os.mkdir(monthPath)
							os.chown(monthPath, user_id.pw_uid, user_id.pw_gid)	# ユーザーIDを"pi"に変更
							os.chmod(monthPath, 0777)							# 権限変更"-rwxrwxrwx
							log_file.write(str(currentDate) + " : New directory generated. Directory name = " + monthPath + "\n")
						dayPath = currentDate.strftime(monthPath + '%d/')
						if os.path.exists(dayPath) == False:
							os.mkdir(dayPath)
							os.chown(dayPath, user_id.pw_uid, user_id.pw_gid)	# ユーザーIDを"pi"に変更
							os.chmod(dayPath, 0777)								# 権限変更"-rwxrwxrwx
							log_file.write(str(currentDate) + " : New directory generated. Directory name = " + dayPath + "\n")
					beforeDay = currentDay
					
					# 時間が変化したらファイルを閉じて新しいファイルに切り替える
					currentHour = currentDate.hour
					if currentHour != beforeHour:
						f.close()
						f = open(unicode(dayPath + preffix + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + suffix + ".csv", encoding='shift-jis'), 'w')	# ファイルを作成
						f.close																															# ユーザーIDを変更するためにいったん閉じる
						os.chown(unicode(dayPath + preffix + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + suffix + ".csv"), user_id.pw_uid, user_id.pw_gid)	# ユーザーIDを"pi"に変更
						os.chmod(unicode(dayPath + preffix + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + suffix + ".csv"), 0777)							# 権限変更"-rwxrwxrwx
						f = open(unicode(dayPath + preffix + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + suffix + ".csv", encoding='shift-jis'), 'w')	# 再度開く
						f.write("日時,N,A0,A1,A2,A3,A4,A5,A6,A7,D0,D1,D2,D3,D4,D5,D6,D7,N\n")
						log_file.write(str(currentDate) + " : " + str(one_hour_cnt) + " sampled previous 1 hour. ")
						log_file.write(" New file opened successfully. File name = " + unicode(dayPath + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + ".csv") + "\n")
						one_hour_cnt = 0
					beforeHour = currentHour
					
					# 読み取りデータをファイルに書き込み
					tmp_str = con.read(con.inWaiting())
					# f.write(tmp_str)
					tmp_list = []
					tmp_list = (before_nokori + tmp_str).split('\n')
					if len(tmp_list) >= 2:
						for i in range(0, len(tmp_list) - 1):
							f.write(currentDate.strftime("%Y/%m/%d %H:%M:%S") + ".%03d" % (currentDate.microsecond // 1000) + ',' + tmp_list[i] + '\n')
							one_hour_cnt = one_hour_cnt + 1
							# tmp_value_list = tmp_list[i].split(",")
							# for j in range(0, len(tmp_value_list).len - 1):
								# data[j] = int(tmp_value_list[j])
								# print str(data[j]) + ", "
							# print tmp_list[i]
					before_nokori = tmp_list[len(tmp_list) - 1]
					
					# if len(tmp_list) >= 2:
						# for i in range(0, len(tmp_list) - 1):
							# log_file.write(tmp_list[i] + '\n')
					
					# 描画用データ配列を1つずつずらす
					for i in range(4):
						for j in range(290):
							plot_data_y[i][j] = plot_data_y[i][j+1]
						
					# 新しいデータを代入
					for i in range(4):
						# plot_data_y[i][290] = 30 * sin(t/10.0)
						plot_data_y[i][290] = (volts[0] - 1.65)*100
					
					# ログファイルへの書き込みを反映
					log_file.flush()
					
					# 一定時間スリープ
					time.sleep(0.1)
				else:
					# 終わったらストップコマンドを送信する
					if start_stop_pulse == 1:
						con.write("t")
						start_stop_pulse = 0
						print "=== send stop cmd t ==="
					# 一定時間スリープ
					time.sleep(0.1)
				
		except KeyboardInterrupt:
			f.close()
			spi1.close()
			spi2.close()
			GPIO.cleanup()
			sys.exit(0)
		
		print " === end sub thread (sub class) === "

####################################################################################################
# ウィンドウ表示用クラス                                                                                  #
####################################################################################################
class TestPanel(wx.Panel):
	def __init__(self, parent, log):
		wx.Panel.__init__(self, parent, -1, style=wx.NO_FULL_REPAINT_ON_RESIZE)
		self.log = log

		b = wx.Button(self, 10, "Default Button", (20, 20))
		self.Bind(wx.EVT_BUTTON, self.OnClick, b)
		b.SetDefault()
		b.SetSize(b.GetBestSize())

		b = wx.Button(self, 20, "HELLO AGAIN!", (20, 80)) ##, (120, 45))
		self.Bind(wx.EVT_BUTTON, self.OnClick, b)
		b.SetToolTipString("This is a Hello button...")

		b = wx.Button(self, 40, "Flat Button?", (20,150), style=wx.NO_BORDER)
		b.SetToolTipString("This button has a style flag of wx.NO_BORDER.\nOn some platforms that will give it a flattened look.")
		self.Bind(wx.EVT_BUTTON, self.OnClick, b)

	def OnClick(self, event):
		global start_bit, start_stop_pulse
		global data
		global before_nokori
		
		if start_bit == 0:
			start_bit = 1
			start_stop_pulse = 1
			data[0] = 100
		else:
			start_bit = 0
			start_stop_pulse = 1
			data[0] = 200
			
		self.log.write("Click! (%d)" % event.GetId() + " start_bit = " + str(start_bit)



		+ "\n")

####################################################################################################
# Run Test                                                                                         #
####################################################################################################
def runTest(frame, nb, log):
	# GPIO制御用のスレッド作成
	th_cl = TestThread(5, 5)
	th_cl.setDaemon(True)
	th_cl.start()
	
	win = TestPanel(nb, log)
	return win
	
####################################################################################################
# Main Function                                                                                    #
####################################################################################################
if __name__ == '__main__':
	# ウィンドウを準備
	
	# 変数の初期化
	for i in range(16):
		data_max[i] = 100
		data_min[i] = -100
		disp_max[i] = 58
		disp_min[i] = -58
	
	for i in range(16):
		for j in range(291):
			plot_data_x[i][j] = graph_area_x/290 * j
	
	# キャンバスエリアの設定
	# アナログチャンネル選択用チェックボックスの定義
	# デジタルチャンネル選択用チェックボックスの定義
	
	# 初期表示チャンネルの設定
	enable_graph_num = 1
	
	# チャート操作用のボタンの定義
	# Future works
	
	# バインディング
	# app = wx.PySimpleApp()
	# frame = myFrame(None)
	
	# panel = wx.Panel(frame, wx.ID_ANY)
	# panel.SetBackgroundColour("#AFAFAF")
	# button1 = wx.Button(panel, wx.ID_ANY, u"Button1")
	
	# layout = wx.BoxSizer(wx.VERTICAL)
	# layout.Add(button1)
	# panel.SetSizer(layout)
	
	# frame.Show(True)
	# app.MainLoop()
	
	run.main(['', os.path.basename(sys.argv[0])] + sys.argv[1:])
