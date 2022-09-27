const reviewModel = require('../models/reviewModel')
const bookModel = require('../models/bookModel')
const mongoose = require('mongoose')

//////////////////////////////////////////////////// createReview ////////////////////////////////////////////////////////

const createReview = async (req, res) => {
    try {
        let bookId = req.params.bookId;
        let requestBody = req.body;

        let { review, reviewedBy, rating } = requestBody;

        if (!bookId) {
            return res
                .status(400)
                .send({ status: false, message: "please give bookId" });
        }

        let validateBookId = mongoose.isValidObjectId(bookId);

        if (!validateBookId) {
            return res
                .status(400)
                .send({ status: false, message: "this is not a valid bookId" });
        }

        let findBook = await bookModel.findOne({ _id:bookId });
        if (!findBook) {
            return res
                .status(404)
                .send({ status: false, message: "no books with this Books id" });
        }

        if (findBook.isDeleted) {
            return res
                .status(200)
                .send({ status: true, message: "This book has been deleted" });
        }

        if (!rating) {
            return res
                .status(400)
                .send({ status: false, message: "rating is a required field" });
        }
        if (!(/^[1-5]+$/.test(rating))) {
            return res
                .status(400)
                .send({ status: false, message: "please provide a valid rating between 1-5" });
        }

        let date = Date.now();
        let details = {
            bookId: bookId,
            reviewedBy: reviewedBy,
            reviewedAt: date,
            rating: rating,
            review: review,
        };
        const isValid = function (value) {
            if (typeof value == "undefined" || value == null) return false;
            if (typeof value == "string" && value.trim().length > 0) return true;
        };

        if (isValid(reviewedBy)) {
            details["reviewedBy"] = reviewedBy;
        }

        // if requestBody does not have the "reviewedBy name" then assigning its default value "Guest"
        else {
            details["reviewedBy"] = "Guest";
        }

        let reviewCreated = await reviewModel.create(details);

        if (reviewCreated) {
            // USING .lean() to convert mongoose object to plain js object for adding a property temporarily
            let updatedBook = await bookModel.findOneAndUpdate({ _id: bookId }, { $inc: { reviews: 1 } }, { new: true }).lean();

            updatedBook["reviewsData"] = reviewCreated;

            return res
                .status(201)
                .send({ status: true, message: "Review published", data: updatedBook });
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};

const isValid = function(value){
    if(typeof (value) == 'undefined' || value == null) return false
    if(typeof (value) == 'string' && value.trim().length > 0) return true
}

const isValidRating = function(value){
    if (typeof (value) == 'undefined' || value == null) return false
    if ( typeof (value) != 'number') return false
    if(value < 1 || value > 5) return false
    return true
}
const isValidName = function (name) {
    const regexForName = /^[A-Za-z ]+$/
    return regexForName.test(name);
  };

const isValidRequestBody = function(object){
return (Object.keys(object).length > 0)
}

const isValidIdType = function(objectId){
return mongoose.Types.ObjectId.isValid(objectId)
}

//////////////////////////////////////////// updateReview ////////////////////////////////////////////////////////////////////////////

const updateReview = async function (req, res){
    try{
        const queryParams = req.query
        const requestBody = req.body
        const bookId = req.params.bookId
        const reviewId = req.params.reviewId

        // query params must be empty
        if(isValidRequestBody(queryParams)){
        return  res.status(400).send({status: false, message : "please give data only in requestBody"})
        }
        // requestBody 
        if(!isValidRequestBody(requestBody)){
        return  res.status(400).send({status : false, message : "update details is required for review update"})
        }
        
        if(!bookId){
        return res.status(400).send({status : false, message : "bookId is required in path params"})
        }   

        if(!isValidIdType(bookId)){
        return  res.status(400).send({status : false, message : "enter a valid bookId"})
        }

        // using .lean() to convert mongoose object to plain js object for adding a property temporarily 
        const bookByBookId = await bookModel.findOne({_id : bookId}).lean()
        if(!bookByBookId){
            return res.status(404).send({status : false, message : ` No Book found by ${bookId}`})
            }
        if(bookByBookId.isDeleted==true) return res.status(200).send({status : true, message : "This book is already deleted"})

        if(!reviewId){
        return res.status(400).send({status : false, message : "reviewId is required in path params"})
        }   
    
        if(!mongoose.Types.ObjectId.isValid(reviewId)){
        return  res.status(400).send({status : false, message : "enter a valid reviewId"})
        }

        const reviewByReviewId = await reviewModel.findOne({_id : reviewId})

        if(!reviewByReviewId){
        return res.status(404).send({status : false, message : `No review found by ${reviewId} `})
        }
        if(reviewByReviewId.isDeleted==true) return res.status(400).send({status : false, message : "This review is already deleted , you can't update the review"})

        if(reviewByReviewId.bookId != bookId){
        return res.status(400).send({status : false, message : "review is not from this book"})  
        }
    
        const {review, reviewedBy, rating} = requestBody

        // creating an empty object for adding all updates as per requestBody
        const update = {}

        // if requestBody has the mentioned property then validating that property and adding it to updates object
        if (requestBody["reviewedBy"]){
            if(!isValid(reviewedBy)){
            return res.status(400).send({status : false, message : `enter a valid name like: "JOHN" `})
            }

       if(!isValidName(reviewedBy)){
            return res.status(404).send({status : false, message : ` plz enter correct name`})
            }
            update["reviewedBy"] = reviewedBy.trim()
        }

        if(requestBody["rating"]){
            if(!isValidRating(rating)){
            return res.status(400).send({status : false, message : "rate the book from 1 to 5, in Number format"})
            }

                update["rating"] = rating            
        }

        if(requestBody["review"]){
            if(!isValid(review)){
                return  res.status(400).send({status : false, message : `enter review in valid format like : "awesome book must read" `})
            }
               update['review'] = review.trim()
            
        }
        let reviewData1 = []
        
       let reviewData = await reviewModel.findOneAndUpdate({_id : reviewId, isDeleted : false}, {$set : update}, {new : true})
       reviewData1.push(reviewData)

        bookByBookId["reviewsData"] = reviewData1

        res.status(200).send({status : true, message : "review updated successfully", data : bookByBookId})

    }catch(err){
        res.status(500).send({error : err.message})
    }
}




// //////////////////////////////////////////////////////// deletereview ///////////////////////////////////////////////////
const deleteReview = async function (req, res) {
    try {
        let review = req.params.reviewId
        let book = req.params.bookId

        if (!mongoose.Types.ObjectId.isValid(book)) return res.status(400).send({ status: false, message: "bookId is not Valid" });
        if (!mongoose.Types.ObjectId.isValid(review)) return res.status(400).send({ status: false, message: "reviewId is not Valid" });

        let findBook = await bookModel.findById(book)
        if (!findBook) return res.status(404).send({ status: false, message: "book does not exist" })
        if (findBook.isDeleted) return res.status(400).send({ status: false, message: "book already deleted you can't delete review" })


        let findreview = await reviewModel.findById(review)
        if (!findreview) return res.status(404).send({ status: false, message: "reviewId does not exist" })
        if (findreview.isDeleted) return res.status(400).send({ status: false, message: "review already deleted" })

        if (findreview.bookId != book) return res.status(400).send({ status: false, message: "You can't delete someone else review" })

        await bookModel.updateOne({ _id: book }, { $inc: { reviews: -1 } })
        await reviewModel.updateOne((findreview), { $set: { isDeleted: true } })
        
        return res.status(200).send({ status: true, message: "successfully deleted" })
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

module.exports = { createReview, updateReview, deleteReview }