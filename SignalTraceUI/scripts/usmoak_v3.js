//================================================================================================//
//                                                                                                //
// FILE : usmoak_v3.js                                                                            //
// MEMO : Universal - Steal Mill Operation Analysing Kit �̃f�[�^�\������S��JavaScript           //
//                                                                                                //
// UPDATE 16/08/26 : ���]�Ȑ܂����č��̌`���ł���                                                 //
//        16/08/27 : PATH��FILL��none�ɂ��邱�Ƃ��o����                                           //
//                   �Ђ�����R�����g��ł����ލ�ƁA�\���t�H�[�}�b�g�����ꂢ�ɂ�����           //
//        16/08/28 : �O�f�[�^�E���f�[�^�ւ̑J�ڂ����݂Ă݂� �� �ȒP�ɂ͂ł���                     //
//                   �����f�[�^�Ƀt�B�b�g�ł���悤��draw���̏�����ύX                           //
//        16/09/03 : ���{���csv���ږ���ǂ߂�悤�ɂȂ����I                                      //
//                   �e���n��̃`�F�b�N�{�b�N�X�̒ǉ��E�`�F�b�N�ɉ����ă`���[�g�`�揈����ǉ�     //
//                   �}��̃f�U�C���ύX                                                           //
//                   ���̑��ׂ��ȏC��                                                             //
//        16/09/04 : �����O���t��ʗ̈�ɕ\���ł����I�D�D�D���A�t�H�[�}�b�g������ꂵ��           //
//        16/10/29 : ���C�A�E�g�ύX�A���C���I��ǉ��A�f�[�^�\�[�X�I��ǉ��A�����I��ǉ�           //
//                   ���t�ϐ����g���ăt�@�C�������w�肷��悤�ɕύX�A���f�[�^�E�O�f�[�^�{�^�����P //
//        16/10/30 : ���낢��ADATATRACE�̃f�[�^�t�H�[�}�b�g�ɑΉ�                                //
//                   �c���͈͐ݒ�p������ǉ�(�ۑ肪�����D�D�D)                                   //
//        20/01/10 : �V����SIGNALTRACE�ɍ����悤�ɕύX                                            //
//        20/01/11 : �c���̊g��E�k���ɂ����̖ړr                                               //
//        20/01/12 : �f�[�^�̒ǉ��E�ؑ֏����𕪂�����悤�ɕύX                                 //
//        20/01/13 : �����f�[�^�\�[�X��`��ł���悤�Ɏ��݂Ă��邪�A��풆                       //
//                   �ł���悤�ɂȂ������A�I�u�W�F�N�g�w���ȃv���O���~���O(�H)�ɂĂ����Ԑi��     //
//                   ����ł��񓯊��̏����̏��Ԃ��ǂݐ؂ꂸ���X������Ȃ��Ƃ�����Ă���           //
//        20/01/16 : �}�E�X�̈ʒu��\���A�O���t���Ƀ}�E�X�ʒu�ɉ���������ǉ�                     //
//                   ���ꂩ��}�E�X�ʒu�ƃO���t��̈ʒu�֌W�͂��荇�킹�\��                       //
//        20/01/18 : �Ԉ����֐����Ď����B�}�E�X�ʒu�ɉ������e�O���t�̒l��\������@�\��ǉ�       //
//                   �O��f�[�^���폜����@�\���ǉ�                                               //
//                                                                                                //
//================================================================================================//

//================================================================================================//
// Constants                                                                                      //
//================================================================================================//
// �l�[�~���O���[���敪
const TYPE_ST = 0;
const TYPE_DT = 1;

// ���C���I���敪
const HOT     = 0;
const SANPL   = 1;
const TCM     = 2;
const CAL     = 3;
const BAF     = 4
const TPM     = 5;
const CPL     = 6;
const ICHIETL = 7;
const NIETL   = 8;
const TPSL    = 9;

// �����W�敪
const RANGE_DEFAULT = 0;
const RANGE_SPECIAL = 1;

// �f�[�^�t�@�C���R���g���[���敪
const ADD_NONE = 0;
const ADD_NEXT = 1;
const ADD_BACK = 2;
const DEL_NEXT = 1;
const DEL_BACK = 2;

//================================================================================================//
// Global Variables                                                                               //
//================================================================================================//
var yrange = [];
var yrange_fix = [];

var strDataSource = [];
var intCurDataType = [], strCurPath = [], strCurSuffix = [], strCurDefault = [];

var color_sample = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf", "#17becf", "#17becf", "#17becf"]
var dataPointer = 0, dataDivision = 10000, dataLength = 10000;

var dataSampleNum = [];

var strDataSourceName, strDataSourcePath, strDataSourceSuffix, strDataSourceDefault;

var chart_div_top, bot_margin, chart_width, chart_height;	// �`���[�g�`��̈�̃}�[�W���E���E����
var base_width, base_height;								// �`���[�g�`��̈�(�ڐ����܂�)�̕��E����
var margin, intTickPadding;

var svg, xScale, yScale, xAxis, yAxis, line, user, users, eventArea;
var xMax, xMin;
var data_text;

// �ǂݎ��t�@�C���֌W
var currentFileName = [];
var dataFile = [], dataFileDecimated = [];
var dataItemList = [], strItemListG = [];
var dataDefault = [];

// �A�C�e�����X�g
var item_list;

var kkk = 0;

// �f�[�^�\�[�X�I�u�W�F�N�g�̔z��
var objDSArr = [];

// �}�E�X�ʒu�ێ��p�ϐ�
var intClientX = 0, intClientY = 0;
var intGlobalX = 0, intGlobalY = 0;
var intScreenX = 0, intScreenY = 0;
var mouse_pos_x = 0, mouse_pos = 0;
var mouse_text_margin_x = 5, mouse_text_margin_y = 20;
var mouse_pos_date = 0, mouse_pos_index = 0;

// �T���v�����̐ݒ�
var sample_num = 3600;
var total_sample_num = 3600;
var total_sample_num_mabiki = 3600;

