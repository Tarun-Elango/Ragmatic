# TODO:
# use input reader to read the input file and store embeddings to vector db
# use queryGen to generate a query
# use agents along with llm model(aiHelper), agent type should be based on question asked ( based on category given by queryGen)
# IDEA: take the final document list and invoke approprotae agents for each document and then synthesis an answer based on each agent response

# store the required user history/data on mongodb

from queryGen import query_generate
from aiHelper import localAI


def main():
    user_query = "list out the 5 core elective areas"
    user_query2 = user_query + ", here is the content for the pdf: "
    user_file = "input/zurich-masters.pdf"
    storage_folder = "storage"
    token_limit = 8198
    include = ['distances', 'metadatas', 'documents']
    output_data, temp = query_generate(user_query, user_file, token_limit, storage_folder,include)
    userContent = user_query2 + str(output_data)
    systemContent = "You are a pdf assitant, pdf content is give to you by the user"
    # higher temp = more creative, lower is more deterministic and sharp
    localAI(systemContent, userContent, temp)



if __name__ == '__main__':
    main()
    
    
    
'''
messages = []
for i in range(3):
    msg = input('human: ')
    messages.append({"role": "user", "content": msg})
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        max_tokens=128,
        temperature=0.9,
        messages=messages
    )
    ai_response = response.choices[0].message.content.replace('\n', '')
    messages.append({"role":"assistant","content": ai_response})
    print(f'ai: {ai_response}')
    print('\n')
    
multiturn chat responses
'''
    
# TODO: chat mechanism for llm