var schedule = require("node-schedule");
var fs = require('fs');
const fileData = fs.readFileSync("schedule.json", 'utf8');
console.log(fileData)
if(fileData.length >0)  
{
  const object = JSON.parse(fileData)
  object.forEach(data => {
    console.log(data.StartTime)
    
  });
  // const job = schedule.scheduleJob({hour: 16, minute: 15}, function(){
  //     console.log('Time for tea!');
  //   });  
}  
     