import requests
import json
url = "http://127.0.0.1:5000/CheckDaily"
result = requests.get(url)
failed = False
message = "unknown"
try:
    result = result.json()    
    if(result["response"]!="success"):
        failed = True
        message = result["response"]
except Exception as e:
    failed = True
    message = str(e)

if(failed==True):
    url = "http://127.0.0.1:5000/Alerts"
    headers = {"Content-Type": "application/json"}    
    body = {"alert_type":"system","alert_level":3,
            "alert_message":"automatic daily check failed due to Reason::{}".format(message),
            "alert_status":"unsolved","alert_member_associated_id":""}
    result = requests.post(url,headers=headers,data=json.dumps(body))

