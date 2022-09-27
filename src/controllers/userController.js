const UserModel = require("../models/userModel");
const jwt = require("jsonwebtoken");


//////////////////////////////////////////////////  CREATE USER  ///////////////////////////////////////////////////////////////

const isValid = function (value) {
  if (typeof value == "undefined" || value == null) return false;
  if (typeof value == "string" && value.trim().length > 0) return true;
};
let pincodeValidation = /^[1-9]{1}[0-9]{5}|[1-9]{1}[0-9]{3}\\s[0-9]{3}/


const createUser = async function (req, res) {
  try {
    let requestBody = req.body;
    const { title, name, phone, email, password, address } = requestBody //Destructuring

    if (!Object.keys(requestBody).length) return res.send({ status: false, msg: "Enter some data" })


    //title validation
    if (!title) return res.status(400).send({ status: false, msg: "title is mandatory" })
    if (title != "Mr" && title != "Mrs" && title != "Miss") return res.status(400).send({ status: false, msg: `title can contain only "Mr","Mrs" or "Miss"` })

    //Name validation
    if (!name) return res.status(400).send({ status: false, msg: "name is mandatory" })
    if (!(/^[a-zA-Z\. ]*$/).test(name)) return res.status(400).send({ status: false, msg: "name is not valid" })

    //Phone validation
    if (!phone) return res.status(400).send({ status: false, msg: "phone is mandatory" })
    if (!(/^[\s]*[6-9]\d{9}[\s]*$/gi).test(phone)) {
      return res.status(400).send({ status: false, msg: "phone number is invalid , it should be starting with 6-9 and having 10 digits" })
    }
    let phoneCheck = await UserModel.findOne({ phone: phone })
    if (phoneCheck) return res.status(409).send({ status: false, msg: "phone number is already used" })

    //Email validation
    if (!email) return res.status(400).send({ status: false, msg: "email is mandatory" })
    if (!(/^[a-z0-9_]{1,}@[a-z]{3,}[.]{1}[a-z]{3,6}$/).test(email)) {
      return res.status(400).send({ status: false, message: "Email is invalid" })
    }
    let emailCheck = await UserModel.findOne({ email: email })
    if (emailCheck) return res.status(409).send({ status: false, msg: "email is already used " })

    //Password validation
    if (!password) return res.status(400).send({ status: false, msg: "password is mandatory" })
    if (!(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,15}$/).test(password)) {
      return res.status(400).send({ status: false, message: "password is invalid ,it should be of minimum 8 digits and maximum of 15 and should have atleast one special character and one number & one uppercase letter" })
    }
    if (address) {
      if (address.pincode) {
        if (!address.pincode.match(pincodeValidation)) return res.status(400).send({ status: false, message: "please enter a valid pincode" })
      }
      if(address.city) {
        if (!(/^[a-zA-Z\. ]*$/).test(address.city)) return res.status(400).send({ status: false, message: "please enter a valid city" })
      }
      
      if(address.street) {
  
        if (!(/^[a-zA-Z\. ]*$/).test(address.street) ) return res.status(400).send({ status: false, message: "please enter a valid street" })
      }
    }
    let created = await UserModel.create(requestBody)
    res.status(201).send({ status: true, msg: "User successfully created", data: created })
  }
  catch (err) {
    res.status(500).send({ status: false, msg: err.message })
  }
}
// //////////////////////////////////////////// login ///////////////////////////////////////////////////////////


const isValidRequestBody = function (object) {
  return Object.keys(object).length > 0;
};

//////////////////////////////////////////// LOGIN USER  ///////////////////////////////////////////////////////


const userLogin = async function (req, res) {

  try {
    const requestBody = req.body;

    if (!isValidRequestBody(requestBody)) {
      return res.status(400).send({ status: false, message: "please provide input credentials" });
    }

    const userName = requestBody.email;
    const password = requestBody.password;

    // validating userName 
    if (!isValid(userName)) { return res.status(400).send({ status: false, message: "email is required" }); }

    //validating password
    if (!isValid(password)) { return res.status(400).send({ status: false, message: "password is required" }); }

    const loginUser = await UserModel.findOne({ email: userName, password: password, });
    if (!loginUser) { return res.status(404).send({ status: false, message: "invalid login credentials" }); }

    const token = jwt.sign({ userId: loginUser._id.toString() }, "rass!@#512345ssar767", { expiresIn: "50000s" });

    res.status(200).send({ status: true, message: "login successful", data: token });

  } catch (err) {
    res.status(500).send({ status: false, error: err.message });
  }

}
module.exports = { createUser, userLogin }

