import os

from pymongo import MongoClient

mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
mongo_db_name = os.getenv("MONGODB_NAME", "intelligent_job_matcher")

client = MongoClient(mongo_uri)

db = client[mongo_db_name]

jobs_collection = db["jobs"]
resumes_collection = db["resumes"]
explainability_collection = db["explainability_reports"]
users_collection = db["users"]
analyses_collection = db["analyses"]
job_roles_collection = db["job_roles"]
