// const app = require('express')();
// const bodyParser = require('body-parser');
// const MongoClient = require('mongodb').MongoClient;

// const url = "mongodb+srv://make:meals@maincluster.ig4j0cq.mongodb.net/?retryWrites=true&w=majority&appName=mainCluster";

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

// const database = "Meals";
// const collection = "users";

// app.get('/', function(req, res) {
//     res.send(`
//     <form action="/addUser" method="post">
//         <input type="text" name="calorieTarget" placeholder="What's Your Daily Calorie Target?">
//         <input type="text" name="dietType" placeholder="Are You Following Any Specific Diet Style?">
//         <input type="text" name="allergies" placeholder="Allergies (comma-separated)">
//         <input type="submit" value="Submit Preferences">
//     </form>
//     `);
// });

// app.post('/addUser', function(req, res) {
//     const { calorieTarget, dietType, allergies } = req.body;

//     const userPreferences = {
//         calorieTarget: parseInt(calorieTarget) || 2000,
//         dietType: dietType || 'none',
//         allergies: allergies ? allergies.split(',').map(allergy => allergy.trim()) : []
//     };

//     MongoClient.connect(url, function(err, client) {
//         if(err) { 
//             console.log("Connection error: " + err);
//             return res.status(500).send("An error occurred while connecting to the database.");
//         }

//         const db = client.db(database);
//         const coll = db.collection(collection);

//         coll.insertOne(userPreferences, function(err, result) {
//             if (err) {
//                 client.close();
//                 return res.status(500).send("An error occurred while adding preferences to the database.");
//             }

//             client.close();
//             res.send("User preferences added successfully!");
//         });
//     });
// });

// const PORT = 8080; // local
// // const PORT = process.env.PORT || 3000;
// // not needed but helpful
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