// zoom�̐ݒ�
var d3_zoom_scale = 1, d3_zoom_tx = 0, d3_zoom_ty = 0;

// �I������t�@�C���̓������
var date_min = 0;
var date_max = 0;
var date_cur = 0;

//================================================================================================//
// Data Source Object                                                                             //
//================================================================================================//
function DataSource(){
	this.enable = 0;
	this.send_status =  0;
	this.receive_status = 0;
	this.intDataType = 0;
	this.strName = [];
	this.strPath = [];
	this.strSuffix = [];
	this.strDefaultPath = [];
	this.strDataItemList = [];
	this.strDrawItemList = [];
	this.data_series = [];
	this.data_default = [];
	
	this.getItemList = function(strFilename){
	}
	
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
				
				main_draw();
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
				main_draw();
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
		main_draw();
	}
	
	// �f�[�^�̍��ڂɂ���ă`�F�b�N�{�b�N�X��ǉ�
	this.createCheckBox = function(strId){
		item_list = document.getElementById(strId);
		for(var i = 0; i < this.strDataItemList.length; i++){
			var cbLabel = document.createElement("label");
			var chkbox = document.createElement("input");
			
			chkbox.type = "checkbox";
			chkbox.value = this.strName + "_ch" + String(i);
			chkbox.id = this.strName + "_item" + String(i);
			chkbox.onclick = item_list_clicked;
			cbLabel.appendChild(chkbox);
			cbLabel.appendChild(document.createTextNode(this.strDataItemList[i]));
			cbLabel.className = "item_list_label";				// className�̐ݒ�
			
			item_list.appendChild(cbLabel);
			item_list.appendChild(document.createElement('br'));
		}
		var tmp = document.getElementById(this.strName + '_item0');
		tmp.checked = true;										// �ŏ���1���ږڂ��`�F�b�N���Ă���
		this.strDrawItemList.push(this.strDataItemList[0]);
		
		return(0);
	}
	
	// �ݒ�t�@�C���̓ǂݎ��
	this.getSettingFile = function(){
		var getCSV = d3.dsv(',', 'text/csv; charset=shift-jis');
		getCSV(this.strDefaultPath, (error, data) => {
			this.data_default = data;
			this.strDataItemList = data.map(function(d){return d["Name"]});
			this.createCheckBox("item_list");
			
			// console.log("this.dataDefault");
			// console.log(this.data_default);
			// console.log("this.strDataItemList");
			// console.log(this.strDataItemList);
		});
		
		return(0);
	}
}

//================================================================================================//
// �`�F�b�N�{�b�N�X�őI���A�C�e�����ύX���ꂽ���̏���                                             //
// �@�ˁ@�`�F�b�N�{�b�N�X�̏�Ԃɉ����ĕ`��A�C�e����ǉ�                                         //
// ���� 
// �ߒl 
//================================================================================================//
function item_list_clicked(){
	for(var i = 0; i < objDSArr.length; i++){
		if(objDSArr[i].enable == 1){
			objDSArr[i].strDrawItemList = [];
			for(var j = 0; j < objDSArr[i].strDataItemList.length; j++){
				var tmp = document.getElementById(objDSArr[i].strName + '_item' + String(j));
				if(tmp.checked == true){
					objDSArr[i].strDrawItemList.push(objDSArr[i].strDataItemList[j]);
				}
			}
			// console.log(objDSArr[i].strName + " - strDrawItemList = " + objDSArr[i].strDrawItemList);
		}
	}
	
	main_draw();
}

//================================================================================================//
// �f�[�^���X�V                                                                                   //
// ���� 
// �ߒl 
//================================================================================================//
function data_load(target_date, int_add){
	YYYY = target_date.getFullYear();
	MM = target_date.getMonth() + 1;
	DD = target_date.getDate();
	HH = target_date.getHours();
	mm = target_date.getMinutes();
	
	for(var i = 0; i < objDSArr.length; i++){
		if(objDSArr[i].enable == 1){
			currentFileName = select_file(TYPE_ST, objDSArr[i].strPath, objDSArr[i].strSuffix, YYYY, MM, DD, HH, mm);
			if(int_add == ADD_NONE || int_add == ADD_NEXT){
				objDSArr[i].getNewDataFileNext(currentFileName, int_add);
			}else if(int_add == ADD_BACK){
				objDSArr[i].getNewDataFileBack(currentFileName, int_add);
			}else{
				console.log("data_load : argument 'int_add' is incorrect. int_add = " + int_add);
			}
			// console.log("currentFilename = " + currentFileName);
		}
	}
}

//================================================================================================//
// �f�[�^�̐擪�܂��͖������폜                                                                   //
// ���� 
// �ߒl 
//================================================================================================//
function data_del(int_del){
	for(var i = 0; i < objDSArr.length; i++){
		if(objDSArr[i].enable == 1){
			if(int_del == DEL_NEXT){
				objDSArr[i].delData(int_del);
			}else if(int_del == DEL_BACK){
				objDSArr[i].delData(int_del);
			}else{
				console.log("data_del : argument 'int_del' is incorrect. int_del = " + int_del);
			}
		}
	}
}

//================================================================================================//
// �`��֐�                                                                                       //
// ���� 
// �ߒl 
//================================================================================================//
function main_draw(){
	data_merge();					// d3�ɓn����悤�ɑI�����ꂽ�A�C�e���̃f�[�^����������
	sub_draw(RANGE_DEFAULT);		// �`�揈��
	
	document.getElementById("min_date").textContent = dateYYYYMMDDHHmm(date_min);	// �ǂݎ�����t�@�C���̕\�����X�V
	document.getElementById("max_date").textContent = dateYYYYMMDDHHmm(date_max);	// �ǂݎ�����t�@�C���̕\�����X�V
	console.log(" ");
}

