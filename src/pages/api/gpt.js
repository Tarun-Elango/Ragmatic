import EventEmitter from "events";
import OpenAI from "openai";

const openai = new OpenAI();
const stream = new EventEmitter();

// Function to generate a random word
function generateRandomWord(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  let counter = 0;
  const maxWords = 10; // Maximum number of words to send

  // Replace this with your OpenAI stream
//   const interval = setInterval(() => {
//     if (counter < maxWords) {
//         const word = generateRandomWord(Math.floor(Math.random() * 6) + 3);
//         res.write(`data: ${JSON.stringify({ word, count: counter++ })}\n\n`);
//       } else {
//         // Send a completion message after the last word
//         res.write(`event: complete\ndata: {"message": "Stream complete"}\n\n`);
//         clearInterval(interval); // Stop the interval
//       }
//   }, 1000);

    const stream = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: "Say this is a test 5 times" }],
        stream: true,
    });
    for await (const chunk of stream) {
        const message = chunk.choices[0]?.delta?.content || ""
        // process.stdout.write();
        res.write(`data: ${JSON.stringify(message)}\n\n`);
    }
    res.write(`event: complete\ndata: {"message": "Stream complete"}\n\n`);
    

//   stream.on("push", (data) => {
//     res.write(data);
//   });

  req.on("close", () => {
    clearInterval(interval);
  });
}


