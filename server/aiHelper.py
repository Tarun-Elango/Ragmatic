# helper class to retrieve data from ai model
# TODO: later connect to actual gpt4
from openai import OpenAI
from langchain.agents import load_tools
from langchain.agents import initialize_agent
#from langchain.llms import OpenAI
import os

os.environ["OPENAI_API_KEY"] = ""

def gpt3_5(systemContent, userContent, temp):
    llm = OpenAI(temperature=temp)
    tools = load_tools(["serpapi", "llm-math","wikipedia","terminal"], llm=aiClient)
    agent = initialize_agent(tools, 
                            llm, 
                            agent="zero-shot-react-description", 
                            verbose=True)
    agent.run("hi how are you")
    

def localAI(systemContent, userContent, temp):
    # connect to gemini
    # Point to the local server
    aiClient = OpenAI(base_url="http://localhost:1234/v1", api_key="not-needed")
    tools = load_tools(["serpapi", "llm-math","wikipedia","terminal"], llm=aiClient)
    agent = initialize_agent(tools, 
                            aiClient, 
                            agent="zero-shot-react-description", 
                            verbose=True)
    #agent.run("hi how are you")

    completion = aiClient.chat.completions.create(
    model=agent, # this field is currently unused
    messages=[
        {"role": "system", "content": systemContent},
        {"role": "user", "content": userContent}
    ],
    temperature=temp, # avg 0.7
    response_format={ "type": "json_object" }
    )

    print(completion.choices[0].message)
    return completion

