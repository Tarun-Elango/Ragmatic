import OpenAI from 'openai';
import { middleware } from "../../middleware/middleware";
const openaio = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    });
export default async function handler(req, res) {
      // Apply the middleware to protect this route
  const result = await middleware(req);

  if (!result.success) {
    res.status(400).json({ success: false, message: result.message });
  } else {
  if (req.method === 'POST') {
    try {
      // Ensure the request body has the 'sentences' key with an array of sentences
      if (!req.body.sentences || !Array.isArray(req.body.sentences)) {
        return res.status(400).json({ error: 'Invalid input format. Expecting an array of sentences.' });
      }
      // Generate embeddings for the list of sentences
      const embeddingsResponse = await openaio.embeddings.create({
        input: req.body.sentences,
        model: 'text-embedding-3-small', // or another suitable engine,
        encoding_format: "float",
      });
      console.log(embeddingsResponse.data.length)
      // Respond with the embeddings
      res.status(200).json({ embeddings: embeddingsResponse.data });
    } catch (error) {
      // Handle any errors from the OpenAI API
      res.status(500).json({ error: error.message });
    }
  } else {
    // Handle non-POST requests
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
}