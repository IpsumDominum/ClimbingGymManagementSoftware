from pycron import *
import os
import logging
from multiprocessing import Process
import time
import datetime
import requests

# r = requests.get("http://127.0.0.1:5000/CheckRentalsDue")
# logging.info("CheckRentalsDue     : " + str(r.json))


def check_rentals_due():
    s = CronSchedule()

    def check_rentals_due_action():
        r = requests.get("http://127.0.0.1:5000/CheckRentalsDue")
        logging.info("CheckRentalsDue     : " + str(r.json))
        print("rental")

    c = Cron(s)
    c.set_action(check_rentals_due_action)
    c.run()


def check_invoices_due():
    s = CronSchedule()
    s.hours = range(0, 24, 24)

    def check_invoices_due_action():
        r = requests.get("http://127.0.0.1:5000/CheckInvoicesDue")
        logging.info("CheckInvoicesDue     : " + str(r.json))
        print("invoice")

    c = Cron(s)
    c.set_action(check_invoices_due_action)
    c.run()


def check_memberships_due():
    s = CronSchedule()
    s.mins = range(0, 60, 60)

    def check_memberships_due_action():
        r = requests.get("http://127.0.0.1:5000/CheckMembershipsDue")
        logging.info("CheckMembershipsDue     : " + str(r.json))
        print("membership")

    c = Cron(s)
    c.set_action(check_memberships_due_action)
    c.run()


def check_memberships_freeze():
    s = CronSchedule()
    s.hours = range(0, 24, 24)

    def check_memberships_freeze_action():
        r = requests.get("http://127.0.0.1:5000/CheckMembershipsFreeze")
        logging.info("CheckMembershipsFreeze     : " + str(r.json))
        print("membership freeze")

    c = Cron(s)
    c.set_action(check_memberships_freeze_action)
    c.run()


def check_memberships_holiday():
    s = CronSchedule()
    s.hours = range(0, 24, 24)

    def check_memberships_holiday_action():
        r = requests.get("http://127.0.0.1:5000/CheckMembershipsHoliday")
        logging.info("CheckMembershipsHoliday     : " + str(r.json))
        print("membership holiday")

    c = Cron(s)
    c.set_action(check_memberships_holiday_action)
    c.run()


format = "%(asctime)s: %(message)s"
LOG_FILENAME = os.path.join("logs", "log.txt")
logging.basicConfig(
    filename=LOG_FILENAME, format=format, level=logging.INFO, datefmt="%H:%M:%S"
)

logging.info("Main    : before creating processes")

p1 = Process(target=check_rentals_due)
p2 = Process(target=check_invoices_due)
p3 = Process(target=check_memberships_due)
p4 = Process(target=check_memberships_freeze)
p5 = Process(target=check_memberships_holiday)


logging.info("Main    : processes created")

p1.start()
logging.info("Main    : checkRentalsDue started")
p2.start()
logging.info("Main    : checkInvoicesDue started")
p3.start()
logging.info("Main    : checkMembershipsDue started")
p4.start()
logging.info("Main    : checkMembershipsFreeze started")
p5.start()
logging.info("Main    : checkMembershipsHoliday started")

logging.info("Main    : all processes started")

p1.join()
p2.join()
p3.join()
p4.join()
p5.join()

logging.info("Main    : All Processes Completed")
