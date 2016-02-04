"use strict"
var mongoose = require('mongoose');

var newsSchema = mongoose.Schema({
    title : String,
    date : Date,

    approved : Boolean,
    approvedBy : String,
    approvedAt : Date,

    createdAt : Date,
    createdBy : String
});

var newsModel = mongoose.model('News', newsSchema, 'News');


mongoose.connect("mongodb://localhost:27017/NewsDB");

mongoose.set('debug', true);

var EDITORS = ['ashish', 'hardik', 'dhanesh'];
var UPLOADERS = ['seema', 'abhijeet', 'kansu', 'bahubali', 'raj'];
var APPROVAL_STATUS = [true, true, true, false];

var WEEK = 7 * 24 * 60 * 60 * 1000;
var HOUR = 60 * 60 * 1000;

var NUM_WEEKS = 10;
var NEWS_PER_WEEK_LL = 10; //lower limit
var NEWS_PER_WEEK_UL = 25;

//now = new Date();
function getRandomItem(array){
    var i = Math.floor(Math.random() * array.length);
    return array[i];
}

function getRandom(){
    return Math.floor(Math.random() * 1000);
}

function getRandomRange(low, high){
    return low + Math.round(Math.random() * (high-low));
}

function getRandomDate(ref, op){
    //subtract a random amount of time 1 to 12 hrs to get a new date
    var sub = HOUR + Math.floor(Math.random() * HOUR * 11);
    if(op === '-'){
        return new Date(ref.getTime() - sub);
    }
    else{
        return new Date(ref.getTime() + sub);
    }
}

var date = new Date("2015-01-01");
function generateData(){
    //for 50 weeks starting from 01-01-2015
    for(var w=0; w< NUM_WEEKS; w++){
        var newsThisWeek = getRandomRange(NEWS_PER_WEEK_LL, NEWS_PER_WEEK_UL);
        for(var i=0; i<newsThisWeek; i++){
            var item = new newsModel();
            item.title = "news " + getRandom();
            item.date = date;

            item.createdAt = getRandomDate(date, '-');
            item.createdBy = getRandomItem(UPLOADERS);

            item.approved = getRandomItem(APPROVAL_STATUS);
            if(item.approved){
                item.approvedAt = getRandomDate(date, '+'); 
                item.approvedBy = getRandomItem(EDITORS);
            }

            item.save();

            console.log("%j", item);

            //increment by 1 week
        }
        date = new Date(date.getTime() + WEEK);
    }
}

function deleteData(){
    newsModel.remove({}, function(err){
        console.log(err);
    });
}

var command = process.argv[2];

if(command === 'populate'){
    generateData();
}
else if(command === 'drop'){
    deleteData();
}
//generateData();
