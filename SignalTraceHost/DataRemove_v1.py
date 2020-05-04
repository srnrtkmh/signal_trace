#!/usr/bin/env python
# coding: cp932
#==================================================================================================#
#                                                                                                  #
# FILE : DataRemove_v1.py                                                                          #
# Memo : 16/07/18 wxPython03.pyをベースに作成開始                                                  #
#                                                                                                  #
# Updated     : 2016/09/17 新規作成開始、古いフォルダを探索するロジックはほぼ完成                  #
# LastUpdated : 2016/09/17 新規作成開始、古いフォルダを探索するロジックはほぼ完成                  #
#                                                                       (C) 2016 Kyohei Umemoto    #
# How to execute :                                                                                 #
#     python DataRemove_v1.py                                                                      #
#         or                                                                                       #
#     nohup python DataRemove_v1.py &                                                              #
#                                                                                                  #
# How to end                                                                                       #
#     kill -INT [PID]                                                                              #
#     * PID is written DataRemove_PID.txt                                                          #
#                                                                                                  #
#==================================================================================================#

#==================================================================================================#
# Import Module                                                                                    #
#==================================================================================================#
import sys				# sys(exit()の使用, 引数取得のために必要)
import os				# OS(ファイルの各種処理のために必要)
import time				# 時刻取得用モジュール(一定時間スリープにも必要)
import datetime			# datetimeモジュール
import shutil			# ディレクトリが空でなくても削除するために使うモジュール
import pwd				# ユーザーID取得用モジュール
import signal			# シグナル受信に使用するモジュール

#==================================================================================================#
# Global variables                                                                                 #
#==================================================================================================#
# フォルダ・ファイル設定
parentPath = "/home/pi/Desktop/share/"		# 親ディレクトリの設定
dataPath = "/home/pi/Desktop/share/data/"	# データ用ディレクトリの設定
preffix = "DataRemove_"						# ファイル名プレフィックス
suffix = ""									# ファイル名サフィックス
path = "/"

# シグナル受信処理用変数
pid = 0
pid_file = []

# 確保しておきたい空き領域設定
needed_avail = 10000000000

#==================================================================================================#
# Signal Receive Function                                                                          #
#==================================================================================================#
def receive_signal(signum, stack):
	print "Received signal :", signum
	currentDate = datetime.datetime.today()	# today()メソッドで現在日付・時刻のdatetime型データの変数を取得
	log_file.write(str(currentDate) + " : Received signal " + str(signum) + ". End this process/\n")
	log_file.close()
	pid_file.close()
	sys.exit(0)

#==================================================================================================#
# 指定パス内のディレクトリリストを取得する関数                                                     #
#==================================================================================================#
def getdirs(path):
	dirs=[]
	for item in os.listdir(path):
		if os.path.isdir(os.path.join(path, item)):
			dirs.append(item)
	return dirs

#==================================================================================================#
# Main Function                                                                                    #
#==================================================================================================#
if __name__ == '__main__':
	# シグナルハンドル関係の設定
	pid = os.getpid()																# 実行プロセスのPIDを取得
	pid_file_name = unicode(parentPath + preffix + "PID.txt", encoding='shift-jis')	# PID表示用のファイル名を設定
	pid_file = open(pid_file_name, 'w')												# PID表示用ファイルを新規作成
	pid_file.write(str(pid))														# PID表示用ファイルにPID書き込み
	pid_file.flush()																# PID表示用ファイルへの書き込み反映
	signal.signal(signal.SIGINT, receive_signal)									# SIGINTを受け取ったら指定関数を呼び出すように設定
	
	# ログファイルを開く
	user_id = pwd.getpwnam('pi')								# ユーザー"pi"のUID、GIDを取得
	currentDate = datetime.datetime.today()						# today()メソッドで現在日付・時刻のdatetime型データの変数を取得
	log_file_name = unicode(parentPath + preffix + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + suffix + ".log", encoding='shift-jis')	# ログファイル名の設定
	log_file = open(log_file_name, 'w')							# ログファイルを新規作成
	log_file.close												# ユーザーIDを変更するためにいったん閉じる
	os.chown(log_file_name, user_id.pw_uid, user_id.pw_gid)		# ユーザーIDを"pi"に変更
	os.chmod(log_file_name, 0777)								# 権限変更"-rwxrwxrwx
	log_file = open(log_file_name, 'w')							# 再度開く
	log_file.write(str(currentDate) + " : Started DataRemove." + "\n")
	
	
	# 周期処理開始
	try:
		while True:
			# 容量が規定未満であれば古いディレクトリの削除を試行
			st = os.statvfs(path)	# 容量を確認するためのオブジェクトを取得
			if st.f_frsize * st.f_bavail < needed_avail:
				# 空き容量が規定を上回った旨のログを残す
				currentDate = datetime.datetime.today()
				log_file.write(str(currentDate) + " : Available size = " + str(st.f_frsize * st.f_bavail) + ". Trying to delete old data." + "\n")
				
				# データディレクトリの中から一番古い日付ディレクトリを探し当てる処理
				# まずは古い月ディレクトリを探索
				dirOldestMonth = ""
				oldest_year = 9999
				oldest_month = 99
				dirListMonth = getdirs(dataPath)
				for item in dirListMonth:
					# 年月ディレクトリの年・月を取得
					tmp_year  = int(item[0:4])
					tmp_month = int(item[5:7])
					
					# 年月ディレクトリ内のディレクトリ数をカウント
					dirListDay = getdirs(dataPath + item + "/")
					file_cnt = 0
					for file in dirListDay:
						file_cnt +=1
					
					# 対象年月ディレクトリ内が空であれば削除、空でなければ探索対象として処理
					if file_cnt == 0:
						shutil.rmtree(dataPath + item + "/")					# 空の年月ディレクトリは削除する
						log_file.write(str(currentDate) + " : Removed Directory because of no files: " + dataPath + item + "/" + "\n")
					else:
						if oldest_year >= tmp_year and oldest_month >= tmp_month:
							oldest_year  = tmp_year
							oldest_month = tmp_month
							dirOldestMonth = dataPath + item + "/"
					# print "year : " + str(tmp_year) + " month : " + str(tmp_month)
				
				currentDate = datetime.datetime.today()
				log_file.write(str(currentDate) + " : Oldest month : " + dirOldestMonth + "\n")
				
				# 古い月ディレクトリが見つかったらその中の古い日付ディレクトリを探索
				if dirOldestMonth != "":
					dirOldestDay = ""
					oldest_day = 99
					dirListDay = getdirs(dirOldestMonth)
					for item in dirListDay:
						tmp_day = int(item[0:2])
						if oldest_day >= tmp_day:
							oldest_day = tmp_day
							dirOldestDay = dirOldestMonth + item + "/"
						# print "day : " + str(tmp_day)
				
				currentDate = datetime.datetime.today()
				log_file.write(str(currentDate) + " : Oldest directory : " + dirOldestDay + "\n")
				
				shutil.rmtree(dirOldestDay)					# 一番古かった日付フォルダを削除
				currentDate = datetime.datetime.today()
				log_file.write(str(currentDate) + " : Removed Directory : " + dirOldestDay + "\n")
			else:
				currentDate = datetime.datetime.today()
				log_file.write(str(currentDate) + " : Available size : " + str(st.f_frsize * st.f_bavail) + ". Not need to delete data" + "\n")
			
			log_file.flush()			# ログファイルへの書き込みを反映
			time.sleep(3600)				# 1時間スリープ
			
	except KeyboardInterrupt:
		sys.exit()
