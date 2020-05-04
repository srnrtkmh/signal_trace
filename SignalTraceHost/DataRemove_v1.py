#!/usr/bin/env python
# coding: cp932
#==================================================================================================#
#                                                                                                  #
# FILE : DataRemove_v1.py                                                                          #
# Memo : 16/07/18 wxPython03.py���x�[�X�ɍ쐬�J�n                                                  #
#                                                                                                  #
# Updated     : 2016/09/17 �V�K�쐬�J�n�A�Â��t�H���_��T�����郍�W�b�N�͂قڊ���                  #
# LastUpdated : 2016/09/17 �V�K�쐬�J�n�A�Â��t�H���_��T�����郍�W�b�N�͂قڊ���                  #
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
import sys				# sys(exit()�̎g�p, �����擾�̂��߂ɕK�v)
import os				# OS(�t�@�C���̊e�폈���̂��߂ɕK�v)
import time				# �����擾�p���W���[��(��莞�ԃX���[�v�ɂ��K�v)
import datetime			# datetime���W���[��
import shutil			# �f�B���N�g������łȂ��Ă��폜���邽�߂Ɏg�����W���[��
import pwd				# ���[�U�[ID�擾�p���W���[��
import signal			# �V�O�i����M�Ɏg�p���郂�W���[��

#==================================================================================================#
# Global variables                                                                                 #
#==================================================================================================#
# �t�H���_�E�t�@�C���ݒ�
parentPath = "/home/pi/Desktop/share/"		# �e�f�B���N�g���̐ݒ�
dataPath = "/home/pi/Desktop/share/data/"	# �f�[�^�p�f�B���N�g���̐ݒ�
preffix = "DataRemove_"						# �t�@�C�����v���t�B�b�N�X
suffix = ""									# �t�@�C�����T�t�B�b�N�X
path = "/"

# �V�O�i����M�����p�ϐ�
pid = 0
pid_file = []

# �m�ۂ��Ă��������󂫗̈�ݒ�
needed_avail = 10000000000

#==================================================================================================#
# Signal Receive Function                                                                          #
#==================================================================================================#
def receive_signal(signum, stack):
	print "Received signal :", signum
	currentDate = datetime.datetime.today()	# today()���\�b�h�Ō��ݓ��t�E������datetime�^�f�[�^�̕ϐ����擾
	log_file.write(str(currentDate) + " : Received signal " + str(signum) + ". End this process/\n")
	log_file.close()
	pid_file.close()
	sys.exit(0)

#==================================================================================================#
# �w��p�X���̃f�B���N�g�����X�g���擾����֐�                                                     #
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
	# �V�O�i���n���h���֌W�̐ݒ�
	pid = os.getpid()																# ���s�v���Z�X��PID���擾
	pid_file_name = unicode(parentPath + preffix + "PID.txt", encoding='shift-jis')	# PID�\���p�̃t�@�C������ݒ�
	pid_file = open(pid_file_name, 'w')												# PID�\���p�t�@�C����V�K�쐬
	pid_file.write(str(pid))														# PID�\���p�t�@�C����PID��������
	pid_file.flush()																# PID�\���p�t�@�C���ւ̏������ݔ��f
	signal.signal(signal.SIGINT, receive_signal)									# SIGINT���󂯎������w��֐����Ăяo���悤�ɐݒ�
	
	# ���O�t�@�C�����J��
	user_id = pwd.getpwnam('pi')								# ���[�U�["pi"��UID�AGID���擾
	currentDate = datetime.datetime.today()						# today()���\�b�h�Ō��ݓ��t�E������datetime�^�f�[�^�̕ϐ����擾
	log_file_name = unicode(parentPath + preffix + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + suffix + ".log", encoding='shift-jis')	# ���O�t�@�C�����̐ݒ�
	log_file = open(log_file_name, 'w')							# ���O�t�@�C����V�K�쐬
	log_file.close												# ���[�U�[ID��ύX���邽�߂ɂ����������
	os.chown(log_file_name, user_id.pw_uid, user_id.pw_gid)		# ���[�U�[ID��"pi"�ɕύX
	os.chmod(log_file_name, 0777)								# �����ύX"-rwxrwxrwx
	log_file = open(log_file_name, 'w')							# �ēx�J��
	log_file.write(str(currentDate) + " : Started DataRemove." + "\n")
	
	
	# ���������J�n
	try:
		while True:
			# �e�ʂ��K�薢���ł���ΌÂ��f�B���N�g���̍폜�����s
			st = os.statvfs(path)	# �e�ʂ��m�F���邽�߂̃I�u�W�F�N�g���擾
			if st.f_frsize * st.f_bavail < needed_avail:
				# �󂫗e�ʂ��K����������|�̃��O���c��
				currentDate = datetime.datetime.today()
				log_file.write(str(currentDate) + " : Available size = " + str(st.f_frsize * st.f_bavail) + ". Trying to delete old data." + "\n")
				
				# �f�[�^�f�B���N�g���̒������ԌÂ����t�f�B���N�g����T�����Ă鏈��
				# �܂��͌Â����f�B���N�g����T��
				dirOldestMonth = ""
				oldest_year = 9999
				oldest_month = 99
				dirListMonth = getdirs(dataPath)
				for item in dirListMonth:
					# �N���f�B���N�g���̔N�E�����擾
					tmp_year  = int(item[0:4])
					tmp_month = int(item[5:7])
					
					# �N���f�B���N�g�����̃f�B���N�g�������J�E���g
					dirListDay = getdirs(dataPath + item + "/")
					file_cnt = 0
					for file in dirListDay:
						file_cnt +=1
					
					# �Ώ۔N���f�B���N�g��������ł���΍폜�A��łȂ���ΒT���ΏۂƂ��ď���
					if file_cnt == 0:
						shutil.rmtree(dataPath + item + "/")					# ��̔N���f�B���N�g���͍폜����
						log_file.write(str(currentDate) + " : Removed Directory because of no files: " + dataPath + item + "/" + "\n")
					else:
						if oldest_year >= tmp_year and oldest_month >= tmp_month:
							oldest_year  = tmp_year
							oldest_month = tmp_month
							dirOldestMonth = dataPath + item + "/"
					# print "year : " + str(tmp_year) + " month : " + str(tmp_month)
				
				currentDate = datetime.datetime.today()
				log_file.write(str(currentDate) + " : Oldest month : " + dirOldestMonth + "\n")
				
				# �Â����f�B���N�g�������������炻�̒��̌Â����t�f�B���N�g����T��
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
				
				shutil.rmtree(dirOldestDay)					# ��ԌÂ��������t�t�H���_���폜
				currentDate = datetime.datetime.today()
				log_file.write(str(currentDate) + " : Removed Directory : " + dirOldestDay + "\n")
			else:
				currentDate = datetime.datetime.today()
				log_file.write(str(currentDate) + " : Available size : " + str(st.f_frsize * st.f_bavail) + ". Not need to delete data" + "\n")
			
			log_file.flush()			# ���O�t�@�C���ւ̏������݂𔽉f
			time.sleep(3600)				# 1���ԃX���[�v
			
	except KeyboardInterrupt:
		sys.exit()
