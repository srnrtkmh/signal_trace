//================================================================================================//
//                                                                                                //
// FILE : usmoak_v3.js                                                                            //
// MEMO : Universal - Steal Mill Operation Analysing Kit のデータ表示部を担うJavaScript           //
//                                                                                                //
// UPDATE 16/08/26 : 紆余曲折あって今の形ができる                                                 //
//        16/08/27 : PATHのFILLをnoneにすることを覚えた                                           //
//                   ひたすらコメントを打ち込む作業、表示フォーマットをきれいにする作業           //
//        16/08/28 : 前データ・次データへの遷移を試みてみる → 簡単にはできた                     //
//                   横軸データにフィットできるようにdraw内の処理を変更                           //
//        16/09/03 : 日本語のcsv項目名を読めるようになった！                                      //
//                   各時系列のチェックボックスの追加・チェックに応じてチャート描画処理を追加     //
//                   凡例のデザイン変更                                                           //
//                   その他細かな修正                                                             //
//        16/09/04 : 複数グラフを別領域に表示できた！．．．が、フォーマットが大崩れした           //
//        16/10/29 : レイアウト変更、ライン選択追加、データソース選択追加、日時選択追加           //
//                   日付変数を使ってファイル名を指定するように変更、次データ・前データボタン改善 //
//        16/10/30 : いろいろ、DATATRACEのデータフォーマットに対応                                //
//                   縦軸範囲設定用処理を追加(課題が多い．．．)                                   //
//        20/01/10 : 新しいSIGNALTRACEに合うように変更                                            //
//        20/01/11 : 縦軸の拡大・縮小にも一定の目途                                               //
//        20/01/12 : データの追加・切替処理を分けられるように変更                                 //
//        20/01/13 : 複数データソースを描画できるように試みているが、苦戦中                       //
//                   できるようになったが、オブジェクト指向なプログラミング(？)にてだいぶ進歩     //
//                   それでも非同期の処理の順番が読み切れず少々非効率なことをやっている           //
//        20/01/16 : マウスの位置を表示、グラフ中にマウス位置に応じた線を追加                     //
//                   これからマウス位置とグラフ上の位置関係はすり合わせ予定                       //
//        20/01/18 : 間引き関数を再実装。マウス位置に応じた各グラフの値を表示する機能を追加       //
//                   前後データを削除する機能も追加                                               //
//                                                                                                //
//================================================================================================//

//================================================================================================//
// Constants                                                                                      //
//================================================================================================//
// ネーミングルール区分
const TYPE_ST = 0;
const TYPE_DT = 1;

// ライン選択区分
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

// レンジ区分
const RANGE_DEFAULT = 0;
const RANGE_SPECIAL = 1;

// データファイルコントロール区分
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

var chart_div_top, bot_margin, chart_width, chart_height;	// チャート描画領域のマージン・幅・高さ
var base_width, base_height;								// チャート描画領域(目盛も含む)の幅・高さ
var margin, intTickPadding;

var svg, xScale, yScale, xAxis, yAxis, line, user, users, eventArea;
var xMax, xMin;
var data_text;

// 読み取りファイル関係
var currentFileName = [];
var dataFile = [], dataFileDecimated = [];
var dataItemList = [], strItemListG = [];
var dataDefault = [];

// アイテムリスト
var item_list;

var kkk = 0;

// データソースオブジェクトの配列
var objDSArr = [];

// マウス位置保持用変数
var intClientX = 0, intClientY = 0;
var intGlobalX = 0, intGlobalY = 0;
var intScreenX = 0, intScreenY = 0;
var mouse_pos_x = 0, mouse_pos = 0;
var mouse_text_margin_x = 5, mouse_text_margin_y = 20;
var mouse_pos_date = 0, mouse_pos_index = 0;

// サンプル数の設定
var sample_num = 3600;
var total_sample_num = 3600;
var total_sample_num_mabiki = 3600;

// zoomの設定
var d3_zoom_scale = 1, d3_zoom_tx = 0, d3_zoom_ty = 0;

