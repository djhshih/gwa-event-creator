# Event Creator

A Google Workspace add-on for creating Google calendar events.

## Installation

Set up an Apps Script project by following this (guide)[1].

Update the time zone in `appsscript.json`.

Then, you can push this (apps script)[script.google.com] project with
(clasp)[https://github.com/google/clasp] by

```
clasp push
```

Finally, install a test deployment for your Apps Script project.

## Usage

In Gmail, 
1. Open a message is loaded.
2. Click on the installed Add-on (Event), which will normally appear on the
   right-bar.
3. Verify the populated information and click "Add".

## TODO

More robust parsing to identify event details.


1: https://developers.google.com/workspace/add-ons/quickstart/cats-quickstart#common.gs

