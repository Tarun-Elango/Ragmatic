# this script reads a pdf file and stores ite corresponding embedding to a chroma db instance
import chromadb
from chromadb.utils import embedding_functions
from chromadb.config import Settings
from langchain.document_loaders import PyPDFLoader, PDFMinerLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

# TODO: improve embeddings model, try embeding on sentence level, improve splitting consitency/accuracy, try different distance formulas

def chroma_init(path, name):
    #create a persistent client
    chroma_client = chromadb.PersistentClient(path)

    #custom embedding function
    #sentence_transformer = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-mnet-base-v2") # need to download pip

    #create a collection using client, is already created just read
    collection = chroma_client.get_or_create_collection(name)
    #collection = chroma_client.get_or_create_collection(name="test", embedding_function=sentence_transformer)
    
    return collection
    

def read_and_split(name):
    if name.endswith('.pdf'):
        # Read a pdf and split it
        loader = PyPDFLoader(name)
        # Basic split: by pages
        pages = loader.load_and_split() 
        # Split with more control and precision

    elif name.endswith('.txt'):
        # This is a long document we can split up.
        with open(name, encoding="utf-8") as f:
            file = f.read()

        text_splitter = RecursiveCharacterTextSplitter(
            # Set a really small chunk size, just to show.
            chunk_size=200,
            chunk_overlap=20,
            length_function=len,
            is_separator_regex=False,
        )
        pages = text_splitter.create_documents([file])
        
    return pages


def store(pages, collection, name):
    documents = []
    metadata = []
    ids = []
    id_counter = 1
    
    file_extension = name[-4:]
    
    for i, line in enumerate(pages):
        # Add the pages to the document list
        documents.append(str(line.page_content) if file_extension == '.txt' else str(line))
        
        # Create a sample page number metadata
        metadata.append({"page_number": i + 1})
        
        # Create an ID field, an ID corresponding to each page
        ids.append(str(id_counter))
        id_counter += 1
    
    collection.add(
        documents=documents,
        metadatas=metadata,
        ids=ids
    )
    
    print(f'New file stored with collection size:', collection.count())



def query(text, collection, query_results, query_include_array):
    results = collection.query(
        query_texts=[text],
        n_results=query_results,
        include=query_include_array
    )

    return results
    
def docu(query_text_user, input, num_results, output_query_include, storage_folder):
    # Folder where chroma db is stored
    path = storage_folder
    
    # Name of the db instance
    name = input[6:-4].replace("-","")
    
    # Initialize chroma
    collection = chroma_init(path, name)
    
    # Get the split data
    pages = read_and_split(input)
    
    # Store the pdf only done the first time
    if collection.count() == 0:
        store(pages, collection, name)
    
    # Perform the query
    query_text = query_text_user
    query_results = num_results
    query_include_array = output_query_include
    return query(query_text, collection, query_results, query_include_array)# returns the query result dict
    
#print(docu("data science", "input/zurich-masters.pdf", 5, ['distances', 'metadatas', 'documents'])['ids'])
# following are some util functions  for testing


def return_client_list(path): # path is the folder name 
    chroma_client = chromadb.PersistentClient(path)
    return chroma_client.list_collections()
    
def delete_instance(path, name):
    chroma_client = chromadb.PersistentClient(path)
    return chroma_client.delete_collection(name)
    
def service_health(path):
    chroma_client = chromadb.PersistentClient(path)
    return chroma_client.heartbeat()
    
def collection_num_of_items(path, name):
    return chroma_init(path, name).count()
