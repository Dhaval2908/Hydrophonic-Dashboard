const mqtt = require('mqtt')
const cron = require('node-cron');
const con = require('./database.js')

const host = '15.207.111.161'
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
const topic = 'User/Action'
client.on('connect', () => {
  console.log('Connected')
  client.subscribe("DHT12/Temp", () => {
    console.log(`Subscribe to topic '${topic}'`)
  })
  client.subscribe("DHT12/Humidity", () => {
    console.log(`Subscribe to topic '${topic}'`)
  })
})
  
var flag=0
var time=0
var date=0
cron.schedule('0 */5 * * * *', () => {
   console.log("Calling")
  //  '0 */5 * * * *
    getdata();
    
});
var Temp,humidity
function getdata()
{
  client.publish(topic, "1", { qos: 0, retain: false }, (error) => {
    if (error) {
      console.error(error)
    }
  })

}

  client.on('message', (topic, payload) => {
    
    console.log(payload.toString())
    if (topic === "DHT12/Temp") {
      Temp = payload.toString();
      flag++;
    }
    else if (topic === "DHT12/Humidity") {
      humidity = payload.toString();
      console.log(humidity)
      flag++;
      

    }
    console.log("flag",flag)

  if (flag==2)
  {
    console.log(flag)
    savedata(Temp, humidity)
  }

  })
  
 
   
function savedata(Temp,humidity)
{
  var date_ob = new Date();
  flag = 0
  console.log("humidity",humidity)
  if (humidity === 'NULL')
  {
    humidity = '5.5'
  }
  let day = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let minute =String(date_ob.getMinutes()).padStart(2, '0');
  time =date_ob.getHours()+':'+minute+':'+date_ob.getSeconds();
  date =date_ob.getFullYear()+'/'+month+'/'+day;
  console.log(time)
  console.log(date)
  var t2 = "53"
  var t3 = "54"
  var sql = "INSERT INTO data (Temp,Humidity,EC,PH,Time,Date) VALUES (?,?,?,?,?,?);"
  con.query(sql, [Temp, humidity, t2, t3,time,date], function (err, result) {
    if (err) throw err;
    console.log("1 record inserted");
  });
  time =0
  console.log(time)
}



module.exports = client;
