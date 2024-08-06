const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({extended: false}));

const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/signup.html');
})

const uri = 'mongodb+srv://log:login@maincluster.ig4j0cq.mongodb.net/?retryWrites=true&w=majority&appName=mainCluster';

mongoose.connect(uri,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('mongo is connected');
})

const Schema = mongoose.Schema;

const dataSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

const User = mongoose.model('User', dataSchema);

app.post('/signup', (req, res) => {
    const { email, password } = req.body;
    const newUser = new User({
        email,
        password
    });
    newUser.save().then(() => {
        res.send('User registered successfully');
    }).catch(err => {
        res.send('Error registering user');
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    User.findOne({ email: email }).then(user => {
        if (!user) {
            return res.send('User not found');
        }
        
        if (user.password !== password) {
            return res.send('Incorrect password');
        }

        res.send('Login successful');
    }).catch(err => {
        res.send('Error logging in');
    });
});

app.listen(port, () => {
    console.log('server running at port ' + port);
})