//================================================================================================//
// �f�[�^����                                                                                     //
// ���� 
// �ߒl 
//================================================================================================//
function data_merge(){
	total_sample_num = objDSArr[0].data_series.length;
	mabiki = parseInt(document.getElementById("text_decimate").value);		// �Ԉ���������擾
	total_sample_num_mabiki = total_sample_num / mabiki;
	users = [];
	
	for(var i = 0; i < objDSArr.length; i++){
		if(objDSArr[i].enable == 1){
			var tmp_dataset = decimate_dataset(objDSArr[i].data_series, mabiki);
			if(objDSArr[i].intDataType == TYPE_ST){
				for(var j = 0; j < objDSArr[i].strDrawItemList.length; j++){
					users.push({name: objDSArr[i].strDrawItemList[j], 
						// values: objDSArr[i].data_series.map(function(d){return {date:d.SampleTime, user_num:d[objDSArr[i].strDrawItemList[j]]};}), 
						values: tmp_dataset.map(function(d){return {date:d.SampleTime, user_num:d[objDSArr[i].strDrawItemList[j]]};}), 
						yrange: [parseInt(objDSArr[i].data_default.find((d) => {return (d.Name == objDSArr[i].strDrawItemList[j])})["ScaleMin"]), 
								 parseInt(objDSArr[i].data_default.find((d) => {return (d.Name == objDSArr[i].strDrawItemList[j])})["ScaleMax"])]
					});
				}
			}
			else if(objDSArr[i].intDataType == TYPE_DT){
				// Future Works
			}
		}
	}
	// console.log("��users");
	// console.log(users);
}

//================================================================================================//
// �f�[�^�z����Ԉ����֐�                                                                         //
// ���� 
// �ߒl 
//================================================================================================//
function decimate_dataset(dataset, num){
	tmp_dataset = [];
	
	for(var i = 0; i < dataset.length; i++){
		if(i % mabiki == 0){
			tmp_dataset.push(dataset[i]);
		}
	}
	
	// Debug Section
	// console.log("��dataset");
	// console.log(dataset);
	// console.log("mabiki = " + mabiki);
	// console.log("��tmp_dataset");
	// console.log(tmp_dataset);
	
	return(tmp_dataset);
}

