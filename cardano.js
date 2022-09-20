
/*
policy 

write-bitcoin-data-to-dynamo-s3

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
            "Effect": "Allow",
            "Action": [
                "s3:GetObject"
            ],
            "Resource": "***********************"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject"
            ],
            "Resource": "arn:***********************"
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
                "arn:aws:***********************"
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
            "Resource": "arn:aws:**********************"
        },
        {
            "Sid": "DynamoDBDescribeLimitsAccess",
            "Effect": "Allow",
            "Action": "dynamodb:DescribeLimits",
            "Resource": [
                "arn:aws:**********************"
            ]
        }
    ]
}
*/ 

const AWS = require('aws-sdk');
const https = require('https');
var s3 = new AWS.S3();
const ddb = new AWS.DynamoDB.DocumentClient({ region: 'eu-west-1' });
var dataArray = {
    'price': '1000',
    'movement': '50000'
}
exports.handler = async (event) => {
    let rawData = '';
    const response = await new Promise((resolve, reject) => {
        const req = https.get("https://api.coingecko.com/api/v3/coins/cardano", function (res) {
            res.on('data', chunk => {
                rawData += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: 200,
                    body: JSON.stringify(rawData)
                });
            });
        });
        req.on('error', (e) => {
            reject({
                statusCode: 500,
                body: 'Something went wrong!'
            });
        });
    });

    let parsedData = JSON.parse(rawData);
    dataArray.price = parsedData.market_data['current_price'].eur;
    dataArray.movement = parsedData.market_data.price_change_percentage_24h;

    const data = await createMessage(dataArray);
    const s3 = await pushToBucket(dataArray);


    if(!data){
        console.log('these is a error pushing to Dynamo')
    }

    if(!s3){
        console.log('there is an error pushing to S3')
    }

    return response
};

// Writes message to DynamoDb table Message
async function createMessage(Data) {
    let ts = new Date().toLocaleString();
    
    let time = new Date();
    time.setDate(time.getDate() + 3);
    let epochTime = Date.parse(time);
    
    const params = {
        TableName: 'final-project-cardanoDB',
        Item: {
            'time': ts,
            'id': 'cardano',
            'price': Data.price,
            'movement': Data.movement,
            'expdate': epochTime
        }
    }

    return ddb.put(params).promise().then(response => {
        return response.Item

    }, error => {
        console.error('there is an error: ', error)
    })

}
async function pushToBucket(passedData){

    let format = Buffer.from(JSON.stringify(passedData));


    let ts = new Date().toLocaleString();
   
    var data = {
        Bucket: 'final-project-cardano',
        Key: ts+'.json',
        Body: format
    };

    return s3.upload(data, function (err, data) {
        if (err) {
            console.log(err);
            console.log('Error uploading data: ', data);
        } else {
            console.log('succesfully uploaded!!!');
        }

        return;
    });
}
