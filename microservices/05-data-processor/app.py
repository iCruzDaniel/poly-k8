from flask import Flask, request, jsonify
import datetime

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "Python Flask Processor"})

@app.route('/process', methods=['POST'])
def process():
    data = request.json or {}
    payload = data.get("payload", "empty")
    
    return jsonify({
        "processed": True,
        "original_payload": payload,
        "transformed": payload.upper() + "_PROCESSED_BY_FLASK",
        "processed_at": str(datetime.datetime.utcnow())
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
