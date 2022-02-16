const mysql = require("mysql");
const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan")
var path = require('path');
var cookieParser = require('cookie-parser');
var jwt = require('jsonwebtoken');

const app = express();
app.use(cookieParser());
app.use(bodyParser.json());
app.use(logger("dev"))
app.use(bodyParser.urlencoded({ extended: false }))
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use("/assets", express.static("assets"));

const connection = require("./database");
const client = require("./Mqtt");
const { Console } = require("console");

app.get("/", function (req, res) {
    res.redirect('/index1');
})

app.get('/test', (req, res) => {
    res.render('test', {
        message: ''
    });
});
app.get('/index1', (req, res) => {
    res.render('index1', {
        message: ''
    });
});


app.post("/", function (req, res) {
    var username = req.body.username;
    var password = req.body.password;

    connection.query("select * from test where username = ? ", [username], function (error, results, fields) {
        console.log(results)

        if (results.length > 0) {
            results.forEach(data => {
                if (data.password == password) {
                    const token = jwt.sign({
                        email: data.username,
                    }, 'test secret', { expiresIn: '3h' });
                    // Set session expiration to 3 hr.
                    console.log(token)
                    const expiresIn = 60 * 60* 3 * 1000;
                    console.log(60*60*3*1000)
                    const options = { maxAge: 60 * 60* 3 * 1000 , httpOnly: true };
                    res.cookie('token', token, options);
                    // res.cookie('id', user[0].id, options);
                    res.redirect("/dashboard")
                }
                else {
                    res.render("index1", {
                        message: "Password Does Not Match"
                    });
                }
            });
        }
        else {
            res.render("index1", {
                message: "User Does not exist"
            });
        }



    })
})
app.post("/test", function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var repassword = req.body.repassword;
    connection.query("select * from test where username = ? ", [username], function (error, results, fields) {
        if (results.length > 0) {
            res.render("test", {
                message: "User is already exist"
            });
        }
        else {
            if (password == repassword) {
                connection.query("INSERT INTO test (username, password) VALUES (?, ?);", [username, password], function (error, results, fields) {
                    if (results.length > 0) {
                        res.render("/")

                    }
                    else {
                        res.redirect("/");

                    }
                    res.end();
                })
            }
            else {
                res.render("test", {
                    message: "Password Does Not Match"
                });
            }
        }

    })


})
app.get("/dashboard", isLoggedIn, function (req, res) {
    var sql = 'SELECT * FROM data ORDER BY Date DESC , Time DESC Limit 1';
    connection.query(sql, function (err, d, fields) {
        console.log(d)
        data = d


        res.render("dashboard", {
            userData: data,
        });

    })

})

app.post("/dashboard", function (req, res) {
    var AirPumpON = req.body.AirPumpON;
    var AirPumpOFF = req.body.AirPumpOFF;
    var WaterPumpON = req.body.WaterPumpON;
    var WaterPumpOFF = req.body.WaterPumpOFF;
    var LightON = req.body.LightON;
    var LightOFF = req.body.LightOFF;

    client.publish("REEVA/HYDROPHONICS/34B4724F22C4/Action", "1", { qos: 0, retain: false }, (error) => {
        if (error) {
            console.error(error)
        }

    })
    setTimeout(function () {
        console.log(AirPumpON)
        if (AirPumpON) {
            console.log("t")
            client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/1", "ON:100", { qos: 0, retain: false }, (error) => {
                if (error) {
                    console.error(error)
                }
            })

        }
        if (AirPumpOFF) {
            client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/1", "OFF:0", { qos: 0, retain: false }, (error) => {
                if (error) {
                    console.error(error)
                }
            })
        }
        console.log(AirPumpON)
        if (WaterPumpON) {
            console.log("t")
            client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/3", "ON:100", { qos: 0, retain: false }, (error) => {
                if (error) {
                    console.error(error)
                }
            })

        }
        if (WaterPumpOFF) {
            client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/3", "OFF:0", { qos: 0, retain: false }, (error) => {
                if (error) {
                    console.error(error)
                }
            })
        }

        if (LightON) {
            console.log("t")
            client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/5", "ON:100", { qos: 0, retain: false }, (error) => {
                if (error) {
                    console.error(error)
                }
            })

        }
        if (LightOFF) {
            client.publish("REEVA/HYDROPHONICS/34B472504B4C/C/5", "OFF:0", { qos: 0, retain: false }, (error) => {
                if (error) {
                    console.error(error)
                }
            })
        }
        var sql = 'SELECT * FROM data ORDER BY Date DESC , Time DESC Limit 1';
        connection.query(sql, function (err, d, fields) {
            console.log(d)
            data = d


            res.render("dashboard", {
                userData: data,
            });

        })
    }, 500);



})
app.get("/schedule", isLoggedIn, function (req, res) {



    res.render("schedule");



})
let StartTime,Temp,EndTime,Temp2
app.post("/schedule", isLoggedIn, function (req, res) {
    StartTime = req.body.starttime
    EndTime = req.body.endtime
    Temp=StartTime
    Temp2=EndTime
    Temp = Temp.split(":");
    Temp2 = Temp2.split(":");
    valid = parseInt(Temp[0]) + parseInt(Temp[1]) -parseInt(Temp2[0])-parseInt(Temp2[1])
    console.log("Valid:",valid)
    if(valid>=0)
    {
        console.log("ERROR")
    }
    var date_ob = new Date();
    let minute = String(date_ob.getMinutes()).padStart(2, '0');
    time = date_ob.getHours() + ':' + minute;
    res.render("schedule");
    



})
function isLoggedIn(req, res, next) {   //To verify an incoming token from client
    console.log(req.cookies.token);
    try {
        console.log(req.cookies.token);
        jwt.verify(req.cookies.token, 'test secret');
        return next();
    }
    catch (err) {
        console.log(err.message);
        return res.status(401).render('index1', {  //401 Unauthorized Accesss
            message: 'Please Login Again'
        });
    }
}

setInterval(() => {
    console.log("StartTime:",StartTime)
    console.log("EndTime:",EndTime)
    Temp=StartTime
    Temp2=EndTime
    if (StartTime) {
        Temp = Temp.split(":");
        Temp2 = Temp2.split(":");
        var date_ob = new Date();
        let minute = String(date_ob.getMinutes()).padStart(2, '0');


        diff = parseInt(Temp[0]) + parseInt(Temp[1]) - parseInt(minute) - date_ob.getHours()
        diff2 = parseInt(Temp2[0]) + parseInt(Temp2[1]) - parseInt(minute) - date_ob.getHours()
        console.log(diff2)
        if (diff > 0 || diff2 <= 0) {
            console.log("OFF")
        }
        else {
            console.log("ON")
        }
        
    }
},10000)



app.listen(4000, () => {
    console.log(`server started 4000`)
});