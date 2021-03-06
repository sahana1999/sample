//================ IMPORTS=====================

const express=require("express")
var bodyParser = require('body-parser');
const cors = require('cors');

const authApp=require("./gapi");
var fs=require('fs') //file system object creation
const jwtApp=require("./jwtToken")
const cookieParser = require("cookie-parser");

var multer  = require('multer')

var fileUpload=require("./fileUpload")

var skinderSql=require("./skinderSql")
//------------------Logger function------------------
function logging(string1,string2){
  let timestamp=new Date();
  var string="\n"+"-".repeat(30)+"\n"+string1+"\n"+string2+"\n"+timestamp;
  fs.appendFile('log.txt',string,function(err){
      console.log("data saved")
  })
  }

//=============== INITIALISATIONS =================

const app=express()
app.use(cookieParser());
app.use(express.json())
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(cors())

const port = 3000 || process.env.PORT

var upload = multer({ dest: 'uploads/',storage: multer.memoryStorage() })


// Prevent Server from Crashing
process.on('uncaughtException', function (err) {
    //console.error(err);
   // console.log("Node NOT Exiting...");
    logging(err,"Node NOT Exiting...");
  });



//==============POST METHODS ====================


//++++++++++++++ OAUTH +++++++++++++++++++++++++

app.post("/team2practo/auth/api/oauth",function(req,res){

    res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); // If needed
  res.setHeader('Access-Control-Allow-Credentials', true);

  authApp.verify(req.body.idtoken).then(function(params){

    
    const stat=params["stat"]
    delete params["stat"]

    if(stat=="success"){

      

    skinderSql.selectWhere("users","*",`email='${params["email"]}'`,undefined).then(function(data){
      if(data[0]!=undefined){

        
        params["user_id"]=data[0].User_Id
        params["email"]=data[0].Email
        params["image_link"]=data[0].Image_Link
        params["points"]=data[0].Points
        params["name"]=data[0].Name
        
        
      }
      else{
        params["points"]=0
      }

      const tokens=jwtApp.getAccessToken({"uid":params["user_id"],"email":params["email"]})
        
      if(data[0]==undefined){
        
        
         skinderSql.InsertToTable("users",params)
       }
        params["accessToken"]=tokens["accessToken"]
        
        delete params["user_id"]
        delete params["email"]
        res.send(params)

        

    }) 
        // res.cookie("accesToken", tokens["accessToken"], {secure: true, httpOnly: true})

    }
    else{

        res.status(401).send("unauthorised access")
    }

  })

     
})


app.post("/team2practo/auth/api/refresh",jwtApp.tokenRefresh)








//+++++++++++++++++++ POSTS ++++++++++++++++++++++++++++++++

app.post('/api/upload', upload.single('myFile'),fileUpload.fileUpload)


app.post('/team2practo/posts',jwtApp.verifyAccess,function(req,res){
var data=req.body

var uid=res.locals.uid
data["user_id"]=uid
skinderSql.InsertToTable("posts",data).then(function(){
  res.send({"Message":"Posted Successfully"})

}).catch(function(err){
  res.send(err)

})


})


//+++++++++++++++++++ COMMENTS +++++++++++++++++++++++++++++++++++++++++++++

app.post('/team2practo/comments',jwtApp.verifyAccess,function(req,res){
  var data=req.body
  
  var uid=res.locals.uid
  data["user_id"]=uid
  skinderSql.InsertToTable("comments",data).then(function(){
    res.send({"message":"Commented Successfully"})
  
  }).catch(function(err){
    res.send(err)
  
  })
  
  
  })






//============== GET METHODS ===============================



app.get("/",function(req,res){
  res.send("Hi from Skinder")
})



//+++++++++++++++++++++++ USERS +++++++++++++++++++++++++++++

app.get("/team2practo/users",jwtApp.verifyAccess,function(req,res){
  var uid=res.locals.uid
  skinderSql.selectWhere("users","*",`user_id='${uid}'`,undefined,undefined).then(function(result){
    res.send(result[0])
  }).catch(function(err){
    res.status(500).send("unexpected error")
  })

})


app.get("/team2practo/users/leaderboard",jwtApp.verifyAccess,function(req,res){

skinderSql.selectWhere("users","user_id, name, image_link, points",undefined,"points desc, joinedOn").then(function(result){
  res.send(result)
})

})



//++++++++++++++++++++++ POSTS ++++++++++++++++++++++++++++++++++++++++++++++

