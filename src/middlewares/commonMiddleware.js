const jwt = require("jsonwebtoken")
const { default: mongoose } = require("mongoose");
const bookModel = require("../models/bookModel");

//========================================== Authentication ============================================//

const authentication = function (req, res, next) {
    try {
        let token = req.headers["x-api-key"];
        if (!token) return res.status(401).send({ status: false, msg: " token must be present for authentication " })

        jwt.verify(token, "rass!@#512345ssar767", {ignoreExpiration:true},function (err, decodedToken) {
            if (err) {
                return res.status(400).send({ status: false, msg: "token invalid" });
            } 
            if(Date.now()>decodedToken.exp*1000) {
                return res.status(400).send({ status: false, msg: "token expired" });
            }
                req.decodedToken = decodedToken
                next() 
        })
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}

//========================================== Authorisation ============================================//

const authorisation = async function (req, res, next) {
    let bookId = req.params.bookId
    if (!mongoose.Types.ObjectId.isValid(bookId)) return res.status(400).send({ status: false, msg: "bookId validation failed" })
    let findBookId = await bookModel.findById(bookId)
    if (!findBookId) return res.status(404).send({ status: false, msg: "No books found with given book Id" })
    let userId = findBookId.userId.toString()
    if (req.decodedToken.userId != userId) return res.status(400).send({ status: false, msg: "The user is not authorised" })
    next()
}
module.exports = { authentication, authorisation }
