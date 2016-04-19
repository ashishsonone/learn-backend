var mongoose = require('mongoose');

var SessionSchema = mongoose.Schema({
  _id : false,
  token : String,
  ts : Number
});

var TeacherSchema = mongoose.Schema({
  username : String,
  online : [SessionSchema],
  status :  {type : String, default : "free"}
});

var TeacherModel = mongoose.model('Teacher', TeacherSchema, 'teacher');

module.exports = {
  TeacherModel : TeacherModel
};