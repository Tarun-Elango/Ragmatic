// Assuming "@/inputs" and "@/utils/OpenAIStreamForEdge" are already JavaScript modules that can be imported directly
// Importing necessary utilities and functions
import { OpenAIStream } from "../../utils/OpenAIStreamForEdge";
import fetchOpenAIAPI from "../../utils/fetchOpenAIAPI";

// Configuration object for runtime setting
export const config = {
  runtime: "edge",
};

// Default export of an asynchronous function named handler
export default async function handler(req) {
  try {
    console.log('here')
    const response = await fetchOpenAIAPI();
    const stream = await OpenAIStream(response);
    return new Response(stream, {
      headers: new Headers({
        "Cache-Control": "no-cache",
      }),
    });
  } catch (err) {
    // Error handling, returning the error as a Response if it's an instance of Response
    if (err instanceof Response) {
      return err;
    }
    console.log(err)
    // Returning a generic 500 Internal Server Error response for other types of errors
    return new Response("Internal Server Error", { status: 500 });
  }
}
