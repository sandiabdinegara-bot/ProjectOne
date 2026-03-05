from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/', methods=['GET'])
def health_check():
    return "SiCater Minimal Test: Flask is working!"

@app.route('/test', methods=['GET'])
def test_json():
    return jsonify({"status": "success", "message": "JSON is also working"})

if __name__ == '__main__':
    app.run()
