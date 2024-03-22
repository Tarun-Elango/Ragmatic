import OpenAI from "openai";
import { OpenAIStreamAgents } from "../../utils/OpenAiStreamAgents";
import {createGoogleCustomSearch } from '../../tools/search';
import { customMiddleware } from "../../middleware/customMiddleware";
const openai = new OpenAI();
export const config = {
  runtime: "edge",
};

const [googleCustomSearch, googleCustomSearchSchema] =
    createGoogleCustomSearch({
        apiKey: process.env.GOOGLE_API_KEY,
        googleCSEId: process.env.GOOGLE_CSE_ID,
    });


const functions = {
googleCustomSearch
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
            console.log('Search action') 
            console.log('--------------------------------------------------------------')
            const { userInfo } = await req.json();
            const messages = [
            {
                role: "user",
                content: "Use search function for this query. "+userInfo,
            },
            ];
            const getCompletion = async (messages) => {
                const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo-0125",
                messages,
                functions: [googleCustomSearchSchema],
                temperature: 0.1,
                stream:true
                });
            
                return response;
            }
            let response = await getCompletion(messages);
            let funcCall = "";
            let fnName="";
            let checker= false
            let regularAns = ""
            
            for await (const part of response) {
                if(part.choices[0].delta.function_call){
                if(part.choices[0].delta.function_call.name){
                    fnName= part.choices[0].delta.function_call.name;
                }
                // when function call is returned
                funcCall =funcCall +  part.choices[0].delta.function_call.arguments
                } else{
                //regular question
                if(part.choices[0].delta.content){
                    regularAns = regularAns + part.choices[0].delta.content
                }
                
                }
                //stop checker
                if(part.choices[0].finish_reason === "function_call"){
                // function call stop
                }
                if(part.choices[0].finish_reason === "stop"){
                // regular stop
                checker = true;
                }
            }
            console.log(fnName, funcCall, checker, regularAns)
            if(checker){
                // regular message
                const encoder = new TextEncoder();
                // Wrapping the message in an object that mirrors the streaming format
                const responseData = {
                    text: regularAns // Ensuring the message is encapsulated within a "text" key

                };
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
                // agent message
                const fn = functions[fnName];
                const result =await fn(JSON.parse(funcCall));
                // console.log(result)
                messages.push({
                role: "assistant",
                content: null,
                function_call: {
                    name: fnName,
                    arguments: funcCall,
                },
                });

                messages.push({
                role: "function",
                name: fnName,
                content: JSON.stringify({ result: result }),
                });

                // call the completion again
                response = await getCompletion(messages);
                const stream = await OpenAIStreamAgents(response);
                return new Response(stream, {
                headers: new Headers({
                    "Cache-Control": "no-cache",
                }),
                });
            }

        }catch (err) {
            if (err instanceof Response) {
            return err;
            }
            console.log(err)
            // Returning a generic 500 Internal Server Error response for other types of errors
            return new Response("Internal Server Error", { status: 500 });
        }
    }
}
