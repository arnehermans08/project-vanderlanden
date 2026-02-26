from flask import Flask, request, jsonify
from pymongo import MongoClient
import time
from bson import json_util
import json
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# MongoDB verbinding
client = MongoClient("mongodb://root:password@localhost:27017/")
db = client["db1"]
collection = db["sensors"]

@app.route('/sensor-data-insert', methods=['POST'])
def add_sensor_data():
    data = request.json
    new_entry = {
        "cartId": data.get("cartId"),
        "loc": data.get("loc"),
        "type": data.get("type"),
        "value": data.get("value"),
        "time": int(time.time())  # Unix timestamp (seconden)
    }
    result = collection.insert_one(new_entry)
    return jsonify({
        "status": "success",
        "message": "Data opgeslagen!",
        "mongo_id": str(result.inserted_id)
    }), 201


@app.route('/sensor-data-extract', methods=['POST'])
def get_sensor_data():
    all_data = list(collection.find())
    return json.loads(json_util.dumps(all_data)), 200


# Cleanup (verwijder data ouder dan 60 dagen)
@app.route('/cleanup', methods=['POST'])
def cleanup_data():
    # 60 dagen in seconden
    sixty_days_seconds = 60 * 24 * 60 * 60

    # Huidige timestamp
    current_time = int(time.time())

    # Timestamp van 60 dagen geleden
    threshold_timestamp = current_time - sixty_days_seconds

    # Verwijder alles ouder dan threshold
    result = collection.delete_many({
        "time": {"$lt": threshold_timestamp}
    })

    return jsonify({
        "status": "success",
        "message": f"{result.deleted_count} oude documenten verwijderd.",
        "threshold_timestamp": threshold_timestamp
    }), 200


# Deepclean (verwijder ALLES)
@app.route('/deepclean', methods=['POST'])
def deep_clean():
    result = collection.delete_many({})

    return jsonify({
        "status": "success",
        "message": "De volledige collectie is leeggemaakt.",
        "deleted_count": result.deleted_count
    }), 200


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)