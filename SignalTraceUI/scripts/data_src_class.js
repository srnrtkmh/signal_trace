//================================================================================================//
//                                                                                                //
// FILE : data_src_class.js                                                                       //
// MEMO : DataSource�I�u�W�F�N�g�𐶐�����֐��̒�`                                              //
//                                                                                                //
// UPDATE 20/05/06 : ���X�N���v�g�������Ȃ��ēǂ݂Â炭�Ȃ����̂ŁA�ʃt�@�C���Ƃ��č쐬           //
//                   ��������̂��߃O���[�o���ϐ����g�p����L�q���N���X���Ŋ�������悤�ɕύX   //
//                                                                                                //
//================================================================================================//

//================================================================================================//
// Constants                                                                                      //
//================================================================================================//
// �f�[�^�t�@�C���R���g���[���敪
const ADD_NONE = 0;
const ADD_NEXT = 1;
const ADD_BACK = 2;
const DEL_NEXT = 1;
const DEL_BACK = 2;

// �l�[�~���O���[���敪
const TYPE_ST = 0;
const TYPE_DT = 1;

var get_cnt = 0;
var get_num = 0;

//================================================================================================//
// Data Source Object                                                                             //
//================================================================================================//
function DataSource(){
	this.enable = 0;
	this.intDataType = 0;
	this.strName = [];
	this.strPath = [];
	this.strSuffix = [];
	this.strDefaultPath = [];
	this.strDataItemList = [];
	this.strDrawItemList = [];
	this.intDataYmin = [];
	this.intDrawYmin = [];
	this.intDataYmax = [];
	this.intDrawYmax = [];
	this.strUnitList = [];
	this.intDefaultOnList =[];
	this.data_series = [];
	this.data_default = [];
	this.item_list_id = [];
	
	// main_draw�֐��̓��[�U�[���Ŏw�肷�邱��
	this.main_draw = function(){}				// �f�[�^�擾��̕`�揈���ŌĂяo���֐�
	this.item_list_clicked = function(){}		// �A�C�e�����X�g���N���b�N���ꂽ���̏���
	this.getItemList = function(strFilename){}	// Future Works
	
	// �V�����f�[�^��ǂݍ��݁A�����ɒǉ�����
	this.getNewDataFileNext = function(strFileName, intAdd){
		var dateFormat1 = d3.time.format("%Y/%m/%d %H:%M:%S.%L");
		var dateFormat2 = d3.time.format("\'%Y/%m/%d %H:%M:%S.%L");
		var getCSV = d3.dsv(',', 'text/csv; charset=shift-jis');
		
		// ����܂œǂݍ��񂾃f�[�^�������p�����ǂ����ݒ�
		if(intAdd == ADD_NONE){
			this.data_series = [];
		}else if(intAdd == ADD_NEXT){
		}else{
			console.log("getNewDataFileNext : Error intAdd is incorrect. intAdd = " + intAdd);
		}
		
		// �f�[�^�^�C�v�ɉ����ēǂݍ��ݏ��������{
		if(this.intDataType == TYPE_ST){
			getCSV(strFileName, (error, data) => {
				// data file
				data.forEach((d) => {d.HostTime = dateFormat1.parse(d.HostTime);});			// �����񁨓����ϊ�
				data.forEach((d) => {d.SampleTime = dateFormat1.parse(d.SampleTime);});		// �����񁨓����ϊ�
				
				// ����sample_num�łȂ������炻��ɍ����悤�ɕύX��������
				var tmp_data = data;
				if(tmp_data.length < sample_num){					// sample_num�����̏ꍇ
					var tmp_diff = sample_num - tmp_data.length;
					for(var i = 0; i < tmp_diff; i++){
						tmp_data.splice(parseInt(tmp_data.length * (i + 1) / tmp_diff - 1), 0, tmp_data[parseInt(tmp_data.length * (i + 1) / tmp_diff - 1)]);
					}
				}
				else if(data.length > sample_num){				// sample_num���̏ꍇ
					var tmp_diff = tmp_data.length - sample_num;
					for(var i = 0; i < tmp_diff; i++){
						tmp_data.splice(parseInt(tmp_data.length * (i + 1) / tmp_diff - 1), 1);
					}
				}
				
				for(var i = 0; i < tmp_data.length; i++){
					this.data_series.push(tmp_data[i]);
				}
				
				total_sample_num = this.data_series.length;
				
				// Debug Section
				// console.log("��data");
				// console.log(data);
				// console.log("��this.data_series");
				// console.log(this.data_series);
				// console.log("��this.strDataItemList");
				// console.log(this.strDataItemList);
				// console.log("total_sample_num = " + total_sample_num);
				
				get_cnt = get_cnt + 1;
				if(get_cnt == get_num){
					this.main_draw();
					get_cnt = 0;
				}
			});
		}else if(this.intDataType == TYPE_DT){
			data.forEach(function(d){d.SampleTime = dateFormat2.parse(d.���t);});		// �����񁨓����ϊ�
			this.strDataItemList.push(d3.keys(data[0]).filter(function(key){return (key!="���t" && key!="HostTime" && key!="N");}));	// date�����͉����p�f�[�^�̂��ߏ��O
			
			// Future Works
		}
		return (0);
	}
	
	// �V�����f�[�^��ǂݍ��݁A�擪�ɒǉ�����
	this.getNewDataFileBack = function(strFileName, intAdd){
		var dateFormat1 = d3.time.format("%Y/%m/%d %H:%M:%S.%L");
		var dateFormat2 = d3.time.format("\'%Y/%m/%d %H:%M:%S.%L");
		var getCSV = d3.dsv(',', 'text/csv; charset=shift-jis');
		
		// ����܂œǂݍ��񂾃f�[�^�������p�����ǂ����ݒ�
		if(intAdd == ADD_NONE){
			this.data_series = [];
		}else if(intAdd == ADD_BACK){
		}else{
			console.log("getNewDataFileBack : Error intAdd is incorrect. intAdd = " + intAdd);
		}
		
		// �f�[�^�^�C�v�ɉ����ēǂݍ��ݏ��������{
		if(this.intDataType == TYPE_ST){
			getCSV(strFileName, (error, data) => {
				// data file
				data.forEach((d) => {d.HostTime = dateFormat1.parse(d.HostTime);});			// �����񁨓����ϊ�
				data.forEach((d) => {d.SampleTime = dateFormat1.parse(d.SampleTime);});		// �����񁨓����ϊ�
				
				// ����sample_num�łȂ������炻��ɍ����悤�ɕύX��������
				var tmp_data = data;
				if(tmp_data.length < sample_num){					// sample_num�����̏ꍇ
					var tmp_diff = sample_num - tmp_data.length;
					for(var i = 0; i < tmp_diff; i++){
						tmp_data.splice(parseInt(tmp_data.length * (i + 1) / tmp_diff - 1), 0, tmp_data[parseInt(tmp_data.length * (i + 1) / tmp_diff - 1)]);
					}
				}
				else if(tmp_data.length > sample_num){				// sample_num���̏ꍇ
					var tmp_diff = tmp_data.length - sample_num;
					for(var i = 0; i < tmp_diff; i++){
						tmp_data.splice(parseInt(tmp_data.length * (i + 1) / tmp_diff - 1), 1);
					}
				}
				
				for(var i = tmp_data.length - 1; i >= 0; i--){
					this.data_series.unshift(tmp_data[i]);
				}
				
				total_sample_num = this.data_series.length;
				
				// Debug Section
				// console.log("��data");
				// console.log(data);
				// console.log("��this.data_series");
				// console.log(this.data_series);
				// console.log("��this.strDataItemList");
				// console.log(this.strDataItemList);
				// console.log("total_sample_num = " + total_sample_num);
				
				// decimate_dataset();				// �f�[�^���Ԉ�������
				this.main_draw();
			});
		}else if(this.intDataType == TYPE_DT){
			data.forEach(function(d){d.SampleTime = dateFormat2.parse(d.���t);});		// �����񁨓����ϊ�
			this.strDataItemList.push(d3.keys(data[0]).filter(function(key){return (key!="���t" && key!="HostTime" && key!="N");}));	// date�����͉����p�f�[�^�̂��ߏ��O
			
			// Future Works
		}
		return (0);
	}
	
	// �f�[�^���폜
	this.delData = function(int_del){
		if(int_del == DEL_NEXT){
			this.data_series.splice(this.data_series.length - sample_num, sample_num);
		}else if(int_del == DEL_BACK){
			this.data_series.splice(0, sample_num);
		}else{
			console.log("delData : Error int_del is incorrect. int_del = " + int_del);
		}
	}
	
	// �f�[�^�̍��ڂɂ���ă`�F�b�N�{�b�N�X��ǉ�
	this.createCheckBox = function(strId){
		item_list = document.getElementById(strId);
		var nodeLabel = document.createElement("label");
		nodeLabel.appendChild(document.createTextNode(this.strName));
		nodeLabel.className = "item_list_label";				// className�̐ݒ�
		item_list.appendChild(nodeLabel);
		item_list.appendChild(document.createElement('br'));
		
		for(var i = 0; i < this.strDataItemList.length; i++){
			var cbLabel = document.createElement("label");
			var chkbox = document.createElement("input");
			
			chkbox.type = "checkbox";
			chkbox.value = this.strName + "_ch" + String(i);
			chkbox.id = this.strName + "_item" + String(i);
			chkbox.onclick = this.item_list_clicked;
			cbLabel.appendChild(document.createTextNode("�@"));
			cbLabel.appendChild(chkbox);
			cbLabel.appendChild(document.createTextNode(this.strDataItemList[i]));
			cbLabel.className = "item_list_label";				// className�̐ݒ�
			
			item_list.appendChild(cbLabel);
			item_list.appendChild(document.createElement('br'));
		}
		
		for(var i = 0; i < this.strName.length; i++){
			var tmp = document.getElementById(this.strName + '_item' + String(i));
			if(this.intDefaultOnList[i] == 1){
				tmp.checked = true;										// �f�t�H���g��ON�ɐݒ肳��Ă�����̂̓`�F�b�N���Ă���
				this.strDrawItemList.push(this.strDataItemList[i]);		// �`�悷��A�C�e�����X�g�ɒǉ�
			}
		}
		
		return(0);
	}
	
	// �ݒ�t�@�C���̓ǂݎ��
	this.getSettingFile = function(){
		var getCSV = d3.dsv(',', 'text/csv; charset=shift-jis');
		getCSV(this.strDefaultPath, (error, data) => {
			this.data_default = data;												// Default�ݒ�f�[�^���i�[
			this.strDataItemList = data.map(function(d){return d["Name"]});			// �A�C�e������z��̌`�Ŋi�[
			this.intDefaultOnList = data.map(function(d){return d["DefaultON"]});	// DefaultON��z��̌`�Ŋi�[
			this.strUnitList = data.map(function(d){return d["Unit"]});				// Unit��z��̌`�Ŋi�[
			this.intDataYminList = data.map(function(d){return d["ScaleMin"]});		// Unit��z��̌`�Ŋi�[
			this.intDataYmaxList = data.map(function(d){return d["ScaleMax"]});		// Unit��z��̌`�Ŋi�[
			this.createCheckBox(this.item_list_id);									// �A�C�e�����X�g�ɃA�C�e�����E�`�F�b�N�{�b�N�X��ǉ�
			
			// console.log("this.dataDefault");
			// console.log(this.data_default);
			// console.log("this.strDataItemList");
			// console.log(this.strDataItemList);
			// console.log(this.intDefaultOnList);
		});
		
		return(0);
	}
}
