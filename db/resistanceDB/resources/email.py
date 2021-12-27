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
import jinja2
from jinja2 import Template
from flask import Flask, request, jsonify, render_template
from app import db, mail, mail_queue, config
from sqlalchemy import or_, and_
import datetime
from datetime import timedelta
from flask_mail import Message
from flask import render_template
import time
import datetime
from pytz import timezone
from models.emailTemplate import EmailTemplate
import uuid
import requests


class EmailGetQueue(Resource):
    def get(self):
        return mail_queue

    def delete(self):
        args = request.args
        mail_queue_id = args["id"]
        mail_queue[int(mail_queue_id)]["cancel"] = True
        return "success"


class EmailResource(Resource):
    def get(self):
        return EmailTemplate.return_all()

    def post(self):
        def send_via_mail_gun(recipients, header, content):
            if content == "":
                content = "this message is empty"
            return requests.post(
                "https://api.mailgun.net/v3/resistanceclimbing.co.nz/messages",
                auth=("api", config["MAILGUN_API_KEY"]),
                data={
                    "from": "Resistance Climbing Gym <noreply@resistanceclimbing.co.nz>",
                    "to": recipients,
                    "subject": header,
                    "html": content,
                },
            )

        data = request.get_json()
        today = datetime.datetime.now(timezone("Pacific/Auckland"))
        msg_html = data["msg_html"]
        msg_header = data["msg_header"]
        recipients = data["recipients"]

        if len(recipients) > 10:
            print(
                "The length of recipients exceeds 10, please use bulk email service instead!"
            )

        # Finds first empty slot
        mail_queue_id = None
        for idx, item in enumerate(mail_queue):
            if item["cancel"] == True:
                mail_queue_id = idx
                break
        if mail_queue_id == None:
            return "Mail queue full!"

        # Otherwise proceed to cend...

        today = datetime.datetime.now(timezone("Pacific/Auckland"))
        mail_queue[mail_queue_id] = {
            "total_recipients": len(recipients),
            "total_processed": 0,
            "expected_finish_time": (
                today + timedelta(seconds=1 * len(recipients))
            ).isoformat(),
            "status": "in-progress",
            "cancel": False,
        }

        def get_full_name(member):
            return (
                member["firstName"]+ " "
                + member["lastName"]
            )

        for recp in recipients:
            if mail_queue[mail_queue_id]["cancel"] == True:
                break
            msg_html_parsed = Template(msg_html)
            try:
                msg_html_parsed = msg_html_parsed.render(
                    MemberFullName=get_full_name(recp)
                )
            except jinja2.exceptions.UndefinedError as e:
                mail_queue[int(mail_queue_id)]["status"] = "failed"
                mail_queue[int(mail_queue_id)]["cancel"] = True
                return "Error::Mail Variable Error::" + str(e)
            response = send_via_mail_gun([recp["email"]], msg_header, msg_html_parsed)
            try:
                if response.json()["message"] == "Queued. Thank you.":
                    pass
                else:
                    mail_queue[int(mail_queue_id)]["status"] = "failed"
                    mail_queue[int(mail_queue_id)]["cancel"] = True
                    return "failed to send to at least on recipients"
            except Exception as e:
                return str(e)
            # print(response.json())
            mail_queue[mail_queue_id]["total_processed"] += 1

        mail_queue[int(mail_queue_id)]["cancel"] = True
        mail_queue[int(mail_queue_id)]["status"] = "success"
        return "success"

    def delete(self):
        args = request.args
        id = args["id"]
        template = EmailTemplate.query.get(id)
        if template != None:
            template.toggleActivation()
            db.session.commit()


class EmailSendFromTemplate(Resource):
    def post(self):
        data = request.get_json()
        # template_id = data["template_id"]
        # recepients = data["recipients"]
        # for recepient in recepients:
        #


class EmailEditTemplate(Resource):
    def post(self):
        data = request.get_json()

        template_id = data["template_id"]
        template_html = data["template_html"]
        template_header = data["template_header"]
        template_active = data["template_active"]

        template = EmailTemplate.query.get(template_id)
        if template == None:
            return "Error::Template not found in database.Unknown Error, Try Following DEBUG steps in guideboook."
        else:
            template.update(
                template_header=template_header,
                template_content=template_html,
                template_active=template_active,
            )
            db.session.commit()
            return "success"
