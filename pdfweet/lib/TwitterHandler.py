import io
import math
import imghdr
import tweepy
from flask import session
from pdfweet import app

imghdr.tests.append(lambda h, f: 'jpeg' if h[:2] == b'\xff\xd8' else None)

class NoneStatus:
    id = None


def get_auth():
    auth = tweepy.OAuthHandler(
        app.config['CONSUMER_KEY'], app.config['CONSUMER_SECRET'], app.config['CALLBACK_URL'])
    return auth


def get_api():
    auth = get_auth()
    key = session.get('access_token', None)
    secret = session.get('access_token_secret', None)
    auth.set_access_token(key, secret)
    return tweepy.API(auth)


def get_user():
    api = get_api()
    try:
        user = api.me()
        return user
    except tweepy.TweepError:
        return None


def send_tweet(text, image):
    api = get_api()
    n = math.ceil(len(image) / 4)
    status = NoneStatus
    for i in range(n):
        media_ids = list(generate_media_ids(image[4*i:4*(i+1)]))
        print(text.format(i=i+1, n=n))
        status = api.update_status(text.format(
            i=i+1, n=n), media_ids=media_ids, in_reply_to_status_id=status.id)
        yield status


def generate_media_ids(images):
    api = get_api()
    for image in images:
        try:
            imagedata = image.stream.read()
            imagetype = imghdr.what(None, h=imagedata)
            buffer = io.BytesIO(imagedata)
            media = api.media_upload(f'image.{imagetype}', file=buffer)
            yield media.media_id
        except Exception:
            continue
