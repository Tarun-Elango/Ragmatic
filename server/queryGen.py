# helper class to take the users prompt
# take the users desired file 
# and create the most accurate/concise prompt

#TODO: take user query, get the vectordb result, and make a consise query
# take the embedding result make a consise query(based on token limit) 
# TODO: find a way to get the best size for num_of_queries
'''
It obviously depends on the question.

"Who plays jack in titanic?" vs "Summarize the plot of the movie titanic."

try to find an algorithm to find the optimal query

try to use gpt on prompt, and indentify if the question is specify then lower docus
if the prompt is general, then higher docus

higher docu = lower temp
lower docu = higher temp
this inverse relation works, cant use this


'''

'''
use llm here to find  
- relevant documents
- and use to make a consise summary while also keep the kepping important terms
- categorizing the user question along with the content (like math, reasoning, others etc) try to corelate with any agent if
required

'''
# then use both the initial query and embedding result(above steps) and send it all to llm

from inputReader import docu, collection_num_of_items
import tiktoken

# returns tokens from the input string   
def num_tokens_from_string(string: str, encoding_name: str) -> int:
    encoding = tiktoken.get_encoding(encoding_name)
    num_tokens = len(encoding.encode(string))
    return num_tokens

#print(num_tokens_from_string("Hello world, let's test tiktoken.", "cl100k_base"))
'''
cl100k_base	gpt-4, gpt-3.5-turbo, text-embedding-ada-002
p50k_base	text-davinci-003, text-davinci-002
r50k_base	GPT-3 models
'''

# ids, distances, metadatas, documents, uris, data

def find_num_of_queries(user_query, user_file, token_limit, storage_folder,include):
    # take token limit and documents returned and find max limit, and set num_ofqueries to 1 minus that value
    outputforone = docu(user_query, user_file, 1, include, storage_folder)
    token_size = num_tokens_from_string(str(outputforone['documents'][0]),"cl100k_base")
    max_docus = (token_limit/token_size) - 3 # token_limit / token size of each document for this pdf
    total_docus_for_pdf = collection_num_of_items( storage_folder, user_file[6:-4].replace("-",""))
    # INVERSE relation between relative docu size returned and temp
    num_of_q = 0 
    
    if max_docus > total_docus_for_pdf :
        num_of_q= total_docus_for_pdf - 3
    else:
        num_of_q= max_docus

    temp = 0.1
        
    return num_of_q, temp


"""
user_query = "list out the 5 core elective areas, here is the content for the pdf: "
user_file = "input/zurich-masters.pdf"
token_limit = 8198
print(find_num_of_queries(user_query, user_file, token_limit))
"""


def query_generate(user_query, user_file, token_limit, storage_folder,include):
    num_of_queries, temp = find_num_of_queries(user_query, user_file, token_limit, storage_folder,include)
    #inital_db_query = docu(user_query, user_file, num_of_queries, include)
    # combine all the documents only into 
    #inital_db_query_docu_string = ""
    #for i in range(num_of_queries):
    #    inital_db_query_docu_string+= inital_db_query['documents']
    return docu(user_query, user_file, num_of_queries, include, storage_folder)['documents'], temp
 
