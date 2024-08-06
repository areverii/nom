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

/* must have OPENAI_API_KEY set as an environment var */
const openai_api_key = process.env.OPENAI_API_KEY;

/* LLM used is chatgpt-4o */
const model = new ChatOpenAI({
  model: 'gpt-4o',
  temperature: 0,
  apiKey: openai_api_key,
});

/* this is kind of strange but langchain requires at least one tool and a schema 
in order to work. the tool used to be edamamAPI, but due to pricing restrictions
we couldn't use that, so for now i used a placeholder schema and tool. */
const placeholder_schema = z.object({
  meal: z.string(),
});

const placeholder_tool = new DynamicTool({
  name: 'placeholder_tool',
  description: 'This is a placeholder tool.',
  func: async () => {
    return 'This is a placeholder response.';
  },
  schema: placeholder_schema,
});

const tools = [placeholder_tool];

/* current time and day are passed to the LLM so it knows when the next meal it should generate is */
const current_date_time = new Date();
const current_time = current_date_time.toTimeString().split(' ')[0];
const current_day = current_date_time.toLocaleDateString('en-US', { weekday: 'long' });

/* the warmup prompt is extremely important! it's the only way as far as i know to get the LLM to produce templated, parsable output. */
const prompt = ChatPromptTemplate.fromMessages([
  ['system', `You are a helpful assistant for an app called Nom. The user already sees your first message, which says hey! let's get a mealplan started! let me know what you're feeling. You write in all lowercase and in a cute but mellow manner! Always have punctuation. Your role is to generate or modify meal plans for the user. By default, meal plans contain 3 meals a day for a week. When creating a meal plan, start it at the next upcoming meal based on the current time and day. If it's past around 7pm for the user, start the meal plan at breakfast for the following day. You must produce a full meal plan without leaving out any meals. The current time is ${current_time} and the current day is ${current_day}. Your output must be formed like this:

response: Write a natural language response explaining the meal plan and how it accommodates the user's preferences, including details about how dietary preferences, allergies, and calorie targets were considered.

json: Provide the meal plan in the following JSON format without any newlines or extra whitespace: {{\"days\":[{{\"day\":\"Monday\",\"meals\":{{\"breakfast\":\"\",\"lunch\":\"\",\"dinner\":\"\"}}}}, ... ]}}

Make sure to replace the placeholders "response:" and "json:" with the actual content. Design or modify the meal plan to best fit the query and the user's preferences (food likes/dislikes, allergies, calorie targets, etc...) if they have any. Make sure to strictly adhere to allergies and dietary preferences. In your response, explain clearly how the meal plan accommodates the user's preferences. For example, "i made sure to include this and this to ensure you hit your calorie target" or "i avoided this ingredient due to your allergy". Ensure that your explanation is detailed and directly addresses the user's stated preferences.`],
  ['user', '{input}'],
  new MessagesPlaceholder('agent_scratchpad'),
]);

/* set up the langchain agent */ 
const model_with_functions = model.bind({
  functions: tools.map(tool => convertToOpenAIFunction(tool)),
});

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

/* call_agent
takes in a combined input (can include stuff like user preferences) and calls the agent executor with it.
it retries a few times if the output does not validate correctly.
returns a meal plan object.
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
 * Function to parse and verify the output
 * @param {string} output - the raw output from the agent
 * @returns {Promise<Object|null>} - the parsed and verified meal plan or null if an error occurs
 /* 
 parse_and_verify_output
 the output parsing had to use some regular expression patterns but basically all it is doing is separating
 the response from the JSON meal plan. this works because the warmup prompt tells the LLM to generate a result that looks like
      response: ...
      json: ...
  so we can just split the output on the response and json delimiters and parse the JSON part.

 */
async function parse_and_verify_output(output) {
  try {
    const response_match = output.match(/response:\s*(.*?)\s*json:/);
    const response = response_match ? response_match[1].trim() : null;

    const json_match = output.match(/{[\s\S]*}/);
    if (!json_match) {
      throw new Error('No JSON found in the output');
    }
    const json_string = json_match[0];
    const meal_plan = JSON.parse(json_string);

    return { meal_plan, response };
  } catch (error) {
    console.error('error parsing or verifying the meal plan:', error);
    throw new Error('no JSON found in the output!');
  }
}

/* get_user_preferences
uses the db.js module to connect to the database using a username and returns back the findOne
*/
async function get_user_preferences(username) {
  try {
    const db = await connect_to_database();
    const preferences = await db.collection('user_preferences').findOne({ username });
    return preferences || {};
  }
  catch (error) {
    console.error('error connecting to the database or fetching preferences:', error);
    return {};
  }
  finally {
    await close_database();  // close db after fetching prefs
  }
}

export { call_agent, get_user_preferences };
