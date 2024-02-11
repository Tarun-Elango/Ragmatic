async function fetchModelResponse(inputData) {
    const url = "https://api-inference.huggingface.co/models/cross-encoder/ms-marco-electra-base";
  
      // Set up the request options
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Replace 'YOUR_API_TOKEN_HERE' with your actual Hugging Face API token
          'Authorization': `Bearer ${process.env.HF_API_TOKEN}`
        },
        // Example input, replace with your actual data
        body: JSON.stringify(inputData)
      };
  
      // Execute the fetch request
      const response = await fetch(url, requestOptions);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
  
    return response.json(); // Parse and return the response JSON
}

async function getTopSimilarSentences(mainSentence, otherSentences) {
    const scores = [];
  
    // Get similarity score for each sentence
    for (const sentence of otherSentences) {
      try {
        const response = await fetchModelResponse({inputs: [mainSentence, sentence]});
        scores.push({ sentence, score: response.score });
      } catch (error) {
        console.error(`Error fetching similarity for sentence: "${sentence}"`, error);
      }
    }
  
    // Sort sentences by score in descending order
    scores.sort((a, b) => b.score - a.score);
  
    // Take top 5 sentences
    const topSentences = scores.slice(0, 5).map(entry => entry.sentence);
  
    // Return as a single string
    return topSentences.join(', ');
  }

  export default getTopSimilarSentences;
  