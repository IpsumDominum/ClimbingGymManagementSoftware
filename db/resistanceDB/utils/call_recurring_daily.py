from pycron import *
import os
import logging
from multiprocessing import Process
import time
import datetime
import requests


format = "%(asctime)s: %(message)s"
LOG_FILENAME = os.path.join("logs", "log.txt")
logging.basicConfig(
    filename=LOG_FILENAME, format=format, level=logging.INFO, datefmt="%H:%M:%S"
)
r = requests.get("http://127.0.0.1:5000/CheckDaily")
logging.info("DailyCall     : " + str(r.json))

s = CronSchedule()
s.hours = range(0, 24, 24)


def call_daily():
    r = requests.get("http://127.0.0.1:5000/CheckDaily")
    logging.info("DailyCall     : " + str(r.json))


c = Cron(s)
c.set_action(call_daily)
c.run()
