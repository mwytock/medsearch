
from google.appengine.api import users

WHITELIST = [
    "mwytock@gmail.com",
    "rvguha@gmail.com",
]

def check_authorization(f):
    def wrapper(self):
        user = users.get_current_user()
        if not user.email() in WHITELIST:
            logging.info("Request from %s not authorized", user.email())
            self.response.set_status(403)
            return
        f(self)
    return wrapper
