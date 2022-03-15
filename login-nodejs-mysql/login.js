const mysql = require("mysql");
const express = require("express");
const bodyParser = require("body-parser");
const encoder = bodyParser.urlencoded();
const logger = require("morgan")
var path = require('path');
var cookieParser = require('cookie-parser');
var jwt = require('jsonwebtoken');
var fs = require('fs');

var admin = require("firebase-admin");

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



const app = express();
app.use(cookieParser());
app.use(bodyParser.json());
app.use(logger("dev"))
app.use(bodyParser.urlencoded({ extended: false }))
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine("html", require("ejs").renderFile);


const test = require("./schedule")
const connection = require("./database");
const client = require("./Mqtt");
const { Console } = require("console");

app.get("/",isLoggedIn, function (req, res) {
    res.redirect('login');
})

app.get('/signup', (req, res) => {
    res.render("signup.html");
});
app.get('/login',LOGIN, (req, res) => {
    res.render('login');
});
app.get("/dashboard",isLoggedIn,(req,res)=>{
  client.publish("REEVA/HYDROPHONICS/34B4724F22C4/Action", "1", { qos: 0, retain: false }, (error) => {
    if (error) {
        console.error(error)
    }

}) 
setTimeout(() => {
    const data = fs.readFileSync("data.json", 'utf8');
    const DATA = JSON.parse(data)
    const fileData = fs.readFileSync("status.json", 'utf8');
    const object = JSON.parse(fileData)
    res.render("dashboard", {
        Data : DATA,
        Status: object
    });
}, 500);
})
app.post("/dashboard", encoder,isLoggedIn ,function (req, res) {
  var AirPump = req.body.AirPump;
  console.log(AirPump)
  
  client.publish("REEVA/HYDROPHONICS/34B4724F22C4/Action", "1", { qos: 0, retain: false }, (error) => {
      if (error) {
          console.error(error)
      }

  })      
      if(AirPump=="ON")
      {
         
          client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/2", "ON:100", { qos: 0, retain: false }, (error) => {
              
              if (error) {
                  console.error(error)
              }
          })
          const fileData = fs.readFileSync("status.json", 'utf8');
          const object = JSON.parse(fileData)
          fs.writeFileSync("status.json", JSON.stringify({ Pump: "ON" }, null, 2))
      }
      if(AirPump=="OFF")
      {
         
          client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/2", "OFF:0", { qos: 0, retain: false }, (error) => {
              
              if (error) {
                  console.error(error)
              }
          })
          const fileData = fs.readFileSync("status.json", 'utf8');
          const object = JSON.parse(fileData)
          fs.writeFileSync("status.json", JSON.stringify({ Pump: "OFF" }, null, 2))
      }
     
      setTimeout(() => {
      const data = fs.readFileSync("data.json", 'utf8');
      const DATA = JSON.parse(data)
      const fileData = fs.readFileSync("status.json", 'utf8');
      const object = JSON.parse(fileData)
      res.render("dashboard", {
          Data : DATA,
          Status: object
      });
      }, 500);
      
  

})
app.post("/sessionLogin", (req, res) => {
    const idToken = req.body.idToken.toString();
    const expiresIn = 60* 60*1* 1000;
    console.log(expiresIn)
  
    admin
      .auth()
      .createSessionCookie(idToken, { expiresIn })
      .then(
        (sessionCookie) => {
          const options = { maxAge: expiresIn, httpOnly: true };
          res.cookie("session", sessionCookie, options);
          res.end(JSON.stringify({ status: "success" }));
        },
        (error) => {
          res.status(401).send("UNAUTHORIZED REQUEST!");
        }
      );
  });

  app.get("/logout", (req, res) => {
    res.clearCookie("session");
    res.redirect("/login");
  });
  app.get("/resetpassword",(req,res)=>{
    res.render("resetpassword.html")
   })
   app.get("/schedule", isLoggedIn, function (req, res) {
    const fileData = fs.readFileSync("schedule.json", 'utf8');
    const object = JSON.parse(fileData)

    res.render("schedule", {
        ScheduleData: object
    });
})
test()

