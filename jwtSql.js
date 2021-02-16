

const sqlconn=require("./mySql")
const con=sqlconn.con
var fs=require('fs') //file system object creation
const tableName="userjwt";

//------------------Logger function------------------
function logging(string1,string2){
    let timestamp=new Date();
    var string="\n"+"-".repeat(30)+"\n"+string1+"\n"+string2+"\n"+timestamp;
    fs.appendFile('log.txt',string,function(err){
        console.log("data saved")
    })
    }


function addRefreshToken(uid,refreshToken){
    const query=`insert into ${tableName} values ('${uid}','${refreshToken}')`

    con.query(query,function(err,result){
        if(err)
        {
            logging(err.stack,"sql error");
            //console.log(err.stack)
        }
        
    })

     

}

function  getRefreshToken(uid){
    const query=`select refreshToken from ${tableName} where user_id='${uid}'`

    return new Promise(function(resolve,reject){
    con.query(query,function(err,result){
        if(err){

            reject(err.stack)
            
        }
        else{
            
            resolve(result[0].refreshToken)
    
           
        }
        
    })
})

    
}


function deleteRefreshToken(uid){
    const query=`delete from ${tableName} where user_id='${uid}'`

    con.query(query,function(err,result){
        if(err)
        {

            console.log(err.stack)
        }
        
    })

     

}






exports.addRefreshToken=addRefreshToken;
exports.getRefreshToken=getRefreshToken;
exports.deleteRefreshToken=deleteRefreshToken;