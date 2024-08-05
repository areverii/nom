import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { connect_to_database } from './db.js';
import { call_agent } from './agent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mealplan.html'));
});

// meal plan generation endpoint
app.post('/generate', async (req, res) => {
    const { query } = req.body;
    const user_id = "user123"; // TEMP
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