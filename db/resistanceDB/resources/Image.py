from flask_restful import Resource, reqparse
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    jwt_refresh_token_required,
    get_jwt_identity,
    get_raw_jwt,
)
import models
from flask import Flask, request, jsonify
from app import db, mail
from sqlalchemy import or_, and_
import datetime
from flask_mail import Message
from flask import render_template
import time


class ImageResource(Resource):
    def post(self):
        data = request.form
        # msg_html = data["msg_html"]
        # sender = data["sender"]
        # recipients = data["recipients"]

        print(data)