app.post("/schedule", isLoggedIn, function (req, res) {
    StartTime = req.body.starttime
    EndTime = req.body.endtime
    StartTime = StartTime.split(":");
    EndTime = EndTime.split(":");
    var date_ob = new Date();
    let minute = String(date_ob.getMinutes()).padStart(2, '0');
    time = date_ob.getHours() + ':' + minute;
    const fileData = fs.readFileSync("schedule.json", 'utf8');
    const object = JSON.parse(fileData)
    if (object.length === 0) {

        fs.writeFileSync("schedule.json", JSON.stringify([{ StartHr: StartTime[0], StartMin: StartTime[1], StartSec: StartTime[2], EndHr: EndTime[0], EndMin: EndTime[1], EndSec: EndTime[2] }], null, 2))
        client.publish("TEST", "1", { qos: 0, retain: false }, (error) => {
            if (error) {
                console.error(error)
            }
        })
    } else {

        object.push({ StartHr: StartTime[0], StartMin: StartTime[1], StartSec: StartTime[2], EndHr: EndTime[0], EndMin: EndTime[1], EndSec: EndTime[2] })
        fs.writeFileSync("schedule.json", JSON.stringify(object, null, 2))
        client.publish("TEST", "1", { qos: 0, retain: false }, (error) => {
            if (error) {
                console.error(error)
            }
        })


    }
    res.redirect("/schedule")
})
client.on('message', (topic, payload) => {
    if (topic === "TEST") {
        test()
    }
})
app.post("/delete", isLoggedIn, function (req, res) {
    const fileData = fs.readFileSync(`schedule.json`, 'utf8');
    const object = JSON.parse(fileData)
    index = object.findIndex(object => object.StartHr == req.query.StartHr && object.StartMin == req.query.StartMin)
    object.splice(index, 1)
    fs.writeFileSync("schedule.json", JSON.stringify(object, null, 2))
    client.publish("TEST", "1", { qos: 0, retain: false }, (error) => {
        if (error) {
            console.error(error)
        }
    })
    res.redirect("/schedule")
})


app.get("/analysis", isLoggedIn, function (req, res) {
    
    connection.query("select * from data", function (error, results, fields) {
        // console.log(results)
        var Temp = [];
        var Time = [];
        var date = [];
        var Humidity= [];
        var PH= [];
        var EC= [];

        for(var i in results)
        {
            Temp.push([results [i].Temp]);
            Time.push([results [i].Time]);
            date.push([results [i].Date]);
            Humidity.push([results [i].Humidity]);
            PH.push([results [i].PH]);
            EC.push([results [i].EC]);
        }
        res.render("analysis",{
            Temp :'',
            Time :'',
            Date :'',
            Humidity:'',
            PH : '',
            EC : ''
            });
    })
    
})
app.post("/analysis", isLoggedIn, function (req, res) {
    var Date = req.body.date.split('-');
    var Date = Date[0]+'/'+Date[1]+'/'+Date[2]
    // console.log("DATE",Date)
    // 2022-03-12
    // 2022/03/01
    connection.query("select * from data where Date = ?",[Date], function (error, results, fields) {
        // console.log(results)
        var Temp = [];
        var Time = [];
        var date = [];
        var Humidity= [];
        var PH= [];
        var EC= [];

        for(var i in results)
        {
            Temp.push([results [i].Temp]);
            Time.push([results [i].Time]);
            date.push([results [i].Date]);
            Humidity.push([results [i].Humidity]);
            PH.push([results [i].PH]);
            EC.push([results [i].EC]);
        }
        //  console.log(Temp)
        res.render("analysis",{
            Temp :Temp,
            Time :Time,
            Date :date,
            Humidity:Humidity,
            PH : PH,
            EC : EC
            });
    })
    
})
  function isLoggedIn(req, res, next) {   //To verify an incoming token from client
    const sessionCookie = req.cookies.session || "";
   
    admin
      .auth()
      .verifySessionCookie(sessionCookie, true /** checkRevoked */)
      .then((userData) => {
        console.log("Logged in:", userData.email)
        next()
      })
      .catch((error) => {
        res.redirect("/login");
      });
    
  }
  function LOGIN(req, res, next) {   //To verify an incoming token from client
    const sessionCookie = req.cookies.session || "";
   
    admin
      .auth()
      .verifySessionCookie(sessionCookie, true /** checkRevoked */)
      .then((userData) => {
        console.log("Logged in:", userData.email)
        res.redirect("/dashboard")
      })
      .catch((error) => {
        res.render("login");
      });
  }
 

app.listen(4000, () => {
    console.log(`server started 4000`)
});