//================================================================================================//
// �`��֐��̑���(�t�@�C���������K�v�Ȃ��`��ύX�͂���݂̂�OK)                                   //
// ���� 
// �ߒl 
//================================================================================================//
function sub_draw(range_select){
	// ����SVG���폜
	d3.select("svg").remove();
	
	// ������Scale�EAxis�̐���
	xScale = d3.time.scale().range([0,chart_width]);					// x�������̏o�͗̈��ݒ�(chart_width)�A���ԕ\���̏ꍇ
	// xScale = d3.scale.linear().range([0,chart_width]);					// x�������̏o�͗̈��ݒ�(chart_width)�Alinear�\���̏ꍇ
	
	xAxis = d3.svg.axis()				// x���ڐ��̐ݒ�֐��𐶐�
		.scale(xScale)					// x����scale�֐���o�^
		.orient("bottom")				// �l�̕\���͉���
		.tickSize(-chart_height)		// �ڐ�����(�O��������)
		.tickPadding(intTickPadding);	// x���Ɩڐ������̊Ԋu��ݒ�
	
	// SVG�𐶐�(���E�����E�ʒu��ݒ�)
	svg = d3.select("#chart").append("svg")
		.attr("width", base_width)		// SVG�̕��ݒ�
		.attr("height", base_height)		// SVG�̍����ݒ�
		.append("g")						// �`��̈��margin�����s�ړ�������g���쐬
		.attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
	
	// �N���b�v�p�X�̐ݒ�
	svg.append("clipPath")
		.attr("id","clip")
		.append("rect")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", chart_width)
		.attr("height", chart_height)
	
	// x���ڐ��`��K�p�A�e�L�X�g�̐ݒ�
	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + chart_height + ")")
		.call(xAxis);
	
	// �`���[�g�̕`������s
	line = new Array;
	yScale = new Array;
	yAxis = new Array;
	user = new Array;
	var chart_height_div = chart_height / users.length;
	
	// �I�����ꂽ�A�C�e��������y�������E�`���[�g�`�揈�������s
	for(i = 0; i < users.length; i++){
		// y��Scale�Ey��Axis�E���C���֐��𐶐�
		yScale[i] = d3.scale.linear()												// y�������̏o�͗̈��ݒ�
			.range([chart_height_div*i + chart_height_div, chart_height_div*i]);	// �A�C�e�����X�g�̏ォ�珇�Ԃɓ��Ԋu�ɏo�͗̈��ݒ�
		yAxis[i] = d3.svg.axis()				// y���ڐ��̐ݒ�֐��𐶐�
			.scale(yScale[i])					// y����scale�֐���o�^
			.orient("left")						// �l�̕\���͍���
			.tickSize(-chart_width)				// �ڐ�����(�O��������)
			.tickPadding(5);					// y���Ɩڐ������̊Ԋu��ݒ�
		line[i] = d3.svg.line().x(function(d){return xScale(d.date);}).y(function(d){return yScale[i](d.user_num);});	// ����f�[�^���o�̐ݒ�Ax�ʒu�F���Odate�̗�Ay�ʒu�F���Odate�ȊO�̗�
		
		// x���Ey���̃X�P�[���ɍő�l�E�ŏ��l��ݒ�
		var xAxisData = $.map(users[i]["values"], function(v, i){return Number(v.date);});
		xMin = Math.min.apply(null, xAxisData);
		xMax = Math.max.apply(null, xAxisData);
		xScale.domain([xMin, xMax]);
		
		if(range_select == RANGE_DEFAULT){
			// yrange[i][0] = d3.min(users[i]["values"].map(function(d){return d.user_num}));
			// yrange[i][1] = d3.max(users[i]["values"].map(function(d){return d.user_num}));
			yrange[i][0] = users[i]["yrange"][0];
			yrange[i][1] = users[i]["yrange"][1];
			if(yrange[i][0] == yrange[i][1]){
				yrange[i][0] = yrange[i][0] - 1;
				yrange[i][1] = yrange[i][1] + 1
			}
		}else if(range_select == RANGE_SPECIAL){
			// testArea.on�֐��ŕύX����Ă���͂��D�D�D
		}
		
		yScale[i].domain([yrange[i][0], yrange[i][1]]);
		// console.log("xScale : " + xScale.domain());
		// console.log("yScale[" + i + "] : " + yScale[i].domain());
		
		// y���ڐ��`��K�p�A�e�L�X�g�̐ݒ�
		svg.append("g")
			.attr("class", "y axis")
			.attr("transform", "translate(0, 0) rotate(0)")
			.call(yAxis[i]);
		
		// �p�X��`��
		svg.append("g")
			.attr("clip-path", "url(#clip)")
			.append("path")
			.attr("class", "line" + i)
			.attr("fill", "none")
			.attr("stroke", color_sample[i])
			.attr("stroke-width", "2.0px")
			.attr("clip-path", "url(#clip)")
			.attr("d", line[i](users[i]["values"]))
			.data(users[i]["values"]);
	}
	
	// �}�E�X����̃C�x���g�G���A�ݒ�
	eventArea = svg.append("svg:rect")
		.attr("id", "eventArea")
		.attr("class", "pane")
		.attr("width", chart_width)
		.attr("height", chart_height)
		.style("opacity", 0)
	change_zoom($("input[name='zoomOptionsRadios']").val());
	d3_zoom_scale = 1;
	d3_zoom_tx = 0;
	d3_zoom_ty = 0;
		
	// �}��̕`��
	draw_legend(svg, users, chart_width - 15, 3);
	
	// �l���͈͎w��C�x���g�����̈�
	var testArea = svg.selectAll(".testArea")
		.data(users)
		.enter()
		.append("g")
		.attr("class", "testArea")
		.attr("transform", function(d,i){return "translate(" + -margin.left + ", " + (chart_height / users.length * i) + ")"});
	
	testArea.append("rect")
		.attr("class", "pane")
		.attr("width", 50)
		.attr("height", chart_height/users.length)
		.style("opacity", 0)
		.on("dblclick", function(d,i){
			var ymin = window.prompt(i + "�l�͈͉���");
			yrange[i][0] = ymin;
			var ymax = window.prompt(i + "�l�͈͏��");
			yrange[i][1] = ymax;
			// console.log("ymin : " + ymin + ", ymax : " + ymax);
			sub_draw(RANGE_SPECIAL);
		});
	
	// �Y�[���h���[
	svg.select("g.x.axis").call(xAxis);
	for(i = 0; i < users.length; i++){
		svg.select("g.y.axis"+i).call(yAxis[i]);
		svg.select("path.line"+i)
			.attr("d", line[i](users[i]["values"]))
	}
	
	// �}�E�X�ʒu�ɉ��������\�� -----------------------------------------------------------------//
	// �}�E�X�ʒu�������Q�Ɛ����������߂�line�֐����`(x, y)�͔z���[0], [1]�Ƃ���B
	var lineMouse = d3.svg.line()
		.x(function(d) {return d[0];})
		.y(function(d) {return d[1];});
	
	// �}�E�X�ʒu�ɉ����ē����e�L�X�g�̃x�[�X���쐬
	data_text = [];
	for(i = 0; i < users.length; i++){
		data_text[i] = "";
	}
	
	// �}�E�X�ʒu(x)�ɉ������Q�Ɛ��̕`��
	var path_x = svg.append("g")
		.attr("id", "mouse_path_gx")
		.attr("class", "mouse_path_gx");
	path_x.append("path")
		.attr('d', lineMouse([[intClientX, 0], [intClientX, 3000]]))
		.attr('id', 'mouse_path_x')
		.attr('class', 'mouse_path_x')
		.attr('stroke', 'black')
		.attr('stroke-width', 1)
		.attr("clip-path", "url(#clip)");
	
	path_x.selectAll(".mouse_text")
		.data(data_text)
		.enter()
		.append("text")
		.attr("class", "mouse_text")
		.attr("id", (d, i) => {return "mouse_text" + i})
		.attr("transform", (d, i) => {return "translate(0, " + (i * chart_height_div) + ")"})
		.attr("x", intClientX - intLeftPos - mouse_text_margin_x)
		.attr("y", mouse_text_margin_y)
		.attr("dy", ".35em")
		.attr("clip-path", "url(#clip)")
		.style("text-anchor","end")
		.text((d) => {return d;});
	
	// �}�E�X�ʒu(x)�ʒu�ɉ������Q�Ɛ��̕`��
	var path_y = svg.append("g")
		.attr("id", "mouse_path_gy")
		.attr("class", "mouse_path_gy");
	path_y.append("path")
		.attr('d', lineMouse([[0, intClientY], [3000, intClientY]]))
		.attr('id', 'mouse_path_y')
		.attr('class', 'mouse_path_y')
		.attr('stroke', 'black')
		.attr("clip-path", "url(#clip)");
	
	// console.log(data_text);
	// console.log(intClientX);
	// console.log(intLeftPos);
	
	// �`���[�g�R���g���[���̏��X�V--------------------------------------------------------------//
	document.getElementById("data_length").textContent = "Data Sample : " + String(total_sample_num);
	document.getElementById("data_length_mabiki").textContent = "Draw Sample : " + String(total_sample_num_mabiki);
}

//================================================================================================//
// �g��E�k���̏������s���֐�                                                                     //
// ���� 
// �ߒl 
//================================================================================================//
function zoom_draw(){
	var event = d3.event;
	d3_zoom_scale = event.scale;		// �X�P�[�� (���݂̔{��)
	d3_zoom_tx = event.translate[0] ;	// �g�����X���[�g (X�����ւ̈ړ�����)
	d3_zoom_ty = event.translate[1] ;	// �g�����X���[�g (Y�����ւ̈ړ�����)
	// console.log("scale = " + d3_zoom_scale + ", tx = " + d3_zoom_tx + ", ty = " + d3_zoom_ty);
	
	svg.select("g.x.axis").call(xAxis);
	for(i = 0; i < users.length; i++){
		// svg.select("g.y.axis").call(yAxis[i]);
		svg.select("path.line"+i)
			.attr("d", line[i](users[i]["values"]))
	}
}

