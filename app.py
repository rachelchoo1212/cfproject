from flask import Flask
from flask import request

app = Flask(__name__)
@app.route('/api/testendpoint', methods=['GET'])
def get_endpoint():
    return str(request.headers)

@app.route('/api/limitedendpoint', methods=['GET'])
def get_limited():
    return "This page is for limited users"

@app.route('/')
def hello():
    return 'Welcome to My Watchlist!'

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port = 443, ssl_context=('/home/ec2-user/cftest/www.rachel-zhu.com.pem','/home/ec2-user/cftest/www.rachel-zhu.com.key'))
