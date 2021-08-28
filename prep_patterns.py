import csv
import json

pattern_file = 'meeting_patterns.csv'
pattern_dict = {}

def extract_name(course: str) -> str:
    course = course.split()
    return ' '.join(course[1:-1])

with open(pattern_file, 'r') as f:
    patterns = csv.reader(f)
    next(patterns)
    for row in patterns:
        course_code = row[0].split()[0]
        course_name = extract_name(row[0])
        pattern = row[1]

        if course_code in pattern_dict:
            pattern_dict[course_code].append(pattern)
        else:
            pattern_dict[course_code] = [pattern]

print(json.dumps(pattern_dict, indent='  '))