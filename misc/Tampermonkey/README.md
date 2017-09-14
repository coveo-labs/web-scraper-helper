# Tampermonkey Script

The Tampermonkey script is now depricated. It is recommended to rather use the more convenient and up-to-date Google Chrome extension also included in this repo (see Chrome extension [README](../chrome_extension/README.md)).

Tampermonkey is a popular userscript manager that you can install in most browsers (see [Tampermonkey](https://tampermonkey.net/)). The web-scraper-helper Tampermonkey script allows you to create and test web scraping configurations directly from the brwoser when visiting web pages for which you want to customize the indexing. 

The web scraping configuration developed with the extenson can tell the Web and Sitemap sources to exclude web page sections and extract metadata (see [Web Scraping Configuration](http://www.coveo.com/go?dest=cloudhelp&lcid=9&context=277)). The extension does not currently support testing the creation of sub-items. 

The extension provides some GUI to create, save, and test your web scraping configuration on specific pages to immediately see the results. 

## Installation
1. If not already done, install Tampermonkey in your favorite browser (see [Tampermonkey](https://tampermonkey.net/)).
1. Import the `misc/Webscraping.user.js` file in your Tampermonkey extension. 

## Usage
1. From within the Tampermonkey editor, edit the script:
   1. Edit `@match` to activate the script for the desired web site pages.
   1. Edit the `jsonRules` with the desired web scraping configuration (see [Web Scraping Configuration](http://www.coveo.com/go?dest=cloudhelp&lcid=9&context=277)).
   1. Save the script.
1. Reload the web site page.

   The excluded sections appear with a semi-transparent white overlay. Extracted metadata values appear in the web-scraper-helper panel on the right. 
1. Test and find-tune your web scraping configuration with other site pages. 
1. Once you are happy with your scraping rules, copy and paste the JSON configuration from the Tampermonkey editor to your Web or Sitemap source in the Coveo Cloud V2 organization using the [administration console](https://platform.cloud.coveo.com/admin/).
1. Rebuild your source. 
1. Validate that your web scraping configuration performed as expected on all source items. 

## Dependencies
This earlier version of the tool is a [Tampermonkey](https://tampermonkey.net/) script.