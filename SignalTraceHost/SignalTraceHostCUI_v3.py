#!/usr/bin/env python
# coding: cp932
#==================================================================================================#
#                                                                                                  #
# FILE : SignalTraceHostCUI_v2.py                                                                  #
# Memo : 16/07/18 wxPython03.py���x�[�X�ɍ쐬�J�n                                                  #
#        20/05/05 SignalTraceHostCUI_v2.py���x�[�X�ɍ쐬�J�n                                       #
#                                                                                                  #
# Updated     : 2016/07/18                                                                         #
#             : 2016/07/31 Signal Trace Interface v2 �ɐ؂�ւ��č쐬��                            #
#             : 2016/07/18 ...                                                                     #
#             : 2016/08/02 ���ׂȉ���(�V���A���|�[�g�f�o�C�X�������ϐ���������)                  #
#             : 2016/08/07 CUI�o�[�W�����쐬�J�n                                                   #
#             : 2016/08/07 �f�o�C�X�w��̋@�\�E�ʐM�J�n���̃G�R�[�o�b�N�m�F����                    #
#                          �ǂݎ��l�̑Ó����m�F�����E�e��G���[�����Ȃǂ�ǉ�                    #
#             : 2016/08/14 �`�����l������ݒ�ł���悤�Ɉ��������ǉ�                              #
#             : 2016/09/18 �e�ʂ��N�����Ă�����Â��t�@�C�����폜���郍�W�b�N��ǉ����悤��        #
#                          �ʃv���O�����ɂ��邱�Ƃɂ���                                            #
#             : 2016/09/18 �T���v�����O�^�C���Ԋu�Ɏ��������蓖�Ă�ύX�����݂� �� �Ƃ肠����OK    #
#                          �T���v���^�C����python��������s�J�n�����̍����𒀎��C�����鏈����      #
#                          �ǉ����Čo�ߊώ@���A10ms�Ԋu�Ή����ǂ����邩�ȁD�D�D                    #
#             : 2016/09/19 ���O�t�@�C���������ɐ؂�ւ��鏈����ǉ�                                #
#             : 2016/10/01 csv�t�@�C����؂�ւ������Ԃ�currentDate����dateCurrentSample�ɕύX #
#             : 2019/12/21 �ĊJ���X�^�[�g                                                          #
#             : 2019/12/29 csv�t�@�C���̃f�[�^���x�����O���t�@�C������ǂݍ��ނ悤�ɕύX           #
#             : 2019/12/29 SignalTraaceNode_THBC�ɑΉ�����悤�ȃ\�[�X�R�[�h��ǉ���               #
#             : 2019/12/30 SignalTraaceNode_THBC, SignalTraceNode_THB�ɑΉ�����悤�ɏC�����悤��  #
#                          �v�������T���v�������w�肷�邾���œ��ʂɃR�[�h��p�ӂ���K�v�͂Ȃ�      #
#                          �f�[�^�t�@�C�����ւ̃V���A���f�o�C�X���̓�������v���t�B�b�N�X�ł͂Ȃ�  #
#                          �T�t�B�b�N�X�Ƃ���悤�ɕύX                                            #
#                          Arduino Nano�ł̓V���A���|�[�g�̊J������ʓr�p�ӂ��Ȃ���΂Ȃ炭�Ȃ���  #
#                          ���߁AArduino Micro��Arduino Nano�����s���̈����Ŏw�肷��悤�ɕύX     #
# LastUpdated : 2020/05/05 �֐��ɕ�������悤�Ƀ\�[�X�R�[�h��ύX��                                #
#                                                                                                  #
#                                                                       (C) 2019 Kyohei Umemoto    #
# How to execute :                                                                                 #
#     python SignalTraceHostCUI_v2.py [Serial device name] [Label file]                            #
#                                        [Number of channels] [Sampling time(us)] [Arduino number] #
#         or                                                                                       #
#     nohup python SignalTraceHostCUI_v2.py [Serial device name] [Label file]                      #
#                      [Number of channels] [Sampling time(us)] [Arduino number] > [tty????.txt] & #
#                                                                                                  #
# Argument Discription :                                                                           #
#     Serial device name : �ڑ�����V���A���f�o�C�X��(��΃p�X) ��:"/dev/ttyACM0", "/dev/ttyUSB1"  #
#     Label file         : �f�[�^�t�@�C���̃��x���Ƃ��Ďg�p����t�@�C����(���΃p�X)                #
#     Number of channels : �V���A���f�o�C�X���瑗�t����Ă���f�[�^���ڐ�                          #
#     Sampling time(us)  : �V���A���f�o�C�X���瑗�t����Ă���f�[�^�̃T���v�����O�^�C��[us]        #
#     Arduino number     : �g�p����arduino�ɍ��킹�����l�@�� : Arduino Micro : 0, Arduino nano : 1 #
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
import sys				# sys(exit()�̎g�p, �����擾�̂��߂ɕK�v)
import os				# OS(�t�@�C���̊e�폈���̂��߂ɕK�v)
import locale			# local(!)
import datetime			# datetime���W���[��
import time				# �����擾�p���W���[��
import pwd				# ���[�U�[ID�擾�p���W���[��
import threading		# �}���`�X���b�h�v���O���~���O�p���W���[��
from math import *		# �Z�p���Z�p���W���[��
import serial			# Arduino�Ƃ̒ʐM�Ŏg�p����V���A���ʐM�p���W���[��
import signal			# �V�O�i����M�Ɏg�p���郂�W���[��
import shutil			# �f�B���N�g������łȂ��Ă��폜���邽�߂Ɏg�����W���[��

