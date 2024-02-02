# server.py

from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit, disconnect
from sentence_transformers import CrossEncoder
from openai import OpenAI
from tokenValidator import authenticate_request
import time
import tiktoken
import os

os.environ["OPENAI_API_KEY"] = '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'
client = OpenAI(
    # This is the default and can be omitted
    api_key=os.environ.get("OPENAI_API_KEY"),
)
model = CrossEncoder('cross-encoder/ms-marco-electra-base')
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*")  # Adjust CORS as necessary

def num_tokens_from_string(string: str, encoding_name: str) -> int:
    encoding = tiktoken.get_encoding(encoding_name)
    num_tokens = len(encoding.encode(string))
    return num_tokens

def send_message(message):
    stream = client.chat.completions.create(
        model="gpt-3.5-turbo-0125",
        messages=[{"role": "user", "content": message}],
        stream=True,
    )
    for chunk in stream:
        content = chunk.choices[0].delta.content
        if content:
            emit('message', {'data': content})
            socketio.sleep(0) # yields control back to the Flask-SocketIO event loop, pause current task, 
            #allowing other tasks to complete
    print('message sent')
       

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    token = request.args.get('acctoken')
    if not authenticate_request(token):  
        emit('error', {'data': 'Invalid token, please login again'})
        socketio.sleep(0.1)
    else:
        print('Client connected')
    
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    disconnect()
    print('Client disconnected')
    
    
@socketio.on('trigger_disconnect')
def trigger_disconnect():
    disconnect()  # Call the existing disconnect handler

@socketio.on('start')
def handle_start(message):
    print('number of tokens:',num_tokens_from_string(message, "cl100k_base"))
    send_message(message)
    disconnect()

    
@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    main_sentence = data['main_sentence']
    queries = data['queries']

    # Create pairs of main_sentence and each query
    query_pairs = [(main_sentence, query) for query in queries]
    #print(query_pairs)  # Print query pairs in order

    # Predict scores for all query pairs
    scores = model.predict(query_pairs)
    #print(scores)

    # Determine the number of top scores to return
    # at 5 we are about 600 tokens
    top_scores_count = min(5, len(queries))

    # Sort scores and select top scores
    top_scores = sorted(zip(scores, queries), reverse=True)[:top_scores_count]
    top_scores_str = ', '.join([f"{query}" for score, query in top_scores])

    return jsonify(top_scores_str)

if __name__ == '__main__':
    socketio.run(app, debug=True)
