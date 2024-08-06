import { ChatOpenAI } from '@langchain/openai';
import { DynamicTool } from '@langchain/core/tools';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { convertToOpenAIFunction } from '@langchain/core/utils/function_calling';
import { RunnableSequence } from '@langchain/core/runnables';
import { AgentExecutor } from 'langchain/agents';
import { formatToOpenAIFunctionMessages } from 'langchain/agents/format_scratchpad';
import { OpenAIFunctionsAgentOutputParser } from 'langchain/agents/openai/output_parser';
import { z } from 'zod';
import { connect_to_database, close_database } from './db.js';

const openai_api_key = process.env.OPENAI_API_KEY;

const model = new ChatOpenAI({
  model: 'gpt-4o',
  temperature: 0,
  apiKey: openai_api_key,
});

// minimal schema for placeholder tool
const placeholder_schema = z.object({
  meal: z.string(),
});

// placeholder tool to avoid empty functions array error
const placeholder_tool = new DynamicTool({
  name: 'placeholder_tool',
  description: 'This is a placeholder tool.',
  func: async () => {
    return 'This is a placeholder response.';
  },
  schema: placeholder_schema,
});

const tools = [placeholder_tool];

// get the current time and day
const current_date_time = new Date();
const current_time = current_date_time.toTimeString().split(' ')[0];
const current_day = current_date_time.toLocaleDateString('en-US', { weekday: 'long' });

// warmup prompt
const prompt = ChatPromptTemplate.fromMessages([
  ['system', `You are a helpful assistant for an app called Nom. You write in all lowercase and in a cute but mellow manner! Always have punctuation. Your role is to generate or modify meal plans for the user. By default, meal plans contain 3 meals a day for a week. When creating a meal plan, start it at the next upcoming meal based on the current time and day. If it's past around 7pm for the user, start the mealplan at breakfast for the following day. You must produce a full meal plan without leaving out any meals. The current time is ${current_time} and the current day is ${current_day}. Your output must be formed like [response that will be displayed separately] [json]. You must output the meal plan just once in the following JSON format without any newlines or extra whitespace: {{"days":[{{"day":Monday,"meals":{{"breakfast":"","lunch":"","dinner":""}}}}, ... ]}}. Design or modify the mealplan to best fit the query and the user's preferences (food likes/dislikes, allergies, calorie targets, etc...) if they have any.`],
  ['user', '{input}'],
  new MessagesPlaceholder('agent_scratchpad'),
]);

// langchain agent tools
const model_with_functions = model.bind({
  functions: tools.map(tool => convertToOpenAIFunction(tool)),
});

// create langchain agent
const runnable_agent = RunnableSequence.from([
  {
    input: (i) => i.input,
    agent_scratchpad: (i) => formatToOpenAIFunctionMessages(i.steps),
  },
  prompt,
  model_with_functions,
  new OpenAIFunctionsAgentOutputParser(),
]);

const executor = AgentExecutor.fromAgentAndTools({
  agent: runnable_agent,
  tools,
});

/* 
 * function to call the agent
 * @param {string} input - the user input to be processed by the agent
 * @param {number} retries - the number of retry attempts
 * @returns {Promise<Object>} - the final meal plan generated by the agent
 */
async function call_agent(input, retries = 3) {
  console.log(`Calling agent executor with query: ${input}`);
  let attempt = 0;
  while (attempt < retries) {
    try {
      const result = await executor.invoke({ input });
      console.log('Raw Output:', result);

      const meal_plan = await parse_and_verify_output(result.output);
      if (meal_plan) {
        console.log('Final Meal Plan:', meal_plan);
        return meal_plan;
      }
    } catch (error) {
      console.error(`Error on attempt ${attempt + 1}:`, error);
    }
    attempt++;
  }
  console.error('Failed to generate a valid meal plan after multiple attempts.');
  return null;
}

/* 
 * function to parse and verify the output
 * @param {string} output - the raw output from the agent
 * @returns {Promise<Object|null>} - the parsed and verified meal plan or null if an error occurs
 */
async function parse_and_verify_output(output) {
  try {
    // extract the response part from the brackets
    const response_match = output.match(/\[(.*?)\]/);
    const response = response_match ? response_match[1].trim() : null;

    // extract the JSON part of the response
    const json_match = output.match(/{[\s\S]*}/);
    if (!json_match) {
      throw new Error('No JSON found in the output');
    }
    const json_string = json_match[0];
    const meal_plan = JSON.parse(json_string);

    return { meal_plan, response };
  } catch (error) {
    console.error('Error parsing or verifying the meal plan:', error);
    throw new Error('No JSON found in the output');
  }
}

/* 
 * function to get user preferences from MongoDB
 * @param {string} userId - the user ID to fetch preferences for
 * @returns {Promise<Object>} - the user preferences from the database
 */
async function get_user_preferences(userId) {
  try {
    const db = await connect_to_database();
    const preferences = await db.collection('user_preferences').findOne({ userId });
    return preferences || {};
  } catch (error) {
    console.error('Error connecting to the database or fetching preferences:', error);
    return {};
  } finally {
    await close_database();  // Close the database connection after fetching preferences
  }
}

export { call_agent, get_user_preferences };