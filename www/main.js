let courses;

// ----------
// How course selection works
// ----------
//
// The search box ultimately controls what happens with the selectedCourses
// list. The filter box controls the filteredCourses list by filtering from the
// selectedCourses list. This allows changes to the offerings filter without
// changing the search box. However, changes in the search box will have to
// refilter the results, so any changes since the last filter will take effect,
// although the filter will not be reset.
//
// on search: selectedCourses gets updated with a filtered version of courses,
// then run what happens on filter
//
// on filter: filteredCourses gets updated with a filtered version of
// selectedCourses, then the results listing is updated
let selectedCourses;
let filteredCourses;

fetch("catalog.json")
  .then((res) => {
    if (!res.ok) {
      throw new Error(res.body);
    }

    return res.json();
  })
  .then((data) => {
    courses = data;
    selectedCourses = courses;
  })
  .catch((err) => console.log(err));

const school = document.getElementById("school");
const dept = document.getElementById("dept");
const subject = document.getElementById("subject");
const keyword = document.getElementById("keyword");

const searchSearch = document.getElementById("search-search");
const searchReset = document.getElementById("search-reset");

const semester = document.getElementById("semester");
const block = document.getElementById("block");

const offerFilter = document.getElementById("offer-filter");
const offerReset = document.getElementById("offer-reset");

const results = document.getElementById("results");

const toTitleCase = (str) => {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

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
school.addEventListener("input", () => {
  if (school.value === "NCSSM Online") {
    dept.classList.add("school-online");
    subject.classList.add("school-online");
  } else {
    dept.classList.remove("school-online");
    subject.classList.remove("school-online");
  }
});

// Reset the subject when the department is changed and hide the subjects that
// don't match with the department
dept.addEventListener("input", () => {
  // Don't reset the subject if the department is being set to all since any
  // subject is valid for when the department is all
  if (dept.value !== "All") {
    subject.value = "All";
  }

  const dept_classes = {
    All: "dept-all",
    "Engineering and Computer Science": "dept-ecs",
    Humanities: "dept-hum",
    Science: "dept-sci",
    Mathematics: "dept-math",
    "Interdisciplinary Electives": "dept-inter",
    "Physical Activity & Wellness": "dept-paw",
    "Student Life": "dept-life",
  };

  subject.classList.remove(...Object.values(dept_classes));
  subject.classList.add(dept_classes[dept.value]);
});

semester.addEventListener("input", () => {
  if (semester.value === "Any" || semester.value == "Never") {
    block.disabled = true;
    block.value = "Any";
  } else {
    block.disabled = false;
  }
});

const resetResults = () => {
  while (results.firstChild) {
    results.removeChild(results.firstChild);
  }
};

const resetSearch = () => {
  school.value = "All";
  dept.value = "All";
  subject.value = "All";
  keyword.value = "";

  // Avoid the hiding and showing effects from previous selections carrying over
  // even after resetting.
  dept.className = "";
  subject.className = "dept-all";
};

const resetOffer = () => {
  semester.value = "Any";
  block.value = "Any";
  block.disabled = true;
};

const updateResults = () => {
  filteredCourses.forEach((c) => {
    const li = document.createElement("li");

    // formatting the dropdown to resemble the original course catalogue
    let drowndown_html = "";
    Object.keys(c)
      .filter(
        (k) =>
          k !== "course_id" &&
          k !== "title" &&
          k !== "description" &&
          k !== "meetings" &&
          k !== "video" &&
          k !== "patterns_s1" &&
          k !== "patterns_s2"
      )
      .forEach((k) => {
        drowndown_html += `<strong>${toTitleCase(k.replace(/_/g, " "))}:</strong> ${c[k]} <br>`;
      });

    if (c.hasOwnProperty("video")) {
      drowndown_html += `<iframe width="376" align="center" height="212" src="${c.video}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen=""></iframe>`;
    }

    drowndown_html += `<p>${c.description}</p> <br>`;
    drowndown_html += `<strong>Meetings:</strong> ${c.meetings} <br>`;

    if (c.hasOwnProperty("patterns_s1")) {
      drowndown_html += `<strong>1st Semester Meeting Patterns: </strong> ${c.patterns_s1.join(
        ", "
      )} <br>`;
    }

    if (c.hasOwnProperty("patterns_s2")) {
      drowndown_html += `<strong>2nd Semester Meeting Patterns: </strong> ${c.patterns_s2.join(
        ", "
      )} <br>`;
    }

    li.innerHTML = `<details><summary>${c.title}</summary><div class="result-card">${drowndown_html}</div></details>`;
    results.appendChild(li);
  });
};

const selectCourses = () => {
  selectedCourses = courses
    .filter((c) => (school.value === "All" ? true : school.value === c.school))
    .filter((c) => (dept.value === "All" ? true : dept.value === c.dept))
    .filter((c) => (subject.value === "All" ? true : subject.value === c.subject))
    // Match for the keyword in the course_id, title, and description fields,
    // ignoring case and trimming
    .filter((c) =>
      keyword === ""
        ? true
        : c.course_id.trim().toLowerCase().includes(keyword.value.trim().toLowerCase()) ||
          c.title.trim().toLowerCase().includes(keyword.value.trim().toLowerCase()) ||
          c.description.trim().toLowerCase().includes(keyword.value.trim().toLowerCase())
    );
};

const filterCourses = () => {
  filteredCourses = selectedCourses
    .filter((c) => {
      switch (semester.value) {
        case "Any":
          return true;

        case "Never":
          return !c.hasOwnProperty("patterns_s1") && !c.hasOwnProperty("patterns_s2");

        case "Year":
          return c.hasOwnProperty("patterns_s1") || c.hasOwnProperty("patterns_s2");

        case "Semester1":
          return c.hasOwnProperty("patterns_s1");

        case "Semester2":
          return c.hasOwnProperty("patterns_s2");

        default:
          return false;
      }
    })
    .filter((c) => {
      if (block.value === "Any") {
        return true;
      }

      if (semester.value === "Year") {
        return (
          (c.hasOwnProperty("patterns_s1") && c.patterns_s1.some((p) => p.includes(block.value))) ||
          (c.hasOwnProperty("patterns_s2") && c.patterns_s2.some((p) => p.includes(block.value)))
        );
      } else if (semester.value === "Semester1") {
        return c.patterns_s1.some((p) => p.includes(block.value));
      } else if (semester.value === "Semester2") {
        return c.patterns_s2.some((p) => p.includes(block.value));
      }
    });
};

searchSearch.addEventListener("click", () => {
  resetResults();
  selectedCourses = courses;

  selectCourses();
  filterCourses();

  updateResults();
});

offerFilter.addEventListener("click", () => {
  resetResults();
  filterCourses();
  updateResults();
});

searchReset.addEventListener("click", () => {
  resetSearch();
  resetResults();
  selectedCourses = courses;
});

offerReset.addEventListener("click", () => {
  resetOffer();
  filterCourses();
  updateResults();
});
