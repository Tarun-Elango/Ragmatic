export async function OpenAIStreamAgents(response) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
  
    // Creating a ReadableStream that will handle the incoming response data
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            //console.log("Decoded chunk:", chunk); // Log each chunk for inspection
  
            // Convert the chunk into a string format expected by the parser
            const chunkString = JSON.stringify(chunk);
            const chunkData = encoder.encode(chunkString);
  
            // Directly enqueuing encoded chunk data into the controller
            controller.enqueue(chunkData);
          }
        } catch (error) {
          console.error("Error in OpenAIStream:", error);
          controller.error(error); // Proper error handling in the stream
        } finally {
          controller.close(); // Ensuring the stream is properly closed after processing
        }
      },
    });
  
    // Setting up a counter to manage the number of processed events
    let counter = 0;
  
    // Creating a TransformStream to modify the data before it's consumed
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const data = decoder.decode(chunk); // Decoding the chunk into a string
  
        // Basic check to terminate the stream if a specific condition is met
        if (data === "[DONE]") {
          controller.terminate();
          return;
        }
  
        try {
          const json = JSON.parse(data); // Attempt to parse the chunk as JSON
          //console.log('here', json);
  
          const text = json.choices[0]?.delta?.content || ""; // Extracting text from the delta object
  
          // Filtering out unwanted chunks based on content and a counter
          if (counter < 2 && (text.match(/\n/) || []).length) {
            counter++;
            return;
          }
  
          // Preparing the payload for the next stage in the stream
          const payload = { text: text };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch (e) {
          console.error(e);
          controller.error(e); // Error handling in the TransformStream
        }
      },
    });
  
    // Piping the ReadableStream through the TransformStream
    return readableStream.pipeThrough(transformStream);
  }
  