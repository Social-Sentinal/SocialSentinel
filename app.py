from flask import request, jsonify, Flask, render_template

app = Flask(__name__)

@app.route('/', methods=['GET'])
def home():
    return render_template('index.html')


@app.route('/engine.html', methods=['GET'])
def engine():
    return render_template('engine.html')


@app.route('/sentiments.html', methods=['GET'])
def sentiments():
    return render_template('sentiments.html')


@app.route('/reports.html', methods=['GET'])
def reports():
    return render_template('reports.html')


if __name__ == '__main__':
    app.run(debug=True)