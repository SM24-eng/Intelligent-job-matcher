from utils import jobs_collection

sample_jobs = [
    {
        "title": "Python Developer",
        "description": "Looking for a Python developer with Django and REST API experience"
    },
    {
        "title": "Data Scientist",
        "description": "Experience in machine learning, NLP, and data analysis"
    },
    {
        "title": "Frontend Developer",
        "description": "React developer with strong JavaScript and UI skills"
    }
]

jobs_collection.insert_many(sample_jobs)
print("Sample jobs inserted successfully")
