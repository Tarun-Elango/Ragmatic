//https://github.com/JohannLai/openai-function-calling-tools
import OpenAI from "openai";
import { OpenAIStreamAgents } from "../../../utils/OpenAiStreamAgents";
import {createCalculator } from '../../../tools/calculator';
import { customMiddleware } from "../../../middleware/customMiddleware";
const openai = new OpenAI();
export const config = {
  runtime: "edge",
};

const [calculator, calculatorSchema] = createCalculator();

const functions = {
  calculator,
};
export default async function handler(req, res) {
  const result = await customMiddleware(req.headers.get('authorization'));

    if (!result.success) {
      //  res.status(400).json({ success: false, message: result.message });
        return new Response("Invalid Token", { status: 400 });
      } else {
          if (req.method !== 'POST') {
            // If not a POST request, immediately return 405 Method Not Allowed
            return res.status(405).json({ message: 'Method Not Allowed' });
          }
          try {
            console.log('--------------------------------------------------------------')
            console.log('calculator action start') 
            console.log('--------------------------------------------------------------')

            const { userInfo } = await req.json(); // the query
            const messages = [
              {
                role: "user",
                content: "Use calculator function for this query: "+userInfo,
              },
            ];

            console.log('Initial GPT call for calculator')
            const getCompletion = async (messages) => {
                const response = await openai.chat.completions.create({
                  model: "gpt-3.5-turbo-0125",
                  messages,
                  functions: [calculatorSchema],
                  temperature: 0.1,
                  stream:true
                });
                return response;
              }
            
              let response = await getCompletion(messages);
              console.log("got the response")
              let funcCall = "";
              let fnName="";
              let checker= false
              let regularAns = ""

              console.log('initiating for loop and loop the response')
              // go through the stream response
              for await (const part of response) {
                if(part.choices[0].delta.function_call){
                  // when function call is returned
                  if(part.choices[0].delta.function_call.name){
                    fnName= part.choices[0].delta.function_call.name;
                  }
                  funcCall =funcCall +  part.choices[0].delta.function_call.arguments
                } else{
                  //regular question
                  if(part.choices[0].delta.content){
                    regularAns = regularAns + part.choices[0].delta.content
                  }
                }
                // last message, stop reason
                if(part.choices[0].finish_reason === "function_call"){
                  // function call stop
                  console.log('Function call stop: ',part.choices[0].finish_reason)
                }
                if(part.choices[0].finish_reason === "stop"){
                  console.log('regular stop: ',part.choices[0].finish_reason)
                  // regular stop
                  checker = true;
                }
              }

              // if the return values dont indicate function call
              if(checker){
                console.log('Inside if loop, cause the finish reason specified no function call')
                // regular message
                const encoder = new TextEncoder();
                // Wrapping the message in an object that mirrors the streaming format
                const responseData = {
                    text: regularAns // Ensuring the message is encapsulated within a "text" key
                };
                console.log('Returning the values')
                // Encoding the structured message to maintain consistency with the desired format
                const encodedData = encoder.encode(`data: ${JSON.stringify(responseData)}\n\n`);
                // Returning the encoded data in a Response object with consistent headers
                
                return new Response(encodedData, {
                  status: 200,
                  headers: new Headers({
                    "Cache-Control": "no-cache",
                  }),
                });
              } else {
                console.log('outside if loop, cause the finish reason specified function call')
                // if the return values indicate function call
                const fn = functions[fnName];
                const result = fn(JSON.parse(funcCall)); // do the function processing

                console.log('Processing the gpt response with our function: ', result)
                console.log(`creating message 1 with function call details ${fnName} and ${funcCall}`)
                messages.push({
                  role: "assistant",
                  content: null,
                  function_call: {
                    name: fnName,
                    arguments: funcCall,
                  },
                });

                console.log('creating message 2 with the result inside content')
                messages.push({
                  role: "function",
                  name: fnName,
                  content: JSON.stringify({ result: result }),
                });

                console.log('getting and streaming the response')
                // call the completion again, after pushing the messages
                response = await getCompletion(messages);
                const stream = await OpenAIStreamAgents(response);
                return new Response(stream, {
                  headers: new Headers({
                    "Cache-Control": "no-cache",
                  }),
                });
              }

          }catch (err) {
            console.log('theres an error: ',err)
            if (err instanceof Response) {
              return err;
            }
            
            // Returning a generic 500 Internal Server Error response for other types of errors
            return new Response("Internal Server Error", { status: 500 });

          }
        }
}