app.get("/team2practo/posts",jwtApp.verifyAccess,function(req,res){

  var uid=res.locals.uid
  skinderSql.nonORMQuery(`select temp.*,u.name,u.image_link as user_image from (select p.post_id,p.user_id,p.title,p.caption,p.image_link,p.upvotes,p.downvotes,DATE_FORMAT(p.timeposted, "%H:%i %d-%m-%Y") as timeposted,up.upordown from posts as p LEFT JOIN (select post_id,upordown from userPostUd where user_id="${uid}") as up on p.post_id=up.post_id)as temp,users as u where temp.user_id=u.user_id order by post_id desc`).then(function(result){
    
    res.send(result)
  })
})

app.get("/team2practo/posts/me",jwtApp.verifyAccess,function(req,res){

  var uid=res.locals.uid
  skinderSql.nonORMQuery(`select temp.*,u.name,u.image_link as user_image from (select p.post_id,p.user_id,p.title,p.caption,p.image_link,p.upvotes,p.downvotes,DATE_FORMAT(p.timeposted, "%H:%i %d-%m-%Y") as timeposted,up.upordown from (select * from posts where user_id="${uid}") as p LEFT JOIN (select post_id,upordown from userPostUd where user_id="${uid}") as up on p.post_id=up.post_id)as temp,users as u where temp.user_id=u.user_id order by post_id desc`).then(function(result){
    
    res.send(result)
  })
})

app.get("/team2practo/posts/trending",jwtApp.verifyAccess,function(req,res){

  skinderSql.nonORMQuery(`select p.post_id,p.user_id,p.title,p.caption,p.image_link,p.upvotes,p.downvotes,DATE_FORMAT(p.timeposted, "%H:%i %d-%m-%Y") as timeposted,u.image_link as user_image,u.name from posts as p,users as u where p.user_id=u.user_id  order by upvotes+downvotes desc;
  `).then(function(result){
    
    res.send(result)
  })

})



//+++++++++++++++++++++++ COMMENTS ++++++++++++++++++++++++++++++++++++

app.get("/team2practo/:postid/comments",jwtApp.verifyAccess,function(req,res){
  var uid=res.locals.uid
  var pid=req.params.postid
  skinderSql.nonORMQuery(`select temp.*,u.name,u.image_link as user_image from (select p.comment_id,p.post_id,p.user_id,p.comment,p.upVotes,p.downVotes,DATE_FORMAT(p.timecommented, "%H:%i %d-%m-%Y") as timeCommented,p.up_level_cid,up.upordown from comments as p LEFT JOIN (select comment_id,upordown from userCommentUd where user_id="${uid}") as up on p.comment_id=up.comment_id)as temp,users as u where temp.user_id=u.user_id and temp.up_level_cid is null and post_id=${pid} order by comment_id desc`).then(function(result){
    
    res.send(result)
  })
 })

 app.get("/team2practo/comments/:commentid/thread",jwtApp.verifyAccess,function(req,res){
  var uid=res.locals.uid
  var cid=req.params.commentid
  
  skinderSql.nonORMQuery(`select temp.*,u.name,u.image_link as user_image from (select p.comment_id,p.post_id,p.user_id,p.comment,p.upVotes,p.downVotes,DATE_FORMAT(p.timecommented, "%H:%i %d-%m-%Y") as timeCommented,p.up_level_cid,up.upordown from comments as p LEFT JOIN (select comment_id,upordown from userCommentUd where user_id="${uid}") as up on p.comment_id=up.comment_id)as temp,users as u where temp.user_id=u.user_id and temp.up_level_cid=${cid} order by comment_id desc`).then(function(result){
    
    res.send(result)
  })
 })

 




//=================== PUT METHODS ==========================


//++++++++++++++++++++++++ POSTS +++++++++++++++++++++++++++++++++

app.put("/team2practo/posts/uord",jwtApp.verifyAccess,function(req,res){
  var uid=res.locals.uid
  var data=req.body

  skinderSql.storedProcedures("interactPost",{"uid":uid,"pcid":data.post_id,"uod":data.upordown}).then(function(){
    res.send("voted successfully")
  })

})


//++++++++++++++++++++++  COMMENTS ++++++++++++++++++++++++++++++++

app.put("/team2practo/comments/uord",jwtApp.verifyAccess,function(req,res){
  var uid=res.locals.uid
  var data=req.body

  skinderSql.storedProcedures("interactComment",{"uid":uid,"pcid":data.comment_id,"uod":data.upordown}).then(function(){
    res.send("voted successfully")
  })

})





// ============= DELETE METHODS =====================================

app.delete("/team2practo/auth/api/logout",jwtApp.logout)




//================LISTEN TO PORT ==================


app.listen(port,function(){
    console.log(`listening to port ${port}`)
})