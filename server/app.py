from flask import Flask, request, jsonify
from waitress import serve
from queryGen import query_generate
from aiHelper import localAI

app = Flask(__name__)


@app.route('/process_pdf', methods=['POST'])
def process():
    
    data = request.get_json()
    
    user_query = data.get('user_query', '')
    user_query2 = user_query + ", here is the content for the pdf: "
    user_file = data.get('user_file', '')
    storage_folder = "storage"
    token_limit = 8198
    include = ['distances', 'metadatas', 'documents']
    output_data, temp = query_generate(user_query, user_file, token_limit, storage_folder,include)
    userContent = user_query2 + str(output_data)
    systemContent = "You are a pdf assitant, pdf content is give to you by the user"
    ai_response = localAI(systemContent, userContent, temp).choices[0].message.content
    
    sample = "Based on the given content, here are the five core elective areas for the MSc programs in Informatics at the University of Zurich:\n\n1. Information Systems (IS) - WWF elective area6 ECTS, INF elective area15 ECTS\n2. Software Systems - WWF elective area15 ECTS, INF elective area15 ECTS\n3. People-Oriented Computing - WWF elective area6 ECTS, INF elective area15 ECTS\n4. Artificial Intelligence - WWF elective area6 ECTS, INF elective area15 ECTS\n5. Data Science - WWF elective area6 ECTS, INF elective area15 ECTS"
    return jsonify({'result': ai_response})

if __name__ == '__main__':
 
    # run() method of Flask class runs the application 
    # on the local development server.
    app.run()
    
    '''
    dev server, use below instead of app.run()
    
    host = '0.0.0.0'  # Listen on all public IPs
    port = 5000

    serve(app, host=host, port=port)
    '''
