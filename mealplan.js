import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import fetch from 'node-fetch';
import { DynamicTool } from '@langchain/core/tools';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { convertToOpenAIFunction } from '@langchain/core/utils/function_calling';
import { RunnableSequence } from '@langchain/core/runnables';
import { AgentExecutor } from 'langchain/agents';
import { formatToOpenAIFunctionMessages } from 'langchain/agents/format_scratchpad';
import { OpenAIFunctionsAgentOutputParser } from 'langchain/agents/openai/output_parser';
import { AIMessage, HumanMessage } from '@langchain/core/messages';

const openai_api_key = process.env.OPENAI_API_KEY;
const edamam_app_id = process.env.EDAMAM_APP_ID;
const edamam_app_key = process.env.EDAMAM_APP_KEY;

const model = new ChatOpenAI({
  model: 'gpt-4o',
  temperature: 0,
  apiKey: openai_api_key,
});

const queryEdamamAPI = new DynamicTool({
  name: 'query_edamam',
  description: 'Queries the Edamam API to fetch recipes based on the meal plan.',
  func: async (meal) => {
    const url = `https://api.edamam.com/search?q=${meal}&app_id=${edamam_app_id}&app_key=${edamam_app_key}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.hits.map(hit => hit.recipe).join('\n');
    } catch (error) {
      console.error('Error fetching recipes:', error);
      return 'Error fetching recipes';
    }
  },
});

const tools = [queryEdamamAPI];

// warmup prompt
const prompt = ChatPromptTemplate.fromMessages([
  ['system', 'You are a helpful assistant for an app called Nom. Your role is to generate or modify meal plans for the user. By default, meal plans contain 3 meals a day for a week. When creating a meal plan, start it at the next upcoming meal based on the time and day you receive the request.'],
  ['human', '{input}'],
  new MessagesPlaceholder('agent_scratchpad'),
]);

// langchain agent tools
const modelWithFunctions = model.bind({
  functions: tools.map(tool => convertToOpenAIFunction(tool)),
});

// create langchain agent
const runnableAgent = RunnableSequence.from([
  {
    input: (i) => i.input,
    agent_scratchpad: (i) => formatToOpenAIFunctionMessages(i.steps),
  },
  prompt,
  modelWithFunctions,
  new OpenAIFunctionsAgentOutputParser(),
]);

const executor = AgentExecutor.fromAgentAndTools({
  agent: runnableAgent,
  tools,
});

async function callAgent(input) {
  console.log(`Calling agent executor with query: ${input}`);
  const result = await executor.invoke({ input });
  console.log(result);
  return result.output;
}

// current example
const user_input = "I want to bake a creme brulee recipe one night, and I want at least one Italian recipe.";
callAgent(user_input).then(result => {
  console.log('Final Result:', result);
}).catch(error => {
  console.error('Error:', error);
});

// memory for stateful conversation
const MEMORY_KEY = 'chat_history';
const chatHistory = [];

const memoryPrompt = ChatPromptTemplate.fromMessages([
  ['system', 'You are a helpful assistant for an app called Nom. Your role is to generate or modify meal plans for the user. By default, meal plans contain 3 meals a day for a week. When creating a meal plan, start it at the next upcoming meal based on the time and day you receive the request.'],
  new MessagesPlaceholder(MEMORY_KEY),
  ['user', '{input}'],
  new MessagesPlaceholder('agent_scratchpad'),
]);

const agentWithMemory = RunnableSequence.from([
  {
    input: (i) => i.input,
    agent_scratchpad: (i) => formatToOpenAIFunctionMessages(i.steps),
    chat_history: (i) => i.chat_history,
  },
  memoryPrompt,
  modelWithFunctions,
  new OpenAIFunctionsAgentOutputParser(),
]);

const executorWithMemory = AgentExecutor.fromAgentAndTools({
  agent: agentWithMemory,
  tools,
});

async function callAgentWithMemory(input) {
  console.log(`Calling agent executor with query: ${input}`);
  const result = await executorWithMemory.invoke({ input, chat_history: chatHistory });
  console.log(result);

  chatHistory.push(new HumanMessage(input));
  chatHistory.push(new AIMessage(result.output));

  return result.output;
}

// example code of how to do followup input
// const user_input_with_memory = "How many letters in the word educa?";
// callAgentWithMemory(user_input_with_memory).then(result => {
//   console.log('Final Result:', result);

//   const follow_up_input = "Is that a real English word?";
//   return callAgentWithMemory(follow_up_input);
// }).then(result => {
//   console.log('Follow-Up Result:', result);
// }).catch(error => {
//   console.error('Error:', error);
// });