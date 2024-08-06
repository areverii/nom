import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connect_to_database, close_database } from './db.js';
import { call_agent } from './agent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// user is always default for now
const user = 'default';

/* endpoints for serving the different pages */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mealplan.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});


app.get('/preferences', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'preferences.html'));
});

/* endpoint for submitting preferences form
note: we ultimately parse everything as a normal string instead of requiring
a certain form of input because the LLM can handle natural language input.
this gives a lot more flexibility to users. */
app.post('/updatePreferences', async (req, res) => {
    const { calorieTarget, dietType, allergies } = req.body;

    const userPreferences = {
        calorieTarget: calorieTarget.toString(),
        dietType: dietType.toString(),
        //allergies: allergies ? allergies.split(',').map(allergy => allergy.trim().toString()) : []
        allergies: allergies.toString()
    };

    try {
        const db = await connect_to_database();
        const result = await db.collection('users').updateOne(
            { userId: user },
            { $set: userPreferences },
            { upsert: true }
        );
        
        if (result.upsertedCount > 0) {
            console.log(`a new user was added with ID: ${user}`);
        } else if (result.modifiedCount > 0) {
            console.log(`user preferences updated for user ID: ${user}`);
        } else {
            console.log(`no changes made to user ID: ${user}`);
        }

        await close_database();
        res.send("user preferences updated successfully!");
    } catch (error) {
        console.error("an error occurred while updating preferences in the database:", error);
        res.status(500).send("an error occurred while updating preferences in the database!");
    }
});

/* endpoint that constructs the full agent input including preferences and calls call_agent to get a generated response */
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
        console.error('error generating meal plan:', error);
        res.status(500).send('error generating meal plan');
    }
});

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});
