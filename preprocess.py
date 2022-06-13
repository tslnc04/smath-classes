#!/usr/bin/python3

from bs4 import BeautifulSoup
import urllib.request
import re
import json
import csv

catalog_url = 'https://courses.ncssm.edu/catalog.php'
catalog_file = ''
catalog_output = 'www/catalog.json'

pattern_file_s1 = 'meeting_patterns_s1.csv'
pattern_file_s2 = 'meeting_patterns_s2.csv'

pattern_files = {
    ('NCSSM Durham', 's1'): 'patterns_durham_s1.csv',
    ('NCSSM Durham', 's2'): 'patterns_durham_s2.csv',
    ('NCSSM Morganton', 's1'): '',
    ('NCSSM Morganton', 's2'): '',
}

def parse_patterns(pattern_file: str) -> dict:
    pattern_dict = {}
    with open(pattern_file, 'r', newline='') as f:
        patterns = csv.reader(f)
        next(patterns)
        for row in patterns:
            course_code = row[2].split()[0]
            pattern = row[3]

            # Deduplicate patterns with set
            if course_code in pattern_dict:
                pattern_dict[course_code].add(pattern)
            else:
                pattern_dict[course_code] = {pattern}
    return pattern_dict

pattern_dicts = {k: parse_patterns(v) for k, v in pattern_files.items() if v}

if catalog_file:
    with open(catalog_file, 'r') as f:
        catalog_data = f.read()
else:
    with urllib.request.urlopen(catalog_url) as f:
        catalog_data = f.read().decode()

soup = BeautifulSoup(catalog_data, 'html.parser')
courses_list = soup.find(id='course_list_selected').find_all(
    'li', 'course_listing_selected')
courses = {}

for listing in courses_list:
    course = {}

    ps = listing.find_all('p')
    course['course_id'] = next(ps[0].stripped_strings)

    # If the entry has an accompanying video, find the link to it
    frames = listing.find_all('iframe')
    if len(frames) > 0:
        course['video'] = frames[0]['src']

    # Each span in the second paragraph roughly corresponds to a key-value pair
    # in the course data
    metas = list(ps[1].stripped_strings)
    for i in range(0, len(metas), 2):
        key = metas[i].lower() \
                      .replace(' ', '_').replace('(', '') \
                      .replace(')', '').replace(':', '')
        val = metas[i+1] if i+1 != len(metas) else ''
        course[key] = val

    # Match course with its patterns based on school
    for (school, semester), pattern_dict in pattern_dicts.items():
        if school == course['school']:
            if course['course_id'] in pattern_dict:
                # Since the deduplication leaves a set, turn it back into a list
                # for JSON serialization and sort at the same time
                course['patterns_'+semester] = sorted(pattern_dict[course['course_id']])

    # Some courses show the code twice in the title. This regex identifies the
    # issue and strips the first course code.
    course['title'] = ps[2].string.strip()
    if re.match(r'[A-z]{2}[0-9]{4}\s+[A-z]{2}[0-9]{4}', course['title']) is not None:
        course['title'] = course['title'][6:].strip()

    # Description parsing
    # There are four cases to cover, all starting with ps[3] as the base.
    #
    # Case 1: ps[3] > string
    #   This case is easy to cover and just uses the sole string inside the
    #   paragraph as the description. Similar to how it was in the 2021-2022
    #   version of the coursse catalog.
    # Case 2: ps[3] > divs
    #   Every other case is essentially a sub-case of this. For some reason the
    #   paragraph has multiple divs where the first one is the description and
    #   the following are requirements.
    # Case 3: ps[3] > div > divs
    #   For some reason, the divs are just nested. Go down to the child div and
    #   move to Case 2.
    # Case 4: ps[3] > div > string + divs
    #   This is a somewhat rare case but has the description as the string and
    #   following divs within the div. Hard to identify because Case 3 may have
    #   a string first, but it'll be a \n or something similar.

    # Case 1
    if ps[3].string:
        course['description'] = ps[3].string.strip() 
    # Cases 2-4
    elif (divs := ps[3].find_all('div')):
        if divs[0].div:
            # Case 4 detection
            if isinstance(divs[0].contents[0], str) and len(divs[0].contents[0]) > 1:
                course['description'] = divs[0].contents[0]
            # Moves from Case 3 into Case 2, although necessary for Case 4 also
            divs = divs[0].find_all('div')
    
        # Still Case 1, but they use <u> tags that split up the string
        if not divs[0].string:
            course['description'] = ' '.join(divs[0].strings)
        # Case 4 handling, using the first string and filling in divs
        elif 'description' in course:
            course['description'] += '<br\>'.join(div.string for div in divs)
        # Case 2 handling with the requirements parsing like metas
        else:
            course['description'] = divs[0].string.strip()

            # Parsing of requirements similar to the meta fields
            for req in divs[1:]:
                if not req.string or len(req.string) < 2 or req.string == 'Requirements':
                    continue
                req = req.string.split(':')
                key = req[0].lower() \
                            .replace(' ', '_').replace('(', '') \
                            .replace(')', '').replace(':', '') \
                            .replace('/', '_')
                course[key] = req[1].strip()

    # When the department and subject are the same, the catalog doesn't
    # actually show the subject, so add that back in.
    if 'subject' not in course:
        course['subject'] = course['dept']

    # Deduplicate by school and course_id, since Morganton and Durham can both
    # the same course, but only once each.
    courses[course['course_id'] + course['school']] = course

# Print for diagnostics
# print(json.dumps(list(courses.values()), indent='    '))

with open(catalog_output, 'w') as f:
    # Pretty print version
    json.dump(list(courses.values()), f, indent='    ')
    # json.dump(list(courses.values()), f, separators=(',', ':'))