#==================================================================================================#
# Global variables                                                                                 #
#==================================================================================================#
# SignalTraceInterface�p�ϐ�
data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
before_data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
volts = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
before_volts = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
di_data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
before_di_data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

serialDeviceName = ""	# �V���A���f�o�C�X�̐ݒ�
serialChNum = 32		# I/O�`�����l�����̐ݒ�
baudrate = 115200		# �{�[���[�g�ݒ�
parentPath = ""			# �e�f�B���N�g���̐ݒ�
dataPath = ""			# �f�[�^�p�f�B���N�g���̐ݒ�
labelFileName = ""		# ���x���ݒ�t�@�C����
f = []					# CSV�o�͗p�t�@�C���I�u�W�F�N�g
strCsvName = ""			# �t�@�C�����p�ϐ�
file_header = ""		# CSV�t�@�C���̃w�b�_�[
preffix = ""			# �t�@�C�����v���t�B�b�N�X
suffix = ""				# �t�@�C�����T�t�B�b�N�X

before_nokori = ""
one_hour_cnt = 0
dt = 100000							# �T���v�����O�^�C���̐ݒ�(�f�t�H���g��100ms�A�����ɂĐݒ肷��̂Ŏ�������)
plus_cnt = 0						# �T���v���^�C���ƒ�������s���Ԃ̍����v���X�����ɃI�[�o�[���Ă���񐔂𐔂���J�E���^
minus_cnt = 0						# �T���v���^�C���ƒ�������s���Ԃ̍����}�C�i�X�����ɃI�[�o�[���Ă���񐔂𐔂���J�E���^

dateCurrentMonth = 0				# �����Ƀ��O�t�@�C����؂�ւ��邽�߂̕ϐ�
dateBeforeMonth = 0					# �����Ƀ��O�t�@�C����؂�ւ��邽�߂̕ϐ�

current_sample_number1 = 999		# �ŏ���1���R�[�h�ڂ̓T���v���i���o�["0"������͂��Ȃ̂ŏ�������l��"999"
current_sample_number2 = 999		# �ŏ���1���R�[�h�ڂ̓T���v���i���o�["0"������͂��Ȃ̂ŏ�������l��"999"
before_sample_number1 = 999			# �ǂ��������������Ă��܂��̂ŏ����l�͓K��
before_sample_number2 = 999			# �ǂ��������������Ă��܂��̂ŏ����l�͓K��

# �V�O�i����M�����p�ϐ�
pid = 0
pid_file = []

#==================================================================================================#
# Signal Receive Function                                                                          #
#==================================================================================================#
def receive_signal(signum, stack):
	print "Received signal :", signum
	currentDate = datetime.datetime.today()	# today()���\�b�h�Ō��ݓ��t�E������datetime�^�f�[�^�̕ϐ����擾
	log_file.write(str(currentDate) + " : Received signal " + str(signum) + ". End this process/\n")
	con.write("t")
	f.close()
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


