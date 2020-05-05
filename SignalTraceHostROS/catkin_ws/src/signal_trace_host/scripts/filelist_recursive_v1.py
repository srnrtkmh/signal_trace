#!/usr/bin/env python
# coding: UTF-8
#==================================================================================================#
#                                                                                                  #
# FILE : filelist_recursive_v1.py                                                                  #
# Memo : 指定ディレクトリ以下のディレクトリにファイルリストを作成するスクリプト                    #
#                                                                                                  #
# Updated     : 指定ディレクトリ以下の各ディレクトリにファイル名を記載したファイルネームリストを   #
#               作成できるようにスクリプトを作成開始                                               #
#               概ね必要な機能は実装完了。7日より古いディレクトリは対象外とすることとした          #
#                                                                                                  #
#                                                                       (C) 2020 Kyohei Umemoto    #
# How to execute :                                                                                 #
#     python filelist_recursive_v1.py [directory name] [user name]                                 #
#                                                                                                  #
#==================================================================================================#

#==================================================================================================#
# Import Module                                                                                    #
#==================================================================================================#
import sys
import os				# OS(ファイルの各種処理のために必要)
import pwd				# ユーザーID取得用モジュール
import datetime			# datetimeモジュール


import glob				# 
import locale			# local(!)
from math import *		# 算術演算用モジュール
import signal			# シグナル受信に使用するモジュール

#==================================================================================================#
# Global variables                                                                                 #
#==================================================================================================#
file_list_filename = "file_list.txt"

#==================================================================================================#
# Generating file list function                                                                    #
# Argument     : dir_name - string to specify the target directory to generate file list           #
#                id  - User ID of the generated file                                               #
# Return value : The number of generated file lists                                                #
#==================================================================================================#
def file_list_gen(dir_name, id):
	# 対象ディレクトリのファイル名・ディレクトリ名を取得
	files = []
	directories = []
	for filename in os.listdir(dir_name):
		if os.path.isfile(os.path.join(dir_name, filename)):			# ファイルか、ディレクトリかで場合分け
			if filename != file_list_filename:							# ファイルリストのファイル名は記載しない
				files.append(filename)									# ファイル名を追加
		else:
			directories.append(filename)								# ディレクトリ名を追加
	
	# 対象ディレクトリにファイル名リストを作成
	date1 = datetime.datetime.fromtimestamp(os.stat(dir_name).st_mtime)
	date2 = datetime.datetime.now()
	dt = datetime.timedelta(days=7)	
	if date2 - date1 <= dt:												# 更新日時が7日より古いディレクトリは作成対象外
		if len(files) != 0:												# ファイルがないディレクトリは作成対象外
			target_file_name = dir_name + "file_list.txt"				# ファイルネームリストのファイル名は"file_list.txt"
			file = open(target_file_name, "w")							# ファイルを開く
			file.close													# ユーザーIDを変更するためにいったん閉じる
			user_id = pwd.getpwnam(id)									# ユーザーデータを取得
			os.chown(target_file_name, user_id.pw_uid, user_id.pw_gid)	# ユーザーIDを"pi"に変更
			os.chmod(target_file_name, 0644)							# 権限変更"-rwxrwxrwx
			file = open(target_file_name, 'w')							# 再度開く
			for item in files:											# ファイル名を出力
				file.write(item + "\n")
			file.close()												# ファイルを閉じる
	# else:
		# print dir_name + " " + str(date2 - date1)
	
	# 対象ディレクトリのサブディレクトリに対して再帰処理を実施 (下位の階層もすべてファイルネームリストを作成できるように)
	for item in directories:
		file_list_gen(dir_name + item + "/", id)

#==================================================================================================#
# Main Function                                                                                    #
#==================================================================================================#
if __name__ == '__main__':
	# Test Code
	# param = sys.argv
	# date1 = datetime.datetime.fromtimestamp(os.stat(param[1]).st_mtime)
	# date2 = datetime.datetime.now()
	# dt = datetime.timedelta(days=10)
	# print str(date1) + "tset"
	# print date2
	# print date2 - date1
	# print date2 - date1 + dt
	# print date2 - date2 > dt
	# print date2 - date2 < dt
	# if date2 - date1 > dt:
		# print "big"
	# elif date2 - date2 < dt:
		# print "small"
	# sys.exit(1)
	
	# 引数処理
	param = sys.argv
	if len(param) == 3:
		file_list_gen(param[1], param[2])
	else:
		print "Invalid argument. Valid command : \"" + param[0] + "[Target directory]\""
		sys.exit(1)
