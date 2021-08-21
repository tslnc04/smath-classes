let courses

fetch('catalog.json')
  .then((res) => {
    if (!res.ok) {
      throw new Error(res.body)
    }

    return res.json()
  })
  .then((data) => {
    courses = data
    // console.log(data)
    // const results = document.getElementById('results')
    // for (const course of data) {
    //   const li = document.createElement('li')
    //   li.innerHTML = `<h1>${course.title}</h1>`
    //   results.appendChild(li)
    // }
  })
  .catch((err) => console.log(err))

const school = document.getElementById('school')
const dept = document.getElementById('dept')
const subject = document.getElementById('subject')
const keyword = document.getElementById('keyword')

const search = document.getElementById('search')
const reset = document.getElementById('reset')

const results = document.getElementById('results')

const toTitleCase = (str) => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

// ----------
// How conditional hiding and showing works
// ----------
//
// Based on the school/program: The "school-online" class is added to the
// department and subject select elements when the online program is selected,
// otherwise there is no classes present on these select elements. The
// residential-only subjects and departments have the "school-residential" class
// on the option elements. CSS is then used to hide these elements when the
// parent has the "school-online class".
//
// Based on the department: A class prefixed with "dept-" is added to the
// subject select element and all others are removed based on the chosen
// department. Option elements for the subject each have a the class with the
// "dept-" for each department they should show for, with every department
// receiving the "dept-all" class. By default the option elements are hidden,
// and only when the select element has a corresponding class, including
// "dept-all", will the option elements be shown. This final step is done
// entirely through CSS.

// Hide departments and subjects like physical activity when the online program
// is selected
school.addEventListener('input', () => {
  if (school.value === 'NCSSM Online') {
    dept.classList.add('school-online')
    subject.classList.add('school-online')
  } else {
    dept.classList.remove('school-online')
    subject.classList.remove('school-online')
  }
})

// Reset the subject when the department is changed and hide the subjects that
// don't match with the department
dept.addEventListener('input', () => {
  // Don't reset the subject if the department is being set to all since any
  // subject is valid for when the department is all
  if (dept.value !== 'All') {
    subject.value = 'All'
  }

  const dept_classes = {
    All: 'dept-all',
    'Engineering and Computer Science': 'dept-ecs',
    Humanities: 'dept-hum',
    Science: 'dept-sci',
    Mathematics: 'dept-math',
    'Interdisciplinary Electives': 'dept-inter',
    'Physical Activity & Wellness': 'dept-paw',
    'Student Life': 'dept-life',
  }

  subject.classList.remove(...Object.values(dept_classes))
  subject.classList.add(dept_classes[dept.value])
})

search.addEventListener('click', () => {
  while (results.firstChild) {
    results.removeChild(results.firstChild)
  }

  courses
    .filter((c) => (school.value === 'All' ? true : school.value === c.school))
    .filter((c) => (dept.value === 'All' ? true : dept.value === c.dept))
    .filter((c) =>
      subject.value === 'All' ? true : subject.value === c.subject
    )
    // Match for the keyword in the course_id, title, and description fields,
    // ignoring case and trimming
    .filter((c) =>
      keyword === ''
        ? true
        : c.course_id
            .trim()
            .toLowerCase()
            .includes(keyword.value.trim().toLowerCase()) ||
          c.title
            .trim()
            .toLowerCase()
            .includes(keyword.value.trim().toLowerCase()) ||
          c.description
            .trim()
            .toLowerCase()
            .includes(keyword.value.trim().toLowerCase())
    )
    .forEach((c) => {
      const li = document.createElement('li')

      // formatting the dropdown to resemble the original course catalogue
      let drowndown_html = ''
      Object.keys(c)
        .filter(
          (k) =>
            k !== 'course_id' &&
            k !== 'title' &&
            k !== 'description' &&
            k !== 'meetings' &&
            k !== 'video'
        )
        .forEach((k) => {
          drowndown_html += `<strong>${toTitleCase(
            k.replaceAll('_', ' ')
          )}:</strong> ${c[k]} <br>`
        })

      if (c.hasOwnProperty('video')) {
        drowndown_html += `<iframe width="376" align="center" height="212" src="${c.video}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen=""></iframe>`
      }

      drowndown_html += `<p>${c.description}</p> <br>`
      drowndown_html += `<strong>Meetings:</strong> ${c.meetings} <br>`

      li.innerHTML = `<details><summary>${c.title}</summary><div class="result-card">${drowndown_html}</div></details>`
      results.appendChild(li)
    })
})

reset.addEventListener('click', () => {
  while (results.firstChild) {
    results.removeChild(results.firstChild)
  }

  school.value = 'All'
  dept.value = 'All'
  subject.value = 'All'
  keyword.value = ''

  // Avoid the hiding and showing effects from previous selections carrying over
  // even after resetting.
  dept.className = ''
  subject.className = 'dept-all'
})
