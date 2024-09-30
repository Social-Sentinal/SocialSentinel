from flask import request, jsonify, Flask, render_template

app = Flask(__name__)

@app.route('/', methods=['GET'])
def home():
    return render_template('index.html')


@app.route('/engine.html', methods=['GET'])
def recommend():
    user_input = request.form['user_input']  # Get user input from the form
    recommendations = hybrid_recommender.predict(user_input)

    # Extract required fields for query params
    query_params = {
        "captions": recommendations['captions'].tolist(),
        "hashtags": recommendations['hashtags'].tolist()
    }

    # Fetch real-time URLs
    urls = fetch_real_time_urls(query_params)

    return render_template('engine.html', recommendations=recommendations, urls=urls)


@app.route('/sentiments.html', methods=['GET'])
def sentiments():
    return render_template('sentiments.html')


@app.route('/reports.html', methods=['GET'])
def reports():
    return render_template('reports.html')

if __name__ == '__main__':
    app.run(debug=True)