#==================================================================================================#
# Main Function                                                                                    #
#==================================================================================================#
if __name__ == '__main__':
	# ��������
	param = sys.argv
	if len(param) >= 7:
		serialDeviceName = param[1]		# �V���A���f�o�C�X�ւ̃p�X
		labelFileName = param[2]		# ���x���Ƃ��Ďg�p����csv�t�@�C��
		ioChNum = int(param[3])			# �擾����f�[�^�̍��ڐ�
		dt = int(param[4])				# �擾����f�[�^�̎���
		arduinoNum = int(param[5]);		# �g�p����Arduino�敪�@0:Arduino Micro�@1:Arduino Nano ���V���A���|�[�g�̃Z�b�g�A�b�v�ɍ��ق���
		usr_id_str = param[6]			# �쐬����t�@�C���̃��[�U�[��
	else:
		print "Invalid argument. Valid command : \"" + param[0] + " [Serial device name] [Label file] [Number of I/O channels] [Sampling time (microseconds)] [Arduino number] [User name]\""
		sys.exit(1)
	
	# �����ݒ�
	currentDate = datetime.datetime.today()		# today()���\�b�h�Ō��ݓ��t�E������datetime�^�f�[�^�̕ϐ����擾
	user_id = pwd.getpwnam(usr_id_str)			# ���[�U�["pi"��UID�AGID���擾
	preffix = ""								# csv�t�@�C���Alog�t�@�C���̃v���t�B�b�N�X���f�o�C�X���ɂĐݒ�
	suffix = "_" + param[1][5:12]				# csv�t�@�C���Alog�t�@�C���̃T�t�B�b�N�X���f�o�C�X���ɂĐݒ�
	pid = os.getpid()							# ���s�v���Z�X��PID���擾
	dataPath = "/home/" + usr_id_str + "/Desktop/Share/Data/"	# �f�[�^�p�f�B���N�g���̐ݒ�
	parentPath = "/home/" + usr_id_str + "/Desktop/Share/"		# �e�f�B���N�g���̐ݒ�
	
	# csv�t�@�C���̃��x����ǂݍ���
	label_file = open(labelFileName, "r")
	label_list = label_file.readlines()
	file_header = label_list[0].replace("\n", "") + "\n"
	
	# dataPath�����݂��Ȃ���΍쐬
	if not os.path.exists(dataPath):
		os.mkdir(dataPath)									# �f�B���N�g�����쐬
		os.chown(dataPath, user_id.pw_uid, user_id.pw_gid)	# ���[�U�[ID��"pi"�ɕύX
		os.chmod(dataPath, 0777)							# �����ύX"-rwxrwxrwx
	
	# �V�O�i���n���h���֌W�̐ݒ�
	pid_file_name = unicode(parentPath + preffix + "PID" + suffix + ".txt", encoding='shift-jis')	# PID�\���p�̃t�@�C������ݒ�
	pid_file = open(pid_file_name, 'w')																# PID�\���p�t�@�C����V�K�쐬
	pid_file.write(str(pid))																		# PID�\���p�t�@�C����PID��������
	pid_file.flush()																				# PID�\���p�t�@�C���ւ̏������ݔ��f
	signal.signal(signal.SIGINT, receive_signal)													# SIGINT���󂯎������w��֐����Ăяo���悤�ɐݒ�
	
	# ���O�t�@�C�����J��
	log_file_name = unicode(parentPath + preffix + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + suffix + ".log", encoding='shift-jis')
	log_file = open(log_file_name, 'w')							# ���O�t�@�C����V�K�쐬
	log_file.close												# ���[�U�[ID��ύX���邽�߂ɂ����������
	os.chown(log_file_name, user_id.pw_uid, user_id.pw_gid)		# ���[�U�[ID��"pi"�ɕύX
	os.chmod(log_file_name, 0777)								# �����ύX"-rwxrwxrwx
	log_file = open(log_file_name, 'w')							# �ēx�J��
	log_file.write(str(currentDate) + " : Started Signal Trace." + "\n")
	
	# �V���A���ʐM�|�[�g���Z�b�g�A�b�v
	try:
		if arduinoNum == 0:
			con = serial.Serial(serialDeviceName, baudrate, timeout=0.2, rtscts=True, dsrdtr=True)	# �|�[�g�̃I�[�v��(timeout�̐ݒ�͓K���Artscts��dsrdtr��True�ɂ��Ă����Ȃ���ArduinoMicro�Ƃ͒ʐM�ł��Ȃ�)
		elif arduinoNum == 1:
			con = serial.Serial(serialDeviceName, baudrate, timeout=0.2, rtscts=False, dsrdtr=False)	# �|�[�g�̃I�[�v��(timeout�̐ݒ�͓K���Artscts��dsrdtr��False�ɂ��Ă����Ȃ���ArduinoNano�Ƃ͒ʐM�ł��Ȃ�)
		else:
			log_file.write(str(currentDate) + " : arduino number is incorrect. arduinoNum = " + arduinoNum + "\n")
			log_file.write(str(currentDate) + " : arduino number should be 0 (Arduino Micro) or 1 (Arduino Nano)\n")
		time.sleep(1.0)
	except serial.SerialException as e:
		print "SerialException : " + str(e)
		sys.exit(1)
	# print con.portstr						# �|�[�g�l�[���̊m�F
	tmp_str = con.read(con.inWaiting())		# �ǂݎ��o�b�t�@����ɂ��Ă���
	log_file.write(str(currentDate) + " : Serial port opened successfully. Port name = " + con.portstr + "\n")
	
	# ���s�J�n����̃f�B���N�g���ݒ�
	currentDate = datetime.datetime.today()	# today()���\�b�h�Ō��ݓ��t�E������datetime�^�f�[�^�̕ϐ����擾
	monthPath = currentDate.strftime(dataPath + '%Y_%m/')
	if os.path.exists(monthPath) == False:
		os.mkdir(monthPath)
		os.chown(monthPath, user_id.pw_uid, user_id.pw_gid)	# ���[�U�[ID��"pi"�ɕύX
		os.chmod(monthPath, 0777)							# �����ύX"-rwxrwxrwx
	dayPath = currentDate.strftime(monthPath + '%d/')
	if os.path.exists(dayPath) == False:
		os.mkdir(dayPath)
		os.chown(dayPath, user_id.pw_uid, user_id.pw_gid)	# ���[�U�[ID��"pi"�ɕύX
		os.chmod(dayPath, 0777)							# �����ύX"-rwxrwxrwx
	
	# ���s�J�n����g�p�t�@�C�����J���A���L�҂�ύX
	strCsvName = unicode(dayPath + preffix + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + suffix + ".csv", encoding='shift-jis')	# �t�@�C�����̐ݒ�
	f = open(strCsvName, 'w')								# �t�@�C�����쐬
	f.close													# ���[�U�[ID��ύX���邽�߂ɂ����������
	os.chown(strCsvName, user_id.pw_uid, user_id.pw_gid)	# ���[�U�[ID��"pi"�ɕύX
	os.chmod(strCsvName, 0777)								# �����ύX"-rwxrwxrwx
	f = open(strCsvName, 'w')								# �ēx�J��
	f.write(file_header)									# �w�b�_�[����������
	log_file.write(str(currentDate) + " : New file opened successfully. File name = " + strCsvName + "\n")
	
	# ���t�E���Ԃ̏����l
	currentDate = datetime.datetime.today()
	currentHour = currentDate.hour
	beforeHour = currentHour
	currentDay = currentDate.day
	beforeDay = currentDay
	dateCurrentMonth = currentDate.month
	dateBeforeMonth = dateCurrentMonth
	
	# �T���v���^�C���̏����l�ݒ�
	dateCurrentSample = datetime.datetime.today()
	tmp_microsecond = dateCurrentSample.microsecond
	dateCurrentSample = dateCurrentSample.replace(microsecond = (tmp_microsecond / 100000) * 100000)
	dateCurrentSample = dateCurrentSample + datetime.timedelta(microseconds=100000)
	
	# �ŏ���1�񂾂��X�^�[�g�R�}���h�𑗐M
	tmp_str = con.read(con.inWaiting())		# �ǂݎ��o�b�t�@����ɂ��Ă���(�O�ɋL�q����1�񂾂����Ƌ�ɂȂ�Ȃ���������(?))
	con.write("s")							# �X�^�[�g�R�}���h�𑗐M(1���)
	log_file.write(str(currentDate) + " : Start command transmitted (1st try).\n")			# �X�^�[�g�R�}���h�𑗂����|���O
	time.sleep(3.0)							# �X�^�[�g�R�}���h�̃R�[���o�b�N�܂�1�b�ԑ҂�
	tmp_str = con.read()					# �X�^�[�g�R�}���h�̃R�[���o�b�N���m�F
	if tmp_str != "s":
		con.write("s")						# �X�^�[�g�R�}���h�𑗐M(2���)
		log_file.write(str(currentDate) + " : Start command transmitted (2nd try).\n")		# �X�^�[�g�R�}���h�𑗂����|���O
		time.sleep(3.0)						# �X�^�[�g�R�}���h�̃R�[���o�b�N�܂�1�b�ԑ҂�
		tmp_str = con.read()				# �X�^�[�g�R�}���h�̃R�[���o�b�N���m�F
		if tmp_str != "s":
			con.write("s")					# �X�^�[�g�R�}���h�𑗐M(3���)
			log_file.write(str(currentDate) + " : Start command transmitted (3rd try).\n")	# �X�^�[�g�R�}���h�𑗂����|���O
			time.sleep(3.0)					# �X�^�[�g�R�}���h�̃R�[���o�b�N�܂�1�b�ԑ҂�
			tmp_str = con.read()			# �X�^�[�g�R�}���h�̃R�[���o�b�N���m�F
			if tmp_str != "s":
				print "Serial Device did not transmit call back : " + tmp_str
				con.write("t")				# �O�̂��߃X�g�b�v�R�}���h�𑗂��Ă���
				sys.exit(1)
	log_file.write(str(currentDate) + " : Start command echo back received.\n")
	
	# ���������J�n
	try:
		while True:
			# ���݂̓������擾
			currentDate = datetime.datetime.today()
			
			# �ǂݎ��f�[�^���t�@�C���ɏ�������
			tmp_str = con.read(con.inWaiting())
			tmp_list = []										# �z��̒��g���N���A���Ă���(�K�v���ǂ����͖��m�ł͂Ȃ�)
			tmp_list = (before_nokori + tmp_str).split('\n')	# �O��T���v���c��ƍ���T���v�����Ȃ����킹�ĉ��s�ŕ���
			if len(tmp_list) >= 2:
				for i in range(0, len(tmp_list) - 1):
					# f.write(dateCurrentSample.strftime("%Y/%m/%d %H:%M:%S") + ".%03d" % (dateCurrentSample.microsecond // 1000) + ',' + tmp_list[i] + '\n')
					f.write(currentDate.strftime("%Y/%m/%d %H:%M:%S") + ".%03d" % (currentDate.microsecond // 1000) + ',' + dateCurrentSample.strftime("%Y/%m/%d %H:%M:%S") + ".%03d" % (dateCurrentSample.microsecond // 1000) + ',' + tmp_list[i] + '\n')
					dateCurrentSample = dateCurrentSample + datetime.timedelta(microseconds=dt)
					one_hour_cnt = one_hour_cnt + 1
					
					# �T���v���i���o�[�̑Ó����]��(1���R�[�h���ɐ擪�E���[�T���v���i���o�[����v������i���o�[�͑O��i���o�[+1���`�F�b�N)
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
					
					# �X�̃f�[�^���擾
					tmp_value_list = tmp_list[i].split(",")
					if len(tmp_value_list) == ioChNum + 2:
						for j in range(0, len(tmp_value_list)):
							# data[j] = int(tmp_value_list[j])
							data[j] = tmp_value_list[j]
					else:
						log_file.write(str(currentDate) + " : " + "record bytes not invalid. len(tmp_value_list) = " + str(len(tmp_value_list)) + "\n")
					
					# ���t���ω�������f�B���N�g����؂�ւ���
					currentDay = dateCurrentSample.day
					if currentDay != beforeDay:
						monthPath = dateCurrentSample.strftime(dataPath + '%Y_%m/')
						if os.path.exists(monthPath) == False:
							os.mkdir(monthPath)
							os.chown(monthPath, user_id.pw_uid, user_id.pw_gid)	# ���[�U�[ID��"pi"�ɕύX
							os.chmod(monthPath, 0777)							# �����ύX"-rwxrwxrwx
							log_file.write(str(currentDate) + " : New directory generated. Directory name = " + monthPath + "\n")
						dayPath = dateCurrentSample.strftime(monthPath + '%d/')
						if os.path.exists(dayPath) == False:
							os.mkdir(dayPath)
							os.chown(dayPath, user_id.pw_uid, user_id.pw_gid)	# ���[�U�[ID��"pi"�ɕύX
							os.chmod(dayPath, 0777)								# �����ύX"-rwxrwxrwx
							log_file.write(str(currentDate) + " : New directory generated. Directory name = " + dayPath + "\n")
					beforeDay = currentDay
					
					# ���Ԃ��ω�������t�@�C������ĐV�����t�@�C���ɐ؂�ւ���
					currentHour = dateCurrentSample.hour
					if currentHour != beforeHour:
						f.close()												# �]���t�@�C�������
						strCsvName = unicode(dayPath + preffix + dateCurrentSample.strftime('%Y_%m_%d_%H_%M_%S') + suffix + ".csv", encoding='shift-jis')	# �t�@�C�����̐ݒ�
						f = open(strCsvName, 'w')								# �t�@�C�����쐬
						f.close													# ���[�U�[ID��ύX���邽�߂ɂ����������
						os.chown(strCsvName, user_id.pw_uid, user_id.pw_gid)	# ���[�U�[ID��"pi"�ɕύX
						os.chmod(strCsvName, 0777)								# �����ύX"-rwxrwxrwx
						f = open(strCsvName, 'w')								# �ēx�J��
						f.write(file_header)									# �w�b�_�[����������
						log_file.write(str(currentDate) + " : " + str(one_hour_cnt) + " sampled previous 1 hour. ")
						log_file.write(" New file opened successfully. File name = " + unicode(dayPath + dateCurrentSample.strftime('%Y_%m_%d_%H_%M_%S') + ".csv") + "\n")
						one_hour_cnt = 0
					beforeHour = currentHour
					
				# ���A���^�C���\��
				# print str(tmp_list[len(tmp_list) - 2]),
				# print "\r",
				
			before_nokori = tmp_list[len(tmp_list) - 1]
			
			# ���݂̃T���v���^�C���Ɩ{�������s�J�n�����̂����␳
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
			
			# �����ւ�����烍�O�t�@�C����ʖ��ɐ؂�ւ���
			dateCurrentMonth = currentDate.month
			if dateCurrentMonth != dateBeforeMonth:
				log_file.close()
				log_file_name = unicode(parentPath + preffix + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + suffix + ".log", encoding='shift-jis')
				log_file = open(log_file_name, 'w')							# ���O�t�@�C����V�K�쐬
				log_file.close												# ���[�U�[ID��ύX���邽�߂ɂ����������
				os.chown(log_file_name, user_id.pw_uid, user_id.pw_gid)		# ���[�U�[ID��"pi"�ɕύX
				os.chmod(log_file_name, 0777)								# �����ύX"-rwxrwxrwx
				log_file = open(log_file_name, 'w')							# �ēx�J��
				log_file.write(str(currentDate) + " : Log file changed." + "\n")
			dateBeforeMonth = dateCurrentMonth
			
			log_file.flush()			# ���O�t�@�C���ւ̏������݂𔽉f
			beforeDate = currentDate	# �O�񏈗��������X�V
			time.sleep(0.1)				# ��莞�ԃX���[�v
	
	except KeyboardInterrupt:
		con.write("t")
		f.close()
		currentDate = datetime.datetime.today()										# ���݂̓������擾
		log_file.write(str(currentDate) + " : Exit by the keyboard input" + "\n")	# �L�[�{�[�h���͂ŕ������Ƃ����O�ɋL��
		log_file.close()
		sys.exit(0)
	