// https://medium.com/hackernoon/how-to-add-new-cognito-users-to-dynamodb-using-lambda-e3f55541297c

//https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools-working-with-aws-lambda-triggers.html
let ddbParams = {
    Item: {
        'id': {S: event.request.userAttributes.sub},
        '__typename': {S: 'User'},
        
        'username': {S: event.userName},
        'name': {S: event.request.userAttributes.name},
        'skillLevel': {N: '0'},
        'email': {S: event.request.userAttributes.email},
        'createdAt': {S: date.toISOString()},
    },
    TableName: 'final-project-user-details'
};


// working policy
/*
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:PutLogEvents",
                "logs:CreateLogGroup",
                "logs:CreateLogStream"
            ],
            "Resource": "arn:aws:logs:*:*:*"
        },
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "cognito-identity:*",
                "cognito-idp:*",
                "cognito-sync:*"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ses:SendEmail",
                "ses:SendRawEmail"
            ],
            "Resource": "*"
        },
        {
            "Sid": "DynamoDBIndexAndStreamAccess",
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetShardIterator",
                "dynamodb:Scan",
                "dynamodb:Query",
                "dynamodb:DescribeStream",
                "dynamodb:GetRecords",
                "dynamodb:ListStreams"
            ],
            "Resource": [
                "arn:aws:dynamodb:eu-west-1:821390823963:table/final-project-user-details/*"
            ]
        },
        {
            "Sid": "DynamoDBTableAccess",
            "Effect": "Allow",
            "Action": [
                "dynamodb:BatchGetItem",
                "dynamodb:BatchWriteItem",
                "dynamodb:ConditionCheckItem",
                "dynamodb:PutItem",
                "dynamodb:DescribeTable",
                "dynamodb:DeleteItem",
                "dynamodb:GetItem",
                "dynamodb:Scan",
                "dynamodb:Query",
                "dynamodb:UpdateItem"
            ],
            "Resource": "arn:aws:dynamodb:eu-west-1:821390823963:table/final-project-user-details"
        },
        {
            "Sid": "DynamoDBDescribeLimitsAccess",
            "Effect": "Allow",
            "Action": "dynamodb:DescribeLimits",
            "Resource": [
                "arn:aws:dynamodb:eu-west-1:821390823963:table/final-project-user-details"
            ]
        }
    ]
}
*/

// working function 

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient({ region: 'eu-west-1' });
var ses = new aws.SES({ region: "eu-west-1" });

exports.handler = async (event, context) => {
    console.log(event);

    let date = new Date();

    if (event.request.userAttributes.sub) {

        // -- Write data to DDB
      let ddbParams = {
          TableName: 'final-project-user-details',
  Item: {                
                'id': event.request.userAttributes.sub,
                'username': event.userName,
                'email':  event.request.userAttributes.email,
                'createdAt':  date.toISOString()
                
              }
            
        };

        // Call DynamoDB
        try {
            await ddb.put(ddbParams).promise()
            console.log("Success");
        } catch (err) {
            console.log("Error", err);
        }
        const email = await sendEmail(event);

        console.log("Success: Everything executed correctly");
        context.done(null, event);

    } else {
        // Nothing to do, the user's email ID is unknown
        console.log("Error: Nothing was written to DDB");
        context.done(null, event);
    }
};

async function sendEmail(event){

    var params = {
        Destination: {
          ToAddresses: [event.request.userAttributes.email],
        },
        Message: {
          Body: {
            Text: { Data: "Thank you for signing up to CoinStack, We will send you updates on future price movement" },
          },
    
          Subject: { Data: "Welcome" },
        },
        Source: 'jalenoss33@gmail.com'
      };
     
      return ses.sendEmail(params).promise()

}
