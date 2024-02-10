import { OpenAIStream } from "../../../utils/OpenAIStreamForEdge";
import fetchOpenAIAPI from "../../../utils/fetchOpenAIAPI";
import { customMiddleware } from "../../../middleware/customMiddleware";
// Configuration object for runtime setting
export const config = {
  runtime: "edge",
};

// Default export of an asynchronous function named handler
export default async function handler(req) {
  const result = await customMiddleware(req.headers.get('authorization'));

    if (!result.success) {
      //  res.status(400).json({ success: false, message: result.message });
        return new Response("Invalid Token", { status: 400 });
      } else {
    if (req.method !== 'POST') {
        //res.status(405).end(`Method ${req.method} Not Allowed`);
        return new Response(`Method ${req.method} Not Allowed`, { status: 405 });
      }

    const { userInfo } = await req.json();
  try {
    const response = await fetchOpenAIAPI(userInfo);
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
}
