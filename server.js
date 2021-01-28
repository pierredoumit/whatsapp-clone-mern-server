//importing
const express = require("express")
const mongoose = require("mongoose")
const Pusher = require('pusher');
const Messages = require("./dbMessages.js");
const cors = require("cors")


//app config
const app = express();
const port = process.env.PORT || 9000;


const pusher = new Pusher({
    appId: '1092205',
    key: '378d5ed1333d00438eda',
    secret: 'fe446705b0b9a898c8c5',
    cluster: 'eu',
    encrypted: true
});

//middleware
app.use(express.json());
app.use(cors())

// DB config

const dbUrl = 'mongodb+srv://admin:edFyBUeYy5Xu7Sz4@cluster0.we4p2.mongodb.net/Whatsapp-Mern?retryWrites=true&w=majority';
//const dbUrl = 'mongodb://localhost/mern-whatsapp';
//connecting to mongoose
mongoose.connect(dbUrl, { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true }, function (err, data) {
    console.log('mongo db connection', err);
});

const db = mongoose.connection;

db.once('open', () => {
    console.log("DB connected");

    const msgCollection = db.collection('messagecontents')
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log(change)

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            });
        }
        else {
            console.log("Error triggering Pusher")
        }
    })
})

//??

//api routes
app.get('/', (req, res) => res.status(200).send("Hello World"));

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if (err)
            res.status(500).send(err)
        else
            res.status(200).send(data)
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body;
    Messages.create(dbMessage, (err, data) => {
        if (err)
            res.status(500).send(err)
        else
            res.status(200).send('New Message create \n ' + data)
    })
})

//listen
app.listen(port, () => console.log('listing at port:' + port))