// 選択するファイルの日時情報
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
				
				main_draw();
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
				main_draw();
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
		main_draw();
	}
	
	// データの項目によってチェックボックスを追加
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
			cbLabel.className = "item_list_label";				// classNameの設定
			
			item_list.appendChild(cbLabel);
			item_list.appendChild(document.createElement('br'));
		}
		var tmp = document.getElementById(this.strName + '_item0');
		tmp.checked = true;										// 最初の1項目目をチェックしておく
		this.strDrawItemList.push(this.strDataItemList[0]);
		
		return(0);
	}
	
	// 設定ファイルの読み取り
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
// チェックボックスで選択アイテムが変更された時の処理                                             //
// 　⇒　チェックボックスの状態に応じて描画アイテムを追加                                         //
// 引数 
// 戻値 
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
// データを更新                                                                                   //
// 引数 
// 戻値 
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
// データの先頭または末尾を削除                                                                   //
// 引数 
// 戻値 
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
// 描画関数                                                                                       //
// 引数 
// 戻値 
//================================================================================================//
function main_draw(){
	data_merge();					// d3に渡せるように選択されたアイテムのデータを結合する
	sub_draw(RANGE_DEFAULT);		// 描画処理
	
	document.getElementById("min_date").textContent = dateYYYYMMDDHHmm(date_min);	// 読み取ったファイルの表示を更新
	document.getElementById("max_date").textContent = dateYYYYMMDDHHmm(date_max);	// 読み取ったファイルの表示を更新
	console.log(" ");
}

//================================================================================================//
// データ結合                                                                                     //
// 引数 
// 戻値 
//================================================================================================//
function data_merge(){
	total_sample_num = objDSArr[0].data_series.length;
	mabiki = parseInt(document.getElementById("text_decimate").value);		// 間引く分母を取得
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
	// console.log("↓users");
	// console.log(users);
}

//================================================================================================//
// データ配列を間引く関数                                                                         //
// 引数 
// 戻値 
//================================================================================================//
function decimate_dataset(dataset, num){
	tmp_dataset = [];
	
	for(var i = 0; i < dataset.length; i++){
		if(i % mabiki == 0){
			tmp_dataset.push(dataset[i]);
		}
	}
	
	// Debug Section
	// console.log("↓dataset");
	// console.log(dataset);
	// console.log("mabiki = " + mabiki);
	// console.log("↓tmp_dataset");
	// console.log(tmp_dataset);
	
	return(tmp_dataset);
}

