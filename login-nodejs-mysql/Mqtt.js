const mqtt = require('mqtt')
const cron = require('node-cron');
const con = require('./database.js')
const fs = require("fs");

const host = '13.233.193.235'
const port = '1883'
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`

const connectUrl = `mqtt://${host}:${port}`
const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: 'emqx',
  password: 'public',
  reconnectPeriod: 1000,
})
const topic = "REEVA/HYDROPHONICS/34B4724F22C4/Action"
client.on('connect', () => {
  console.log('Connected')
  client.subscribe("REEVA/HYDROPHONICS/34B4724F22C4/DHT12/Temp", () => {
    console.log(`Subscribe to topic '${topic}'`)
  })
  client.subscribe("TEST", () => {
    console.log(`Subscribe to topic '${topic}'`)
  })
  client.subscribe("REEVA/HYDROPHONICS/34B4724F22C4/DHT12/Humidity", () => {
    console.log(`Subscribe to topic '${topic}'`)
  })
})

var flag = 0
var time = 0
var date = 0
cron.schedule(' */30 * * * *', () => {
  console.log("Calling")
  //  '0 */5 * * * *
  getdata();

});

var Temp, humidity,PH,EC
function getdata() {
  client.publish(topic, "1", { qos: 0, retain: false }, (error) => {
    if (error) {
      console.error(error)
    }
  })
}

client.on('message', (topic, payload) => {
  if (topic === "REEVA/HYDROPHONICS/34B4724F22C4/DHT12/Temp") {
    Temp = payload.toString();
    console.log("TEMP",Temp)

  }
  else if (topic === "REEVA/HYDROPHONICS/34B4724F22C4/DHT12/Humidity") {
    humidity = payload.toString();
    console.log("Humidity",humidity)
   
  }
  else if (topic === "REEVA/HYDROPHONICS/34B4724F22C4/EC/EC") {
    humidity = payload.toString();
    console.log("EC",EC)
   
  }
  else if (topic === "REEVA/HYDROPHONICS/34B4724F22C4/PH/PH") {
    humidity = payload.toString();
    console.log("PH",PH)
    savedata(Temp, humidity,EC,PH)
  }
;
})

function savedata(Temp, humidity,EC,PH) {
  var date_ob = new Date();
  flag = 0
  let day = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let minute = String(date_ob.getMinutes()).padStart(2, '0');
  time = date_ob.getHours() + ':' + minute + ':' + date_ob.getSeconds();
  date = date_ob.getFullYear() + '/' + month + '/' + day;

  

  if (Temp > 28) {
    Fan = "ON"

    client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/1", "ON:100", { qos: 0, retain: false }, (error) => {
      if (error) {
        console.error(error)
      }
    })
  }
  else {
    Fan = "OFF"
    client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/1", "OFF:0", { qos: 0, retain: false }, (error) => {
      if (error) {
        console.error(error)
      }
    })
  }

  console.log(time)
  //Temp="22.0"
  
  var sql = "INSERT INTO data (Temp,Humidity,EC,PH,Time,Date,Fan) VALUES (?,?,?,?,?,?,?);"
  con.query(sql, [Temp, humidity, EC, PH, time, date, Fan], function (err, result) {
    if (err) throw err;
    console.log("1 record inserted");
  });
  // const fileData = fs.readFileSync("data.json", 'utf8');
  // const object = JSON.parse(fileData)
  fs.writeFileSync("data.json", JSON.stringify([{ Temp: Temp, Humidity: humidity, EC: t2, PH: t3, Time: time, Date: date, Fan: Fan }], null, 2));
  time = 0
  Fan = ""

}



module.exports = client;
