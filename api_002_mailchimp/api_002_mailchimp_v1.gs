/********************************************************************************
 * 
 * API experiments 2017 #002
 * Exploring the MailChimp API
 * Retrives MailChimp data and populates a Google Sheet
 * 
 */


// setup menu to run print Mailchimp function from Sheet
function onOpen() {
  var ui = SpreadsheetApp.getUi();

  ui.createMenu('MailChimp Menu')
    .addItem('Get campaign data', 'printMailChimpData')
    .addItem('Import emails', 'importEmailsMailChimp')
    .addItem('List Growth Details','listGrowth')
    .addToUi();

}



// script properties service
// retrive copy of mailchimp api key
function getApiKey() {  
  var properties = PropertiesService.getScriptProperties();
  return properties.getProperty('apikey');
}

function getListID() {  
  var properties = PropertiesService.getScriptProperties();
  return properties.getProperty('listID');
}


/*
 * Step 1:
 * Basic MailChimp API GET request
 *
 * {list_id} the ID of your list in MailChimp
 * {apikey} your MailChimp API key
 *
 */

function mailchimp1() {
  
  // get mailchimp api key from properties service
  var apikey = getApiKey();
  
  // URL and params for the Mailchimp API
  var root = 'https://us11.api.mailchimp.com/3.0/';
  var listID = getListID();
  var endpoint = 'lists/' + listID;
  
  var params = {
    'method': 'GET',
    'muteHttpExceptions': true,
    'headers': {
      'Authorization': 'apikey ' + apikey
    }
  };
  
  // call the Mailchimp API
  var response = UrlFetchApp.fetch(root+endpoint, params);
  var data = response.getContentText();
  var json = JSON.parse(data);
  
  // Log the list stats
  Logger.log(json["stats"]);
  
  // Log the total number of people on the list
  Logger.log("Total members on list: " + json["stats"]["member_count"]);
}


/****************************************************************************************
 *
 * Step 2:
 *
 */
function mailchimp2() {
  
  // get mailchimp api key from properties service
  var apikey = getApiKey();
  
  // URL and params for the Mailchimp API
  var root = 'https://us11.api.mailchimp.com/3.0/';
  var endpoint = 'lists/';
  
  var params = {
    'method': 'GET',
    'muteHttpExceptions': true,
    'headers': {
      'Authorization': 'apikey ' + apikey
    }
  };
  
  // call the Mailchimp API
  var response = UrlFetchApp.fetch(root+endpoint, params);
  var data = response.getContentText();
  var json = JSON.parse(data);
  
  // Log the list id and stats
  Logger.log("List ID:" + json["lists"][0]["id"]);
  Logger.log(json["lists"][0]["stats"]);
}

/****************************************************************************************
 *
 * Return more than the default 10
// Add this to the endpoint '?count=20'
 */
function mailchimp3() {
  
  // get mailchimp api key from properties service
  var apikey = getApiKey();
  
  // URL and params for the Mailchimp API
  var root = 'https://us11.api.mailchimp.com/3.0/';
  var endpoint = 'campaigns?count=20';
  
  var params = {
    'method': 'GET',
    'muteHttpExceptions': true,
    'headers': {
      'Authorization': 'apikey ' + apikey
    }
  };
  
  // call the Mailchimp API
  var response = UrlFetchApp.fetch(root+endpoint, params);
  var data = response.getContentText();
  var json = JSON.parse(data);
  
  // Log the list id and stats
  var campaigns = json['campaigns'];
  Logger.log(campaigns.length);
  for (var i = 0; i < campaigns.length; i++) {
    Logger.log(campaigns[i]["settings"]["subject_line"]);
  }
}



/****************************************************************************************
 *
 * Step 4: general endpoint
 *
 */

// generalized mailchimp api call
function mailchimpEndpoint(endpoint) {
  
  // get mailchimp api key from properties service
  var apikey = getApiKey();
  
  // URL and params for the Mailchimp API
  var root = 'https://us11.api.mailchimp.com/3.0/';
  var path = endpoint;
  var query = '?count=30';
  
  var params = {
    'method': 'GET',
    'muteHttpExceptions': true,
    'headers': {
      'Authorization': 'apikey ' + apikey
    }
  };
  
  Logger.log(root + path + query);
  Logger.log(params);
  
  // call the Mailchimp API
  var response = UrlFetchApp.fetch(root + path + query, params);
  var data = response.getContentText();
  var json = JSON.parse(data);
  
  // Return the JSON data
  //return json[endpoint];
  return json;
}


