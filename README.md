# smath-classes

An unofficial course catalog for the [North Carolina School of Science and Mathematics](https://ncssm.edu) (NCSSM).

Preview available at [smath-classes.netlify.app](https://smath-classes.netlify.app/).

## What?

An alternative to the [current course catalog](https://courses.ncssm.edu/catalog.php) that the NCSSM registrar maintains. The website is implemented in pure HTML/CSS/JS, with no external dependencies and the scraping portion is written in Python3, only dependent on Beautiful Soup.

## Why?

Mobile support. The official version doesn't just look bad, it's borderline impossible to use on a mobile device.

Additionally, the official version does not allow editing of search queries, only resetting them. This becomes infuriating when one clicks the wrong option and is forced to redo the search.

Eventually, the faults of the official site bothered me enough to just recreate the site done properly.

## Usage

To scrape new data, simply run `./preprocess.py`. Otherwise, the `www` directory acts as a functional site. Meeting patterns are provided in this repo, although they are ordinarily acessible from the [registrar website](https://registrar.ncssm.edu) provided one has an NCSSM google account.

## License

Copyright 2022 Kirsten Laskoski

Licensed under [MIT](https://github.com/tslnc04/smath-classes/blob/main/LICENSE).
