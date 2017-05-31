# web-scraper-helper
A tool to test web scraping rules.

## Description

This tool is a Tampermonkey script. You need to install the [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) extension in your Chrome browser to use it.

## How-to Use

* Import the `misc/Webscraping.user.js` file in your Tampermonkey extension.
* From within the Tampermonkey editor:
  * Edit the `@match` to include the site you are working with
  * Edit the `jsonRules`
  * Save the script
* Reload your site

Once you are happy with your rules, copy and paste the JSON structure from the Tampermonkey editor to your Web source in your [Coveo organization](https://platform.cloud.coveo.com/admin/).
