from flask import request, jsonify, Flask, render_template

app = Flask(__name__)

@app.route('/', methods=['GET'])
def home():
    return render_template('index.html')

# @app.route('/api', methods=['POST'])
# def api():
#     data = request.get_json()
#     return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
    