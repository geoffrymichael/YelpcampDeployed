var express = require("express");
var router = express.Router({mergeParams: true});
var Campground = require("../models/campground");
var Comment = require ("../models/comment");
var middleware = require("../middleware")

//COMMMENTS ROUTES

//Comments New
router.get("/new", middleware.isLoggedIn, function(req, res) {
   Campground.findById(req.params.id, function(err, campground) {
       if (err || !campground){
            req.flash("error", "Campground not found");
            res.redirect("/campgrounds");
       } else {
          res.render("comments/new", {campground: campground});
       }
       
   });
});

//Comments Create
router.post("/", middleware.isLoggedIn, function(req, res) {
     //This is code line foundin the course questions provided by a user. 
    //  Campground.findById(req.params.id).populate("comments").exec(function(err, campground) {
    //This is Colt's line and produced a handling error. Update: it works now.
    Campground.findById(req.params.id, function(err, campground) { 
        if(err || !campground){
            req.flash("error", "Campground not found");
            res.redirect("/campgrounds");
        } else {
            
            Comment.create(req.body.comment, function(err, comment) {
                if(err) {
                    console.log(err);
                    res.redirect("/campgrounds")
                } else {
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save()
                    //This is the code I changed it to from colt's
                    // campground.comments.push(comment);
                    //this code did not work and instead added an extra "__" section which caused comment object not to work. Update: it works now
                    campground.comments.push(comment._id);
                    campground.save();
                    req.flash("success", "You succesfully added a comment.")
                    res.redirect("/campgrounds/" + campground._id);
                }
            });
        }
    });
    
});

//EDIT COMMENT form route
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res) {
    Campground.findById(req.params.id, function(err, foundCampground) {
        if(err || !foundCampground) {
            req.flash("error", "Campground not found");
            return res.redirect("back");
        }
        Comment.findById(req.params.comment_id, function(err, foundComment) {
            if(err){
                res.redirect("back");
            } else {
                res.render("comments/edit", {campground_id: req.params.id, comment: foundComment});
            }
        });
    });
});

//UPDATE Route for edit form to go to
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res) {
   Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updated) {
       if(err){
           res.redirect("back")
       } else {
           res.redirect("/campgrounds/" + req.params.id);
       }
   })
});

//COMMENT destroy route
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res) {
    Comment.findByIdAndRemove(req.params.comment_id, function(err) {
        if(err){
            res.redirect("back")
        } else{
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});




module.exports = router;