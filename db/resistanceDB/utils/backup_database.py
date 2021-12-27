import os
import datetime
from pytz import timezone
import time

today = datetime.datetime.now(timezone("Pacific/Auckland"))

save_dir = os.path.join("C:\\Users\\duned\\Desktop\\Backups")
if not os.path.isdir(save_dir):
    os.makedirs(save_dir)
os.system("pg_dump -U postgres postgres > {}/{}-{}-{}.sql".format(save_dir,today.year, today.month, today.day))
print("Done.Exiting...If no other message except for this is shown, then backup is successful.")
time.sleep(3)