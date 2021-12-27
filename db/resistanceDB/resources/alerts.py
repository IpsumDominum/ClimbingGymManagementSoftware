from flask_restful import Resource, reqparse
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    jwt_refresh_token_required,
    get_jwt_identity,
    get_raw_jwt,
)
from flask import Flask, request, jsonify
from app import db
from sqlalchemy import or_
from models.alerts import Alerts

# Get alerts
class AlertsResource(Resource):
    def get(self):
        return Alerts.return_all()
    def post(self):
        data = request.get_json()
        try:
            alert = Alerts(alert_type=data["alert_type"],alert_level=data["alert_level"],
                    alert_message = data["alert_message"],
            alert_status=data["alert_status"],member_associated_id=data["alert_member_associated_id"])
        except KeyError as e:
            return {"response":str(e)}
        db.session.add(alert)
        db.session.commit()
        return {"response":"success"}
    def delete(self):
        args = request.args
        id = args["id"]
        alert = Alerts.query.get(id)
        alert.alert_status = "solved"
        db.session.commit()
        return "success"
