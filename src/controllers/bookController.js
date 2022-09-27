const { default: mongoose } = require("mongoose");
const bookModel = require('../models/bookModel')
const userModel = require('../models/userModel')
const reviewModel = require('../models/reviewModel')

let regexValidation = /^[a-zA-z]+/;
let regexValidISBN = /^[6-9]{3}[\-][\d]{10}$/;
let regexValidReleasedAt = /^(?!0000)\d{4}-(?!00)(?!13)(?!14)(?!15)(?!16)(?!17)(?!18)(?!19)[0-1]{1}\d{1}-(?!00)(?!33)(?!32)(?!34)(?!35)(?!36)(?!37)(?!38)(?!39)[0-3]{1}\d{1}$/;
let timeElapsed = Date.now();
let today = new Date(timeElapsed);


/////////////////////////////////////////////////////////// CREATE BOOK ///////////////////////////////////////////////////////

const createbook = async function (req, res) {
    try {
        let data = req.body
        if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "plzz give some data" });

        const { title, excerpt, userId, ISBN, category, subcategory, releasedAt } = data //Destructuring 

        // Mandatory keys validation
        if (!title) return res.status(400).send({ status: false, message: "title is manadatory" });
        if (!title.match(regexValidation)) return res.status(400).send({ status: false, message: "please enter a valid title" })

        if (!excerpt) return res.status(400).send({ status: false, message: " excerpt  is manadatory" });
        if (!excerpt.match(regexValidation)) return res.status(400).send({ status: false, message: "please enter a valid excerpt" })

        if (!userId) return res.status(400).send({ status: false, message: " userId is manadatory" });
        if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).send({ status: false, message: "userId is not Valid" });

        if (!ISBN) return res.status(400).send({ status: false, message: " ISBN is manadatory" });
        if (!ISBN.match(regexValidISBN)) return res.status(400).send({ status: false, message: "please enter a valid ISBN starting 3digits should be (6-9) then (-) and after that 10digits" })

        if (!category) return res.status(400).send({ status: false, message: " category is manadatory" });

        if (!subcategory) return res.status(400).send({ status: false, message: " subcategory is manadatory" });

        if (!releasedAt) return res.status(400).send({ status: false, message: " releasedAt is manadatory" });
        if (!releasedAt.match(regexValidReleasedAt)) return res.status(400).send({ status: false, message: "please enter a valid Date('YYYY-MM-DD')" })

        if(req.decodedToken.userId!=userId) return res.status(403).send({status:false,message:"You are not authorised to create book by someone else userid"})
       

        let correctuserId = await userModel.findById(userId)
        if (!correctuserId) return res.status(404).send({ status: false, message: "userId does not exist" })

        let findtitle = await bookModel.findOne({ title: title });
        if (findtitle) return res.status(409).send({ status: false, message: "title already exists" });

        let findISBN = await bookModel.findOne({ ISBN: ISBN });
        if (findISBN) return res.status(409).send({ status: false, message: "ISBN already exists" });

        const book = await bookModel.create(data)
        res.status(201).send({ status: true, message: "Book is successfully created", data: book })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}
/////////////////////////////////////////////////////////// GET BOOKS ///////////////////////////////////////////////////////