//================================================================================================//
// �Y�[��������x�������Ay�������ݒ肷��֐�                                                       //
// ���� 
// �ߒl 
//================================================================================================//
function change_zoom(is_x){
	if(is_x == "true"){
		zoom = d3.behavior.zoom().on("zoom", zoom_draw);
		zoom.x(xScale);
		zoom.y(d3.scale.linear().range([0, 0]));
		eventArea.call(zoom);
	}else{
		zoom = d3.behavior.zoom().on("zoom", zoom_draw);
		zoom.x(d3.scale.linear().range([0, 0]));
		zoom.y(yScale[0]);
		eventArea.call(zoom);
	}
}

//================================================================================================//
// �}�E�X���������ۂɃ}�E�X�A���̎Q�Ɛ��E�l�\�����X�V����֐�                                     //
// ���� 
// �ߒl 
//================================================================================================//
function mouse_move_draw(e){
		if(!e) e = window.event; // ���K�V�[
		// console.log(e);
		
		// Client���W�n�ł̃}�E�X�ʒu��\��
		intClientX = e.clientX;
		intClientY = e.clientY;
		
		// �}�E�X�|�W�V�������`���[�g�\���G���A���W�n�ɕϊ�
		mouse_pos_x = intClientX - intLeftPos;
		mouse_pos_y = intClientY - intTopPos;
		
		// �}�E�X�ʒu(x)�ɉ��������������擾
		mouse_pos_date = xScaleInv(mouse_pos_x);
		mouse_pos_index = limit(xScaleInvIndex(mouse_pos_date), 0, total_sample_num_mabiki - 1);
		// console.log("mouse_pos_date = " + mouse_pos_date + ", mouse_pos_index = " + mouse_pos_index);
		
		// �}�E�X�ʒu�̐���`��
		// line�֐����` (x,y)�͔z���[0],[1]�Ƃ���B
		var lineMouse = d3.svg.line()
			.x(function(d) {return d[0];})
			.y(function(d) {return d[1];});
		
		kkk = d3.select("#mouse_path_x");
		kkk.attr('d', lineMouse([[intClientX - intLeftPos - 1, 0], [intClientX - intLeftPos - 1, 3000]]))
		
		aaa = d3.select("#mouse_path_y");
		aaa.attr('d', lineMouse([[0, intClientY - intTopPos], [3000, intClientY - intTopPos]]))
		
		// �}�E�X�ʒu�̃f�[�^�\���p�e�L�X�g��`��
		for(var i = 0; i < users.length; i++){
			var str = users[i]["values"][mouse_pos_index]["user_num"];
			
			kkk = d3.select("#mouse_text" + i);
			kkk.attr("x", mouse_pos_x - mouse_text_margin_x)
				.attr("y", mouse_text_margin_y)
				.attr("dy", ".35em")
				.style("text-anchor","end")
				.text(str);
		}
};

//================================================================================================//
// �`���[�g�G���A���x�ʒu�ɑΉ����鉡���l��Ԃ��֐�                                              //
// ���� 
// �ߒl 
//================================================================================================//
function xScaleInv(x){
	var tmp, x1, x2, y1, y2;
	
	x1 = 0 + d3_zoom_tx;
	x2 = chart_width * d3_zoom_scale + d3_zoom_tx;
	y1 = xMin;
	y2 = xMax;
	tmp = (y2 - y1) / (x2 - x1) * (x - x1) + y1;
	
	// console.log("x1 = " + x1 + ", x2 = " + x2 + ", y1 = " + new Date(y1) + ", y2 = " + new Date(y2));
	// console.log(new Date(tmp));
	
	return(tmp);
}

//================================================================================================//
// �����l�ɑΉ�����f�[�^�z��̃C���f�b�N�X��Ԃ��֐�                                             //
// ���� 
// �ߒl 
//================================================================================================//
function xScaleInvIndex(x){
	var tmp, x1, x2, y1, y2;
	
	x1 = xMin;
	x2 = xMax;
	y1 = 0;
	y2 = total_sample_num_mabiki;
	tmp = Math.round((y2 - y1) / (x2 - x1) * (x - x1) + y1);
	
	// console.log("x1 = " + new Date(x1) + ", x2 = " + new Date(x2) + ", y1 = " + y1 + ", y2 = " + y2);
	// console.log(tmp);
	
	return(tmp);
}

//================================================================================================//
// �㉺�����~�b�g���|����֐�                                                                     //
// ���� x   : �㉺�����|����]���Ώ�                                                              //
//      min : �����l                                                                              //
//      max : ����l                                                                              //
// �ߒl tmp : �㉺�����~�b�g���|������̐��l(�㉺���𒴂��Ă��Ȃ���΂��̂܂�)                    //
//================================================================================================//
function limit(x, min, max){
	var tmp;
	if(x > max){
		tmp = max;
	}else if(x < min){
		tmp = min;
	}else{
		tmp = x;
	}
	return(tmp);
}

//================================================================================================//
// YYMMDDHH�̕����񂩂�`�悷��Ώۃt�@�C����ύX���鏈��                                         //
// ���� 
// �ߒl 
//================================================================================================//
function dateChange(YYMMDDHH){
	var str, YYYY, MM, DD, HH;
	
	YYYY = "20" + YYMMDDHH.substring(0, 2);
	MM = YYMMDDHH.substring(2, 4);
	DD = YYMMDDHH.substring(4, 6);
	HH = YYMMDDHH.substring(6, 8);
	mm = "00";
	
	str = YYYY + "/" + MM + "/" + DD + " " + HH + ":" + mm + ":00";
	console.log(str);
	return(str);
}

