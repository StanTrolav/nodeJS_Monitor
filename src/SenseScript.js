//Загрузка данных из Qlik Sense
const log = require('./Logger'); //Логирование работы сервиса на диск
var myFunction = require('./common');

module.exports = function (SenseObjId, SenseAppId, SenseServer, NeedSave = 0, filePartName = 'SENSE', rows){
//function GetSenseTable(SenseObjId, SenseAppId, SenseServer, NeedSave = 0, filePartName = 'SENSE'){

	log('Sense export started. ' + SenseServer + '\\' + SenseAppId + '\\' + SenseObjId, 'QS_BH_Whisperer_', true, 'INFO', true);
	//подключение модулей
	var WebSocket = require('ws');
	var fs = require('fs');
	client_pem_file 	= './certificats/' + SenseServer + '/client.pem';
	client_key_pem_file = './certificats/' + SenseServer + '/client_key.pem';
	root_pem_file 		= './certificats/' + SenseServer + '/root.pem';


	//устанавливаем соединение
		//проверяю наличие корневых сертификаторв для подключения
		certificates_check = {
		cert: fs.existsSync(client_pem_file),
	    key:  fs.existsSync(client_key_pem_file),
	    root: fs.existsSync(root_pem_file)
		};

		if(!certificates_check.cert || !certificates_check.key || !certificates_check.key) {
			log("Can't find certificate files.", 'QS_BH_Whisperer_', true, 'INFO', true);
			//Дальше функция падает сама с ошибкой
		};

		//console.log(JSON.stringify(certificates_check));

	var certificates = {
		cert: fs.readFileSync(client_pem_file),
	    key:  fs.readFileSync(client_key_pem_file),
	    root: fs.readFileSync(root_pem_file)
		};

	var ws = new WebSocket('wss://'+ SenseServer + ':4747/app/', {
			ca: certificates.root,
			cert: certificates.cert,
			key: certificates.key,
			headers: {
				'X-Qlik-User':  'UserDirectory=internal; UserId=sbt-qs-service'
			}
	});

	// id объекта
	var objectID = SenseObjId;

	//количество строк из таблицы
	finalObjectArray = [];
	//открываем соединение чтобы выполнять запросы
	promise = new Promise((resolve, reject) => {
		ws.onopen = function (event) {
		    var OpenDoc = {
				"method": "OpenDoc",
				"handle": -1,
				"params": [
					SenseAppId
				],
				"outKey": -1,
				"id": 1
			}

			var msg_GetActiveDoc = {
				"handle": -1,
				"method": "GetActiveDoc",
				"params": {}
			}

			var GetObject = {
				"handle": 1,
				"method": "GetObject",
				"params": {
					"qId": objectID
				}
			}

			var GetLayout = {
				"handle": 2,
				"method": "GetLayout",
				"params": {},
				"outKey": -1,
				"id": 3
			}

			var msgArray = [OpenDoc, msg_GetActiveDoc, GetObject, GetLayout];
			send_msg(msgArray, function() {
				resolve(finalObjectArray);
				//console.log(finalObjectArray);
			});	
		};
	});

	//обработка запросов для подключения к таблице
	function send_msg(msgArray, callback) {

		if (msgArray.length != 0) {
			ws.send(JSON.stringify(msgArray[0]));
			ws.onmessage = function(event) {
				msgArray.splice(0,1);
				send_msg(msgArray, callback);
				response = JSON.parse(event.data);
				//callback(response);	
			}
		} else {
			ws.onmessage = function (event) {
				//вытаскиваем итоговые результаты
				var response = JSON.parse(event.data);
				var filds = [];
				
				var dimensions = response.result.qLayout.qHyperCube.qDimensionInfo;
				var measures = response.result.qLayout.qHyperCube.qMeasureInfo; 
				objectHead = {};
			  	dimensions.forEach(function(item, dimensions) {
			  		filds.push({"name":item.qFallbackTitle});
			  	});
				
				//определяем выводить или нет итоги
				
				/*if (response.result.qLayout.totals != undefined) {
					if (response.result.qLayout.totals.show) {
						var grandTotalRow = response.result.qLayout.qHyperCube.qGrandTotalRow;
						
					  	var sum = [];
					  	grandTotalRow.forEach(function(item, grandTotalRow) {
					  		sum.push(item.qText);
					  	});
					  	//console.log(sum);
					  	//вытаскиваем все поля			  	
					  	measures.forEach(function(item, i, measures) {
					  		filds.push({"name":item.qFallbackTitle,
					  					"value": sum[i]});
					  	});	
					  	
					  	filds.forEach(function(item, i, filds){
					  		if (item.value == undefined) {
					  			objectHead[item.name] = '';
					  		} else {
					  			objectHead[item.name] = item.value;
					  		}
					  	})
					  	//objectHead[filds[0].name] = response.result.qLayout.totals.label;

				  	} else {
				  		measures.forEach(function(item, i, measures) {
				  			filds.push({"name":item.qFallbackTitle});
				  		})
				  	};
				  	} else {
				  		*/
				  		measures.forEach(function(item, i, measures) {
				  			filds.push({"name":item.qFallbackTitle});
				  		})
				  	//}
			  	
			  	//Проверка, передано ли количество строк
			  	if (rows == undefined) {
			  		rows = response.result.qLayout.qHyperCube.qDimensionInfo[0].qCardinal;
			  	}
			  	var length = filds.length;
			  	//создаю массив из типовых объектов
			  	objectFildsArray = [];
			  	cellsArray = [];
			  	csvArray = [];
			  	valueArray = valueArray(filds);
			  	objectArray = [];
				GetValue(valueArray, length, function() {
					callback();
				});

			}
		}
	}

	//формирование заготовки для JSON и запросов для	
	function valueArray(filds) {
		var getValueArray = [];
		
		for (var i = 0; i < rows; i++) {
			var object = {};
			for (var j = 0; j < filds.length; j++) {
				var GetHyperCubeData = {
					"handle": 2,
					"method": "GetHyperCubeData",
					"params": {
						"qPath": "/qHyperCubeDef",
							"qPages": [
							{
								"qLeft": j,
								"qTop": i,
								"qWidth": 1,
								"qHeight": 1
							}
						]
						},
					"outKey": -1,
					"id": 5
				}
				object[filds[j].name] = '';
				objectFildsArray.push(filds[j].name);
				getValueArray.push(GetHyperCubeData);
			}
		finalObjectArray.push(object);
		}	
		return getValueArray;
	};

	//функция для формирования JSON
	function GetValue(msgArray, length, callback) {	
		if (msgArray.length != 0){
			ws.send(JSON.stringify(msgArray[0]));
			ws.onmessage = function(event) {
				response = JSON.parse(event.data);
				objectArray.push(response.result.qDataPages[0].qMatrix[0][0].qText);
				msgArray.splice(0,1);
				GetValue(msgArray, length, callback);
			}				
		} else {
			finalObjectArray.forEach(function (item, i, finalObjectArray) {
				for (key in item) {
					item[key] = objectArray[0];
					objectArray.splice(0,1);
				}
			})
			//вставляем первый элемент с итогами (если он есть)
			if (Object.keys(objectHead).length!= 0) {
				finalObjectArray.unshift(objectHead);
			}
			
			//Сохранение файла, если нужно.
			if(NeedSave == 1) {
				if (!fs.existsSync('./datafiles')){
					    fs.mkdirSync('./datafiles');
					}
					let fileName = './datafiles/' + filePartName + '_' + myFunction.getDateTime('') + '.JSON'; //ISU_TASKS_DATA_20180827101923.csv
					fs.writeFile(fileName, JSON.stringify(finalObjectArray), 'utf-8', (err) => 
						{
							if(err) throw err;
							log('Sense Object ' + objectID + ' saved to disk. FilePath: ' + fileName, 'QS_BH_Whisperer_', true, 'INFO', true);
						}
					);
			};

			ws.close();
			callback();
		};//Условие закрыто		
	};

};//GetSenseTable закрыт


//GetSenseTable(SenseObjId = 'WDQmwdu', SenseAppId = '97b10d85-f1ec-4c65-af91-e8415b7a96cb', SenseServer = 'sbt-ouiefs-0104.ca.sbrf.ru');
//GetSenseTable(SenseObjId = 'WDQmwdu', SenseAppId = '97b10d85-f1ec-4c65-af91-e8415b7a96cb', SenseServer = 'sbt-ouiefs-0104.ca.sbrf.ru', NeedSave = 0, filePartName = 'deviation');