//================================================================================================//
// 描画関数の続き(ファイル処理が必要ない描画変更はこれのみでOK)                                   //
// 引数 
// 戻値 
//================================================================================================//
function sub_draw(range_select){
	// 既存SVGを削除
	d3.select("svg").remove();
	
	// 横軸のScale・Axisの生成
	xScale = d3.time.scale().range([0,chart_width]);					// x軸方向の出力領域を設定(chart_width)、時間表示の場合
	// xScale = d3.scale.linear().range([0,chart_width]);					// x軸方向の出力領域を設定(chart_width)、linear表示の場合
	
	xAxis = d3.svg.axis()				// x軸目盛の設定関数を生成
		.scale(xScale)					// x軸のscale関数を登録
		.orient("bottom")				// 値の表示は下側
		.tickSize(-chart_height)		// 目盛長さ(外向きが正)
		.tickPadding(intTickPadding);	// x軸と目盛文字の間隔を設定
	
	// SVGを生成(幅・高さ・位置を設定)
	svg = d3.select("#chart").append("svg")
		.attr("width", base_width)		// SVGの幅設定
		.attr("height", base_height)		// SVGの高さ設定
		.append("g")						// 描画領域をmargin分平行移動させるgを作成
		.attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
	
	// クリップパスの設定
	svg.append("clipPath")
		.attr("id","clip")
		.append("rect")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", chart_width)
		.attr("height", chart_height)
	
	// x軸目盛描画適用、テキストの設定
	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + chart_height + ")")
		.call(xAxis);
	
	// チャートの描画を実行
	line = new Array;
	yScale = new Array;
	yAxis = new Array;
	user = new Array;
	var chart_height_div = chart_height / users.length;
	
	// 選択されたアイテム数だけy軸生成・チャート描画処理を実行
	for(i = 0; i < users.length; i++){
		// y軸Scale・y軸Axis・ライン関数を生成
		yScale[i] = d3.scale.linear()												// y軸方向の出力領域を設定
			.range([chart_height_div*i + chart_height_div, chart_height_div*i]);	// アイテムリストの上から順番に等間隔に出力領域を設定
		yAxis[i] = d3.svg.axis()				// y軸目盛の設定関数を生成
			.scale(yScale[i])					// y軸のscale関数を登録
			.orient("left")						// 値の表示は左側
			.tickSize(-chart_width)				// 目盛長さ(外向きが正)
			.tickPadding(5);					// y軸と目盛文字の間隔を設定
		line[i] = d3.svg.line().x(function(d){return xScale(d.date);}).y(function(d){return yScale[i](d.user_num);});	// 線画データ抽出の設定、x位置：名前dateの列、y位置：名前date以外の列
		
		// x軸・y軸のスケールに最大値・最小値を設定
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
			// testArea.on関数で変更されているはず．．．
		}
		
		yScale[i].domain([yrange[i][0], yrange[i][1]]);
		// console.log("xScale : " + xScale.domain());
		// console.log("yScale[" + i + "] : " + yScale[i].domain());
		
		// y軸目盛描画適用、テキストの設定
		svg.append("g")
			.attr("class", "y axis")
			.attr("transform", "translate(0, 0) rotate(0)")
			.call(yAxis[i]);
		
		// パスを描画
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
	
	// マウス操作のイベントエリア設定
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
		
	// 凡例の描画
	draw_legend(svg, users, chart_width - 15, 3);
	
	// 値軸範囲指定イベント発生領域
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
			var ymin = window.prompt(i + "値範囲下限");
			yrange[i][0] = ymin;
			var ymax = window.prompt(i + "値範囲上限");
			yrange[i][1] = ymax;
			// console.log("ymin : " + ymin + ", ymax : " + ymax);
			sub_draw(RANGE_SPECIAL);
		});
	
	// ズームドロー
	svg.select("g.x.axis").call(xAxis);
	for(i = 0; i < users.length; i++){
		svg.select("g.y.axis"+i).call(yAxis[i]);
		svg.select("path.line"+i)
			.attr("d", line[i](users[i]["values"]))
	}
	
	// マウス位置に応じた情報表示 -----------------------------------------------------------------//
	// マウス位置応じた参照線を書くためのline関数を定義(x, y)は配列の[0], [1]とする。
	var lineMouse = d3.svg.line()
		.x(function(d) {return d[0];})
		.y(function(d) {return d[1];});
	
	// マウス位置に応じて動くテキストのベースを作成
	data_text = [];
	for(i = 0; i < users.length; i++){
		data_text[i] = "";
	}
	
	// マウス位置(x)に応じた参照線の描画
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
	
	// マウス位置(x)位置に応じた参照線の描画
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
	
	// チャートコントロールの情報更新--------------------------------------------------------------//
	document.getElementById("data_length").textContent = "Data Sample : " + String(total_sample_num);
	document.getElementById("data_length_mabiki").textContent = "Draw Sample : " + String(total_sample_num_mabiki);
}

//================================================================================================//
// 拡大・縮小の処理を行う関数                                                                     //
// 引数 
// 戻値 
//================================================================================================//
function zoom_draw(){
	var event = d3.event;
	d3_zoom_scale = event.scale;		// スケール (現在の倍率)
	d3_zoom_tx = event.translate[0] ;	// トランスレート (X方向への移動距離)
	d3_zoom_ty = event.translate[1] ;	// トランスレート (Y方向への移動距離)
	// console.log("scale = " + d3_zoom_scale + ", tx = " + d3_zoom_tx + ", ty = " + d3_zoom_ty);
	
	svg.select("g.x.axis").call(xAxis);
	for(i = 0; i < users.length; i++){
		// svg.select("g.y.axis").call(yAxis[i]);
		svg.select("path.line"+i)
			.attr("d", line[i](users[i]["values"]))
	}
}

