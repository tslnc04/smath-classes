#!/usr/local/bin/python3.9

from bs4 import BeautifulSoup
import urllib.request
import re
import json

catalog_url = 'https://uniapp.ncssm.edu/registrar/catalog/course_catalog_beta1.3.1.php'
# catalog_file = 'catalog.html'
catalog_output = 'www/catalog.json'

with urllib.request.urlopen(catalog_url) as f:
    catalog_data = f.read().decode()

# with open(catalog_file, 'r') as f:
#     catalog_data = f.read()

courses = {}

soup = BeautifulSoup(catalog_data, 'html.parser')

courses_list = soup.find(id='course_list_selected').find_all(
    'li', 'course_listing_selected')

for listing in courses_list:
    course = {}

    ps = listing.find_all('p')
    course['course_id'] = next(ps[0].stripped_strings)

    frames = listing.find_all('iframe')
    if len(frames) > 0:
        course['video'] = frames[0]['src']

    metas = list(ps[1].stripped_strings)
    for i in range(0, len(metas), 2):
        key = metas[i].lower() \
                      .replace(' ', '_').replace('(', '') \
                      .replace(')', '').replace(':', '')
        val = metas[i+1] if i+1 != len(metas) else ''
        course[key] = val

    if len(ps) >= 4 and 'Course Specific Link:' in list(ps[3].stripped_strings):
        ps = [ps[i] for i in range(len(ps)) if i != 3 and i != 4]

    course['title'] = ps[2].string.strip()
    if re.match(r'[A-z]{2}[0-9]{4}\s+[A-z]{2}[0-9]{4}', course['title']) is not None:
        course['title'] = course['title'][6:].strip()

    course['description'] = ps[3].string.strip() if ps[3].string else ''
    course['meetings'] = list(ps[4].stripped_strings)[1] if len(ps) >= 5 else ''

    # When the department and subject are the same, the catalog doesn't
    # actually show the subject, so add that back in.
    if 'subject' not in course:
        course['subject'] = course['dept']

    courses[course['course_id']] = course

with open(catalog_output, 'w') as f:
    json.dump(list(courses.values()), f, indent='    ')
