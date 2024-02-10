const fetchOpenAIAPI = async (userInfo) => {
  
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      throw new Response("Missing OPENAI_API_KEY", { status: 400 });
    }
    const payload = {
      model: "gpt-3.5-turbo-0125",
      messages: [{ role: "user", content: userInfo }],
      temperature:  0.1,
      stream: true,
    };
  
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      method: "POST",
      body: JSON.stringify(payload),
    });
  
    if (response.status !== 200) {
      throw new Response(response.statusText, { status: response.status });
    }

    return response;
  };
  
  export default fetchOpenAIAPI;
  