# Event Creator

A Google Workspace add-on for creating Google calendar events.

## Installation

Set up an Apps Script project by following this [guide][1].

Update the time zone in `appsscript.json`.

Then, you can push this [apps script][2] project with [clasp][3] by
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
2: https://script.google.com
3: https://github.com/google/clasp

