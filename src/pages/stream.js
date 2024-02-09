import { useState } from "react";

export default function Home() {
  const [eventSource, setEventSource] = useState(null);

  const callSSE = () => {
    if (eventSource) {
        console.log("SSE already started");
        return;
      }
    const newEventSource = new EventSource("/api/gpt");
    newEventSource.onmessage = (e) => {
      console.log(JSON.parse(e.data));
    };
    newEventSource.addEventListener("complete", (e) => {
      console.log("Stream complete", JSON.parse(e.data));
      newEventSource.close(); // Close the connection upon receiving the completion message
      setEventSource(null); // Reset the event source state
    });
    newEventSource.onerror = (e) => {
      if (e.currentTarget.readyState === EventSource.CLOSED) {
        console.log("SSE closed", e);
      } else {
        console.log("SSE error", e);
      }
      newEventSource.close();
      setEventSource(null);
    };
    setEventSource(newEventSource);
  };

  const handleClose = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
      console.log("Connection closed");
    }
  };

  return (
    <div>
      <button onClick={callSSE}>Start SSE</button>
      <button onClick={handleClose}>Stop SSE</button>
      <p>Open the console to see the SSE messages</p>
    </div>
  );
}
