#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from os import environ
from flask import Flask

app = Flask(__name__)
app.secret_key = environ['SECRET_KEY']
app.config['CONSUMER_KEY'] = environ['CONSUMER_KEY']
app.config['CONSUMER_SECRET'] = environ['CONSUMER_SECRET']
app.config['CALLBACK_URL'] = environ['CALLBACK_URL']

from pdfweet import views