//================================================================================================//
// �^�[�Q�b�g�n���ύX���鏈��                                                                   //
// ���� 
// �ߒl 
//================================================================================================//
function set_target_dataset(){
	console.log("data_source_clicked");
}

//================================================================================================//
// Code                                                                                           //
//================================================================================================//
$(function(){
	var tooltip = d3.select("#chart").append("div").attr("class",�@"tooltip").style("opacity",0);		// �c�[���`�b�v�A�܂��g���Ă��Ȃ�
	
	// �����񁨓����ϊ��̃t�H�[�}�b�g�w��
	var dateFormat1 = d3.time.format("%Y/%m/%d %H:%M:%S.%L");
	var dateFormat2 = d3.time.format("\'%Y/%m/%d %H:%M:%S.%L");
	
	//============================================================================================//
	// �C�x���g�n���h���̓o�^                                                                     //
	//============================================================================================//
	// �`��{�^������
	document.getElementById("drawButton").onclick = function(){
		main_draw();
	}
	
	// ���ݐؑփ{�^������
	document.getElementById("changeNowButton").onclick = function(){
		data_load(date_cur, ADD_NONE);
	}
	
	// �O�ؑփ{�^������
	document.getElementById("changeBackButton").onclick = function(){
		date_cur.setHours(date_cur.getHours() - 1);
		date_min = new Date(date_cur);
		date_max = new Date(date_cur);
		data_load(date_cur, ADD_NONE);
	}
	
	// ���ؑփ{�^������
	document.getElementById("changeNextButton").onclick = function(){
		date_cur.setHours(date_cur.getHours() + 1);
		date_min = new Date(date_cur);
		date_max = new Date(date_cur);
		data_load(date_cur, ADD_NONE);
	}
	
	// �O�ǉ��{�^������
	document.getElementById("addBackButton").onclick = function(){
		date_min.setHours(date_min.getHours() - 1);
		date_cur = new Date(date_min);
		data_load(date_cur, ADD_BACK);
	}
	
	// ���ǉ��{�^������
	document.getElementById("addNextButton").onclick = function(){
		date_max.setHours(date_max.getHours() + 1);
		date_cur = new Date(date_max);
		data_load(date_cur, ADD_NEXT);
	}
	
	// �O�폜�{�^������
	document.getElementById("delBackButton").onclick = function(){
		date_min.setHours(date_min.getHours() + 1);
		date_cur = new Date(date_min);
		data_del(DEL_BACK);
	}
	
	// ���폜�{�^������
	document.getElementById("delNextButton").onclick = function(){
		date_max.setHours(date_max.getHours() - 1);
		date_cur = new Date(date_max);
		data_del(DEL_NEXT);
	}
	
	// Date����͗p�̃e�L�X�g�{�b�N�X�̐��l�𔽉f������X�V�{�^���������ꂽ���̏�����o�^
	$("#dateButton").click(function(){
		var str = document.getElementById("date_text").value;
		date_cur = new Date(dateChange(str));
		date_min = new Date(dateChange(str));
		date_max = new Date(dateChange(str));
		data_load(date_cur, ADD_NONE);
	});
	
	// �Ԉ����ݒ�p�e�L�X�g�{�b�N�X�ύX���̏�����o�^
	document.getElementById("text_decimate").onchange = function(){
		main_draw();
	}
	
	// �Ԉ����ݒ�{�{�^���������ꂽ���̏�����o�^
	document.getElementById("addDecimateButton").onclick = function(){
		var tmpTextbox = document.getElementById("text_decimate");
		
		if(parseInt(tmpTextbox.value) == 1){
			tmpTextbox.value = String(10);
		}else{
			tmpTextbox.value = String(parseInt(tmpTextbox.value) + 10);
		}
		main_draw();
	}
	
	// �Ԉ����ݒ�|�{�^���������ꂽ���̏�����o�^
	document.getElementById("decDecimateButton").onclick = function(){
		var tmpTextbox = document.getElementById("text_decimate");
		
		if(parseInt(tmpTextbox.value) <= 10){
			tmpTextbox.value = String(1);
		}else{
			tmpTextbox.value = String(parseInt(tmpTextbox.value) - 10);
		}
		main_draw();
	}
	
	// zoom�I�v�V����(x, y, x/y)�̑I�����ς�����Ƃ��Ɏ��s���鏈����o�^
	$("input[name='zoomOptionsRadios']").change(function(){change_zoom($(this).val());});
	
	// �}�E�X���ړ����邽�тɎ��s�����C�x���g
	document.onmousemove = mouse_move_draw;
	
	//============================================================================================//
	// �y�[�W�ǂݍ��ݎ��̏���                                                                     //
	//============================================================================================//
	// test code
	
	// �ϐ��̏����� ------------------------------------------------------------------------------//
	$('.item_list').empty();
	document.getElementById("text_decimate").value = "1";
	for(var i=0; i<100; i++){
		yrange.push([-1, 1]);
		yrange_fix.push(0);
	}
	
	// �\���̈�̐ݒ� (1��ʂɎ��܂�悤�ɕ��E������ݒ�) ----------------------------------------//
	chart_div_top = 120;											// �`���[�g�J�n����(�蓮�������ߑł�)
	bot_margin = 150;												// �`���[�g���ɕK�v�ȗ̈�(�蓮�������ߑł�)
	base_width = $(".time_chart_contents").width();					// �`���[�g�\���̈�̕����擾
	base_height = $(window).height() - chart_div_top - bot_margin;	// chart�I�u�W�F�N�g�̊J�n������window��������\���̈�̃x�[�X������ݒ�
	margin = {top:10,right:10,bottom:20,left:60};					// ���E�E�㉺�̃}�[�W����ݒ�
	chart_width = base_width - margin.left - margin.right;			// �`��̈敝�F�E�C���h�E������}�[�W�����������l
	chart_height = base_height - margin.top - margin.bottom;		// �`��̈捂�F�x�[�X��������}�[�W�����������l
	intTickPadding = 5;												// �ڐ��p��Padding�T�C�Y�w��
	
	// Debug Section
	// console.log("base_width:" + base_width);
	// console.log("base_height:" + base_height);
	// console.log("chart_width:" + chart_width);
	// console.log("chart_height:" + chart_height);
	// console.log("margin");
	// console.log(margin);
	
	// �h�L�������g�\���̈�̊e�[���v�Z ----------------------------------------------------------//
	// intHidariPos = (document.documentElement.clientWidth - document.getElementById("contents").clientWidth) / 2
	               // + (document.getElementById("main").offsetWidth - document.getElementById("time_chart").offsetWidth) / 2;
	// intMigiPos = (document.documentElement.clientWidth - document.getElementById("contents").clientWidth) / 2 + document.getElementById("contents").clientWidth;
	               // - (document.getElementById("main").offsetWidth - document.getElementById("time_chart").offsetWidth) / 2;
	intLeftPos = document.getElementById("time_chart_contents").getBoundingClientRect().left + margin.left;
	intRightPos = document.getElementById("time_chart_contents").getBoundingClientRect().right - margin.right;
	intTopPos = document.getElementById("time_chart").getBoundingClientRect().top + margin.top + intTickPadding;
	intBotPos = document.getElementById("time_chart").getBoundingClientRect().bottom - margin.bottom;
	
	// Debug Section
	// console.log("window.innerHeight = " + window.innerHeight);
	// console.log("window.innerWidth = " + window.innerWidth);
	// console.log("document.documentElement.clientHeight = " + document.documentElement.clientHeight);
	// console.log("document.documentElement.clientWidth = " + document.documentElement.clientWidth);
	// console.log("document.getElementById('contents').clientWidth = " + document.getElementById("contents").clientWidth);
	// console.log(document.getElementById("main").offsetWidth);
	// console.log(document.getElementById("main").clientWidth);
	// console.log(document.getElementById("data_source").offsetWidth);
	// console.log(document.getElementById("data_source").clientWidth);
	// console.log(document.getElementById("time_chart").offsetWidth);
	// console.log(document.getElementById("time_chart").clientWidth);
	// console.log(document.getElementById("time_chart").getBoundingClientRect().left);
	// console.log(document.getElementById("time_chart").getBoundingClientRect().top);
	console.log("intLeftPos = " + intLeftPos + ", intRightPos = " + intRightPos);
	console.log("intTopPos = " + intTopPos + ", intBotPos = " + intBotPos);
	
	// DataSource�I���̃`�F�b�N�{�b�N�X��z�u ----------------------------------------------------//
	var req = new XMLHttpRequest();							// HTTP�Ńt�@�C����ǂݍ��ނ��߂�XMLHttpRrequest�I�u�W�F�N�g�𐶐�
	req.open("get", "scripts/DataSource.csv", true);			// �A�N�Z�X����t�@�C�����w��
	req.send(null);											// HTTP���N�G�X�g�̔��s
	req.onload = () => {									// ���X�|���X���Ԃ��Ă����珈�����s
		// ���s�R�[�h�ōs���Ƃ̕�����ɕ���
		strDataSource = req.responseText.split('\n');		// �s���Ƃɕ������Ĕz��Ɏ��߂�
		
		// ��s���폜
		for(var i = 0; i < strDataSource.length; i++){
			if(strDataSource[i] == ""){
				strDataSource.splice(i, 1);
			}
		}
		
		strDataSourceLabel = strDataSource[0].split(',');	// �擪�̃��x���𒊏o
		strDataSource.shift()								// �擪�̖��O�s���폜
		
		// �ǂݎ�����f�[�^�����ɃI�u�W�F�N�g�쐬
		strDataSourceName = [];
		objDSArr = [];
		for(var i = 0; i < strDataSource.length; i++){
			var tmp = strDataSource[i].split(',');
			strDataSourceName.push(tmp[0]);
			objDSArr.push(new DataSource());
			objDSArr[i].strName = tmp[0];
			objDSArr[i].strPath = tmp[1];
			objDSArr[i].strSuffix = tmp[2];
			objDSArr[i].strDefaultPath = tmp[3];
		}
		
		// �擾�����e������Ń`�F�b�N�{�b�N�X��z�u
		add_checkbox_line(strDataSourceName, "source", set_target_dataset);
		$("#source" + "0").prop("checked", true);
		$("#source" + "1").prop("checked", true);
		objDSArr[0].enable = 1;
		objDSArr[1].enable = 1;
		
		// �����`��Ώۂ�I��
		date_cur = new Date('2020/01/6 00:00:00');
		date_min = new Date('2020/01/6 00:00:00');
		date_max = new Date('2020/01/6 00:00:00');
		
		data_load(date_cur, ADD_NONE);
		for(var i = 0; i < objDSArr.length; i++){
			if(objDSArr[i].enable == 1){
				objDSArr[i].getSettingFile();
			}
		}
		
		// console.log("�������`��I��Ώۃf�[�^");
		// console.log(currentFileName);
		console.log("objDSArr");
		console.log(objDSArr);
	}
});