//================================================================================================//
// ズーム方向をx方向か、y方向か設定する関数                                                       //
// 引数 
// 戻値 
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
// マウスが動いた際にマウス連動の参照線・値表示を更新する関数                                     //
// 引数 
// 戻値 
//================================================================================================//
function mouse_move_draw(e){
		if(!e) e = window.event; // レガシー
		// console.log(e);
		
		// Client座標系でのマウス位置を表示
		intClientX = e.clientX;
		intClientY = e.clientY;
		
		// マウスポジションをチャート表示エリア座標系に変換
		mouse_pos_x = intClientX - intLeftPos;
		mouse_pos_y = intClientY - intTopPos;
		
		// マウス位置(x)に応じた横軸情報を取得
		mouse_pos_date = xScaleInv(mouse_pos_x);
		mouse_pos_index = limit(xScaleInvIndex(mouse_pos_date), 0, total_sample_num_mabiki - 1);
		// console.log("mouse_pos_date = " + mouse_pos_date + ", mouse_pos_index = " + mouse_pos_index);
		
		// マウス位置の線を描画
		// line関数を定義 (x,y)は配列の[0],[1]とする。
		var lineMouse = d3.svg.line()
			.x(function(d) {return d[0];})
			.y(function(d) {return d[1];});
		
		kkk = d3.select("#mouse_path_x");
		kkk.attr('d', lineMouse([[intClientX - intLeftPos - 1, 0], [intClientX - intLeftPos - 1, 3000]]))
		
		aaa = d3.select("#mouse_path_y");
		aaa.attr('d', lineMouse([[0, intClientY - intTopPos], [3000, intClientY - intTopPos]]))
		
		// マウス位置のデータ表示用テキストを描画
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
// チャートエリア上のx位置に対応する横軸値を返す関数                                              //
// 引数 
// 戻値 
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
// 横軸値に対応するデータ配列のインデックスを返す関数                                             //
// 引数 
// 戻値 
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
// 上下限リミットを掛ける関数                                                                     //
// 引数 x   : 上下限を掛ける評価対象                                                              //
//      min : 下限値                                                                              //
//      max : 上限値                                                                              //
// 戻値 tmp : 上下限リミットを掛けた後の数値(上下限を超えていなければそのまま)                    //
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
// YYMMDDHHの文字列から描画する対象ファイルを変更する処理                                         //
// 引数 
// 戻値 
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
// ターゲット系列を変更する処理                                                                   //
// 引数 
// 戻値 
//================================================================================================//
function set_target_dataset(){
	console.log("data_source_clicked");
}

//================================================================================================//
// Code                                                                                           //
//================================================================================================//
$(function(){
	var tooltip = d3.select("#chart").append("div").attr("class",　"tooltip").style("opacity",0);		// ツールチップ、まだ使えていない
	
	// 文字列→日時変換のフォーマット指定
	var dateFormat1 = d3.time.format("%Y/%m/%d %H:%M:%S.%L");
	var dateFormat2 = d3.time.format("\'%Y/%m/%d %H:%M:%S.%L");
	
	//============================================================================================//
	// イベントハンドラの登録                                                                     //
	//============================================================================================//
	// 描画ボタン処理
	document.getElementById("drawButton").onclick = function(){
		main_draw();
	}
	
	// 現在切替ボタン処理
	document.getElementById("changeNowButton").onclick = function(){
		data_load(date_cur, ADD_NONE);
	}
	
	// 前切替ボタン処理
	document.getElementById("changeBackButton").onclick = function(){
		date_cur.setHours(date_cur.getHours() - 1);
		date_min = new Date(date_cur);
		date_max = new Date(date_cur);
		data_load(date_cur, ADD_NONE);
	}
	
	// 次切替ボタン処理
	document.getElementById("changeNextButton").onclick = function(){
		date_cur.setHours(date_cur.getHours() + 1);
		date_min = new Date(date_cur);
		date_max = new Date(date_cur);
		data_load(date_cur, ADD_NONE);
	}
	
	// 前追加ボタン処理
	document.getElementById("addBackButton").onclick = function(){
		date_min.setHours(date_min.getHours() - 1);
		date_cur = new Date(date_min);
		data_load(date_cur, ADD_BACK);
	}
	
	// 次追加ボタン処理
	document.getElementById("addNextButton").onclick = function(){
		date_max.setHours(date_max.getHours() + 1);
		date_cur = new Date(date_max);
		data_load(date_cur, ADD_NEXT);
	}
	
	// 前削除ボタン処理
	document.getElementById("delBackButton").onclick = function(){
		date_min.setHours(date_min.getHours() + 1);
		date_cur = new Date(date_min);
		data_del(DEL_BACK);
	}
	
	// 次削除ボタン処理
	document.getElementById("delNextButton").onclick = function(){
		date_max.setHours(date_max.getHours() - 1);
		date_cur = new Date(date_max);
		data_del(DEL_NEXT);
	}
	
	// Date手入力用のテキストボックスの数値を反映させる更新ボタンが押された時の処理を登録
	$("#dateButton").click(function(){
		var str = document.getElementById("date_text").value;
		date_cur = new Date(dateChange(str));
		date_min = new Date(dateChange(str));
		date_max = new Date(dateChange(str));
		data_load(date_cur, ADD_NONE);
	});
	
	// 間引き設定用テキストボックス変更時の処理を登録
	document.getElementById("text_decimate").onchange = function(){
		main_draw();
	}
	
	// 間引き設定＋ボタンが押された時の処理を登録
	document.getElementById("addDecimateButton").onclick = function(){
		var tmpTextbox = document.getElementById("text_decimate");
		
		if(parseInt(tmpTextbox.value) == 1){
			tmpTextbox.value = String(10);
		}else{
			tmpTextbox.value = String(parseInt(tmpTextbox.value) + 10);
		}
		main_draw();
	}
	
	// 間引き設定－ボタンが押された時の処理を登録
	document.getElementById("decDecimateButton").onclick = function(){
		var tmpTextbox = document.getElementById("text_decimate");
		
		if(parseInt(tmpTextbox.value) <= 10){
			tmpTextbox.value = String(1);
		}else{
			tmpTextbox.value = String(parseInt(tmpTextbox.value) - 10);
		}
		main_draw();
	}
	
	// zoomオプション(x, y, x/y)の選択が変わったときに実行する処理を登録
	$("input[name='zoomOptionsRadios']").change(function(){change_zoom($(this).val());});
	
	// マウスを移動するたびに実行されるイベント
	document.onmousemove = mouse_move_draw;
	
	//============================================================================================//
	// ページ読み込み時の処理                                                                     //
	//============================================================================================//
	// test code
	
	// 変数の初期化 ------------------------------------------------------------------------------//
	$('.item_list').empty();
	document.getElementById("text_decimate").value = "1";
	for(var i=0; i<100; i++){
		yrange.push([-1, 1]);
		yrange_fix.push(0);
	}
	
	// 表示領域の設定 (1画面に収まるように幅・高さを設定) ----------------------------------------//
	chart_div_top = 120;											// チャート開始高さ(手動調整決め打ち)
	bot_margin = 150;												// チャート下に必要な領域(手動調整決め打ち)
	base_width = $(".time_chart_contents").width();					// チャート表示領域の幅を取得
	base_height = $(window).height() - chart_div_top - bot_margin;	// chartオブジェクトの開始高さとwindow高さから表示領域のベース高さを設定
	margin = {top:10,right:10,bottom:20,left:60};					// 左右・上下のマージンを設定
	chart_width = base_width - margin.left - margin.right;			// 描画領域幅：ウインドウ幅からマージンを引いた値
	chart_height = base_height - margin.top - margin.bottom;		// 描画領域高：ベース高さからマージンを引いた値
	intTickPadding = 5;												// 目盛用のPaddingサイズ指定
	
	// Debug Section
	// console.log("base_width:" + base_width);
	// console.log("base_height:" + base_height);
	// console.log("chart_width:" + chart_width);
	// console.log("chart_height:" + chart_height);
	// console.log("margin");
	// console.log(margin);
	
	// ドキュメント表示領域の各端を計算 ----------------------------------------------------------//
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
	
	// DataSource選択のチェックボックスを配置 ----------------------------------------------------//
	var req = new XMLHttpRequest();							// HTTPでファイルを読み込むためのXMLHttpRrequestオブジェクトを生成
	req.open("get", "scripts/DataSource.csv", true);			// アクセスするファイルを指定
	req.send(null);											// HTTPリクエストの発行
	req.onload = () => {									// レスポンスが返ってきたら処理続行
		// 改行コードで行ごとの文字列に分割
		strDataSource = req.responseText.split('\n');		// 行ごとに分解して配列に収める
		
		// 空行を削除
		for(var i = 0; i < strDataSource.length; i++){
			if(strDataSource[i] == ""){
				strDataSource.splice(i, 1);
			}
		}
		
		strDataSourceLabel = strDataSource[0].split(',');	// 先頭のラベルを抽出
		strDataSource.shift()								// 先頭の名前行を削除
		
		// 読み取ったデータを元にオブジェクト作成
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
		
		// 取得した各文字列でチェックボックスを配置
		add_checkbox_line(strDataSourceName, "source", set_target_dataset);
		$("#source" + "0").prop("checked", true);
		$("#source" + "1").prop("checked", true);
		objDSArr[0].enable = 1;
		objDSArr[1].enable = 1;
		
		// 初期描画対象を選択
		date_cur = new Date('2020/01/6 00:00:00');
		date_min = new Date('2020/01/6 00:00:00');
		date_max = new Date('2020/01/6 00:00:00');
		
		data_load(date_cur, ADD_NONE);
		for(var i = 0; i < objDSArr.length; i++){
			if(objDSArr[i].enable == 1){
				objDSArr[i].getSettingFile();
			}
		}
		
		// console.log("↓初期描画選択対象データ");
		// console.log(currentFileName);
		console.log("objDSArr");
		console.log(objDSArr);
	}
});

//================================================================================================//
// SVG要素にd3を使用してグラフの凡例を追加する関数                                                //
// 引数 svg   : 凡例が追加される対象のSVG要素                                                     //
//      users : users要素(本来これでなくてよいので、修正したい)                                   //
//      pos_x : 凡例を描画する位置のx座標(右端の位置)                                             //
//      pos_y : 凡例を描画する位置のy座標(上端の位置)                                             //
// 戻値 なし                                                                                      //
//================================================================================================//
function draw_legend(svg, users, pos_x, pos_y){
	var legend_base = svg.append("g")							// 凡例用のグループを追加
		.attr("id","legend_base")
		.attr("class","legend_base")
		.attr("transform","translate(0, 0)");
	legend_base.append("rect");									// 凡例枠用の四角形を先に描いておく
	
	var legend = legend_base.selectAll(".legend")
		.data(users)
		.enter()
		.append("g")
		.attr("class", "legend")
		.attr("transform", (d, i) => {return "translate(0, "+(i*20)+")"});
		
	legend.append("rect")										// 凡例の色サンプル用四角形の描画
		.attr("x", pos_x - 13)
		.attr("y", 8)
		.attr("width", 18)
		.attr("height", 18)
		// .style("fill", function(d, i){return color(d.name)});
		.style("fill", (d, i) => {return color_sample[i]});
	
	legend.append("text")										// 凡例のテキストの描画
		.attr("x", pos_x - 19)
		.attr("y", 16)
		.attr("dy", ".35em")
		.style("text-anchor","end")
		.text((d) => {return d.name;});
	
	var legend_base_width = document.getElementById("legend_base").getBBox().width;		// テキスト長さ(文字列長さ)も反映させた凡例枠の幅を取得
	var legend_base_height = document.getElementById("legend_base").getBBox().height;		// テキスト高さ(項目数)も反映させた凡例枠の幅を取得
	
	legend_base.select("rect")									// 改めて凡例全体枠のサイズ・配置を修正
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
	
	legend_base.call(d3.behavior.drag().on("drag", function(){	// 凡例をドラッグしたときに移動させる処理
		d3.select(this)
			.transition()
			.duration(50)
			.attr("transform", "translate(" + (d3.event.x - pos_x + 24) + ", " + (d3.event.y - 9) + ")")}
	));
}

//================================================================================================//
// 関数 add_checkbox_line : チェックボックスを並べる関数                                          //
// 備考 チェックボックスには指定されたプレフィックスと0から始まる連番がIDとして付与される         //
//                                                                                                //
// 引数 strName      : チェックボックスの横に挿入するテキスト                                     //
//      strIdPrefix  : チェックボックスのIDに着けるプレフィックス                                 //
//      onclick_func : チェックボックスをクリックしたときに実行する関数                           //
// 戻値              : なし                                                                       //
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
// 関数 select_file : ファイルタイプ・日時からファイル取得のパスを取得する関数                    //
// 引数 intTDorST : データタイプ選択 ex) TYPE_DT - DATATRACE用、TYPE_ST - SignalTrace用           //
//      strPath   : 対象データフォルダのパス ex) data/SIGNALTRACE/sth1/                           //
//      YYYY      : 年の文字列 ex) 2020                                                           //
//      MM        : 月の文字列 ex) 1                                                              //
//      DD        : 日の文字列 ex) 18                                                             //
//      HH        : 時の文字列 ex) 12                                                             //
// 戻値 str       : データファイルのパス                                                          //
//================================================================================================//
function select_file(intDTorST, strPath, strSuffix, YYYY, MM, DD, HH, mm){
	var str;
	
	if(intDTorST == TYPE_DT){
		str = strPath + YYYY + "年" + ('0' + MM).slice(-2) + "月" + ('0' + DD).slice(-2) + "日/" + ('0' + HH).slice(-2) + "時/" + "AGCﾃﾞｰﾀ(1)" + YYYY + ('0' + MM).slice(-2) + ('0' + DD).slice(-2) + ('0' + HH).slice(-2) + ('0' + mm).slice(-2) + '.CSV';
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
// 関数 dateYYYYMMDDHHmm : Date型から表示形式を簡素化して文字列を返す関数                         //
// 引数 date : 任意のDate型の変数                                                                 //
// 戻値      : "YYYY/MM/DD HH:mm"のように年月日時分の形の文字列                                   //
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
