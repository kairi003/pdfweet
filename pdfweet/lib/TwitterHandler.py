#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import io
import math
import imghdr
from typing import Optional, Generator
import tweepy
from tweepy.models import Status, Media
from flask import session
from werkzeug.datastructures import FileStorage
from pdfweet import app

imghdr.tests.append(lambda h, f: 'jpeg' if h[:2] == b'\xff\xd8' else None)


class DummyStatus(Status):
    def __init__(self):
        self.id = None


def get_auth() -> tweepy.OAuthHandler:
    auth = tweepy.OAuth1UserHandler(
        app.config['CONSUMER_KEY'], app.config['CONSUMER_SECRET'],
        callback=app.config['CALLBACK_URL'])
    return auth


def get_api() -> tweepy.API:
    auth = get_auth()
    key = session.get('access_token', None)
    secret = session.get('access_token_secret', None)
    auth.set_access_token(key, secret)
    return tweepy.API(auth)


def get_user() -> Optional[tweepy.User]:
    try:
        api = get_api()
        user = api.verify_credentials()
        return user
    except tweepy.TweepyException:
        return None


def send_tweet(text: str, images: list[FileStorage], sensitive: bool) -> Generator[Status, None, None]:
    api = get_api()
    num_tweet = math.ceil(len(images) / 4)
    status: Status = DummyStatus()
    for i in range(num_tweet):
        media_ids = list(generate_media_ids(api, images[4*i:4*(i+1)]))
        status = api.update_status(
            text.format(i=i+1, n=num_tweet),
            media_ids=media_ids,
            in_reply_to_status_id=status.id,
            possibly_sensitive=sensitive
        )
        yield status


def send_tweet2(text: str, images: list[FileStorage], sensitive: bool, pre_id: int, i: int, n: int) -> str:
    api = get_api()
    if pre_id < 0:
        pre_id = None
    media_ids = list(generate_media_ids(api, images))
    status: Status = api.update_status(
        text.format(i=i, n=n),
        media_ids=media_ids,
        in_reply_to_status_id=pre_id,
        possibly_sensitive=sensitive
    )
    return status.id_str


def generate_media_ids(api: tweepy.API, images: list[FileStorage]):
    for img in images:
        try:
            imagedata = img.stream.read()
            imagetype = imghdr.what(None, h=imagedata)
            buffer = io.BytesIO(imagedata)
            media: Media = api.media_upload(f'image.{imagetype}', file=buffer)
            yield media.media_id
        except Exception:
            continue
