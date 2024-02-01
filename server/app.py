# server.py

from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit, disconnect
from sentence_transformers import CrossEncoder
from openai import OpenAI
import time
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

def send_message(message):
    stream = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": message}],
        stream=True,
    )

    for chunk in stream:
        content = chunk.choices[0].delta.content
        if content:
            emit('message', {'data': content})
            socketio.sleep(0) # yields control back to the Flask-SocketIO event loop, pause current task, 
            #allowing other tasks to complete
            #print(content)
            
    print('message sent')
       

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('start')
def handle_start(message):
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
    top_scores_count = min(5, len(queries))

    # Sort scores and select top scores
    top_scores = sorted(zip(scores, queries), reverse=True)[:top_scores_count]
    top_scores_str = ', '.join([f"{query}" for score, query in top_scores])

    return jsonify(top_scores_str)

if __name__ == '__main__':
    socketio.run(app, debug=True)
