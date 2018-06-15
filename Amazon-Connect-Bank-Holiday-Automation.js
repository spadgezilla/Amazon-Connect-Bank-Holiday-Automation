// Created by Paul Glover 2018, special thanks to Milos Cosic from Amazon for his help with JSON processing

const https = require('https');
var doc = require('dynamodb-doc');
var db = new doc.DynamoDB();
 
exports.handler = (event, context, callback) => {
    
    // Get bank holiday json from gov.uk website
    https.get('https://www.gov.uk/bank-holidays.json', (resp) => {
      let data = '';
 
        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });
    
        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            processData(data);
        });
 
    }).on("error", (err) => {
    callback("Error: " + err.message);
    });
  
    // Process and format json data
    function processData(data)
    {
        var dataJ = JSON.parse(data);
        // Define the region you want to use (england-and-wales, scotland, northern-ireland) 
        var england = dataJ["england-and-wales"];
        var england_events = england.events;
        for(var i = 0; i<england_events.length; i++)
        {
        var current_event = england_events[i]; 
        var eventStartDate = current_event.date;
        var eventReason = current_event.title;
        var eventReasonDate = eventStartDate.substring(0,3);
        
        // Convert date to epoch time format
        Date.prototype.getUnixTime = function() { return this.getTime()/1000|0 };

        if(!Date.now) Date.now = function() { return new Date(); }
        Date.time = function() { return Date.now().getUnixTime(); }

        // Define epoch start and finish times        
        var parsedUnixStartTime = new Date(eventStartDate).getUnixTime();
        var parsedUnixEndTime = new Date(eventStartDate).getUnixTime();
        var parsedUnixEndTimeFinal = parsedUnixEndTime+86400;
       
        // Define the name of your DynamoDB table and items
        var tableName = "holidayCalendar";
        var item = {
            "dateStart":parseInt(parsedUnixStartTime),
            "dateEnd":parseInt(parsedUnixEndTimeFinal),
            "reason":eventReason+" "+eventReasonDate
        };
        var params = {
            TableName:tableName, 
            Item: item
        };
        console.log(params);
        // Write data to the table
        db.putItem(params,function(err,data){
        if (err) console.log(err);
        else console.log(data);
        });
        };
    }
  }