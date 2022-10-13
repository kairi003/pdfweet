#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
from werkzeug.exceptions import BadRequest, Forbidden, InternalServerError
from flask import session, redirect, render_template, request, url_for
import tweepy
from pdfweet import app
from pdfweet.lib import TwitterHandler as th


@app.route('/')
def root():
    user = th.get_user()
    if user is None:
        return render_template('not_logined.html')
    else:
        return render_template('logined.html', user=user)


@app.route('/favicon.ico')
def favicon():
    return redirect(url_for('static', filename='favicon.ico'))


@app.route('/login', methods=['GET'])
def login():
    session.permanent = True
    auth = th.get_auth()
    try:
        redirect_url = auth.get_authorization_url()
        session['request_token'] = auth.request_token
        return redirect(redirect_url)
    except (tweepy.Forbidden, tweepy.Unauthorized):
        raise Forbidden
    except:
        raise InternalServerError


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
        except (tweepy.Forbidden, tweepy.Unauthorized):
            raise Forbidden
        except:
            raise InternalServerError
    return redirect(url_for('root'))


@app.route('/tweet', methods=['POST'])
def tweet():
    if 'image[0]' in request.files and 'text' in request.form and 'num' in request.form:
        try:
            text = request.form.get('text', '(i/n)')
            num = int(request.form.get('num', 0))
            images = [request.files.get(f'image[{i}]', None) for i in range(num)]
            sensitive = 'sensitive' in request.form
            statuses = list(th.send_tweet(text, images, sensitive))
        except (tweepy.Forbidden, tweepy.Unauthorized):
            raise Forbidden
        except:
            raise InternalServerError
        return render_template('tweet_tpl.html', tweet_id=statuses[0].id)
    else:
        raise BadRequest

@app.route('/tweet2', methods=['POST'])
def tweet2():
    try:
        text = request.form.get('text', '(i/n)')
        n = int(request.form.get('n', 0))
        i = int(request.form.get('i', 0))
        images = request.files.values()
        sensitive = 'sensitive' in request.form
        pre_id = int(request.form.get('preId', -1))
        tweet_id = th.send_tweet2(text, images, sensitive, pre_id, i, n)
        return json.dumps({'success': True, 'id': tweet_id})
    except Exception as ee:
        return json.dumps({'success': False, 'error': 'error'})
