from flask import Flask, request, jsonify
from pymongo import MongoClient
from datetime import datetime, timedelta
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
        "time": datetime.now() 
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

# 3. Nieuw Endpoint: Cleanup (verwijder data ouder dan 2 maanden)
@app.route('/cleanup', methods=['POST'])
def cleanup_data():
    # Bereken de datum van exact 60 dagen (2 maanden) geleden
    twee_maanden_geleden = datetime.now() - timedelta(days=60)
    
    # Verwijder documenten waar "time" kleiner is dan deze datum
    result = collection.delete_many({"time": {"$lt": twee_maanden_geleden}})
    
    return jsonify({
        "status": "success",
        "message": f"{result.deleted_count} oude documenten verwijderd.",
        "threshold_date": twee_maanden_geleden.strftime("%Y-%m-%d %H:%M:%S")
    }), 200

# 4. Nieuw Endpoint: Deepclean (verwijder ALLES)
@app.route('/deepclean', methods=['POST'])
def deep_clean():
    # Een lege filter {} betekent: alles verwijderen
    result = collection.delete_many({})
    
    return jsonify({
        "status": "success",
        "message": "De volledige collectie is leeggemaakt.",
        "deleted_count": result.deleted_count
    }), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)