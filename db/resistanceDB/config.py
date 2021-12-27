import os
import json

with open("./config.json") as config_file:
    config = json.load(config_file)


basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    """Set Flask configuration from environment variables."""

    DEBUG = False
    TESTING = False
    CSRF_ENABLED = True
    SQLALCHEMY_DATABASE_URI = config.get("DATABASE_URL")
    SECRET_KEY = config.get("SECRET_KEY")
    MAIL_SERVER = config.get("MAIL_SERVER")
    MAIL_PORT = config.get("MAIL_PORT")
    MAIL_USE_TLS = config.get("MAIL_USE_TLS")
    MAIL_USE_SSL = config.get("MAIL_USE_SSL")
    MAIL_USERNAME = config.get("MAIL_USERNAME")
    MAIL_PASSWORD = config.get("MAIL_PASSWORD")


class ProductionConfig(Config):
    DEBUG = False


class StagingConfig(Config):
    DEVELOPMENT = True
    DEBUG = True


class DevelopmentConfig(Config):
    DEVELOPMENT = True
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
