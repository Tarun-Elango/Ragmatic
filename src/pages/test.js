import { FormEvent, useRef, useState } from "react";
import { createParser, ParseEvent } from "eventsource-parser";
const StreamingPage = () => {
    const [generatedCoverLetter, setGeneratedCoverLetter] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
  
    const generate = async () => {
      try {
        const response = await fetch("/api/edge", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userInfo: 'hello' }),
        });
  
        if (response.status !== 200 || !response.body) {
          throw new Error("Failed to generate");
        }
  
        const onParse = (event) => {
          console.log('Event parsed', event); // Debug: Log parsed event
          if (event.type === "event") {
            const data = event.data;
            try {
              const newText = JSON.parse(data).text ?? "";
              setGeneratedCoverLetter(prevText => {
                const updatedText = prevText + newText;
                console.log('Updated text', updatedText); // Debug: Log updated text
                return updatedText;
              });
            } catch (e) {
              console.error("Error parsing event data", e);
            }
          }
        };
        
  
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const parser = createParser(onParse);
  
        while (true) {
          const { value, done } = await reader.read();
  
          if (done) {
            break;
          }
  
          parser.feed(decoder.decode(value));
        }
      } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Failed to Generate";
        setErrorMessage(message);
      }
    };
  
    return (
      <div>
        <button onClick={generate}>Generate Cover Letter</button>
        {errorMessage && <p>Error: {errorMessage}</p>}
        <div>
          <p>Generated Cover Letter:</p>
          <pre>{generatedCoverLetter}</pre>
        </div>
      </div>
    );
  };
  
  export default StreamingPage;