//================================================================================================//
// SVG�v�f��d3���g�p���ăO���t�̖}���ǉ�����֐�                                                //
// ���� svg   : �}�Ⴊ�ǉ������Ώۂ�SVG�v�f                                                     //
//      users : users�v�f(�{������łȂ��Ă悢�̂ŁA�C��������)                                   //
//      pos_x : �}���`�悷��ʒu��x���W(�E�[�̈ʒu)                                             //
//      pos_y : �}���`�悷��ʒu��y���W(��[�̈ʒu)                                             //
// �ߒl �Ȃ�                                                                                      //
//================================================================================================//
function draw_legend(svg, users, pos_x, pos_y){
	var legend_base = svg.append("g")							// �}��p�̃O���[�v��ǉ�
		.attr("id","legend_base")
		.attr("class","legend_base")
		.attr("transform","translate(0, 0)");
	legend_base.append("rect");									// �}��g�p�̎l�p�`���ɕ`���Ă���
	
	var legend = legend_base.selectAll(".legend")
		.data(users)
		.enter()
		.append("g")
		.attr("class", "legend")
		.attr("transform", (d, i) => {return "translate(0, "+(i*20)+")"});
		
	legend.append("rect")										// �}��̐F�T���v���p�l�p�`�̕`��
		.attr("x", pos_x - 13)
		.attr("y", 8)
		.attr("width", 18)
		.attr("height", 18)
		// .style("fill", function(d, i){return color(d.name)});
		.style("fill", (d, i) => {return color_sample[i]});
	
	legend.append("text")										// �}��̃e�L�X�g�̕`��
		.attr("x", pos_x - 19)
		.attr("y", 16)
		.attr("dy", ".35em")
		.style("text-anchor","end")
		.text((d) => {return d.name;});
	
	var legend_base_width = document.getElementById("legend_base").getBBox().width;		// �e�L�X�g����(�����񒷂�)�����f�������}��g�̕����擾
	var legend_base_height = document.getElementById("legend_base").getBBox().height;		// �e�L�X�g����(���ڐ�)�����f�������}��g�̕����擾
	
	legend_base.select("rect")									// ���߂Ė}��S�̘g�̃T�C�Y�E�z�u���C��
		.attr("x", pos_x - legend_base_width)
		.attr("y", pos_y)
		.attr("rx", 5)
		.attr("ry", 5)
		.attr("width", legend_base_width + 10)
		.attr("height", legend_base_height + 10)
		.style("stroke", "#999")
		.style("stroke-width", 2)
		.style("fill", "#fff")
		.style("fill-opacity", 1.1);
	
	legend_base.call(d3.behavior.drag().on("drag", function(){	// �}����h���b�O�����Ƃ��Ɉړ������鏈��
		d3.select(this)
			.transition()
			.duration(50)
			.attr("transform", "translate(" + (d3.event.x - pos_x + 24) + ", " + (d3.event.y - 9) + ")")}
	));
}

