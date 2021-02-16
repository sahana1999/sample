const mysql=require("mysql")
var fs=require('fs') //file system object creation
//------------------Logger function------------------
function logging(string1,string2){
    let timestamp=new Date();
    var string="\n"+"-".repeat(30)+"\n"+string1+"\n"+string2+"\n"+timestamp;
    fs.appendFile('log.txt',string,function(err){
        console.log("data saved")
    })
    }
// SQL Connection

const con=mysql.createConnection({
    host:"team2practo.cs4jmf8qoxwe.us-east-1.rds.amazonaws.com",
    user:"team2practo",
    password:"team2practo",
    port:"3306",
    database:'redClone',
    timezone: '+5:30'
    
});

con.connect(function(err){
    if(err)
    {
        logging(err,"SQL connection failed")
       // console.log("SQL connection failed"+err.stack)        
    }
    else
    {
    
    console.log("--SQL connection successfull")    
    
    }
})



exports.con=con







