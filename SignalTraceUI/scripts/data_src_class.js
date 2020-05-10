//================================================================================================//
//                                                                                                //
// FILE : data_src_class.js                                                                       //
// MEMO : DataSourceオブジェクトを生成する関数の定義                                              //
//                                                                                                //
// UPDATE 20/05/06 : 元スクリプトが長くなって読みづらくなったので、別ファイルとして作成           //
//                   可搬性向上のためグローバル変数を使用する記述をクラス内で完結するように変更   //
//                                                                                                //
//================================================================================================//

//================================================================================================//
// Constants                                                                                      //
//================================================================================================//
// データファイルコントロール区分
const ADD_NONE = 0;
const ADD_NEXT = 1;
const ADD_BACK = 2;
const DEL_NEXT = 1;
const DEL_BACK = 2;

// ネーミングルール区分
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
	
	// main_draw関数はユーザー側で指定すること
	this.main_draw = function(){}				// データ取得後の描画処理で呼び出す関数
	this.item_list_clicked = function(){}		// アイテムリストがクリックされた時の処理
	this.getItemList = function(strFilename){}	// Future Works
	
	// 新しいデータを読み込み、末尾に追加する
	this.getNewDataFileNext = function(strFileName, intAdd){
		var dateFormat1 = d3.time.format("%Y/%m/%d %H:%M:%S.%L");
		var dateFormat2 = d3.time.format("\'%Y/%m/%d %H:%M:%S.%L");
		var getCSV = d3.dsv(',', 'text/csv; charset=shift-jis');
		
		// これまで読み込んだデータを引き継ぐかどうか設定
		if(intAdd == ADD_NONE){
			this.data_series = [];
		}else if(intAdd == ADD_NEXT){
		}else{
			console.log("getNewDataFileNext : Error intAdd is incorrect. intAdd = " + intAdd);
		}
		
		// データタイプに応じて読み込み処理を実施
		if(this.intDataType == TYPE_ST){
			getCSV(strFileName, (error, data) => {
				// data file
				data.forEach((d) => {d.HostTime = dateFormat1.parse(d.HostTime);});			// 文字列→日時変換
				data.forEach((d) => {d.SampleTime = dateFormat1.parse(d.SampleTime);});		// 文字列→日時変換
				
				// もしsample_num個でなかったらそれに合うように変更を加える
				var tmp_data = data;
				if(tmp_data.length < sample_num){					// sample_num個未満の場合
					var tmp_diff = sample_num - tmp_data.length;
					for(var i = 0; i < tmp_diff; i++){
						tmp_data.splice(parseInt(tmp_data.length * (i + 1) / tmp_diff - 1), 0, tmp_data[parseInt(tmp_data.length * (i + 1) / tmp_diff - 1)]);
					}
				}
				else if(data.length > sample_num){				// sample_num個超の場合
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
				// console.log("↓data");
				// console.log(data);
				// console.log("↓this.data_series");
				// console.log(this.data_series);
				// console.log("↓this.strDataItemList");
				// console.log(this.strDataItemList);
				// console.log("total_sample_num = " + total_sample_num);
				
				get_cnt = get_cnt + 1;
				if(get_cnt == get_num){
					this.main_draw();
					get_cnt = 0;
				}
			});
		}else if(this.intDataType == TYPE_DT){
			data.forEach(function(d){d.SampleTime = dateFormat2.parse(d.日付);});		// 文字列→日時変換
			this.strDataItemList.push(d3.keys(data[0]).filter(function(key){return (key!="日付" && key!="HostTime" && key!="N");}));	// dateだけは横軸用データのため除外
			
			// Future Works
		}
		return (0);
	}
	
	// 新しいデータを読み込み、先頭に追加する
	this.getNewDataFileBack = function(strFileName, intAdd){
		var dateFormat1 = d3.time.format("%Y/%m/%d %H:%M:%S.%L");
		var dateFormat2 = d3.time.format("\'%Y/%m/%d %H:%M:%S.%L");
		var getCSV = d3.dsv(',', 'text/csv; charset=shift-jis');
		
		// これまで読み込んだデータを引き継ぐかどうか設定
		if(intAdd == ADD_NONE){
			this.data_series = [];
		}else if(intAdd == ADD_BACK){
		}else{
			console.log("getNewDataFileBack : Error intAdd is incorrect. intAdd = " + intAdd);
		}
		
		// データタイプに応じて読み込み処理を実施
		if(this.intDataType == TYPE_ST){
			getCSV(strFileName, (error, data) => {
				// data file
				data.forEach((d) => {d.HostTime = dateFormat1.parse(d.HostTime);});			// 文字列→日時変換
				data.forEach((d) => {d.SampleTime = dateFormat1.parse(d.SampleTime);});		// 文字列→日時変換
				
				// もしsample_num個でなかったらそれに合うように変更を加える
				var tmp_data = data;
				if(tmp_data.length < sample_num){					// sample_num個未満の場合
					var tmp_diff = sample_num - tmp_data.length;
					for(var i = 0; i < tmp_diff; i++){
						tmp_data.splice(parseInt(tmp_data.length * (i + 1) / tmp_diff - 1), 0, tmp_data[parseInt(tmp_data.length * (i + 1) / tmp_diff - 1)]);
					}
				}
				else if(tmp_data.length > sample_num){				// sample_num個超の場合
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
				// console.log("↓data");
				// console.log(data);
				// console.log("↓this.data_series");
				// console.log(this.data_series);
				// console.log("↓this.strDataItemList");
				// console.log(this.strDataItemList);
				// console.log("total_sample_num = " + total_sample_num);
				
				// decimate_dataset();				// データを間引く処理
				this.main_draw();
			});
		}else if(this.intDataType == TYPE_DT){
			data.forEach(function(d){d.SampleTime = dateFormat2.parse(d.日付);});		// 文字列→日時変換
			this.strDataItemList.push(d3.keys(data[0]).filter(function(key){return (key!="日付" && key!="HostTime" && key!="N");}));	// dateだけは横軸用データのため除外
			
			// Future Works
		}
		return (0);
	}
	
	// データを削除
	this.delData = function(int_del){
		if(int_del == DEL_NEXT){
			this.data_series.splice(this.data_series.length - sample_num, sample_num);
		}else if(int_del == DEL_BACK){
			this.data_series.splice(0, sample_num);
		}else{
			console.log("delData : Error int_del is incorrect. int_del = " + int_del);
		}
	}
	
	// データの項目によってチェックボックスを追加
	this.createCheckBox = function(strId){
		item_list = document.getElementById(strId);
		var nodeLabel = document.createElement("label");
		nodeLabel.appendChild(document.createTextNode(this.strName));
		nodeLabel.className = "item_list_label";				// classNameの設定
		item_list.appendChild(nodeLabel);
		item_list.appendChild(document.createElement('br'));
		
		for(var i = 0; i < this.strDataItemList.length; i++){
			var cbLabel = document.createElement("label");
			var chkbox = document.createElement("input");
			
			chkbox.type = "checkbox";
			chkbox.value = this.strName + "_ch" + String(i);
			chkbox.id = this.strName + "_item" + String(i);
			chkbox.onclick = this.item_list_clicked;
			cbLabel.appendChild(document.createTextNode("　"));
			cbLabel.appendChild(chkbox);
			cbLabel.appendChild(document.createTextNode(this.strDataItemList[i]));
			cbLabel.className = "item_list_label";				// classNameの設定
			
			item_list.appendChild(cbLabel);
			item_list.appendChild(document.createElement('br'));
		}
		
		for(var i = 0; i < this.strName.length; i++){
			var tmp = document.getElementById(this.strName + '_item' + String(i));
			if(this.intDefaultOnList[i] == 1){
				tmp.checked = true;										// デフォルトでONに設定されているものはチェックしておく
				this.strDrawItemList.push(this.strDataItemList[i]);		// 描画するアイテムリストに追加
			}
		}
		
		return(0);
	}
	
	// 設定ファイルの読み取り
	this.getSettingFile = function(){
		var getCSV = d3.dsv(',', 'text/csv; charset=shift-jis');
		getCSV(this.strDefaultPath, (error, data) => {
			this.data_default = data;												// Default設定データを格納
			this.strDataItemList = data.map(function(d){return d["Name"]});			// アイテム名を配列の形で格納
			this.intDefaultOnList = data.map(function(d){return d["DefaultON"]});	// DefaultONを配列の形で格納
			this.strUnitList = data.map(function(d){return d["Unit"]});				// Unitを配列の形で格納
			this.intDataYminList = data.map(function(d){return d["ScaleMin"]});		// Unitを配列の形で格納
			this.intDataYmaxList = data.map(function(d){return d["ScaleMax"]});		// Unitを配列の形で格納
			this.createCheckBox(this.item_list_id);									// アイテムリストにアイテム名・チェックボックスを追加
			
			// console.log("this.dataDefault");
			// console.log(this.data_default);
			// console.log("this.strDataItemList");
			// console.log(this.strDataItemList);
			// console.log(this.intDefaultOnList);
		});
		
		return(0);
	}
}