const getBooks = async function (req, res) {
    try {
        let requestQuery = req.query
        let requestBody = req.body
        if (Object.keys(requestBody).length > 0) {
            return res.status(400).send({ status: false, message: "Please enter the filters in requestQuery only" })
        }
        if (requestQuery.userId) {
            if (!mongoose.Types.ObjectId.isValid(requestQuery.userId)) {
                return res.status(400).send({ status: false, message: "userid validation failed" })
            }
        }
        let findBooks = await bookModel.find({ isDeleted: false, ...requestQuery }).select({ _id: 1, title: 1, excerpt: 1, userId: 1, category: 1, releasedAt: 1, reviews: 1 }).sort({title:1})
        if (findBooks.length==0) {
            return res.status(404).send({ status: false, message: "No books found by the given filters" })
        }
        res.status(200).send({ status: true, message: "Books list", data: findBooks })
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

/////////////////////////////////////////////////////////// GET BOOKS BY DETAILS BY PARAM ///////////////////////////////////////////////////////

const getBooksDetail = async function (req, res) {
    try {
        let bookId = req.params.bookId
        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).send({ status: false, message: "bookid validation failed" })
        }

        let bookCheck = await bookModel.findById(bookId).lean()
        if (!bookCheck) return res.status(404).send({ status: false, message: "book not found" })

        let reviews = await reviewModel.find({ bookId: bookId }).select({ _id: 1, bookId: 1, reviewedBy: 1, reviewedAt: 1, rating: 1, review: 1 })

        // bookCheck=bookCheck.toObject();
        bookCheck["reviewsData"] = reviews

        return res.status(200).send({ status: true,message:"Book list", data: bookCheck })

    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}

/////////////////////////////////////////////////////////// PUT BOOKS ///////////////////////////////////////////////////////

const putBooks = async function (req, res) {

    try {
        requestBody = req.body
        requestQuery = req.query
        bookId = req.params.bookId

        if (Object.keys(requestQuery).length > 0) return res.status(400).send({ status: false, message: "Please input the data in requestBody only" })
        if (Object.keys(requestBody).length == 0) return res.status(400).send({ status: false, message: "Please input the details for updation" })

        let findBook = await bookModel.findOne({ _id: bookId })
        if (!findBook) return res.status(404).send({ status: false, message: "No book found with this bookId" })
        if (findBook.isDeleted == true) return res.status(409).send({ status: false, message: "The Book is already deleted , it can't be updated" })

        let { title, excerpt, releasedAt, ISBN } = requestBody // Destructuring

        // validation
        if(title) {
        if (!title.match(regexValidation)) return res.status(400).send({ status: false, message: "please enter a valid title" })
        let findtitle = await bookModel.findOne({ title: title });
        if (findtitle) return res.status(409).send({ status: false, message: "title already exists enter a different title" });
        }
        if(excerpt) {
        if (!excerpt.match(regexValidation)) return res.status(400).send({ status: false, message: "please enter a valid excerpt" })
        }
        if(ISBN) {
        if (!ISBN.match(regexValidISBN)) return res.status(400).send({ status: false, message: "please enter a valid ISBN starting 3digits should be (6-9) then (-) and after that 10digits" })
        let findISBN = await bookModel.findOne({ ISBN: ISBN });
        if (findISBN) return res.status(409).send({ status: false, message: "ISBN already exists enter a different ISBN" });
        }
        if(releasedAt) {
        if (!releasedAt.match(regexValidReleasedAt)) return res.status(400).send({ status: false, message: "please enter a valid Date('YYYY-MM-DD')" })
        }
        

        let updateBook = await bookModel.findOneAndUpdate({ isDeleted: false, _id: bookId }, { $set: { title: title, excerpt: excerpt, releasedAt: releasedAt, ISBN: ISBN } }, { new: true })

        res.status(200).send({ status: true, message: "Sucessfully updated", data: updateBook });

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

/////////////////////////////////////////////////////////// DELETE BOOKS BY PARAMS ///////////////////////////////////////////////////////

const deleteBookParam = async function (req, res) {
    try {
        let requestParams = req.params
        bookId = requestParams.bookId

        let findBooks = await bookModel.findById(bookId)
        if (!findBooks) return res.status(404).send({ status: false, message: "No books found with given bookId" })

        if (findBooks.isDeleted) return res.status(200).send({ status: true, message: "Books already deleted" })

        await bookModel.updateOne((findBooks), { $set: { isDeleted: true, deletedAt: today } })
        return res.status(200).send({ status: true, message: "successfully deleted" })
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

module.exports = { createbook, getBooks, getBooksDetail, putBooks, deleteBookParam }


