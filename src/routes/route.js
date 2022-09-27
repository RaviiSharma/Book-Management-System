const express = require('express');
const router = express.Router();

const userController=require("../controllers/userController")
const bookController=require("../controllers/bookController")
const reviewController=require("../controllers/reviewController")
const commonMw = require("../middlewares/commonMiddleware")

// ===================Users=============

router.post("/register",userController.createUser);
router.post("/login", userController.userLogin)
// ===================Books=============
router.post("/books",commonMw.authentication,bookController.createbook)
router.get("/books",commonMw.authentication,bookController.getBooks)
router.get("/books/:bookId",commonMw.authentication,bookController.getBooksDetail)
router.put("/books/:bookId",commonMw.authentication,commonMw.authorisation,bookController.putBooks)
router.delete("/books/:bookId",commonMw.authentication,commonMw.authorisation,bookController.deleteBookParam)
// ===================Reviews=============
router.post("/books/:bookId/review",reviewController.createReview)
router.put("/books/:bookId/review/:reviewId",reviewController.updateReview)
router.delete("/books/:bookId/review/:reviewId",reviewController.deleteReview)

router.all("/*", function (req, res) {
    res.status(400).send({ status: false, message: "Invalid path params" });
  });



module.exports = router;