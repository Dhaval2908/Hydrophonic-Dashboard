const mysql = require("mysql");
const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan")
var path = require('path');


const app = express();
app.use(bodyParser.json());
app.use(logger("dev"))
app.use(bodyParser.urlencoded({ extended: false }))
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use("/assets", express.static("assets"));

const connection = require("./database");
const client = require("./Mqtt");

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
    connection.query("select * from test where username = ?", [username], (error, results, fields) => {
        console.log(results)

        if (results.length < 0) {
            res.render("index1", {
                message: "User Does Not Exist"
            });
        }
        else {
            connection.query("select * from test where username = ? and password = ?", [username, password], function (error, results, fields) {
                var data
                if (results.length > 0) {

                    res.redirect("/dashboard")

                } else {
                    res.render("index1", {
                        message: "Password Does Not Match"
                    });
                }
                res.end();
            })
        }

    })


})
app.post("/test", function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var repassword = req.body.repassword;
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


})
app.get("/dashboard", function (req, res) {
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
client.on('message', (topic, payload) => {
    //console.log("1234")
    app.use(function(req,res){
        console.log("1234")
        var sql = 'SELECT * FROM data ORDER BY Date DESC , Time DESC Limit 1';
        connection.query(sql, function (err, d, fields) {
            console.log(d)
            data = d


            res.render("dashboard", {
                userData: data,
            });

        })
    })
  
  })

app.listen(4000,()=>{
    console.log(`server started 4000`)
});