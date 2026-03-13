# Event Creator

A Google Workspace add-on for creating Google calendar events.

## Installation

1. Set up a project on [Apps Script][2] by following this [guide][1].

2. Install [clasp][3].

3. Login with `clasp`.

```
clasp login
```

4. Determine the Script ID of your Apps Script project, which
   is found under Project Settings.
   Clone the project into a separate directory.

   ```
   clasp clone <Script ID>
   ```

   Move the project settings file `.clasp.json` to this git repo.

   Alternatively, you can modify the existing `.clasp.json` with your 
   own Script ID:
   ```
   {
     "scriptId": "",
     ...
   }
   ```

4. Then, you can push this Apps Script project with by

   ```
   clasp push
   ```

5. On the [Apps Script][2] portal, install a test deployment for your Apps Script project.

## Usage

In Gmail, 
1. Open a message is loaded.
2. Click on the installed Add-on (Event), which will normally appear on the
   right-bar.
3. Verify the populated information and click "Add".


[1]: https://developers.google.com/workspace/add-ons/quickstart/cats-quickstart#common.gs
[2]: https://script.google.com
[3]: https://github.com/google/clasp

