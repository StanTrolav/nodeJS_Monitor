const fs = require('fs');
const logDir = "./log";
const os = require('os');

if (!fs.existsSync(logDir)){
    fs.mkdirSync(logDir);
}

function getDateTime() {
    let date = new Date();
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
    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;
}

function getDate(delimiter) {
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    let day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    return year + delimiter + month + delimiter + day;
}

module.exports = function(message, filePartName = "", isWriteToFile, level = "INFO", isShowConsole = true) {
    let editedMessage = getDateTime() + " " +  level + ": " + message;//os.hostname() + " " + os.userInfo().username + " " + getDateTime() + " " +  level + ": " + message
    if (isShowConsole) {
        console.log(editedMessage);
    }
    if (isWriteToFile) {
        let fileName = logDir + '/' + filePartName + getDate("") + '.log';
        fs.appendFileSync(fileName, editedMessage + '\r\n', 'utf-8');
    }
}