var fs=require('fs') //file system object creation
const {OAuth2Client} = require('google-auth-library');

const client = new OAuth2Client("752169556635-q0u04asvqip10b7kcckntcfcltm6ek39.apps.googleusercontent.com");

async function verify(token) {
  const ticket = await client.verifyIdToken({
      idToken: token,
      audience: "752169556635-q0u04asvqip10b7kcckntcfcltm6ek39.apps.googleusercontent.com",  
  });
  const payload = ticket.getPayload();
  
  const params={"user_id":payload["sub"],"email":payload["email"],"name":payload["name"],"image_link":payload["picture"],"stat":"success"}

  return params
 
}
//------------------Logger function------------------
function logging(string1,string2){
  let timestamp=new Date();
  var string="\n"+"-".repeat(30)+"\n"+string1+"\n"+string2+"\n"+timestamp;
  fs.appendFile('log.txt',string,function(err){
      console.log("data saved")
  })
  }
verify().catch(function(err){
    logging(err,"error");
    const params={"stat":"error"}
    return params
});

exports.verify=verify;

