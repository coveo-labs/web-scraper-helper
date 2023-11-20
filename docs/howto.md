# How to use the Web Scraper panel

You can boost search result relevance by taking advantage of this feature. Read more information on the official Coveo documentation site - [Web Scraping Configuration](https://docs.coveo.com/en/mc1f3573/index-content/web-scraping-configuration).

_To install this extension in your Chrome browser, follow these [installation steps](./install.md)._

## How-to Guide

1. Open `View > Developer > Developer Tools` or `Option + ⌘ + J` (on macOS), `Shift + CTRL + J`(on Windows/Linux).

   ![Developer Tools](./devtools.png)

1. Find a Web Scraping tab (like shown on the screenshot below)

   <img src="./panel.png" alt="Web Scraper panel" width="400" height="400">

1. Click “Create New File” to start a new Web Scraping configuration for your site and source
1. To pick a specific part of the desired web page, use Select Element (as on screenshot or `Ctrl + Shift + C`)

   ![findelement.png](./find_element.png)

1. When you select a part of the screen, a line of the HTML code will get selected too.

   <img src="./html_code_highlight.png" alt="Elements" height="400">

1. Right click on that highlighted line and either copy CSS or XPATH.

   <img src="./copy_css_or_xpath.png" alt="Copy paths from Elements" height="400">

1. Paste CSS or XPATH into the corresponding box inside Web Scraping

   <img src="./excludes_rules.png" alt="Exclude rules" height="400">

1. Fill in your desired Exclusion filters and Metadata accordingly. When done, copy your configuration to clipboard and paste it in Coveo Administration Console - Web Source Web Scraping field.

   <img src="./copy_clipboard.png" alt="Copy to Clipboard" height="400">

## Validation states

For each selector, you can toggle the selector type between `CSS` and `XPATH`:

  <img src="./selector_validation/toggle.gif" height="100" width="400" alt="Selector toggle button">

The border of the toggle button reflects the validation of the selector:

- `Red`, the selector is _invalid_ (For example, in the following, `/` can't be used in a CSS selector)

  <img src="./selector_validation/invalid.png" height="50" alt="Valid, not found">

- `Yellow`, the selector is _valid_, but no element matching this selector was found in the page.

  <img src="./selector_validation/valid_notfound.png" height="50" alt="Valid, not found">

- `Green`, the selector is _valid_, and at least one element matching this selector was found in the page.

  <img src="./selector_validation/valid_found.png" height="50" alt="Valid, found">
