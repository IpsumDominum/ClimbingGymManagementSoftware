from flask_restful import Resource, reqparse
from datetime import datetime,timedelta
from pytz import timezone
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    jwt_refresh_token_required,
    get_jwt_identity,
    get_raw_jwt,
)
from flask import Flask, request, jsonify
from sqlalchemy import or_, and_
from app import db
from sqlalchemy import or_
from models.system import SystemChecks
from models.system import SystemLog
from sqlalchemy import desc

# Get alerts
class SystemChecksResource(Resource):
    def get(self):
        return SystemChecks.return_all()

class SystemLogsResource(Resource):
    def post(self):
        data = request.get_json()
        year = data["year"]
        month = data["month"]
        date = data["day"]
        offset = data["offset"]

        date_from_string = datetime.strptime(
            "{}-{}-{}".format(year, month, date), "%Y-%m-%d"
        )
        yesterday = date_from_string - timedelta(days=0 - offset)
        tomorrow = date_from_string + timedelta(days=1 + offset)
        # Query Result

        queryResult = SystemLog.query.filter(
            and_(SystemLog.log_date> yesterday, SystemLog.log_date < tomorrow)
        ).order_by(desc(SystemLog.log_date)).all()
        log_history = {
            "data": list(map(lambda x: x.serialize(), queryResult)),
            "queryDate": yesterday.isoformat(),
            "response": "success",
        }
        return log_history
