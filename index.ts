import RedisSMQ, { SendMessageOptions } from 'rsmq';
import { createClient, ClientOpts } from 'redis';
import config from 'config';

const QUEUE_NAME = 'omnea-queue'
const redisConfig : ClientOpts = {
    host: config.get('redis.host'),
    port: config.get('redis.port'),
    password: config.get('redis.password'),
    tls : true
}

const redisClient = createClient(redisConfig);

redisClient.on('error', function (err) {
    console.log('Something went wrong ' + err);
});

redisClient.on('connect', function() {
    console.log('Redis client connected');
});

redisClient.on("subscribe", function (channel, message) {
    console.log('Subscribed')
});

const rsmq = new RedisSMQ( {client : redisClient} );

async function createQueueIfNotExist(queueName : string) : Promise<boolean> {
   const queueList = await rsmq.listQueuesAsync();
   
   if (queueList.includes(queueName)) {
       console.log('Current list:', queueList);
       console.log('already exists.')
       return false;
    }

    const createdQueue = await rsmq.createQueueAsync({ qname: queueName })
    console.log('created')

    return !!createdQueue;
}

function postNewMessage(msgText : string) {
    const msgOptions : SendMessageOptions = {message: msgText, qname: QUEUE_NAME};
    rsmq.sendMessageAsync(msgOptions);
}

function startReadingMessages() {
    let time = 1*1000;
    setTimeout(() => {
        rsmq.receiveMessage({ qname: QUEUE_NAME }, function (err, resp: any) {
            if (err) {
                console.error(err)
                return
            }
        
            if (resp.message) {
                console.log("Message received.", resp)
            } else {
                console.log("No messages for me...")
            }
        });
        startReadingMessages();
    }, time); 
}

function initTest() {
    createQueueIfNotExist(QUEUE_NAME);
    postNewMessage('Holi');
    postNewMessage('Holi2');
    startReadingMessages();
}

initTest();