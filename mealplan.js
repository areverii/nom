import 'dotenv/config';
import OpenAI from 'openai';

const openai_api_key = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: openai_api_key,
});

async function call_chatgpt(messages) {
  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      stream: true,
      max_tokens: 1000,  // Adjust as needed
    });

    let responseText = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      process.stdout.write(content);
      responseText += content;
    }
    return responseText;
  } catch (error) {
    console.error('Error calling ChatGPT:', error);
    return null;
  }
}

async function generate_meal_plan(user_input) {
  const messages = [
    { role: 'system', content: 'You are a helpful assistant for an app called Nom. Your role is to generate or modify meal plans for the user. By default, meal plans contain 3 meals a day for a week. When creating a meal plan, start it at the next upcoming meal based on the time and day you receive the request.' },
    { role: 'user', content: user_input }
  ];

  return await call_chatgpt(messages);
}

async function create_meal_plan_with_recipes(user_input) {
  try {
    const meal_plan = await generate_meal_plan(user_input);
    if (meal_plan) {
      console.log('Generated Meal Plan:', meal_plan);
      // Placeholder for future Edamam API call
      // const recipes = await get_recipes(meal_plan);
      return { meal_plan /* , recipes */ };
    } else {
      throw new Error('Failed to generate meal plan');
    }
  } catch (error) {
    console.error('Error creating meal plan with recipes:', error);
    return null;
  }
}

// Example Usage
const user_input = "I want to bake a creme brulee recipe one night, and I want at least one Italian recipe.";

create_meal_plan_with_recipes(user_input)
  .then(result => {
    if (result) {
      console.log('Final Result:', result);
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
