from pynput import keyboard
import requests


def get_expecting():
    try:
        with open("expecting", "r") as file:
            return bool(file.read())
    except FileNotFoundError:
        return False


def set_expecting(expecting):
    with open("expecting", "w") as file:
        file.write(str(expecting))


def get_buffer():
    try:
        with open("buffer", "r") as file:
            return file.read()
    except FileNotFoundError:
        return ""


def append_buffer(buffer):
    with open("buffer", "a") as file:
        file.write(buffer)


def set_buffer(buffer):
    with open("buffer", "w") as file:
        file.write(buffer)


def on_press(key):
    try:
        if get_expecting() == True and key.char == None:
            append_buffer(chr(int(str(key)[1:-1]) - 48))
        elif key.char == None:
            set_expecting(True)
        # print('alphanumeric key {0} pressed'.format(
        #    key.char))
    except AttributeError:
        if get_expecting() == True:
            url = "https://127.0.0.1:5000/CheckIn"
            data = {"paxton_card_id": requests.get_buffer()}
            x = requests.post(url, data=data)

            set_expecting(False)
            set_buffer("")
        # print('special key {0} pressed'.format(
        #    key))


# Collect events until released
with keyboard.Listener(on_press=on_press) as listener:
    listener.join()
# ...or, in a non-blocking fashion:
# listener = keyboard.Listener(
#    on_press=on_press)
# listener.start()
