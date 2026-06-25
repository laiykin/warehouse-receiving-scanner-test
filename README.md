# Warehouse Receiving App Prototype

This is a static, shareable browser prototype for receiving and tracking installation product inventory.

## Run Locally

```bash
python3 -m http.server 4173
```

Open:

```text
http://127.0.0.1:4173/
```

## What It Tracks

- Products by SKU, barcode, manufacturer, category, size, finish/color, hand/swing, and default location
- Bay layout definitions by bay code, zone, product group, rack/row, position, capacity, and notes
- Locations by location ID, BAT location, bay location, QR value, zone, aisle, bay, shelf, and type
- Inventory balances by SKU, location, customer, order number, job/project, opening tag, and needed-by date
- Inventory transactions for receiving, moves, check-out, returns, cycle counts, and adjustments
- Exceptions for damaged, short, overage, inspection, and wrong-item cases

Seed product lines include Andersen, Simonton, Wincore, Therma-Tru, Elias, ThermoVision, STOW, MSI, and install supplies.

## Share Options

The fastest work-friendly pilot is to host these files as a small internal static web app.

Good options:

- SharePoint document library or intranet page for a basic static pilot
- Azure Static Web Apps if IT wants Microsoft hosting and Entra controls
- Cloudflare Pages or Netlify for a quick private link if allowed by IT
- GitHub Pages for a simple demo link if company policy allows it

For production with shared live data, rebuild or wire this model to:

- Power Apps mobile app for the warehouse UI
- SharePoint Lists or Microsoft Lists for a Microsoft 365 pilot backend
- Power Automate for exception alerts, approvals, and daily reports
- Dataverse later if volume, security, or relational behavior outgrows Lists

## Scanner Notes

The app uses the browser BarcodeDetector API when available. Camera scanning generally needs HTTPS or localhost. Bluetooth scanners that act like keyboard input will work with the text fields even when camera scanning is unavailable.

Admin now has a Bay layout section. Define the real warehouse bays there first, then assign those bay codes to inventory locations. Scanning a location ID, QR value, BAT location, or assigned bay location resolves to the same location.

For vendor window/door tags like the sample photo, the app treats only two pieces as operationally useful by default:

- Customer name from the `Quote:` area
- The raw scanned barcode/vendor label value

The app stores the raw vendor label/barcode so it can be searched later. If that barcode can be decoded into useful vendor data, add a lookup table or vendor export mapping later. Until then, it should be treated as a traceability/reference value, not as a guaranteed SKU/order decoder.

The Receive screen also has Label intake. It can parse pasted OCR text or scanned label text from this vendor-tag format. In production, OCR can be added with Microsoft AI Builder, Azure AI Vision, Power Automate, or a client-side OCR library such as Tesseract.js. For a Microsoft 365 build, AI Builder or Azure AI Vision is the more IT-friendly path.

## Data Export

Use Export in the app to download CSV transaction data. Admin includes balance CSV export and JSON export/import for pilot data backup.
