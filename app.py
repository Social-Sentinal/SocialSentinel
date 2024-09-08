from flask import request, jsonify, Flask, render_template

app = Flask(__name__)

@app.route('/', methods=['GET'])
def home():
    return render_template('index.html')


@app.route('/hello', methods=['GET'])
def test():
    return render_template('test.html')

if __name__ == '__main__':
    app.run(debug=True)