import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { connect_to_database, close_database } from './db.js';
import { call_agent } from './agent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const user = 'default'; // need to set at login

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mealplan.html'));
});

app.get('/preferences', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'preferences.html'));
});

app.post('/updatePreferences', async (req, res) => {
    const { calorieTarget, dietType, allergies } = req.body;

    const userPreferences = {
        calorieTarget: calorieTarget.toString(),
        dietType: dietType.toString(),
        allergies: allergies ? allergies.split(',').map(allergy => allergy.trim().toString()) : []
    };

    try {
        const db = await connect_to_database();
        const result = await db.collection('users').updateOne(
            { userId: user },
            { $set: userPreferences },
            { upsert: true }
        );
        
        if (result.upsertedCount > 0) {
            console.log(`A new user was added with ID: ${user}`);
        } else if (result.modifiedCount > 0) {
            console.log(`User preferences updated for user ID: ${user}`);
        } else {
            console.log(`No changes made to user ID: ${user}`);
        }

        await close_database();
        res.send("User preferences updated successfully!");
    } catch (error) {
        console.error("An error occurred while updating preferences in the database:", error);
        res.status(500).send("An error occurred while updating preferences in the database.");
    }
});

// meal plan generation endpoint
app.post('/generate', async (req, res) => {
    const { query } = req.body;
    const user_id = user;
    try {
        const db = await connect_to_database();
        const preferences = await db.collection('users').findOne({ userId: user_id });
        const full_input = `${query}\nUser Preferences: ${JSON.stringify(preferences)}`;
        const meal_plan = await call_agent(full_input);
        res.json(meal_plan);
    } catch (error) {
        console.error('Error generating meal plan:', error);
        res.status(500).send('Error generating meal plan');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
