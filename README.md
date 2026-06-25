# Install Label Printer Prototype

Static browser app for printing district-coded "job ready for install" labels after the job is entered in Salesforce.

## Workflow

1. Unload truck.
2. Enter / comment the job in Salesforce.
3. Open this app at the warehouse PC.
4. Enter customer name, job number, optional install date, district, and label quantity.
5. Add the job to the print queue.
6. Print the Avery label sheet.

## Current Fields

- Customer name
- Job number
- Install date, typed or left blank for handwriting
- District color
- Number of labels needed for the job

## Label Sheets

The default print layout is `Avery 5164 / 8164`, which is a 2-column by 3-row sheet with 4 in x 3 1/3 in labels. This matches the large label format shown in the reference photo.

The app also includes `Avery 5163 / 8163`, which is a 2-column by 5-row sheet with 4 in x 2 in labels.

Use `Start at label position` when reusing a partially used sheet.

## District Colors

District names and colors can be edited in the app. Changes are saved in the browser on that PC.

## Run Locally

```bash
python3 -m http.server 4173
```

Open:

```text
http://127.0.0.1:4173/
```

## Production Notes

This is still a public/static prototype. It does not require a login and stores local settings in the browser only. Use sample data on public hosting until it is moved into an approved internal environment.
