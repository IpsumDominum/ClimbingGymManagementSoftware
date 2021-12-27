import os
import time

if os.isfile(os.path.join("backups", "main")):
    os.system("psql postgres < " + os.path.join("backups", "main"))
else:
    print(
        "Cannot find backup file : 'backups/main', Please copy and rename back up entry to 'main'. The script will then pick up the file and restore it to the database."
    )
    time.sleep(3)
