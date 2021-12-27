from flask_restful import Resource, reqparse
import models
from flask import Flask, request, jsonify
from app import db
from sqlalchemy import or_
from flask_http_response import success, result, error
import requests
import json
import time
from models.waiverTemp import WaiverTemp
from models.waiverTempFetchLog import WaiverTempFetchLog
from models.system import SystemLog

class WaiverTempResource(Resource):
    def get(self):
        return {"data": WaiverTemp.return_all(), "response": "success"}

    """
    mark one as solved
    """

    def delete(self):
        args = request.args
        id = args["id"]
        if id == "all":
            WaiverTemp.mark_all_as_solved()
        else:
            WaiverTemp.query.get(id).mark_as_solved()
        db.session.commit()
        return "success"

def fetch_waivers_from_station():
    print("pulling waivers...")
    headers = {"Content-Type": "application/json"}
    body = {
        "key": "To use the facilities at your own risk, and take responsibility for any personal injury."
    }
    start_time = time.time()
    try:
        url = "https://waiver-station-db.herokuapp.com/ebfdefa3276c82336dae"
        response = requests.post(url, headers=headers, data=json.dumps(body))
        response_data = response.json()

    except Exception:
        fetch_duration = time.time() - start_time
        fetch_log = WaiverTempFetchLog(0, fetch_duration, "failure")
        db.session.add(fetch_log)
        db.session.commit()
        return "error"

    fetch_duration = time.time() - start_time
    if(len(response_data)!=0):
        log = SystemLog("Pulled {} waivers from waiver station".format(len(response_data)))
        db.session.add(log)
        db.session.commit()
    for item in response_data:
        waiver_temp = WaiverTemp(item)
        db.session.add(waiver_temp)

    fetch_log = WaiverTempFetchLog(len(response_data), fetch_duration, "success")

    db.session.add(fetch_log)
    db.session.commit()
    return "success"

class WaiverTempFetchFromStation(Resource):
    """
    Fetch temp waivers from the waiver station
    """

    def get(self):
        return fetch_waivers_from_station()

class WaiverTempFetchLogResource(Resource):
    def get(self):
        return {"data": WaiverTempFetchLog.return_all(), "response": "success"}