// get mailchimp campaign data v2
function getMailChimpCampaignData2() {
  
  // get mailchimp api key from properties service
  var apikey = getApiKey();
  
  var campaigns = mailchimpEndpoint('campaigns')['campaigns'];  
  Logger.log(campaigns);
  
  var campaignData = [];
  
  // Add the campaign data to the array
  for (var i = 0; i < campaigns.length; i++) {
    
    // put the campaign data into a double array for Google Sheets
    if (campaigns[i]["emails_sent"] != 0) {
      campaignData.push([
        i,
        campaigns[i]["send_time"].substr(0,10),
        campaigns[i]["settings"]["title"],
        campaigns[i]["settings"]["subject_line"],
        campaigns[i]["recipients"]["recipient_count"],
        campaigns[i]["emails_sent"],
        (campaigns[i]["report_summary"]) ? campaigns[i]["report_summary"]["unique_opens"] : 0,  
        (campaigns[i]["report_summary"]) ? campaigns[i]["report_summary"]["clicks"] : 0
      ]);
    }
    else {
      campaignData.push([
        i,
        "Not sent",
        campaigns[i]["settings"]["title"],
        campaigns[i]["settings"]["subject_line"],
        campaigns[i]["recipients"]["recipient_count"],
        campaigns[i]["emails_sent"],
        "N/a",
        "N/a"
      ]);
    }
  }
  
  return campaignData;
}


// add the campaign data to our sheet
function printMailChimpData() {
  
  var data = getMailChimpCampaignData2();
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Campaign Analysis');
  
  var numRows = data.length;
  var numCols = data[0].length;
  
  sheet.getRange(4,1,numRows,numCols).setValues(data);
  
  for (var i = 0; i < numRows; i++) {
    sheet.getRange(4+i,9).setFormulaR1C1('=iferror(R[0]C[-2]/R[0]C[-3]*100,"N/a")');
    sheet.getRange(4+i,10).setFormulaR1C1('=iferror(R[0]C[-2]/R[0]C[-4]*100,"N/a")');
  }
  
  sheet.getRange(4,1,numRows,2).setHorizontalAlignment("center");
  sheet.getRange(4,5,numRows,6).setHorizontalAlignment("center");
 
}

/*
// data format required for api

var data = [
  {
    'email_address': 'xxxxxxxxxxx@gmail.com',
    'status': 'subscribed'
  },
  { 
    'email_address': 'xxxxxxxxxxx@gmail.com',
    'status': 'subscribed'
  }
];
*/

// get new email subscribers from Sheet
function getSubscribers() {
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Email Import');
  var numEmails = sheet.getLastRow()-1;
  
  var emails = sheet.getRange(2, 1, numEmails, 1).getValues();
  
  var emailsArray = emails.map(function(elem) {
    return { 
      'email_address' : elem[0], 
      'status' : 'subscribed' 
    };
  });
  
  /*
  emailsArray = [
    {email_address=xxxxxxxxxxx@gmail.com, status=subscribed}, 
    {email_address=xxxxxxxxxxx@yahoo.com, status=subscribed}, 
    {email_address=xxxxxxxxxxx@yahoo.com, status=subscribed}
  ]
  */
  
  Logger.log(typeof emailsArray);
  Logger.log(emailsArray);
  return emailsArray;
}


