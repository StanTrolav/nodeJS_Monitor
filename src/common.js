 function getDateTime (delimiterD = '', delimiterT = '', delimiterP = '', delimiterZ = '') {
    let date = new Date();
    //date = date + 1258894;
    let hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    let min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    let sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    let day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    return year + delimiterD + month + delimiterD + day + delimiterP + hour + delimiterT + min + delimiterT + sec + delimiterZ;
};

module.exports.getDateTime = getDateTime;

function getDate(delimiter) {
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    let day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    return year + delimiter + month + delimiter + day;
};

module.exports.getDate = getDate;

function JsonToCSV(objArray, delimetr = ',') {
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    //Это преобразование не выгружает заголовки полей
    var str = '';   
    for (var i = 0; i < array.length; i++) {
        var line = '';
        for (var index in array[i]) {
            if (line != '') line += delimetr
            line += array[i][index];
        }
        str += line + '\r\n';
    }
    return str;
};

module.exports.JsonToCSV = JsonToCSV;

function checkFile(path) {
    //Проверка наличия файла на диске
    try{
        return fs.statSync(path).isFile();
    } catch (ex) {}
    return false;
};

module.exports.checkFile = checkFile;

function moveFile(filepath, targetDir = './archive'){
    var oldfilepath = filepath;
    var oldfile = filepath.replace(/^.*[\\\/]/,'');
    var newfilepath = targetDir + '\\' + oldfile;

    if (!fs.existsSync(targetDir)){
    fs.mkdirSync(targetDir);
    };
    //Архивная папка создана

    fs.rename(oldfilepath, newfilepath, function (err)
    {if (err) throw err
        //console.log('Moved ' + oldfilepath +' to ' + newfilepath);
    });
    //файл перемещён без подтверждения замены. Одноимённые файлы перетираются
};

module.exports.moveFile = moveFile;

function dhms(ms){
    //Конвертер милисекунд в дни:часы:минуты:секунды
    days = Math.floor(ms / (24*60*60*1000));
    daysms=ms % (24*60*60*1000);
    hours = Math.floor((daysms)/(60*60*1000));
    hoursms=ms % (60*60*1000);
    minutes = Math.floor((hoursms)/(60*1000));
    minutesms=ms % (60*1000);
    sec = Math.floor((minutesms)/(1000));
        //Привожу к формату 2 символов
        if(sec < 10) {sec_2 = '0'+ sec} else {sec_2 = sec};
        if(minutes < 10) {minutes_2 = '0'+ minutes} else {minutes_2 = minutes};
        if(hours < 10) {hours_2 = '0'+ hours} else {hours_2 = hours};
    return days+":"+hours_2+":"+minutes_2+":"+sec_2;
};

module.exports.dhms = dhms;

function formatBytes(bytes,decimals = 2) {
    //Байты в мегабайты и йотабайты
   if(bytes == 0) return '0 Bytes';
   var k = 1024,
       dm = decimals,
       sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
       i = Math.floor(Math.log(bytes) / Math.log(k));
   return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports.formatBytes = formatBytes;

function CMDComand(MyCMDComand){
//const exec = require('child_process').exec;
    //Запуск процесса из командной строки хостовой машины
child_process.exec(MyCMDComand.toString()
    , function(err, stdout, stderr) {
        if( err instanceof Error) {
            console.error(err)
            throw err;
            }
            console.log('Результат команды: \n', stdout);
    });
};