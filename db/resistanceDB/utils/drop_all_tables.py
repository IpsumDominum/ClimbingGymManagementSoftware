import shutil
import os

if os.path.isdir("migrations"):
    shutil.rmtree("migrations")

with open("db_created.txt", "w") as file:
    file.write("temporary")
os.system("python utils/write_drop_database_commands.py | psql -U postgres")
os.system("python manage.py db init")
os.system("python manage.py db migrate")
os.system("python manage.py db upgrade")

if os.path.isfile("db_created.txt"):
    os.remove("db_created.txt")