// add new email subs to MailChimp
function importEmailsMailChimp() {
  
  var emailData = getSubscribers();
  
  //Logger.log(emailData);
  
  var data = {
    'members': emailData
  };
  
  var payloadData = JSON.stringify(data);
  
  //Logger.log(payloadData);
 /*
  {
    "members": [
      {email_address=xxxxxxxxxxx@gmail.com, status=subscribed}, 
      {email_address=xxxxxxxxxxx@yahoo.com, status=subscribed}, 
      {email_address=xxxxxxxxxxx@yahoo.com, status=subscribed}
    ]
  }
  */
  
  // get mailchimp api key from properties service
  var apikey = getApiKey();
  
  // URL and params for the Mailchimp API
  var root = 'https://us11.api.mailchimp.com/3.0/';
  var listID = getListID();
  var path = '/lists/' + listID;  // for batch upload of subs. For single upload, also add '/members'
  
  var options = {
    'method' : 'post',
    'contentType': 'application/json',
    'payload': payloadData,
    'muteHttpExceptions': true,
    'headers': {
      'Authorization': 'apikey ' + apikey
    }
  };
  
  var response = UrlFetchApp.fetch(root + path, options); // POST emails to mailchimp
  var responseData = response.getContentText();
  var json = JSON.parse(responseData);
  
  //Logger.log(json);
  
  var chimpLog = logMailChimpImport(json);
  
  //Logger.log("this is it here:");
  //Logger.log(chimpLog);
  
  // [Fri Jan 13 22:38:43 GMT-05:00 2017, 0, 0, 3, {email_address=xxxxxxxxxxx@gmail.com, 
  // error=xxxxxxxxxxxx@gmail.com is already a list member, do you want to update? please provide update_existing:true in the request body}]
  
  printMailChimpLog(chimpLog);
  
  emailMailChimpLog(chimpLog);
  
  
  //return json;
  
}


// log time and details of imports, e.g. how many emails
function logMailChimpImport(response) {
  
  var timestamp = new Date();
  
  var mailchimpLog = [
    timestamp,
    response['total_created'],
    response['total_updated'],
    response['error_count'],
    response['errors'][0]
  ];
  
  return mailchimpLog;
}

// print the import log into the Google Sheet
function printMailChimpLog(chimpLog) {
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss.getSheetByName('Import Log');
  
  //Logger.log(typeof chimpLog);
  //Logger.log(chimpLog)
  
  logSheet.appendRow(chimpLog);
  
}


function emailMailChimpLog(data) {
  
  Logger.log('working');
  Logger.log(data);
  
  var body = 'Time of import ' + data[0].toLocaleString() + '\n'
             + 'Total subscribers created: ' + data[1] + '\n'
             + 'Total subscribers updated: ' + data[2] + '\n'
             + 'Total error count: ' + data[3] + '\n'
             + 'Example error: ' + data[4]["error"];
  
  var admin = 'benlcollins@gmail.com';
  
  GmailApp.sendEmail(admin, 'Your mailchimp import has finished - status inside', body);
  
}

// Feature requests:
//
// http://developer.mailchimp.com/documentation/mailchimp/reference/lists/#create-post_lists_list_id
// use response data including error data to build report
// deal with multiple errors, currently just showing first one
// split up if more than 500 emails




// get mailchimp campaign data v1
function getMailChimpCampaignData1() {
  
  // get mailchimp api key from properties service
  var apikey = getApiKey();
  
  var campaigns = mailchimpEndpoint('campaigns')['campaigns'];
  Logger.log(campaigns);
  
  //Logger.log(campaigns[15]);
  
  // Log the campaign data
  for (var i = 0; i < campaigns.length; i++) {
    //Logger.log("i: " + i);
    (campaigns[i]["settings"]["title"]) ? Logger.log("Campaign title: " + campaigns[i]["settings"]["title"]) : Logger.log("No title");
    (campaigns[i]["send_time"]) ? Logger.log("Send time: " + campaigns[i]["send_time"]) : Logger.log("No emails sent");
    (campaigns[i]["settings"]["subject_line"]) ? Logger.log("Campaign: " + campaigns[i]["settings"]["subject_line"]) : Logger.log("No subject line recorded");
    (campaigns[i]["recipients"]["recipient_count"]) ? Logger.log("Recipient count: " + campaigns[i]["recipients"]["recipient_count"]) : Logger.log("No recipient count");
    (campaigns[i]["emails_sent"]) ? Logger.log("Emails sent: " + campaigns[i]["emails_sent"]) : Logger.log("No emails sent");
    
    if ("report_summary" in campaigns[i]) {
      Logger.log("Unique opens: " + campaigns[i]["report_summary"]["unique_opens"]);
      Logger.log("Clicks: " + campaigns[i]["report_summary"]["clicks"]);
    }
    else {
      Logger.log("No unique opens or clicks recorded");
    }

    Logger.log("\n"); // add blank line
  }
  
}