//================================================================================================//
// �֐� add_checkbox_line : �`�F�b�N�{�b�N�X����ׂ�֐�                                          //
// ���l �`�F�b�N�{�b�N�X�ɂ͎w�肳�ꂽ�v���t�B�b�N�X��0����n�܂�A�Ԃ�ID�Ƃ��ĕt�^�����         //
//                                                                                                //
// ���� strName      : �`�F�b�N�{�b�N�X�̉��ɑ}������e�L�X�g                                     //
//      strIdPrefix  : �`�F�b�N�{�b�N�X��ID�ɒ�����v���t�B�b�N�X                                 //
//      onclick_func : �`�F�b�N�{�b�N�X���N���b�N�����Ƃ��Ɏ��s����֐�                           //
// �ߒl              : �Ȃ�                                                                       //
//================================================================================================//
function add_checkbox_line(strName, strIdPrefix, onclick_func){
	var checkbox_line = document.getElementById("data_source");
	
	for(var i = 0; i < strName.length; i++){
		var clabel = document.createElement("label");
		var cbox = document.createElement("input");
		
		cbox.type = "checkbox";
		cbox.id = strIdPrefix + i;
		cbox.value = strName[i];
		cbox.onclick = onclick_func;
		
		clabel.appendChild(cbox);
		clabel.appendChild(document.createTextNode(strName[i]));
		
		checkbox_line.appendChild(clabel);
	}
}

//================================================================================================//
// �֐� select_file : �t�@�C���^�C�v�E��������t�@�C���擾�̃p�X���擾����֐�                    //
// ���� intTDorST : �f�[�^�^�C�v�I�� ex) TYPE_DT - DATATRACE�p�ATYPE_ST - SignalTrace�p           //
//      strPath   : �Ώۃf�[�^�t�H���_�̃p�X ex) data/SIGNALTRACE/sth1/                           //
//      YYYY      : �N�̕����� ex) 2020                                                           //
//      MM        : ���̕����� ex) 1                                                              //
//      DD        : ���̕����� ex) 18                                                             //
//      HH        : ���̕����� ex) 12                                                             //
// �ߒl str       : �f�[�^�t�@�C���̃p�X                                                          //
//================================================================================================//
function select_file(intDTorST, strPath, strSuffix, YYYY, MM, DD, HH, mm){
	var str;
	
	if(intDTorST == TYPE_DT){
		str = strPath + YYYY + "�N" + ('0' + MM).slice(-2) + "��" + ('0' + DD).slice(-2) + "��/" + ('0' + HH).slice(-2) + "��/" + "AGC�ް�(1)" + YYYY + ('0' + MM).slice(-2) + ('0' + DD).slice(-2) + ('0' + HH).slice(-2) + ('0' + mm).slice(-2) + '.CSV';
	}
	else if(intDTorST == TYPE_ST){
		str = strPath + YYYY + "_" + ('0' + MM).slice(-2) + "/" + ('0' + DD).slice(-2) + "/" + YYYY + "_" + ('0' + MM).slice(-2) + "_" + ('0' + DD).slice(-2) + "_" + ('0' + HH).slice(-2) + "_00_00" + strSuffix;
	}
	else{
		console.log("Error at select_file function : intDTorST type is incollect.");
	}
	
	return str;
}

//================================================================================================//
// �֐� dateYYYYMMDDHHmm : Date�^����\���`�����ȑf�����ĕ������Ԃ��֐�                         //
// ���� date : �C�ӂ�Date�^�̕ϐ�                                                                 //
// �ߒl      : "YYYY/MM/DD HH:mm"�̂悤�ɔN���������̌`�̕�����                                   //
//================================================================================================//
function dateYYYYMMDDHHmm(date){
	var YYYY, MM, DD, HH;
	YYYY = date.getFullYear();
	MM = ('0' + date.getMonth() + 1).slice(-2);
	DD = ('0' + date.getDate()).slice(-2);
	HH = ('0' + date.getHours()).slice(-2);
	mm = "00"
	return(YYYY + "/" + MM + "/" + DD + " " + HH + ":" + mm);
}
