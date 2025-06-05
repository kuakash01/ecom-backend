const signin = (req, res)=>{
    res.status(200).json({"response": "ok", "type":"signin"});
}
const signup = (req, res)=>{
    res.status(200).json({"response": "ok", "type":"signup"});
}
module.exports = {signin, signup}