import re
import math


def extract_years(text):
    pattern = r'(\d+)\+?\s*(?:years|year)'
    matches = re.findall(pattern, text.lower())

    if matches:
        return max([int(m) for m in matches])

    return 0

def calculate_experience_score(resume_text, job_text):
    resume_years = extract_years(resume_text)
    job_years = extract_years(job_text)

    # If job does not specify required experience
    if job_years == 0:
        return 1.0

    # If resume has zero experience
    if resume_years == 0:
        return 0.0

    # Log scaling
    score = math.log(1 + resume_years) / math.log(1 + job_years)

    # Clamp score between 0 and 1
    return max(0.0, min(score, 1.0))

