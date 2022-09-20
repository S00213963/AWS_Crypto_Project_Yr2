// working , but cannot change or push data from api into array
// Loads in the AWS SDK
const AWS = require('aws-sdk');
const https = require('https');

const ddb = new AWS.DynamoDB.DocumentClient({ region: 'eu-west-1' });
var dataArray = {
    'price': '1000',
    'movement': '50000'
}
exports.handler = async (event) => {
    let rawData = '';
    const response = await new Promise((resolve, reject) => {
        const req = https.get("https://api.coingecko.com/api/v3/coins/bitcoin", function (res) {
            res.on('data', chunk => {
                rawData += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: 200,
                    body: JSON.parse(rawData)
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
    const data = await createMessage(dataArray)


    if(!data){
        console.log('these is an error saving the data')
    }

    return response
};

// Writes message to DynamoDb table Message
async function createMessage(Data) {
    let ts = new Date().toLocaleString();
    const params = {
        TableName: 'final-project-bitcoinDB',
        Item: {
            'time': ts,
            'id': 'bitcoin',
            'price': Data.price,
            'movement': Data.movement
        }
    }

    return ddb.put(params).promise().then(response => {
        return response.Item

    }, error => {
        console.error('there is an error: ', error)
    })

}