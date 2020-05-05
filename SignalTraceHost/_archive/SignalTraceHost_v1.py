#!/usr/bin/env python
# coding: cp932
####################################################################################################
#                                                                                                  #
# FILE : SignalTraceHost_v1.py                                                                     #
# Updated     : 2016/07/18                                                                         #
#             : 2016/07/31 Signal Trace Interface v2 �ɐ؂�ւ��č쐬��                                     #
#             : 2016/07/18 ...                                                                     #
# LastUpdated : 2016/08/02 ���ׂȉ���(�V���A���|�[�g�f�o�C�X�������ϐ���������)                                #
#                                                                       (C) 2016 Kyohei Umemoto    #
#                                                                                                  #
# Memo :                                                                                           #
#   16/07/18 wxPython03.py���x�[�X�ɍ쐬�J�n                                                        #
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
import datetime			# datetime���W���[��
import time				# �����擾�p���W���[��
import pwd				# ���[�U�[ID�擾�p���W���[��
import threading		# �}���`�X���b�h�v���O���~���O�p���W���[��
from math import *		# �Z�p���Z�p���W���[��
import wx				# GUI�v���O���~���O�p���W���[��
import serial			# Arduino�Ƃ̒ʐM�Ŏg�p����V���A���ʐM�p���W���[��
import run				# wxPython�̃E�B���h�E�\���̂��߂Ɏg�p(wxPython�̃T���v�����)

####################################################################################################
# Global variables                                                                                 #
####################################################################################################
time_resolution = 100000		# ���ԕ���\[us]�A25000us���͔�����������A50000us�������X��������A100000us�����ʂ�������ȁD�D�D
data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
before_data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
volts = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
before_volts = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
di_data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
before_di_data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

# SignalTraceInterface�p�ϐ�
f = []
file_name = ""
file_header = "����,N,A0,A1,A2,A3,A4,A5,A6,A7,D0,D1,D2,D3,D4,D5,D6,D7,N\n"
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


