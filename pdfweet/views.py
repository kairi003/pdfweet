import json
from flask import session, redirect, render_template, request, url_for

from pdfweet import app
from pdfweet.lib import TwitterHandler as th


@app.route('/')
def root():
    user = th.get_user()
    try:
        return render_template('base.html', user=user)
    except Exception as e:
        return str(e)

@app.route('/favicon.ico')
def favicon():
    return redirect(url_for('static', filename='favicon.ico'))

@app.route('/test')
def test():
    return render_template('test.html')


@app.route('/login', methods=['GET'])
def login():
    auth = th.get_auth()
    try:
        redirect_url = auth.get_authorization_url()
        session['request_token'] = auth.request_token
        return redirect(redirect_url)
    except Exception as ee:
        return str(ee)


@app.route('/logout', methods=['GET'])
def logout():
    session.pop('access_token', None)
    session.pop('access_token_secret', None)
    session.pop('request_token', None)
    return redirect(url_for('root'))


@app.route('/callback', methods=['GET'])
def callback():
    if 'request_token' in session and 'oauth_verifier' in request.args:
        auth = th.get_auth()
        token = session.pop('request_token', None)
        verifier = request.args.get('oauth_verifier')
        auth.request_token = token
        try:
            auth.get_access_token(verifier)
            session['access_token'] = auth.access_token
            session['access_token_secret'] = auth.access_token_secret
        except Exception as ee:
            return str(ee)
    return redirect(url_for('root'))


@app.route('/tweet', methods=['POST'])
def tweet():
    if 'image[0]' in request.files and 'text' in request.form and 'num' in request.form:
        try:
            text = request.form.get('text', '(i/n)')
            num = int(request.form.get('num', 0))
            image = [request.files.get(f'image[{i}]', None) for i in range(num)]
            statuses = list(th.send_tweet(text, image))
        except Exception as ee:
            raise ee
            return str(ee)
    return redirect(url_for('root'))


@app.route('/test2/')
def test2():
    th.test()
    return redirect(url_for('root'))