# �O���t�`��p�̕ϐ�
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
		
		parentPath = "/home/pi/Desktop/share/"	# �e�f�B���N�g���̐ݒ�
		currentDate = datetime.datetime.today()	# today()���\�b�h�Ō��ݓ��t�E������datetime�^�f�[�^�̕ϐ����擾
		user_id = pwd.getpwnam('pi')			# ���[�U�["pi"��UID�AGID���擾
		
		# ���O�t�@�C�����J��
		log_file = open(unicode(parentPath + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + ".log", encoding='shift-jis'), 'w')
		log_file.close																											# ���[�U�[ID��ύX���邽�߂ɂ����������
		os.chown(unicode(parentPath + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + ".log"), user_id.pw_uid, user_id.pw_gid)	# ���[�U�[ID��"pi"�ɕύX
		os.chmod(unicode(parentPath + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + ".log"), 0777)							# �����ύX"-rwxrwxrwx
		log_file = open(unicode(parentPath + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + ".log", encoding='shift-jis'), 'w')		# �ēx�J��
		log_file.write(str(currentDate) + " : Started Signal Trace." + "\n")
		
		# �V���A���ʐM�|�[�g���Z�b�g�A�b�v
		con = serial.Serial(serialDeviceName, baudrate, timeout=0.2, rtscts=True, dsrdtr=True)
		print con.portstr
		log_file.write(str(currentDate) + " : Serial port opened successfully. Port name = " + con.portstr + "\n")
		
		# ���s�J�n����̃f�B���N�g���ݒ�
		currentDate = datetime.datetime.today()	# today()���\�b�h�Ō��ݓ��t�E������datetime�^�f�[�^�̕ϐ����擾
		monthPath = currentDate.strftime(parentPath + '%Y_%m/')
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
		file_name = unicode(dayPath + preffix + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + suffix + ".csv", encoding='shift-jis')
		f = open(file_name, 'w')							# �t�@�C�����쐬
		f.close												# ���[�U�[ID��ύX���邽�߂ɂ����������
		os.chown(file_name, user_id.pw_uid, user_id.pw_gid)	# ���[�U�[ID��"pi"�ɕύX
		os.chmod(file_name, 0777)							# �����ύX"-rwxrwxrwx
		f = open(file_name, 'w')							# �ēx�J��
		f.write(file_header)
		log_file.write(str(currentDate) + " : New file opened successfully. File name = " + file_name + "\n")
		
		# ���t�E���Ԃ̏����l
		currentDate = datetime.datetime.today()
		currentHour = currentDate.hour
		beforeHour = currentHour
		currentDay = currentDate.day
		beforeDay = currentDay
		
		try:
			while True:
				if start_bit == 1:
					# �ŏ���1�񂾂��X�^�[�g�R�}���h�𑗐M
					if start_stop_pulse == 1:
						con.write("s")
						start_stop_pulse = 0
						print "=== send start cmd s ==="
					
					# ���݂̓������擾
					currentDate = datetime.datetime.today()
					
					# ���t���ω�������f�B���N�g����؂�ւ���
					currentDay = currentDate.day
					if currentDay != beforeDay:
						monthPath = currentDate.strftime(parentPath + '%Y_%m/')
						if os.path.exists(monthPath) == False:
							os.mkdir(monthPath)
							os.chown(monthPath, user_id.pw_uid, user_id.pw_gid)	# ���[�U�[ID��"pi"�ɕύX
							os.chmod(monthPath, 0777)							# �����ύX"-rwxrwxrwx
							log_file.write(str(currentDate) + " : New directory generated. Directory name = " + monthPath + "\n")
						dayPath = currentDate.strftime(monthPath + '%d/')
						if os.path.exists(dayPath) == False:
							os.mkdir(dayPath)
							os.chown(dayPath, user_id.pw_uid, user_id.pw_gid)	# ���[�U�[ID��"pi"�ɕύX
							os.chmod(dayPath, 0777)								# �����ύX"-rwxrwxrwx
							log_file.write(str(currentDate) + " : New directory generated. Directory name = " + dayPath + "\n")
					beforeDay = currentDay
					
					# ���Ԃ��ω�������t�@�C������ĐV�����t�@�C���ɐ؂�ւ���
					currentHour = currentDate.hour
					if currentHour != beforeHour:
						f.close()
						f = open(unicode(dayPath + preffix + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + suffix + ".csv", encoding='shift-jis'), 'w')	# �t�@�C�����쐬
						f.close																															# ���[�U�[ID��ύX���邽�߂ɂ����������
						os.chown(unicode(dayPath + preffix + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + suffix + ".csv"), user_id.pw_uid, user_id.pw_gid)	# ���[�U�[ID��"pi"�ɕύX
						os.chmod(unicode(dayPath + preffix + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + suffix + ".csv"), 0777)							# �����ύX"-rwxrwxrwx
						f = open(unicode(dayPath + preffix + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + suffix + ".csv", encoding='shift-jis'), 'w')	# �ēx�J��
						f.write("����,N,A0,A1,A2,A3,A4,A5,A6,A7,D0,D1,D2,D3,D4,D5,D6,D7,N\n")
						log_file.write(str(currentDate) + " : " + str(one_hour_cnt) + " sampled previous 1 hour. ")
						log_file.write(" New file opened successfully. File name = " + unicode(dayPath + currentDate.strftime('%Y_%m_%d_%H_%M_%S') + ".csv") + "\n")
						one_hour_cnt = 0
					beforeHour = currentHour
					
					# �ǂݎ��f�[�^���t�@�C���ɏ�������
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
					
					# �`��p�f�[�^�z���1�����炷
					for i in range(4):
						for j in range(290):
							plot_data_y[i][j] = plot_data_y[i][j+1]
						
					# �V�����f�[�^����
					for i in range(4):
						# plot_data_y[i][290] = 30 * sin(t/10.0)
						plot_data_y[i][290] = (volts[0] - 1.65)*100
					
					# ���O�t�@�C���ւ̏������݂𔽉f
					log_file.flush()
					
					# ��莞�ԃX���[�v
					time.sleep(0.1)
				else:
					# �I�������X�g�b�v�R�}���h�𑗐M����
					if start_stop_pulse == 1:
						con.write("t")
						start_stop_pulse = 0
						print "=== send stop cmd t ==="
					# ��莞�ԃX���[�v
					time.sleep(0.1)
				
		except KeyboardInterrupt:
			f.close()
			spi1.close()
			spi2.close()
			GPIO.cleanup()
			sys.exit(0)
		
		print " === end sub thread (sub class) === "

####################################################################################################
# �E�B���h�E�\���p�N���X                                                                                  #
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
	# GPIO����p�̃X���b�h�쐬
	th_cl = TestThread(5, 5)
	th_cl.setDaemon(True)
	th_cl.start()
	
	win = TestPanel(nb, log)
	return win
	
####################################################################################################
# Main Function                                                                                    #
####################################################################################################
if __name__ == '__main__':
	# �E�B���h�E������
	
	# �ϐ��̏�����
	for i in range(16):
		data_max[i] = 100
		data_min[i] = -100
		disp_max[i] = 58
		disp_min[i] = -58
	
	for i in range(16):
		for j in range(291):
			plot_data_x[i][j] = graph_area_x/290 * j
	
	# �L�����o�X�G���A�̐ݒ�
	# �A�i���O�`�����l���I��p�`�F�b�N�{�b�N�X�̒�`
	# �f�W�^���`�����l���I��p�`�F�b�N�{�b�N�X�̒�`
	
	# �����\���`�����l���̐ݒ�
	enable_graph_num = 1
	
	# �`���[�g����p�̃{�^���̒�`
	# Future works
	
	# �o�C���f�B���O
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
