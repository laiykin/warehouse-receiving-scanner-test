const STORAGE_KEY = "warehouse-receiving-state-v5";
const SCREEN_KEY = "warehouse-receiving-screen";

const navItems = [
  { id: "home", label: "Home", icon: "home" },
  { id: "receive", label: "Receive", icon: "scan" },
  { id: "move", label: "Move", icon: "move" },
  { id: "checkout", label: "Check Out", icon: "checkout" },
  { id: "lookup", label: "Lookup", icon: "lookup" },
  { id: "count", label: "Cycle Count", icon: "count" },
  { id: "admin", label: "Admin", icon: "settings" },
];

const screenMeta = {
  home: ["Warehouse Home", "Daily receiving, movement, and exception snapshot."],
  receive: ["Receiving", "Scan install material and location, then post inventory."],
  move: ["Move Inventory", "Transfer stock between staging, bins, carts, and holds."],
  checkout: ["Check Out", "Issue material to a job or return it to inventory."],
  lookup: ["Lookup", "Find products, locations, balances, and recent activity."],
  count: ["Cycle Count", "Compare physical counts against system balances."],
  admin: ["Admin", "Maintain pilot master data and export records."],
};

let state = loadState();
let currentScreen = localStorage.getItem(SCREEN_KEY) || "receive";
let toastTimer = null;
let scanSession = null;

const draft = {
  receive: { condition: "Good", location: "STAGE-01" },
  move: {},
  checkout: { mode: "issue", condition: "Good" },
  lookup: { mode: "product", query: "" },
  count: {},
};

const root = document.getElementById("app-root");
const navRoot = document.getElementById("rail-nav");
const titleEl = document.getElementById("screen-title");
const subtitleEl = document.getElementById("screen-subtitle");
const globalSearch = document.getElementById("global-search");
const toastEl = document.getElementById("toast");
const scanDialog = document.getElementById("scan-dialog");
const scanVideo = document.getElementById("scan-video");
const scanTitle = document.getElementById("scan-title");
const scanHelp = document.getElementById("scan-help");
const scanStatus = document.getElementById("scan-status");

function createSeedState() {
  const products = [
    {
      sku: "AND-400-DH-3046",
      description: "Andersen 400 Series double-hung window",
      category: "Window",
      size: "30 x 46",
      finish: "White",
      hand: "",
      vendor: "Andersen",
      uom: "EA",
      barcode: "AND400DH3046",
      defaultLocation: "WINDOW-RACK-02",
      minQty: 0,
      active: true,
    },
    {
      sku: "SIM-5500-SL-6040",
      description: "Simonton 5500 sliding window",
      category: "Window",
      model: "5500-SL",
      size: "60 x 40",
      finish: "Bronze",
      hand: "",
      vendor: "Simonton",
      uom: "EA",
      barcode: "SIM5500SL6040",
      defaultLocation: "WINDOW-RACK-01",
      minQty: 0,
      active: true,
    },
    {
      sku: "SIM-5200-PWP",
      description: "Simonton 5200 picture window",
      category: "Window",
      model: "5200-PW P",
      size: "41 1/2 x 61 1/4",
      finish: "White",
      hand: "",
      vendor: "Simonton",
      uom: "EA",
      barcode: "5200-PWP",
      defaultLocation: "F03",
      minQty: 0,
      active: true,
    },
    {
      sku: "WINCORE-DOOR-3068-LH",
      description: "Wincore exterior prehung door",
      category: "Door",
      model: "3068-LH",
      size: "3-0 x 6-8",
      finish: "Primed",
      hand: "Left hand inswing",
      vendor: "Wincore",
      uom: "EA",
      barcode: "WINCOREDOOR3068LH",
      defaultLocation: "DOOR-RACK-01",
      minQty: 0,
      active: true,
    },
    {
      sku: "THERMATRU-DOOR-2868-RH",
      description: "Therma-Tru entry door",
      category: "Door",
      model: "2868-RH",
      size: "2-8 x 6-8",
      finish: "Smooth-Star primed",
      hand: "Right hand inswing",
      vendor: "Therma-Tru",
      uom: "EA",
      barcode: "THERMATRU2868RH",
      defaultLocation: "DOOR-RACK-02",
      minQty: 0,
      active: true,
    },
    {
      sku: "ELIAS-REFACE-SHAKER",
      description: "Elias cabinet makeover shaker door",
      category: "Cabinet Makeover",
      size: "Custom",
      finish: "Paint grade",
      hand: "",
      vendor: "Elias",
      uom: "EA",
      barcode: "ELIASREFACESHAKER",
      defaultLocation: "CABINET-BAY-01",
      minQty: 0,
      active: true,
    },
    {
      sku: "THERMOVISION-REFACE",
      description: "ThermoVision cabinet makeover panel",
      category: "Cabinet Makeover",
      size: "Custom",
      finish: "Thermofoil",
      hand: "",
      vendor: "ThermoVision",
      uom: "EA",
      barcode: "THERMOVISIONREFACE",
      defaultLocation: "CABINET-BAY-02",
      minQty: 0,
      active: true,
    },
    {
      sku: "ELIAS-CAB-BASE",
      description: "Elias cabinet replacement base cabinet",
      category: "Cabinet Replacement",
      size: "Custom",
      finish: "Customer selection",
      hand: "",
      vendor: "Elias",
      uom: "EA",
      barcode: "ELIASCABBASE",
      defaultLocation: "CABINET-BAY-01",
      minQty: 0,
      active: true,
    },
    {
      sku: "STOW-ORG-TOWER",
      description: "STOW home organization tower",
      category: "Home Organization",
      size: "Custom",
      finish: "White",
      hand: "",
      vendor: "STOW",
      uom: "EA",
      barcode: "STOWORGTOWER",
      defaultLocation: "STOW-BAY-01",
      minQty: 0,
      active: true,
    },
    {
      sku: "MSI-TILE-1224",
      description: "MSI porcelain tile",
      category: "Tile",
      size: "12 x 24",
      finish: "Customer selection",
      hand: "",
      vendor: "MSI",
      uom: "BOX",
      barcode: "MSITILE1224",
      defaultLocation: "TILE-RACK-01",
      minQty: 0,
      active: true,
    },
    {
      sku: "FLASH-TAPE-06",
      description: "Window flashing tape",
      category: "Install Supply",
      size: "6 in. roll",
      finish: "",
      hand: "",
      vendor: "Install supply",
      uom: "ROLL",
      barcode: "FLASHTAPE06",
      defaultLocation: "HARDWARE-CAGE",
      minQty: 24,
      active: true,
    },
    {
      sku: "HARD-SCREW-3IN",
      description: "Exterior install screws",
      category: "Install Supply",
      size: "3 in.",
      finish: "Coated",
      hand: "",
      vendor: "Install supply",
      uom: "BOX",
      barcode: "HARDSCREW3IN",
      defaultLocation: "HARDWARE-CAGE",
      minQty: 18,
      active: true,
    },
  ];

  const locations = [
    { id: "STAGE-01", batLocation: "BAT-RCV-01", bayLocation: "RCV-BAY-01", zone: "Receiving", aisle: "LANE", bay: "01", shelf: "", bin: "", barcode: "LOC-STAGE-01", type: "Receiving Lane", active: true },
    { id: "QA-HOLD", batLocation: "BAT-QA-HOLD", bayLocation: "QA-BAY-HOLD", zone: "Receiving", aisle: "QA", bay: "HOLD", shelf: "", bin: "", barcode: "LOC-QA-HOLD", type: "Damage Hold", active: true },
    { id: "WINDOW-RACK-01", batLocation: "BAT-WIN-01", bayLocation: "WIN-BAY-01", zone: "Windows", aisle: "RACK", bay: "01", shelf: "", bin: "", barcode: "LOC-WINDOW-RACK-01", type: "Window Rack", active: true },
    { id: "WINDOW-RACK-02", batLocation: "BAT-WIN-02", bayLocation: "WIN-BAY-02", zone: "Windows", aisle: "RACK", bay: "02", shelf: "", bin: "", barcode: "LOC-WINDOW-RACK-02", type: "Window Rack", active: true },
    { id: "F03", batLocation: "BAT-F03", bayLocation: "F03", zone: "Windows", aisle: "F", bay: "03", shelf: "", bin: "", barcode: "LOC-F03", type: "Window Bay", active: true },
    { id: "DOOR-RACK-01", batLocation: "BAT-DOOR-01", bayLocation: "DOOR-BAY-01", zone: "Doors", aisle: "RACK", bay: "01", shelf: "", bin: "", barcode: "LOC-DOOR-RACK-01", type: "Door Rack", active: true },
    { id: "DOOR-RACK-02", batLocation: "BAT-DOOR-02", bayLocation: "DOOR-BAY-02", zone: "Doors", aisle: "RACK", bay: "02", shelf: "", bin: "", barcode: "LOC-DOOR-RACK-02", type: "Door Rack", active: true },
    { id: "CABINET-BAY-01", batLocation: "BAT-CAB-01", bayLocation: "CAB-BAY-01", zone: "Cabinets", aisle: "BAY", bay: "01", shelf: "", bin: "", barcode: "LOC-CABINET-BAY-01", type: "Cabinet Bay", active: true },
    { id: "CABINET-BAY-02", batLocation: "BAT-CAB-02", bayLocation: "CAB-BAY-02", zone: "Cabinets", aisle: "BAY", bay: "02", shelf: "", bin: "", barcode: "LOC-CABINET-BAY-02", type: "Cabinet Bay", active: true },
    { id: "STOW-BAY-01", batLocation: "BAT-STOW-01", bayLocation: "STOW-BAY-01", zone: "Home Org", aisle: "BAY", bay: "01", shelf: "", bin: "", barcode: "LOC-STOW-BAY-01", type: "STOW Bay", active: true },
    { id: "TILE-RACK-01", batLocation: "BAT-TILE-01", bayLocation: "TILE-BAY-01", zone: "Tile", aisle: "RACK", bay: "01", shelf: "", bin: "", barcode: "LOC-TILE-RACK-01", type: "Tile Rack", active: true },
    { id: "HARDWARE-CAGE", batLocation: "BAT-HDW-01", bayLocation: "HDW-BAY-01", zone: "Install", aisle: "CAGE", bay: "01", shelf: "", bin: "", barcode: "LOC-HARDWARE-CAGE", type: "Hardware Cage", active: true },
    { id: "JOB-CART-07", batLocation: "BAT-CART-07", bayLocation: "CART-BAY-07", zone: "Outbound", aisle: "CART", bay: "07", shelf: "", bin: "", barcode: "LOC-JOB-CART-07", type: "Job Cart", active: true },
    { id: "SHIP-STAGE-02", batLocation: "BAT-SHIP-02", bayLocation: "SHIP-BAY-02", zone: "Outbound", aisle: "STAGE", bay: "02", shelf: "", bin: "", barcode: "LOC-SHIP-STAGE-02", type: "Install Staging", active: true },
  ];

  const bays = [
    { code: "RCV-BAY-01", zone: "Receiving", category: "Receiving", row: "Lane", position: "01", capacity: 12, notes: "Main receiving lane", active: true },
    { code: "QA-BAY-HOLD", zone: "Receiving", category: "Exceptions", row: "QA", position: "Hold", capacity: 8, notes: "Damage and shortage hold", active: true },
    { code: "WIN-BAY-01", zone: "Windows", category: "Windows", row: "Window Rack", position: "01", capacity: 30, notes: "Simonton and wide windows", active: true },
    { code: "WIN-BAY-02", zone: "Windows", category: "Windows", row: "Window Rack", position: "02", capacity: 30, notes: "Andersen and standard windows", active: true },
    { code: "F03", zone: "Windows", category: "Windows", row: "F", position: "03", capacity: 20, notes: "Sample bay code from vendor tag", active: true },
    { code: "DOOR-BAY-01", zone: "Doors", category: "Doors", row: "Door Rack", position: "01", capacity: 18, notes: "Wincore doors", active: true },
    { code: "DOOR-BAY-02", zone: "Doors", category: "Doors", row: "Door Rack", position: "02", capacity: 18, notes: "Therma-Tru doors", active: true },
    { code: "CAB-BAY-01", zone: "Cabinets", category: "Cabinets", row: "Cabinet Bay", position: "01", capacity: 40, notes: "Elias cabinet replacement and refacing", active: true },
    { code: "CAB-BAY-02", zone: "Cabinets", category: "Cabinets", row: "Cabinet Bay", position: "02", capacity: 40, notes: "ThermoVision cabinet makeover", active: true },
    { code: "STOW-BAY-01", zone: "Home Org", category: "STOW", row: "Home Org", position: "01", capacity: 20, notes: "STOW home organization", active: true },
    { code: "TILE-BAY-01", zone: "Tile", category: "Tile", row: "Tile Rack", position: "01", capacity: 80, notes: "MSI tile", active: true },
    { code: "HDW-BAY-01", zone: "Install", category: "Install Supplies", row: "Cage", position: "01", capacity: 120, notes: "Tape, screws, hardware", active: true },
    { code: "CART-BAY-07", zone: "Outbound", category: "Job Cart", row: "Cart", position: "07", capacity: 20, notes: "Crew/job cart staging", active: true },
    { code: "SHIP-BAY-02", zone: "Outbound", category: "Install Staging", row: "Ship Stage", position: "02", capacity: 25, notes: "Ready for install pickup", active: true },
  ];

  const balances = [
    { sku: "AND-400-DH-3046", location: "WINDOW-RACK-02", quantity: 9, customer: "Morgan", orderNumber: "ORD-24118", lot: "JOB-24118", serial: "OPN-W12", expiration: "" },
    { sku: "SIM-5500-SL-6040", location: "WINDOW-RACK-01", quantity: 4, customer: "Hernandez", orderNumber: "ORD-24121", lot: "JOB-24121", serial: "OPN-W03", expiration: "" },
    { sku: "WINCORE-DOOR-3068-LH", location: "DOOR-RACK-01", quantity: 5, customer: "Morgan", orderNumber: "ORD-24118", lot: "JOB-24118", serial: "OPN-D01", expiration: "" },
    { sku: "THERMATRU-DOOR-2868-RH", location: "DOOR-RACK-02", quantity: 7, customer: "Nguyen", orderNumber: "ORD-24120", lot: "JOB-24120", serial: "OPN-D07", expiration: "" },
    { sku: "ELIAS-REFACE-SHAKER", location: "CABINET-BAY-01", quantity: 18, customer: "Bennett", orderNumber: "ORD-24125", lot: "JOB-24125", serial: "KIT-K01", expiration: "" },
    { sku: "THERMOVISION-REFACE", location: "CABINET-BAY-02", quantity: 12, customer: "Reed", orderNumber: "ORD-24126", lot: "JOB-24126", serial: "KIT-TV02", expiration: "" },
    { sku: "ELIAS-CAB-BASE", location: "CABINET-BAY-01", quantity: 6, customer: "Keller", orderNumber: "ORD-24127", lot: "JOB-24127", serial: "CAB-B01", expiration: "" },
    { sku: "STOW-ORG-TOWER", location: "STOW-BAY-01", quantity: 4, customer: "Miller", orderNumber: "ORD-24128", lot: "JOB-24128", serial: "CLOSET-02", expiration: "" },
    { sku: "MSI-TILE-1224", location: "TILE-RACK-01", quantity: 31, customer: "Walker", orderNumber: "ORD-24129", lot: "JOB-24129", serial: "BATH-01", expiration: "" },
    { sku: "FLASH-TAPE-06", location: "HARDWARE-CAGE", quantity: 22, customer: "Stock", orderNumber: "STOCK", lot: "STOCK", serial: "", expiration: "" },
    { sku: "HARD-SCREW-3IN", location: "HARDWARE-CAGE", quantity: 16, customer: "Stock", orderNumber: "STOCK", lot: "STOCK", serial: "", expiration: "" },
    { sku: "AND-400-DH-3046", location: "STAGE-01", quantity: 2, customer: "Davis", orderNumber: "ORD-24124", lot: "JOB-24124", serial: "OPN-W05", expiration: "" },
  ];

  const transactions = [
    transactionSeed("Receive", "AND-400-DH-3046", 2, "", "STAGE-01", "PO-80422 / JOB-24124", "Good", "Received against job opening tags.", { customer: "Davis", orderNumber: "ORD-24124" }),
    transactionSeed("Move", "WINCORE-DOOR-3068-LH", 3, "STAGE-01", "DOOR-RACK-01", "PO-80398 / JOB-24118", "Good", "Put away after frame and swing check.", { customer: "Morgan", orderNumber: "ORD-24118" }),
    transactionSeed("Check Out", "FLASH-TAPE-06", 6, "HARDWARE-CAGE", "JOB-CART-07", "WO-4421", "Good", "Loaded for install crew."),
    transactionSeed("Cycle Count", "AND-400-DH-3046", 9, "WINDOW-RACK-02", "WINDOW-RACK-02", "COUNT-WINDOW-RACK-02", "Good", "Count confirmed.", { customer: "Morgan", orderNumber: "ORD-24118" }),
  ];

  return {
    products,
    locations,
    bays,
    balances,
    transactions,
    receipts: [],
    exceptions: [
      {
        id: uid("EX"),
        createdAt: minutesAgo(55),
        sku: "THERMATRU-DOOR-2868-RH",
        issueType: "Damaged",
        quantity: 1,
        reference: "PO-80375",
        customer: "Nguyen",
        orderNumber: "ORD-24120",
        notes: "Dent on lower rail. Photo needed before installer pickup.",
        photoName: "",
        status: "Open",
      },
    ],
    pendingAdjustments: [],
    user: "Warehouse User",
  };
}

function transactionSeed(action, sku, quantity, fromLocation, toLocation, reference, condition, notes, metadata = {}) {
  return {
    id: uid("TX"),
    createdAt: minutesAgo(Math.floor(Math.random() * 340) + 20),
    user: "Warehouse User",
    action,
    sku,
    quantity,
    fromLocation,
    toLocation,
    reference,
    condition,
    notes,
    photoName: "",
    status: "Posted",
    ...metadata,
  };
}

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60000).toISOString();
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved && Array.isArray(saved.products) && Array.isArray(saved.transactions)) {
      return saved;
    }
  } catch (error) {
    console.warn("Could not read saved app state", error);
  }
  const seeded = createSeedState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderNav();
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function icon(name) {
  const paths = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V20h14v-9.5"/><path d="M9 20v-6h6v6"/>',
    scan: '<path d="M4 7V5a1 1 0 0 1 1-1h2"/><path d="M17 4h2a1 1 0 0 1 1 1v2"/><path d="M20 17v2a1 1 0 0 1-1 1h-2"/><path d="M7 20H5a1 1 0 0 1-1-1v-2"/><path d="M7 12h10"/><path d="M8 9v6"/><path d="M12 9v6"/><path d="M16 9v6"/>',
    move: '<path d="M7 7h11l3 4v6h-2"/><path d="M7 17H5V5h10v2"/><path d="M7 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/><path d="M15 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/><path d="M3 9h7"/><path d="M3 12h5"/>',
    checkout: '<path d="M5 20h14"/><path d="M7 20V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14"/><path d="m10 12 2 2 4-5"/>',
    lookup: '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/><path d="M8.5 11h5"/>',
    count: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
    settings: '<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .57V20a2 2 0 1 1-4 0v-.03a1.7 1.7 0 0 0-1-.57 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.57-1H4a2 2 0 1 1 0-4h.03a1.7 1.7 0 0 0 .57-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.57V4a2 2 0 1 1 4 0v.03a1.7 1.7 0 0 0 1 .57 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.35.39.68.57 1H20a2 2 0 1 1 0 4h-.03c-.18.32-.37.65-.57 1Z"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="4"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    alert: '<path d="M10.3 4.2 2.8 17.1A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.9L13.7 4.2a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  };

  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.home}</svg>`;
}

function renderNav() {
  const pending = state.pendingAdjustments.filter((item) => item.status === "Pending").length;
  const openExceptions = state.exceptions.filter((item) => item.status === "Open").length;
  navRoot.innerHTML = navItems
    .map((item) => {
      const count = item.id === "count" ? pending : item.id === "admin" ? openExceptions : 0;
      return `
        <button class="nav-button ${item.id === currentScreen ? "active" : ""}" type="button" data-nav="${item.id}">
          ${icon(item.icon)}
          <span>${escapeHtml(item.label)}</span>
          ${count ? `<em class="nav-count">${count}</em>` : ""}
        </button>
      `;
    })
    .join("");
}

function render() {
  const meta = screenMeta[currentScreen] || screenMeta.receive;
  titleEl.textContent = meta[0];
  subtitleEl.textContent = meta[1];
  localStorage.setItem(SCREEN_KEY, currentScreen);
  renderNav();

  const screens = {
    home: renderHome,
    receive: renderReceive,
    move: renderMove,
    checkout: renderCheckout,
    lookup: renderLookup,
    count: renderCount,
    admin: renderAdmin,
  };
  root.innerHTML = screens[currentScreen] ? screens[currentScreen]() : renderReceive();
  attachImportListener();
  if (currentScreen === "receive") {
    updateReceivePreview();
  }
}

function renderHome() {
  const totalUnits = state.balances.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
  const stockedSkus = new Set(state.balances.filter((row) => row.quantity > 0).map((row) => row.sku)).size;
  const usedLocations = new Set(state.balances.filter((row) => row.quantity > 0).map((row) => row.location)).size;
  const exceptions = state.exceptions.filter((item) => item.status === "Open").length;
  const lowStock = getLowStockProducts();

  return `
    <div class="stack">
      <div class="metric-grid">
        ${metric("On hand units", formatNumber(totalUnits), "Live balance rows")}
        ${metric("Stocked SKUs", stockedSkus, "Products with quantity")}
        ${metric("Active locations", usedLocations, "Bins, staging, carts")}
        ${metric("Open issues", exceptions, "Exceptions to review")}
      </div>

      <div class="quick-grid">
        ${quickAction("receive", "Receive material", "Post windows, doors, trim, or supplies into staging.", "scan")}
        ${quickAction("move", "Move inventory", "Transfer between locations.", "move")}
        ${quickAction("checkout", "Check out stock", "Issue to a job or department.", "checkout")}
        ${quickAction("lookup", "Lookup bin", "Scan a location or SKU.", "lookup")}
      </div>

      <div class="layout-grid">
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>Recent transactions</h2>
              <p>Most recent posted warehouse movements.</p>
            </div>
          </div>
          <div class="panel-body table-wrap">
            ${transactionsTable(state.transactions.slice(0, 8))}
          </div>
        </section>
        <aside class="stack">
          <section class="panel">
            <div class="panel-header">
              <div>
                <h2>Low stock watch</h2>
                <p>Products at or below minimum quantity.</p>
              </div>
            </div>
            <div class="panel-body">
              ${lowStock.length ? lowStock.map((item) => summaryRow(item.sku, `${formatNumber(item.qty)} on hand`, item.description)).join("") : emptyState("No low stock items.")}
            </div>
          </section>
          <section class="panel">
            <div class="panel-header">
              <div>
                <h2>Open exceptions</h2>
                <p>Damage, shortage, and overage records.</p>
              </div>
            </div>
            <div class="panel-body">
              ${renderExceptionRows(4)}
            </div>
          </section>
        </aside>
      </div>
    </div>
  `;
}

function renderReceive() {
  const recentReceive = state.transactions.filter((tx) => tx.action === "Receive").slice(0, 6);

  return `
    ${datalists()}
    <div class="layout-grid">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2>Receive installation product</h2>
            <p>Scan the item tag and receiving rack before posting.</p>
          </div>
          <span class="status-chip active">Staging default: STAGE-01</span>
        </div>
        <div class="panel-body">
          <form data-form="receive" autocomplete="off">
            <div class="form-grid">
              ${scanField("Item SKU, order tag, or barcode", "sku", "receive-sku", "product-list", draft.receive.sku || "", "Scan item")}
              ${scanField("Receiving rack or staging location", "location", "receive-location", "location-list", draft.receive.location || "STAGE-01", "Scan location")}
              ${textField("Quantity", "quantity", "receive-quantity", draft.receive.quantity || "", "number", "1")}
              ${textField("PO, order, or reference", "reference", "receive-reference", draft.receive.reference || "", "text", "PO-80422")}
              ${textField("Customer", "customer", "receive-customer", draft.receive.customer || "", "text", "Davis")}
              ${textField("Order #", "orderNumber", "receive-order", draft.receive.orderNumber || "", "text", "ORD-24124")}
              ${textField("Vendor label / barcode", "labelCode", "receive-label-code", draft.receive.labelCode || "", "text", "Vendor barcode or label ID")}
              ${textField("Job or project", "lot", "receive-lot", draft.receive.lot || "", "text", "JOB-24124")}
              ${textField("Opening, room, or unit tag", "serial", "receive-serial", draft.receive.serial || "", "text", "OPN-W05")}
              ${textField("Needed by date", "expiration", "receive-expiration", draft.receive.expiration || "", "date", "")}
              ${selectField("Condition", "condition", "receive-condition", ["Good", "Damaged", "Short", "Overage", "Wrong item"], draft.receive.condition || "Good")}
              <div class="field wide">
                <label for="receive-photo">Photo</label>
                <input id="receive-photo" name="photo" type="file" accept="image/*" capture="environment" />
              </div>
              <div class="field wide">
                <label for="receive-notes">Notes</label>
                <textarea id="receive-notes" name="notes" placeholder="Packing slip notes, frame/glass damage, missing screen/hardware, carrier notes">${escapeHtml(draft.receive.notes || "")}</textarea>
              </div>
            </div>
            <div class="button-row">
              <button class="primary-button" type="submit">${icon("check")} Post receive</button>
              <button class="secondary-button" type="button" data-action="clear-form" data-form-target="receive">Clear</button>
            </div>
          </form>
        </div>
      </section>

      <aside class="stack">
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>Label intake</h2>
              <p>Scan barcode values or parse copied label text.</p>
            </div>
          </div>
          <div class="panel-body">
            <div class="field">
              <label for="label-text">Label text</label>
              <div class="scan-input">
                <textarea id="label-text" placeholder="Paste label OCR text, vendor order text, or scanned barcode value"></textarea>
                <button class="icon-button" type="button" aria-label="Scan label barcode" title="Scan label barcode" data-action="open-scanner" data-target="label-text" data-label="label barcode">
                  ${icon("camera")}
                </button>
              </div>
            </div>
            <div class="field" style="margin-top:14px">
              <label for="label-photo">Label photo</label>
              <input id="label-photo" type="file" accept="image/*" capture="environment" />
            </div>
            <div class="button-row">
              <button class="secondary-button" type="button" data-action="parse-label">Parse label</button>
              <button class="ghost-button" type="button" data-action="clear-label">Clear label</button>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>Transaction preview</h2>
              <p>Review before posting to on hand.</p>
            </div>
          </div>
          <div class="panel-body preview-panel" id="receive-preview"></div>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>Inventory summary</h2>
              <p>Current product balance by location.</p>
            </div>
          </div>
          <div class="panel-body" id="receive-summary">
            ${renderReceiveSummary(draft.receive.sku)}
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>Recent receiving</h2>
              <p>Latest posted receipts.</p>
            </div>
          </div>
          <div class="panel-body table-wrap">
            ${transactionsTable(recentReceive)}
          </div>
        </section>
      </aside>
    </div>
  `;
}

function renderMove() {
  return `
    ${datalists()}
    <div class="layout-grid">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2>Move inventory</h2>
            <p>Transfer product between locations and keep the audit trail.</p>
          </div>
        </div>
        <div class="panel-body">
          <form data-form="move" autocomplete="off">
            <div class="form-grid">
              ${scanField("Product SKU or barcode", "sku", "move-sku", "product-list", draft.move.sku || "", "Scan product")}
              ${scanField("From location", "fromLocation", "move-from", "location-list", draft.move.fromLocation || "", "Scan from")}
              ${scanField("To location", "toLocation", "move-to", "location-list", draft.move.toLocation || "", "Scan to")}
              ${textField("Quantity", "quantity", "move-quantity", draft.move.quantity || "", "number", "1")}
              ${textField("Reference", "reference", "move-reference", draft.move.reference || "", "text", "Putaway, transfer, cart")}
              ${textField("Customer", "customer", "move-customer", draft.move.customer || "", "text", "Customer name")}
              ${textField("Order #", "orderNumber", "move-order", draft.move.orderNumber || "", "text", "ORD-24124")}
              ${textField("Job or project", "lot", "move-lot", draft.move.lot || "", "text", "JOB-24124")}
              ${textField("Opening, room, or unit tag", "serial", "move-serial", draft.move.serial || "", "text", "OPN-W05")}
              <div class="field wide">
                <label for="move-notes">Notes</label>
                <textarea id="move-notes" name="notes" placeholder="Optional movement notes">${escapeHtml(draft.move.notes || "")}</textarea>
              </div>
            </div>
            <div class="button-row">
              <button class="primary-button" type="submit">${icon("move")} Post move</button>
              <button class="secondary-button" type="button" data-action="clear-form" data-form-target="move">Clear</button>
            </div>
          </form>
        </div>
      </section>
      <aside class="stack">
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>Available stock</h2>
              <p>Balances for the selected SKU.</p>
            </div>
          </div>
          <div class="panel-body" id="move-summary">
            ${renderReceiveSummary(draft.move.sku)}
          </div>
        </section>
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>Last moves</h2>
              <p>Recent transfer transactions.</p>
            </div>
          </div>
          <div class="panel-body table-wrap">
            ${transactionsTable(state.transactions.filter((tx) => tx.action === "Move").slice(0, 6))}
          </div>
        </section>
      </aside>
    </div>
  `;
}

function renderCheckout() {
  const mode = draft.checkout.mode || "issue";
  const isReturn = mode === "return";
  return `
    ${datalists()}
    <div class="layout-grid">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2>${isReturn ? "Return product" : "Check out product"}</h2>
            <p>${isReturn ? "Add material back to a warehouse location." : "Issue stock to a job, department, cart, or truck."}</p>
          </div>
          <div class="segmented" role="group" aria-label="Checkout mode">
            <button class="segment ${mode === "issue" ? "active" : ""}" type="button" data-action="checkout-mode" data-mode="issue">Issue</button>
            <button class="segment ${mode === "return" ? "active" : ""}" type="button" data-action="checkout-mode" data-mode="return">Return</button>
          </div>
        </div>
        <div class="panel-body">
          <form data-form="checkout" autocomplete="off">
            <input type="hidden" name="mode" value="${escapeHtml(mode)}" />
            <div class="form-grid">
              ${scanField("Product SKU or barcode", "sku", "checkout-sku", "product-list", draft.checkout.sku || "", "Scan product")}
              ${scanField(isReturn ? "Return location" : "Current location", "location", "checkout-location", "location-list", draft.checkout.location || "", "Scan location")}
              ${textField("Quantity", "quantity", "checkout-quantity", draft.checkout.quantity || "", "number", "1")}
              ${textField(isReturn ? "Original job, crew, or cart" : "Install crew, job cart, truck, or person", "destination", "checkout-destination", draft.checkout.destination || "", "text", isReturn ? "JOB-CART-07" : "JOB-CART-07")}
              ${textField("Reference", "reference", "checkout-reference", draft.checkout.reference || "", "text", "Work order, issue, return")}
              ${textField("Customer", "customer", "checkout-customer", draft.checkout.customer || "", "text", "Customer name")}
              ${textField("Order #", "orderNumber", "checkout-order", draft.checkout.orderNumber || "", "text", "ORD-24124")}
              ${textField("Job or project", "lot", "checkout-lot", draft.checkout.lot || "", "text", "JOB-24124")}
              ${textField("Opening, room, or unit tag", "serial", "checkout-serial", draft.checkout.serial || "", "text", "OPN-W05")}
              ${selectField("Condition", "condition", "checkout-condition", ["Good", "Damaged", "Inspection"], draft.checkout.condition || "Good")}
              <div class="field wide">
                <label for="checkout-notes">Notes</label>
                <textarea id="checkout-notes" name="notes" placeholder="Optional issue or return notes">${escapeHtml(draft.checkout.notes || "")}</textarea>
              </div>
            </div>
            <div class="button-row">
              <button class="primary-button" type="submit">${icon(isReturn ? "check" : "checkout")} ${isReturn ? "Post return" : "Post check out"}</button>
              <button class="secondary-button" type="button" data-action="clear-form" data-form-target="checkout">Clear</button>
            </div>
          </form>
        </div>
      </section>
      <aside class="stack">
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>Selected SKU balance</h2>
              <p>Use this to confirm quantity before issuing.</p>
            </div>
          </div>
          <div class="panel-body" id="checkout-summary">
            ${renderReceiveSummary(draft.checkout.sku)}
          </div>
        </section>
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>Recent issues and returns</h2>
              <p>Outbound and return transactions.</p>
            </div>
          </div>
          <div class="panel-body table-wrap">
            ${transactionsTable(state.transactions.filter((tx) => ["Check Out", "Return"].includes(tx.action)).slice(0, 6))}
          </div>
        </section>
      </aside>
    </div>
  `;
}

function renderLookup() {
  const mode = draft.lookup.mode || "product";
  const query = draft.lookup.query || "";
  return `
    ${datalists()}
    <div class="stack">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2>Lookup ${mode === "product" ? "product" : mode === "location" ? "location" : "customer/order"}</h2>
            <p>Scan or type a SKU, location, BAT, bay, customer, or order number.</p>
          </div>
          <div class="segmented" role="group" aria-label="Lookup mode">
            <button class="segment ${mode === "product" ? "active" : ""}" type="button" data-action="lookup-mode" data-mode="product">Product</button>
            <button class="segment ${mode === "location" ? "active" : ""}" type="button" data-action="lookup-mode" data-mode="location">Location</button>
            <button class="segment ${mode === "order" ? "active" : ""}" type="button" data-action="lookup-mode" data-mode="order">Customer/Order</button>
          </div>
        </div>
        <div class="panel-body">
          <form data-form="lookup" autocomplete="off">
            <div class="form-grid">
              ${scanField(mode === "product" ? "Product SKU or barcode" : mode === "location" ? "Location ID, BAT, bay, or QR" : "Customer or order #", "query", "lookup-query", mode === "product" ? "product-list" : mode === "location" ? "location-list" : "order-list", query, mode === "product" ? "Scan product" : mode === "location" ? "Scan location" : "Scan order")}
            </div>
            <div class="button-row">
              <button class="primary-button" type="submit">${icon("lookup")} Lookup</button>
              <button class="secondary-button" type="button" data-action="clear-lookup">Clear</button>
            </div>
          </form>
        </div>
      </section>
      <div id="lookup-results">
        ${mode === "product" ? productLookupResults(query) : mode === "location" ? locationLookupResults(query) : orderLookupResults(query)}
      </div>
    </div>
  `;
}

function renderCount() {
  const pending = state.pendingAdjustments.filter((item) => item.status === "Pending");
  return `
    ${datalists()}
    <div class="layout-grid">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2>Cycle count</h2>
            <p>Count a SKU in a location and create an adjustment request when needed.</p>
          </div>
        </div>
        <div class="panel-body">
          <form data-form="count" autocomplete="off">
            <div class="form-grid">
              ${scanField("Location", "location", "count-location", "location-list", draft.count.location || "", "Scan location")}
              ${scanField("Product SKU or barcode", "sku", "count-sku", "product-list", draft.count.sku || "", "Scan product")}
              ${textField("Counted quantity", "counted", "count-counted", draft.count.counted || "", "number", "0")}
              ${textField("Reference", "reference", "count-reference", draft.count.reference || "", "text", "Cycle count batch")}
              ${textField("Customer", "customer", "count-customer", draft.count.customer || "", "text", "Customer name")}
              ${textField("Order #", "orderNumber", "count-order", draft.count.orderNumber || "", "text", "ORD-24124")}
              ${textField("Job or project", "lot", "count-lot", draft.count.lot || "", "text", "JOB-24124")}
              ${textField("Opening, room, or unit tag", "serial", "count-serial", draft.count.serial || "", "text", "OPN-W05")}
              <div class="field wide">
                <label for="count-notes">Notes</label>
                <textarea id="count-notes" name="notes" placeholder="Optional count notes">${escapeHtml(draft.count.notes || "")}</textarea>
              </div>
            </div>
            <div class="button-row">
              <button class="primary-button" type="submit">${icon("count")} Save count</button>
              <button class="secondary-button" type="button" data-action="clear-form" data-form-target="count">Clear</button>
            </div>
          </form>
        </div>
      </section>
      <aside class="stack">
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>Pending adjustments</h2>
              <p>Supervisor approval queue.</p>
            </div>
          </div>
          <div class="panel-body">
            ${pending.length ? pending.map(adjustmentRow).join("") : emptyState("No pending adjustments.")}
          </div>
        </section>
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>Recent counts</h2>
              <p>Cycle count transactions.</p>
            </div>
          </div>
          <div class="panel-body table-wrap">
            ${transactionsTable(state.transactions.filter((tx) => ["Cycle Count", "Adjustment"].includes(tx.action)).slice(0, 6))}
          </div>
        </section>
      </aside>
    </div>
  `;
}

function renderAdmin() {
  return `
    ${datalists()}
    <div class="stack">
      <div class="layout-grid">
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>Add product</h2>
              <p>Create or update a product master row for the pilot.</p>
            </div>
          </div>
          <div class="panel-body">
            <form data-form="product" autocomplete="off">
              <div class="form-grid">
                ${textField("SKU", "sku", "product-sku", "", "text", "SKU-10300")}
                ${textField("Barcode or QR value", "barcode", "product-barcode", "", "text", "SKU10300")}
                ${textField("Description", "description", "product-description", "", "text", "Product description")}
                ${textField("Product line", "category", "product-category", "", "text", "Window, Door, Cabinet, Tile")}
                ${textField("Manufacturer", "vendor", "product-vendor", "", "text", "Andersen, Simonton, MSI")}
                ${textField("Model / series", "model", "product-model", "", "text", "5200-PW P")}
                ${textField("Size", "size", "product-size", "", "text", "30 x 46, custom, 12 x 24")}
                ${textField("Finish/color", "finish", "product-finish", "", "text", "White, bronze, customer selection")}
                ${textField("Hand/swing", "hand", "product-hand", "", "text", "LH inswing")}
                ${textField("UOM", "uom", "product-uom", "EA", "text", "EA")}
                ${scanField("Default location", "defaultLocation", "product-default-location", "location-list", "", "Scan location")}
                ${textField("Minimum quantity", "minQty", "product-min", "0", "number", "0")}
              </div>
              <div class="button-row">
                <button class="primary-button" type="submit">${icon("plus")} Save product</button>
              </div>
            </form>
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>Add location</h2>
              <p>Create or update a warehouse location row.</p>
            </div>
          </div>
          <div class="panel-body">
            <form data-form="location" autocomplete="off">
              <div class="form-grid">
                ${textField("Location ID", "id", "location-id", "", "text", "A-01-A-01")}
                ${textField("QR value", "barcode", "location-barcode", "", "text", "LOC-A-01-A-01")}
                ${textField("BAT location", "batLocation", "location-bat", "", "text", "BAT-WIN-01")}
                ${listField("Bay location", "bayLocation", "location-bay-location", "bay-list", "", "WIN-BAY-01")}
                ${textField("Zone", "zone", "location-zone", "", "text", "A")}
                ${textField("Aisle", "aisle", "location-aisle", "", "text", "01")}
                ${textField("Bay", "bay", "location-bay", "", "text", "A")}
                ${textField("Shelf", "shelf", "location-shelf", "", "text", "01")}
                ${selectField("Type", "type", "location-type", ["Bin", "Receiving Lane", "Damage Hold", "Window Rack", "Door Rack", "Cabinet Bay", "STOW Bay", "Tile Rack", "Hardware Cage", "Job Cart", "Install Staging", "Return"], "Bin")}
              </div>
              <div class="button-row">
                <button class="primary-button" type="submit">${icon("plus")} Save location</button>
              </div>
            </form>
          </div>
        </section>
      </div>

      <div class="layout-grid">
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>Add bay</h2>
              <p>Define the warehouse bay layout used by location labels.</p>
            </div>
          </div>
          <div class="panel-body">
            <form data-form="bay" autocomplete="off">
              <div class="form-grid">
                ${textField("Bay code", "code", "bay-code", "", "text", "WIN-BAY-03")}
                ${textField("Zone", "zone", "bay-zone", "", "text", "Windows")}
                ${textField("Product group", "category", "bay-category", "", "text", "Windows, Doors, Tile")}
                ${textField("Row or rack", "row", "bay-row", "", "text", "Window Rack")}
                ${textField("Position", "position", "bay-position", "", "text", "03")}
                ${textField("Capacity", "capacity", "bay-capacity", "0", "number", "0")}
                <div class="field wide">
                  <label for="bay-notes">Notes</label>
                  <textarea id="bay-notes" name="notes" placeholder="Bay use, constraints, or layout notes"></textarea>
                </div>
              </div>
              <div class="button-row">
                <button class="primary-button" type="submit">${icon("plus")} Save bay</button>
              </div>
            </form>
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>Bay layout</h2>
              <p>Defined bays available for receiving, lookup, and location setup.</p>
            </div>
          </div>
          <div class="panel-body table-wrap">
            ${baysTable(state.bays || [])}
          </div>
        </section>
      </div>

      <div class="layout-grid">
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>Inventory balances</h2>
              <p>Current on hand by SKU and location.</p>
            </div>
            <button class="ghost-button" type="button" data-action="export-balances">${icon("download")} CSV</button>
          </div>
          <div class="panel-body table-wrap">
            ${balancesTable(state.balances)}
          </div>
        </section>

        <aside class="stack">
          <section class="panel">
            <div class="panel-header">
              <div>
                <h2>Data tools</h2>
                <p>Export, import, or reset pilot data.</p>
              </div>
            </div>
            <div class="panel-body">
              <div class="button-row" style="margin-top:0">
                <button class="secondary-button" type="button" data-action="export-json">${icon("download")} Export JSON</button>
                <button class="secondary-button" type="button" data-action="import-json">Import JSON</button>
                <button class="danger-button" type="button" data-action="reset-data">Reset sample data</button>
              </div>
              <input class="hidden-file" id="import-json-file" type="file" accept="application/json" />
            </div>
          </section>

          <section class="panel">
            <div class="panel-header">
              <div>
                <h2>Supervisor queue</h2>
                <p>Approve or reject count adjustments.</p>
              </div>
            </div>
            <div class="panel-body">
              ${state.pendingAdjustments.filter((item) => item.status === "Pending").length ? state.pendingAdjustments.filter((item) => item.status === "Pending").map(adjustmentRow).join("") : emptyState("No pending approvals.")}
            </div>
          </section>

          <section class="panel">
            <div class="panel-header">
              <div>
                <h2>Open exceptions</h2>
                <p>Damage, short, and overage issues.</p>
              </div>
            </div>
            <div class="panel-body">
              ${renderExceptionRows(8)}
            </div>
          </section>
        </aside>
      </div>
    </div>
  `;
}

function scanField(label, name, id, listId, value, scanLabel) {
  return `
    <div class="field">
      <label for="${id}">${escapeHtml(label)}</label>
      <div class="scan-input">
        <input id="${id}" name="${name}" list="${listId}" value="${escapeHtml(value)}" placeholder="${escapeHtml(label)}" />
        <button class="icon-button" type="button" aria-label="${escapeHtml(scanLabel)}" title="${escapeHtml(scanLabel)}" data-action="open-scanner" data-target="${id}" data-label="${escapeHtml(label)}">
          ${icon("camera")}
        </button>
      </div>
    </div>
  `;
}

function textField(label, name, id, value, type, placeholder) {
  const step = type === "number" ? ' step="0.01" min="0"' : "";
  return `
    <div class="field">
      <label for="${id}">${escapeHtml(label)}</label>
      <input id="${id}" name="${name}" type="${type}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}"${step} />
    </div>
  `;
}

function listField(label, name, id, listId, value, placeholder) {
  return `
    <div class="field">
      <label for="${id}">${escapeHtml(label)}</label>
      <input id="${id}" name="${name}" list="${listId}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" />
    </div>
  `;
}

function selectField(label, name, id, options, value) {
  return `
    <div class="field">
      <label for="${id}">${escapeHtml(label)}</label>
      <select id="${id}" name="${name}">
        ${options.map((option) => `<option value="${escapeHtml(option)}" ${option === value ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
      </select>
    </div>
  `;
}

function datalists() {
  const orderOptions = Array.from(
    new Set(
      [
        ...state.balances.flatMap((row) => [row.customer, row.orderNumber, row.labelCode, row.lot]),
        ...state.transactions.flatMap((tx) => [tx.customer, tx.orderNumber, tx.labelCode, tx.reference]),
      ]
        .filter(Boolean)
        .map(String),
    ),
  );
  return `
    <datalist id="product-list">
      ${state.products.map((product) => `<option value="${escapeHtml(product.sku)}">${escapeHtml(product.description)}</option><option value="${escapeHtml(product.barcode)}">${escapeHtml(product.sku)}</option><option value="${escapeHtml(product.vendor || "")}">${escapeHtml(product.category || "")}</option>`).join("")}
    </datalist>
    <datalist id="location-list">
      ${state.locations.map((location) => `<option value="${escapeHtml(location.id)}">${escapeHtml(location.type)}</option><option value="${escapeHtml(location.barcode)}">${escapeHtml(location.id)}</option><option value="${escapeHtml(location.batLocation || "")}">${escapeHtml(location.id)}</option><option value="${escapeHtml(location.bayLocation || bayLocationCode(location))}">${escapeHtml(location.id)}</option>`).join("")}
    </datalist>
    <datalist id="bay-list">
      ${(state.bays || []).map((bay) => `<option value="${escapeHtml(bay.code)}">${escapeHtml([bay.zone, bay.category, bay.row, bay.position].filter(Boolean).join(" | "))}</option>`).join("")}
    </datalist>
    <datalist id="order-list">
      ${orderOptions.map((option) => `<option value="${escapeHtml(option)}"></option>`).join("")}
    </datalist>
  `;
}

function metric(label, value, help) {
  return `
    <div class="metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
      <span>${escapeHtml(help)}</span>
    </div>
  `;
}

function quickAction(screen, title, body, iconName) {
  return `
    <button class="quick-action" type="button" data-nav="${screen}">
      ${icon(iconName)}
      <span>
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(body)}</span>
      </span>
    </button>
  `;
}

function summaryRow(label, value, hint) {
  return `
    <div class="summary-row">
      <div>
        <div class="label-sm">${escapeHtml(label)}</div>
        ${hint ? `<div class="desc-cell">${escapeHtml(hint)}</div>` : ""}
      </div>
      <strong>${escapeHtml(String(value))}</strong>
    </div>
  `;
}

function renderReceiveSummary(input) {
  const product = findProduct(input || "");
  if (!product) return emptyState("Select a product to see stock by location.");
  const rows = state.balances.filter((row) => row.sku === product.sku && Number(row.quantity) !== 0);
  if (!rows.length) return emptyState(`${product.sku} has no on hand balance.`);
  return `
    <div class="preview-panel">
      <div class="lookup-row">
        <div>
          <div class="label-sm">${escapeHtml(product.sku)}</div>
          <div class="value-lg">${escapeHtml(product.description)}</div>
        </div>
        <strong>${formatNumber(totalOnHand(product.sku))} ${escapeHtml(product.uom)}</strong>
      </div>
      ${rows.map((row) => summaryRow(locationDisplay(row.location), `${formatNumber(row.quantity)} ${product.uom}`, balanceHint(row))).join("")}
    </div>
  `;
}

function updateReceivePreview() {
  const preview = document.getElementById("receive-preview");
  if (!preview) return;
  const form = document.querySelector('form[data-form="receive"]');
  const values = form ? Object.fromEntries(new FormData(form).entries()) : draft.receive;
  const product = findProduct(values.sku || "");
  const location = findLocation(values.location || "");
  const quantity = toNumber(values.quantity);
  preview.innerHTML = `
    ${previewRow("Action", "Receive")}
    ${previewRow("Product", product ? `${product.sku} - ${product.description}` : values.sku || "Not selected")}
    ${previewRow("Location", location ? locationDisplay(location.id) : values.location || "STAGE-01")}
    ${previewRow("Quantity", quantity ? formatNumber(quantity) : "0")}
    ${previewRow("Customer", values.customer || "None")}
    ${previewRow("Order #", values.orderNumber || "None")}
    ${previewRow("Vendor label", values.labelCode || "None")}
    ${previewRow("Reference", values.reference || "None")}
    ${previewRow("Condition", values.condition || "Good")}
  `;
  const summary = document.getElementById("receive-summary");
  if (summary) summary.innerHTML = renderReceiveSummary(values.sku);
}

function previewRow(label, value) {
  return `
    <div class="preview-row">
      <div class="label-sm">${escapeHtml(label)}</div>
      <strong>${escapeHtml(String(value))}</strong>
    </div>
  `;
}

function transactionsTable(rows) {
  if (!rows.length) return emptyState("No transactions yet.");
  return `
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Action</th>
          <th>SKU</th>
          <th>Qty</th>
          <th>Customer</th>
          <th>Order #</th>
          <th>Vendor Label</th>
          <th>From</th>
          <th>To</th>
          <th>Ref</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (tx) => `
              <tr>
                <td>${escapeHtml(formatDateTime(tx.createdAt))}</td>
                <td><span class="status-chip ${chipClass(tx.condition)}">${escapeHtml(tx.action)}</span></td>
                <td>
                  <div class="sku-cell">${escapeHtml(tx.sku)}</div>
                  <div class="desc-cell">${escapeHtml(getProductDescription(tx.sku))}</div>
                </td>
                <td>${formatNumber(tx.quantity)}</td>
                <td>${escapeHtml(tx.customer || "-")}</td>
                <td>${escapeHtml(tx.orderNumber || "-")}</td>
                <td>${escapeHtml(tx.labelCode || "-")}</td>
                <td>${escapeHtml(locationOrText(tx.fromLocation))}</td>
                <td>${escapeHtml(locationOrText(tx.toLocation))}</td>
                <td>${escapeHtml(tx.reference || "-")}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function balancesTable(rows) {
  if (!rows.length) return emptyState("No inventory balances.");
  return `
    <table>
      <thead>
        <tr>
          <th>SKU</th>
          <th>Description</th>
          <th>Customer</th>
          <th>Order #</th>
          <th>Vendor Label</th>
          <th>Location</th>
          <th>Qty</th>
          <th>Job</th>
          <th>Opening</th>
          <th>Needed</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .slice()
          .sort((a, b) => `${a.sku}-${a.location}`.localeCompare(`${b.sku}-${b.location}`))
          .map(
            (row) => `
              <tr>
                <td class="sku-cell">${escapeHtml(row.sku)}</td>
                <td>${escapeHtml(getProductDescription(row.sku))}</td>
                <td>${escapeHtml(row.customer || "-")}</td>
                <td>${escapeHtml(row.orderNumber || "-")}</td>
                <td>${escapeHtml(row.labelCode || "-")}</td>
                <td>${escapeHtml(locationDisplay(row.location))}</td>
                <td>${formatNumber(row.quantity)}</td>
                <td>${escapeHtml(row.lot || "-")}</td>
                <td>${escapeHtml(row.serial || "-")}</td>
                <td>${escapeHtml(row.expiration || "-")}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function baysTable(rows) {
  if (!rows.length) return emptyState("No bays defined.");
  return `
    <table>
      <thead>
        <tr>
          <th>Bay</th>
          <th>Zone</th>
          <th>Group</th>
          <th>Row</th>
          <th>Position</th>
          <th>Capacity</th>
          <th>Assigned Location</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .slice()
          .sort((a, b) => String(a.code).localeCompare(String(b.code)))
          .map((bay) => {
            const assigned = state.locations.find((location) => normalizeSearch(location.bayLocation || bayLocationCode(location)) === normalizeSearch(bay.code));
            return `
              <tr>
                <td class="sku-cell">${escapeHtml(bay.code)}</td>
                <td>${escapeHtml(bay.zone || "-")}</td>
                <td>${escapeHtml(bay.category || "-")}</td>
                <td>${escapeHtml(bay.row || "-")}</td>
                <td>${escapeHtml(bay.position || "-")}</td>
                <td>${formatNumber(bay.capacity || 0)}</td>
                <td>${escapeHtml(assigned?.id || "-")}</td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

function renderExceptionRows(limit) {
  const open = state.exceptions.filter((item) => item.status === "Open").slice(0, limit);
  if (!open.length) return emptyState("No open exceptions.");
  return open
    .map(
      (item) => `
        <div class="lookup-row">
          <div>
            <div class="label-sm">${escapeHtml(item.issueType)} | ${escapeHtml(item.orderNumber || item.reference || "No order")}</div>
            <div class="value-lg">${escapeHtml(item.sku)} <span class="desc-cell">qty ${formatNumber(item.quantity)}</span></div>
            <div class="desc-cell">${escapeHtml([item.customer, item.notes || "No notes"].filter(Boolean).join(" | "))}</div>
          </div>
          <span class="status-chip ${chipClass(item.issueType)}">${escapeHtml(item.status)}</span>
        </div>
      `,
    )
    .join("");
}

function adjustmentRow(item) {
  return `
    <div class="lookup-row">
      <div>
        <div class="label-sm">${escapeHtml(locationDisplay(item.location))} | ${escapeHtml(formatDateTime(item.createdAt))}</div>
        <div class="value-lg">${escapeHtml(item.sku)} <span class="desc-cell">delta ${formatSigned(item.delta)}</span></div>
        <div class="desc-cell">${escapeHtml([item.customer, item.orderNumber, item.lot, item.serial].filter(Boolean).join(" | "))}</div>
        <div class="desc-cell">System ${formatNumber(item.systemQty)} counted ${formatNumber(item.countedQty)}. ${escapeHtml(item.notes || "")}</div>
      </div>
      <div class="button-row" style="margin-top:0; justify-content:flex-end">
        <button class="secondary-button" type="button" data-action="approve-adjustment" data-id="${escapeHtml(item.id)}">Approve</button>
        <button class="ghost-button" type="button" data-action="reject-adjustment" data-id="${escapeHtml(item.id)}">Reject</button>
      </div>
    </div>
  `;
}

function productLookupResults(query) {
  if (!query) return emptyPanel("Product results", "Scan or type a product SKU or barcode.");
  const product = findProduct(query);
  if (!product) return emptyPanel("Product results", `No product found for ${query}.`);
  const rows = state.balances.filter((row) => row.sku === product.sku && Number(row.quantity) !== 0);
  const recent = state.transactions.filter((tx) => tx.sku === product.sku).slice(0, 8);
  return `
    <div class="layout-grid">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2>${escapeHtml(product.sku)}</h2>
            <p>${escapeHtml(product.description)}</p>
          </div>
          <strong>${formatNumber(totalOnHand(product.sku))} ${escapeHtml(product.uom)}</strong>
        </div>
        <div class="panel-body">
          ${rows.length ? rows.map((row) => summaryRow(locationDisplay(row.location), `${formatNumber(row.quantity)} ${product.uom}`, balanceHint(row))).join("") : emptyState("No on hand balance.")}
        </div>
      </section>
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2>Recent product activity</h2>
            <p>Receipts, moves, counts, issues, and returns.</p>
          </div>
        </div>
        <div class="panel-body table-wrap">
          ${transactionsTable(recent)}
        </div>
      </section>
    </div>
  `;
}

function orderLookupResults(query) {
  if (!query) return emptyPanel("Customer/order results", "Scan or type a customer name, order number, job, opening tag, or reference.");
  const key = normalizeSearch(query);
  const rows = state.balances.filter((row) =>
    [row.customer, row.orderNumber, row.labelCode, row.lot, row.serial, row.location, row.sku].some((value) => normalizeSearch(value).includes(key)),
  );
  const recent = state.transactions
    .filter((tx) => [tx.customer, tx.orderNumber, tx.labelCode, tx.reference, tx.notes, tx.sku, tx.fromLocation, tx.toLocation].some((value) => normalizeSearch(value).includes(key)))
    .slice(0, 10);
  if (!rows.length && !recent.length) return emptyPanel("Customer/order results", `No material found for ${query}.`);

  return `
    <div class="layout-grid">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2>${escapeHtml(query)}</h2>
            <p>Material currently on hand for this customer, order, job, or opening.</p>
          </div>
          <strong>${formatNumber(rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0))} units</strong>
        </div>
        <div class="panel-body">
          ${rows.length ? rows.map((row) => summaryRow(`${row.sku} @ ${locationDisplay(row.location)}`, `${formatNumber(row.quantity)} ${getProduct(row.sku)?.uom || ""}`, `${getProductDescription(row.sku)} | ${balanceHint(row)}`)).join("") : emptyState("No current on hand rows match this value.")}
        </div>
      </section>
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2>Customer/order activity</h2>
            <p>Recent transactions for matching material.</p>
          </div>
        </div>
        <div class="panel-body table-wrap">
          ${transactionsTable(recent)}
        </div>
      </section>
    </div>
  `;
}

function locationLookupResults(query) {
  if (!query) return emptyPanel("Location results", "Scan or type a location ID, BAT, bay, or QR value.");
  const location = findLocation(query);
  if (!location) {
    const bay = findBay(query);
    if (bay) return bayLookupResults(bay);
    return emptyPanel("Location results", `No location or bay found for ${query}.`);
  }
  const rows = state.balances.filter((row) => row.location === location.id && Number(row.quantity) !== 0);
  const recent = state.transactions.filter((tx) => tx.fromLocation === location.id || tx.toLocation === location.id).slice(0, 8);
  return `
    <div class="layout-grid">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2>${escapeHtml(location.id)}</h2>
            <p>${escapeHtml([location.zone, location.type, location.batLocation, location.bayLocation || bayLocationCode(location)].filter(Boolean).join(" | "))}</p>
          </div>
          <span class="status-chip active">${escapeHtml(location.active ? "Active" : "Inactive")}</span>
        </div>
        <div class="panel-body">
          ${rows.length ? rows.map((row) => summaryRow(row.sku, `${formatNumber(row.quantity)} ${getProduct(row.sku)?.uom || ""}`, `${getProductDescription(row.sku)} | ${balanceHint(row)}`)).join("") : emptyState("This location is empty.")}
        </div>
      </section>
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2>Recent location activity</h2>
            <p>Transactions into and out of this location.</p>
          </div>
        </div>
        <div class="panel-body table-wrap">
          ${transactionsTable(recent)}
        </div>
      </section>
    </div>
  `;
}

function bayLookupResults(bay) {
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2>${escapeHtml(bay.code)}</h2>
          <p>${escapeHtml([bay.zone, bay.category, bay.row, bay.position].filter(Boolean).join(" | "))}</p>
        </div>
        <span class="status-chip ${bay.active ? "active" : ""}">${escapeHtml(bay.active ? "Active bay" : "Inactive bay")}</span>
      </div>
      <div class="panel-body">
        ${summaryRow("Capacity", formatNumber(bay.capacity || 0), bay.notes || "")}
        ${summaryRow("Assigned location", findLocationByBay(bay.code)?.id || "Not assigned", "Assign this bay to a location in Admin before receiving inventory to it.")}
      </div>
    </section>
  `;
}

function emptyPanel(title, message) {
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(message)}</p>
        </div>
      </div>
      <div class="panel-body">
        ${emptyState(message)}
      </div>
    </section>
  `;
}

function emptyState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function handleSubmit(event) {
  const form = event.target.closest("form[data-form]");
  if (!form) return;
  event.preventDefault();
  const name = form.dataset.form;
  const handlers = {
    receive: submitReceive,
    move: submitMove,
    checkout: submitCheckout,
    lookup: submitLookup,
    count: submitCount,
    product: submitProduct,
    location: submitLocation,
    bay: submitBay,
  };
  handlers[name]?.(form);
}

function submitReceive(form) {
  const values = readForm(form);
  const product = requireProduct(values.sku);
  if (!product) return;
  const location = requireLocation(values.location || "STAGE-01");
  if (!location) return;
  const quantity = requireQuantity(values.quantity);
  if (!quantity) return;

  adjustBalance(product.sku, location.id, quantity, values);
  const photoName = getFileName(form, "photo");
  const tx = addTransaction({
    action: "Receive",
    sku: product.sku,
    quantity,
    fromLocation: "",
    toLocation: location.id,
    reference: values.reference,
    customer: values.customer,
    orderNumber: values.orderNumber,
    labelCode: values.labelCode,
    lot: values.lot,
    serial: values.serial,
    expiration: values.expiration,
    condition: values.condition || "Good",
    notes: values.notes,
    photoName,
  });

  state.receipts.unshift({
    id: uid("RCV"),
    transactionId: tx.id,
    createdAt: tx.createdAt,
    sku: product.sku,
    location: location.id,
    quantity,
    reference: values.reference,
    customer: values.customer,
    orderNumber: values.orderNumber,
    labelCode: values.labelCode,
    condition: values.condition || "Good",
    lot: values.lot || "",
    serial: values.serial || "",
    expiration: values.expiration || "",
    photoName,
  });

  if (["Damaged", "Short", "Overage", "Wrong item"].includes(values.condition)) {
    state.exceptions.unshift({
      id: uid("EX"),
      createdAt: new Date().toISOString(),
      sku: product.sku,
      issueType: values.condition,
      quantity,
      reference: values.reference,
      customer: values.customer,
      orderNumber: values.orderNumber,
      labelCode: values.labelCode,
      notes: values.notes,
      photoName,
      status: "Open",
    });
  }

  saveState();
  clearDraft("receive", { condition: "Good", location: "STAGE-01" });
  showToast(`Received ${formatNumber(quantity)} ${product.uom} of ${product.sku}.`);
  render();
}

function submitMove(form) {
  const values = readForm(form);
  const product = requireProduct(values.sku);
  if (!product) return;
  const from = requireLocation(values.fromLocation, "from location");
  if (!from) return;
  const to = requireLocation(values.toLocation, "to location");
  if (!to) return;
  if (from.id === to.id) {
    showToast("From and to locations must be different.", "error");
    return;
  }
  const quantity = requireQuantity(values.quantity);
  if (!quantity) return;
  const available = quantityAt(product.sku, from.id, values);
  if (available < quantity) {
    showToast(`Only ${formatNumber(available)} ${product.uom} available in ${from.id} for that customer/order filter.`, "error");
    return;
  }

  const usedMeta = adjustBalance(product.sku, from.id, -quantity, values);
  if (!usedMeta) {
    showToast("Could not find a matching balance row to move. Add customer/order/opening details or reduce quantity.", "error");
    return;
  }
  const txMeta = { ...values, ...usedMeta };
  adjustBalance(product.sku, to.id, quantity, txMeta);
  addTransaction({
    action: "Move",
    sku: product.sku,
    quantity,
    fromLocation: from.id,
    toLocation: to.id,
    reference: values.reference,
    customer: txMeta.customer,
    orderNumber: txMeta.orderNumber,
    labelCode: txMeta.labelCode,
    lot: txMeta.lot,
    serial: txMeta.serial,
    expiration: txMeta.expiration,
    condition: "Good",
    notes: values.notes,
  });
  saveState();
  clearDraft("move");
  showToast(`Moved ${formatNumber(quantity)} ${product.sku} to ${to.id}.`);
  render();
}

function submitCheckout(form) {
  const values = readForm(form);
  const product = requireProduct(values.sku);
  if (!product) return;
  const location = requireLocation(values.location);
  if (!location) return;
  const quantity = requireQuantity(values.quantity);
  if (!quantity) return;
  const mode = values.mode || draft.checkout.mode || "issue";
  const destination = values.destination || (mode === "issue" ? "Unassigned" : "Return");

  if (mode === "issue") {
    const available = quantityAt(product.sku, location.id, values);
    if (available < quantity) {
      showToast(`Only ${formatNumber(available)} ${product.uom} available in ${location.id} for that customer/order filter.`, "error");
      return;
    }
    const usedMeta = adjustBalance(product.sku, location.id, -quantity, values);
    if (!usedMeta) {
      showToast("Could not find a matching balance row to check out. Add customer/order/opening details or reduce quantity.", "error");
      return;
    }
    addTransaction({
      action: "Check Out",
      sku: product.sku,
      quantity,
      fromLocation: location.id,
      toLocation: destination,
      reference: values.reference,
      customer: usedMeta.customer || values.customer,
      orderNumber: usedMeta.orderNumber || values.orderNumber,
      labelCode: usedMeta.labelCode || values.labelCode,
      lot: usedMeta.lot || values.lot,
      serial: usedMeta.serial || values.serial,
      expiration: usedMeta.expiration || values.expiration,
      condition: values.condition || "Good",
      notes: values.notes,
    });
  } else {
    adjustBalance(product.sku, location.id, quantity, values);
    addTransaction({
      action: "Return",
      sku: product.sku,
      quantity,
      fromLocation: destination,
      toLocation: location.id,
      reference: values.reference,
      customer: values.customer,
      orderNumber: values.orderNumber,
      labelCode: values.labelCode,
      lot: values.lot,
      serial: values.serial,
      condition: values.condition || "Good",
      notes: values.notes,
    });
  }

  if (["Damaged", "Inspection"].includes(values.condition)) {
    state.exceptions.unshift({
      id: uid("EX"),
      createdAt: new Date().toISOString(),
      sku: product.sku,
      issueType: values.condition,
      quantity,
      reference: values.reference,
      customer: values.customer,
      orderNumber: values.orderNumber,
      labelCode: values.labelCode,
      notes: values.notes,
      photoName: "",
      status: "Open",
    });
  }

  saveState();
  clearDraft("checkout", { mode, condition: "Good" });
  showToast(`${mode === "issue" ? "Checked out" : "Returned"} ${formatNumber(quantity)} ${product.sku}.`);
  render();
}

function submitLookup(form) {
  const values = readForm(form);
  draft.lookup.query = values.query || "";
  render();
}

function submitCount(form) {
  const values = readForm(form);
  const location = requireLocation(values.location);
  if (!location) return;
  const product = requireProduct(values.sku);
  if (!product) return;
  const counted = requireQuantity(values.counted, "counted quantity", true);
  if (counted === null) return;

  const systemQty = quantityAt(product.sku, location.id, values);
  const delta = roundQty(counted - systemQty);
  if (delta === 0) {
    addTransaction({
      action: "Cycle Count",
      sku: product.sku,
      quantity: counted,
      fromLocation: location.id,
      toLocation: location.id,
      reference: values.reference,
      customer: values.customer,
      orderNumber: values.orderNumber,
      labelCode: values.labelCode,
      lot: values.lot,
      serial: values.serial,
      condition: "Good",
      notes: values.notes || "Count confirmed.",
    });
    showToast(`Count confirmed for ${product.sku} in ${location.id}.`);
  } else {
    state.pendingAdjustments.unshift({
      id: uid("ADJ"),
      createdAt: new Date().toISOString(),
      sku: product.sku,
      location: location.id,
      systemQty,
      countedQty: counted,
      delta,
      reference: values.reference,
      customer: values.customer,
      orderNumber: values.orderNumber,
      labelCode: values.labelCode,
      lot: values.lot,
      serial: values.serial,
      notes: values.notes,
      requestedBy: state.user,
      status: "Pending",
    });
    showToast(`Adjustment request created: ${formatSigned(delta)} ${product.uom}.`, "warn");
  }

  saveState();
  clearDraft("count");
  render();
}

function submitProduct(form) {
  const values = readForm(form);
  const sku = normalizeKey(values.sku);
  if (!sku) {
    showToast("SKU is required.", "error");
    return;
  }
  const existing = state.products.find((product) => product.sku === sku);
  const next = {
    sku,
    description: values.description || sku,
    category: values.category || "",
    vendor: values.vendor || "",
    model: values.model || "",
    size: values.size || "",
    finish: values.finish || "",
    hand: values.hand || "",
    uom: (values.uom || "EA").toUpperCase(),
    barcode: values.barcode || sku,
    defaultLocation: normalizeLocation(values.defaultLocation || ""),
    minQty: toNumber(values.minQty),
    active: true,
  };
  if (existing) Object.assign(existing, next);
  else state.products.push(next);
  saveState();
  showToast(`${existing ? "Updated" : "Added"} ${sku}.`);
  form.reset();
  render();
}

function submitLocation(form) {
  const values = readForm(form);
  const id = normalizeLocation(values.id);
  if (!id) {
    showToast("Location ID is required.", "error");
    return;
  }
  const existing = state.locations.find((location) => location.id === id);
  const next = {
    id,
    zone: values.zone || "",
    aisle: values.aisle || "",
    bay: values.bay || "",
    shelf: values.shelf || "",
    bin: values.bin || "",
    barcode: values.barcode || `LOC-${id}`,
    batLocation: normalizeLocation(values.batLocation || ""),
    bayLocation: normalizeLocation(values.bayLocation || ""),
    type: values.type || "Bin",
    active: true,
  };
  if (existing) Object.assign(existing, next);
  else state.locations.push(next);
  saveState();
  showToast(`${existing ? "Updated" : "Added"} ${id}.`);
  form.reset();
  render();
}

function submitBay(form) {
  const values = readForm(form);
  const code = normalizeLocation(values.code);
  if (!code) {
    showToast("Bay code is required.", "error");
    return;
  }
  state.bays = state.bays || [];
  const existing = state.bays.find((bay) => normalizeSearch(bay.code) === normalizeSearch(code));
  const next = {
    code,
    zone: values.zone || "",
    category: values.category || "",
    row: values.row || "",
    position: values.position || "",
    capacity: toNumber(values.capacity),
    notes: values.notes || "",
    active: true,
  };
  if (existing) Object.assign(existing, next);
  else state.bays.push(next);
  saveState();
  showToast(`${existing ? "Updated" : "Added"} ${code}.`);
  form.reset();
  render();
}

function handleClick(event) {
  const navButton = event.target.closest("[data-nav]");
  if (navButton) {
    currentScreen = navButton.dataset.nav;
    document.body.classList.remove("nav-open");
    render();
    return;
  }

  const actionEl = event.target.closest("[data-action]");
  if (!actionEl) return;

  const action = actionEl.dataset.action;
  if (action === "toggle-nav") document.body.classList.toggle("nav-open");
  if (action === "export-transactions") exportTransactions();
  if (action === "export-balances") exportBalances();
  if (action === "export-json") exportJson();
  if (action === "import-json") document.getElementById("import-json-file")?.click();
  if (action === "reset-data") resetData();
  if (action === "parse-label") parseReceiveLabel();
  if (action === "clear-label") clearLabelIntake();
  if (action === "open-scanner") openScanner(actionEl.dataset.target, actionEl.dataset.label);
  if (action === "close-scanner") closeScanner();
  if (action === "checkout-mode") {
    draft.checkout.mode = actionEl.dataset.mode;
    render();
  }
  if (action === "lookup-mode") {
    draft.lookup.mode = actionEl.dataset.mode;
    draft.lookup.query = "";
    render();
  }
  if (action === "clear-lookup") {
    draft.lookup.query = "";
    render();
  }
  if (action === "clear-form") {
    const formName = actionEl.dataset.formTarget;
    clearDraft(formName, formName === "receive" ? { condition: "Good", location: "STAGE-01" } : formName === "checkout" ? { mode: draft.checkout.mode || "issue", condition: "Good" } : {});
    render();
  }
  if (action === "approve-adjustment") approveAdjustment(actionEl.dataset.id);
  if (action === "reject-adjustment") rejectAdjustment(actionEl.dataset.id);
}

function handleInput(event) {
  const form = event.target.closest("form[data-form]");
  if (!form || !event.target.name || event.target.type === "file") return;
  const formName = form.dataset.form;
  draft[formName] = draft[formName] || {};
  draft[formName][event.target.name] = event.target.value;
  if (formName === "receive") updateReceivePreview();
  if (formName === "move") updateSideSummary("move-summary", event.target.name === "sku" ? event.target.value : draft.move.sku);
  if (formName === "checkout") updateSideSummary("checkout-summary", event.target.name === "sku" ? event.target.value : draft.checkout.sku);
}

function handleGlobalSearch(event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  const query = globalSearch.value.trim();
  if (!query) return;
  draft.lookup.mode = findLocation(query) ? "location" : findProduct(query) ? "product" : "order";
  draft.lookup.query = query;
  currentScreen = "lookup";
  render();
}

function parseReceiveLabel() {
  const text = document.getElementById("label-text")?.value || "";
  const photoName = document.getElementById("label-photo")?.files?.[0]?.name || "";
  if (!text.trim() && !photoName) {
    showToast("Add label text, scan a barcode, or capture a label photo first.", "error");
    return;
  }
  const parsed = parseLabelText(text);
  if (photoName && !parsed.notes) parsed.notes = `Label photo: ${photoName}`;
  const applied = applyReceiveParse(parsed);
  if (!applied.length) {
    showToast("No label fields could be parsed. Keep the photo and enter the fields manually.", "warn");
    return;
  }
  showToast(`Filled ${applied.join(", ")} from label.`);
}

function clearLabelIntake() {
  const text = document.getElementById("label-text");
  const photo = document.getElementById("label-photo");
  if (text) text.value = "";
  if (photo) photo.value = "";
  showToast("Label intake cleared.");
}

function parseLabelText(text) {
  const raw = String(text || "");
  const upper = raw.toUpperCase();
  const vendorTag = parseVendorTag(raw);
  if (vendorTag) return vendorTag;
  const standaloneLabelCode = extractVendorLabelCode(raw);
  if (standaloneLabelCode && normalizeSearch(raw).length <= normalizeSearch(standaloneLabelCode).length + 4) {
    const possibleProduct = findProduct(standaloneLabelCode);
    return {
      sku: possibleProduct?.sku || "",
      labelCode: standaloneLabelCode,
      notes: `Vendor label/barcode ${standaloneLabelCode}`,
    };
  }

  const brandMatch = upper.match(/\b(ANDERSEN|SIMONTON|WINCORE|THERMA[\s-]?TRU|THERMATRU|ELIAS|THERMOVISION|STOW|MSI)\b/);
  const brand = brandMatch ? normalizeBrand(brandMatch[1]) : "";
  const category = inferCategory(upper);
  const size = matchFirst(raw, [
    /\b(\d{2,3}\s*[xX]\s*\d{2,3})\b/,
    /\b(\d-\d\s*[xX]\s*\d-\d)\b/,
    /\b(\d+\/?\d*\s*(?:IN|INCH|IN\.)?\s*[xX]\s*\d+\/?\d*\s*(?:IN|INCH|IN\.)?)\b/,
  ]);
  const orderNumber = matchFirst(raw, [
    /\b(?:ORDER|ORD|SO|SALES ORDER|ORDER NO|ORDER #)\s*[:#-]?\s*([A-Z0-9-]{4,})/i,
    /\b(ORD-[A-Z0-9-]+)\b/i,
  ]);
  const reference = matchFirst(raw, [
    /\b(?:PO|P\.O\.|PURCHASE ORDER)\s*[:#-]?\s*([A-Z0-9-]{4,})/i,
    /\b(PO-[A-Z0-9-]+)\b/i,
  ]);
  const customer = matchFirst(raw, [
    /\b(?:CUSTOMER|CUST|NAME|CLIENT)\s*[:#-]?\s*([A-Z][A-Z0-9 .,'&-]{2,40})/i,
    /\b(?:SHIP TO|SOLD TO)\s*[:#-]?\s*([A-Z][A-Z0-9 .,'&-]{2,40})/i,
  ]);
  const opening = matchFirst(raw, [
    /\b(?:OPENING|OPN|ROOM|UNIT|TAG|MARK)\s*[:#-]?\s*([A-Z0-9-]{2,24})/i,
    /\b(OPN-[A-Z0-9-]+)\b/i,
  ]);
  const hand = matchFirst(raw, [/\b((?:LEFT|RIGHT|LH|RH)(?:\s+HAND)?(?:\s+IN\s*SWING|\s+OUT\s*SWING|\s+INSWING|\s+OUTSWING)?)\b/i]);
  const finish = matchFirst(raw, [
    /\b(?:COLOR|COLOUR|FINISH)\s*[:#-]?\s*([A-Z0-9 .,'&-]{2,28})/i,
    /\b(WHITE|BRONZE|BLACK|PRIMED|PAINT GRADE|THERMOFOIL|SMOOTH-STAR)\b/i,
  ]);
  const sku = matchSkuLike(raw);
  const product = findProductFromLabel({ sku, brand, category, size, finish, hand, raw });

  return {
    sku: product?.sku || sku || "",
    customer: cleanParsedCustomer(customer),
    orderNumber: cleanParsedValue(orderNumber),
    reference: cleanParsedValue(reference || orderNumber),
    lot: cleanParsedValue(orderNumber ? orderNumber.replace(/^ORD-/i, "JOB-") : ""),
    serial: cleanParsedValue(opening),
    notes: [brand && `Brand ${brand}`, category && `Type ${category}`, size && `Size ${size}`, hand && `Hand ${hand}`, finish && `Finish ${finish}`]
      .filter(Boolean)
      .join(" | "),
  };
}

function parseVendorTag(raw) {
  const text = String(raw || "");
  const upper = text.toUpperCase();
  const looksLikeVendorTag = /\b(QUOTE|AQ|THD\/|INTERNAL USE ONLY|ILF\d{6,}|FR-\d{1,2}\/\d{1,2}\/\d{2,4})\b/i.test(text);
  if (!looksLikeVendorTag) return null;

  const customer = cleanParsedCustomer(
    matchFirst(text, [
      /\bQuote:\s*([^\r\n]{2,60})/i,
      /\bQuote:\s*[\r\n]+\s*([^\r\n]{2,60})/i,
    ]),
  );
  const labelCode = extractVendorLabelCode(text);
  const possibleProduct = labelCode ? findProduct(labelCode) : null;

  return {
    sku: possibleProduct?.sku || "",
    customer,
    labelCode,
    notes: [labelCode && `Vendor label/barcode ${labelCode}`, upper.includes("THD/") && "Vendor tag format", upper.includes("INTERNAL USE ONLY") && "Internal-use vendor QR present"]
      .filter(Boolean)
      .join(" | "),
  };
}

function extractVendorLabelCode(text) {
  const raw = String(text || "");
  return cleanParsedValue(
    matchFirst(raw, [
      /\*([A-Z0-9_-]{3,}[-_][A-Z0-9_-]{4,})\*/i,
      /\b(\d{3}[_-]\d{4}[,\s-]+\d{5}-\d{3})\b/i,
      /\b(ILF\d{6,})\b/i,
      /\b([A-Z0-9]{2,}[-_][A-Z0-9]{4,}[-_][A-Z0-9]{2,})\b/i,
    ]),
  );
}

function applyReceiveParse(parsed) {
  const mapping = {
    sku: "receive-sku",
    location: "receive-location",
    customer: "receive-customer",
    orderNumber: "receive-order",
    labelCode: "receive-label-code",
    reference: "receive-reference",
    lot: "receive-lot",
    serial: "receive-serial",
    expiration: "receive-expiration",
    notes: "receive-notes",
  };
  const applied = [];
  Object.entries(mapping).forEach(([key, id]) => {
    const value = parsed[key];
    const input = document.getElementById(id);
    if (!input || !value) return;
    if (key === "notes" && input.value) input.value = `${input.value}\n${value}`;
    else input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    const labels = { orderNumber: "order #", labelCode: "vendor label", expiration: "needed by date" };
    applied.push(labels[key] || key);
  });
  updateReceivePreview();
  return applied;
}

function matchFirst(text, patterns) {
  for (const pattern of patterns) {
    const match = String(text || "").match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function normalizeBrand(value) {
  return String(value || "").replace(/\s+/g, "").replace(/THERMATRU/i, "Therma-Tru").replace(/THERMA-?TRU/i, "Therma-Tru").toUpperCase() === "THERMA-TRU"
    ? "Therma-Tru"
    : String(value || "")
        .replace(/THERMA[\s-]?TRU/i, "Therma-Tru")
        .replace(/THERMOVISION/i, "ThermoVision")
        .replace(/\bMSI\b/i, "MSI")
        .replace(/\bSTOW\b/i, "STOW")
        .replace(/\bANDERSEN\b/i, "Andersen")
        .replace(/\bSIMONTON\b/i, "Simonton")
        .replace(/\bWINCORE\b/i, "Wincore")
        .replace(/\bELIAS\b/i, "Elias");
}

function inferCategory(upper) {
  if (/\bWINDOW|DOUBLE[-\s]?HUNG|SLIDING\b/.test(upper)) return "Window";
  if (/\bDOOR|ENTRY|PREHUNG|INSWING|OUTSWING\b/.test(upper)) return "Door";
  if (/\bCABINET|REFACE|MAKEOVER|SHAKER\b/.test(upper)) return "Cabinet";
  if (/\bSTOW|CLOSET|ORGANIZATION|ORG\b/.test(upper)) return "Home Organization";
  if (/\bTILE|PORCELAIN|CERAMIC\b/.test(upper)) return "Tile";
  return "";
}

function matchSkuLike(text) {
  const direct = matchFirst(text, [/\b(?:SKU|ITEM|MODEL|PRODUCT)\s*[:#-]?\s*([A-Z0-9][A-Z0-9-]{3,})/i]);
  if (direct && findProduct(direct)) return findProduct(direct).sku;
  const normalizedText = normalizeProductCode(text);
  const exact = state.products.find(
    (product) =>
      new RegExp(`\\b${escapeRegExp(product.sku)}\\b`, "i").test(text) ||
      new RegExp(`\\b${escapeRegExp(product.barcode)}\\b`, "i").test(text) ||
      (product.model && normalizedText.includes(normalizeProductCode(product.model))),
  );
  return exact?.sku || direct || "";
}

function findProductFromLabel({ sku, brand, category, size, finish, hand, raw }) {
  if (sku) {
    const product = findProduct(sku);
    if (product) return product;
  }
  const candidates = state.products
    .map((product) => {
      let score = 0;
      if (brand && normalizeSearch(product.vendor).includes(normalizeSearch(brand))) score += 5;
      if (category && normalizeSearch(product.category).includes(normalizeSearch(category))) score += 3;
      if (size && normalizeSearch(product.size).replace(/\s+/g, "") === normalizeSearch(size).replace(/\s+/g, "")) score += 3;
      if (finish && normalizeSearch(product.finish).includes(normalizeSearch(finish))) score += 1;
      if (hand && normalizeSearch(product.hand).includes(normalizeSearch(hand))) score += 1;
      if (raw && normalizeSearch(raw).includes(normalizeSearch(product.barcode))) score += 8;
      if (raw && product.model && normalizeProductCode(raw).includes(normalizeProductCode(product.model))) score += 8;
      return { product, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  return candidates[0]?.product || null;
}

function cleanParsedValue(value) {
  return String(value || "")
    .replace(/\s{2,}/g, " ")
    .replace(/[|;]+$/g, "")
    .trim();
}

function cleanParsedCustomer(value) {
  return cleanParsedValue(value).replace(/\s+(ORDER|ORD|SO|AQ|PO|P\.O\.|QUOTE|THD|FR|ILF|OPENING|OPN|ROOM|UNIT|TAG|MARK|SIZE|COLOR|COLOUR|FINISH)\b.*$/i, "").trim();
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function updateSideSummary(id, sku) {
  const node = document.getElementById(id);
  if (node) node.innerHTML = renderReceiveSummary(sku);
}

function approveAdjustment(id) {
  const item = state.pendingAdjustments.find((row) => row.id === id);
  if (!item || item.status !== "Pending") return;
  item.status = "Approved";
  item.approvedAt = new Date().toISOString();
  adjustBalance(item.sku, item.location, item.delta, item);
  addTransaction({
    action: "Adjustment",
    sku: item.sku,
    quantity: item.delta,
    fromLocation: item.location,
    toLocation: item.location,
    reference: item.reference || item.id,
    customer: item.customer,
    orderNumber: item.orderNumber,
    labelCode: item.labelCode,
    lot: item.lot,
    serial: item.serial,
    condition: "Good",
    notes: `Approved count adjustment from ${formatNumber(item.systemQty)} to ${formatNumber(item.countedQty)}. ${item.notes || ""}`,
  });
  saveState();
  showToast(`Approved adjustment ${formatSigned(item.delta)} for ${item.sku}.`);
  render();
}

function rejectAdjustment(id) {
  const item = state.pendingAdjustments.find((row) => row.id === id);
  if (!item || item.status !== "Pending") return;
  item.status = "Rejected";
  item.rejectedAt = new Date().toISOString();
  saveState();
  showToast(`Rejected adjustment for ${item.sku}.`);
  render();
}

function readForm(form) {
  const values = Object.fromEntries(new FormData(form).entries());
  Object.keys(values).forEach((key) => {
    if (typeof values[key] === "string") values[key] = values[key].trim();
  });
  return values;
}

function getFileName(form, name) {
  const input = form.querySelector(`[name="${name}"]`);
  return input?.files?.[0]?.name || "";
}

function requireProduct(value) {
  const product = findProduct(value || "");
  if (!product) {
    showToast("Select a valid product SKU or barcode.", "error");
    return null;
  }
  return product;
}

function requireLocation(value, label = "location") {
  const location = findLocation(value || "");
  if (!location) {
    showToast(`Select a valid ${label}.`, "error");
    return null;
  }
  return location;
}

function requireQuantity(value, label = "quantity", allowZero = false) {
  const quantity = toNumber(value);
  if ((!allowZero && quantity <= 0) || (allowZero && quantity < 0)) {
    showToast(`Enter a valid ${label}.`, "error");
    return allowZero ? null : 0;
  }
  return quantity;
}

function findProduct(value) {
  const key = normalizeSearch(value);
  if (!key) return null;
  const productCode = normalizeProductCode(value);
  return (
    state.products.find((product) =>
      [product.sku, product.barcode, product.model].some((field) => normalizeSearch(field) === key || normalizeProductCode(field) === productCode),
    ) ||
    state.products.find((product) =>
      [product.description, product.vendor, product.category, product.model, product.size, product.finish, product.hand].some((field) => normalizeSearch(field).includes(key)),
    )
  );
}

function getProduct(sku) {
  return state.products.find((product) => product.sku === sku);
}

function getProductDescription(sku) {
  return getProduct(sku)?.description || "Unknown product";
}

function findLocation(value) {
  const key = normalizeSearch(value);
  if (!key) return null;
  return state.locations.find((location) =>
    [location.id, location.barcode, location.batLocation, location.bayLocation, bayLocationCode(location)].some((field) => normalizeSearch(field) === key),
  );
}

function findLocationByBay(value) {
  const key = normalizeSearch(value);
  if (!key) return null;
  return state.locations.find((location) => normalizeSearch(location.bayLocation || bayLocationCode(location)) === key);
}

function findBay(value) {
  const key = normalizeSearch(value);
  if (!key) return null;
  return (state.bays || []).find((bay) => normalizeSearch(bay.code) === key);
}

function bayLocationCode(location) {
  if (!location) return "";
  return [location.zone, location.aisle, location.bay].filter(Boolean).join("-").replace(/\s+/g, "-").toUpperCase();
}

function locationDisplay(value) {
  const location = findLocation(value);
  if (!location) return value || "-";
  return [location.id, location.batLocation, location.bayLocation || bayLocationCode(location)].filter(Boolean).join(" | ");
}

function locationOrText(value) {
  if (!value) return "-";
  return findLocation(value) ? locationDisplay(value) : value;
}

function balanceHint(row) {
  return [row.customer, row.orderNumber, row.labelCode && `Vendor label ${row.labelCode}`, row.lot && `Job ${row.lot}`, row.serial && `Tag ${row.serial}`, row.expiration && `Need ${row.expiration}`]
    .filter(Boolean)
    .join(" | ");
}

function normalizeSearch(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeKey(value) {
  return normalizeSearch(value).replace(/\s+/g, "-");
}

function normalizeLocation(value) {
  return normalizeSearch(value).replace(/\s+/g, "-");
}

function normalizeProductCode(value) {
  return normalizeSearch(value).replace(/[^A-Z0-9]/g, "");
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? roundQty(number) : 0;
}

function roundQty(value) {
  return Math.round(Number(value || 0) * 1000) / 1000;
}

function quantityAt(sku, location, values = {}) {
  const meta = balanceMeta(values);
  return roundQty(
    state.balances
      .filter((row) => row.sku === sku && row.location === location && balanceMatches(row, meta))
      .reduce((sum, row) => sum + Number(row.quantity || 0), 0),
  );
}

function totalOnHand(sku) {
  return roundQty(state.balances.filter((row) => row.sku === sku).reduce((sum, row) => sum + Number(row.quantity || 0), 0));
}

function adjustBalance(sku, location, delta, values = {}) {
  const meta = balanceMeta(values);
  let row = null;
  if (delta < 0) {
    const needed = Math.abs(delta);
    row =
      state.balances.find((balance) => balance.sku === sku && balance.location === location && balanceMatches(balance, meta) && Number(balance.quantity || 0) >= needed) ||
      null;
    if (!row) return null;
  } else {
    row =
      state.balances.find(
        (balance) =>
          balance.sku === sku &&
          balance.location === location &&
          ["customer", "orderNumber", "labelCode", "lot", "serial", "expiration"].every((key) => (balance[key] || "") === (meta[key] || "")),
      ) || null;
  }
  if (!row) {
    row = { sku, location, quantity: 0, ...meta };
    state.balances.push(row);
  }
  row.quantity = roundQty(Number(row.quantity || 0) + delta);
  state.balances = state.balances.filter((balance) => Number(balance.quantity || 0) !== 0);
  return balanceMeta(row);
}

function balanceMeta(values = {}) {
  return {
    customer: values.customer || "",
    orderNumber: values.orderNumber || "",
    labelCode: values.labelCode || "",
    lot: values.lot || "",
    serial: values.serial || "",
    expiration: values.expiration || "",
  };
}

function balanceMatches(row, meta) {
  return ["customer", "orderNumber", "labelCode", "lot", "serial", "expiration"].every((key) => !meta[key] || normalizeSearch(row[key]) === normalizeSearch(meta[key]));
}

function addTransaction(input) {
  const tx = {
    id: uid("TX"),
    createdAt: new Date().toISOString(),
    user: state.user,
    status: "Posted",
    photoName: "",
    notes: "",
    ...input,
  };
  state.transactions.unshift(tx);
  return tx;
}

function getLowStockProducts() {
  return state.products
    .map((product) => ({
      sku: product.sku,
      description: product.description,
      qty: totalOnHand(product.sku),
      minQty: Number(product.minQty || 0),
    }))
    .filter((item) => item.minQty > 0 && item.qty <= item.minQty)
    .sort((a, b) => a.qty - b.qty);
}

function clearDraft(name, defaults = {}) {
  draft[name] = { ...defaults };
}

async function openScanner(targetId, label) {
  closeScanner();
  scanSession = { targetId, stream: null, timer: null, detector: null };
  scanTitle.textContent = `Scan ${label || "code"}`;
  scanHelp.textContent = "Point the camera at a barcode or QR code.";
  scanStatus.textContent = "Starting camera...";
  scanDialog.showModal();

  if (!navigator.mediaDevices?.getUserMedia) {
    scanStatus.textContent = "Camera access is not available here. Use manual entry or a Bluetooth scanner.";
    return;
  }
  if (!("BarcodeDetector" in window)) {
    scanStatus.textContent = "This browser does not expose camera barcode detection. Use manual entry or a keyboard wedge scanner.";
    return;
  }

  try {
    const formats = await window.BarcodeDetector.getSupportedFormats?.();
    const preferred = ["qr_code", "code_128", "code_39", "ean_13", "upc_a", "data_matrix"];
    const supported = Array.isArray(formats) ? preferred.filter((format) => formats.includes(format)) : preferred;
    scanSession.detector = new window.BarcodeDetector({ formats: supported.length ? supported : undefined });
    scanSession.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    scanVideo.srcObject = scanSession.stream;
    await scanVideo.play();
    scanStatus.textContent = "Scanning...";
    scanSession.timer = window.setInterval(detectCode, 420);
  } catch (error) {
    console.error(error);
    scanStatus.textContent = "Camera could not start. Check permissions or use manual entry.";
  }
}

async function detectCode() {
  if (!scanSession?.detector || scanVideo.readyState < 2) return;
  try {
    const codes = await scanSession.detector.detect(scanVideo);
    const value = codes?.[0]?.rawValue;
    if (!value) return;
    const input = document.getElementById(scanSession.targetId);
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
    }
    showToast(`Scanned ${value}.`);
    closeScanner();
  } catch (error) {
    scanStatus.textContent = "Still scanning. Hold the code steady in the frame.";
  }
}

function closeScanner() {
  if (scanSession?.timer) window.clearInterval(scanSession.timer);
  if (scanSession?.stream) scanSession.stream.getTracks().forEach((track) => track.stop());
  scanSession = null;
  scanVideo.srcObject = null;
  if (scanDialog.open) scanDialog.close();
}

function exportTransactions() {
  const rows = [
    [
      "id",
      "createdAt",
      "user",
      "action",
      "sku",
      "description",
      "category",
      "manufacturer",
      "quantity",
      "customer",
      "orderNumber",
      "vendorLabelCode",
      "job",
      "openingTag",
      "fromLocation",
      "toLocation",
      "reference",
      "condition",
      "status",
      "notes",
      "photoName",
    ],
    ...state.transactions.map((tx) => [
      tx.id,
      tx.createdAt,
      tx.user,
      tx.action,
      tx.sku,
      getProductDescription(tx.sku),
      getProduct(tx.sku)?.category || "",
      getProduct(tx.sku)?.vendor || "",
      tx.quantity,
      tx.customer,
      tx.orderNumber,
      tx.labelCode,
      tx.lot,
      tx.serial,
      tx.fromLocation,
      tx.toLocation,
      tx.reference,
      tx.condition,
      tx.status,
      tx.notes,
      tx.photoName,
    ]),
  ];
  downloadFile(`warehouse-transactions-${dateStamp()}.csv`, toCsv(rows), "text/csv");
}

function exportBalances() {
  const rows = [
    ["sku", "description", "category", "manufacturer", "customer", "orderNumber", "vendorLabelCode", "location", "batLocation", "bayLocation", "quantity", "job", "openingTag", "neededBy"],
    ...state.balances.map((row) => {
      const location = findLocation(row.location);
      const product = getProduct(row.sku);
      return [
        row.sku,
        getProductDescription(row.sku),
        product?.category || "",
        product?.vendor || "",
        row.customer,
        row.orderNumber,
        row.labelCode,
        row.location,
        location?.batLocation || "",
        location?.bayLocation || bayLocationCode(location),
        row.quantity,
        row.lot,
        row.serial,
        row.expiration,
      ];
    }),
  ];
  downloadFile(`warehouse-balances-${dateStamp()}.csv`, toCsv(rows), "text/csv");
}

function exportJson() {
  downloadFile(`warehouse-pilot-data-${dateStamp()}.json`, JSON.stringify(state, null, 2), "application/json");
}

function attachImportListener() {
  const file = document.getElementById("import-json-file");
  if (!file || file.dataset.bound) return;
  file.dataset.bound = "true";
  file.addEventListener("change", async () => {
    const selected = file.files?.[0];
    if (!selected) return;
    try {
      const imported = JSON.parse(await selected.text());
      if (!Array.isArray(imported.products) || !Array.isArray(imported.locations) || !Array.isArray(imported.transactions)) {
        throw new Error("Invalid pilot data file");
      }
      state = imported;
      saveState();
      showToast("Imported pilot data.");
      render();
    } catch (error) {
      showToast("Import failed. Use a JSON export from this app.", "error");
    }
  });
}

function resetData() {
  const ok = window.confirm("Reset this device to sample data? This will replace local pilot records.");
  if (!ok) return;
  state = createSeedState();
  saveState();
  showToast("Sample data restored.");
  render();
}

function toCsv(rows) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function showToast(message, tone = "success") {
  window.clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.className = `toast show ${tone === "error" ? "error" : tone === "warn" ? "warn" : ""}`;
  toastTimer = window.setTimeout(() => {
    toastEl.className = "toast";
  }, 3600);
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatNumber(value) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(Number(value || 0));
}

function formatSigned(value) {
  const number = Number(value || 0);
  return `${number > 0 ? "+" : ""}${formatNumber(number)}`;
}

function chipClass(value) {
  const key = String(value || "").toLowerCase();
  if (key.includes("damage")) return "danger";
  if (key.includes("short")) return "short";
  if (key.includes("pending") || key.includes("overage") || key.includes("inspection")) return "warn";
  if (key.includes("good") || key.includes("posted") || key.includes("active")) return "good";
  return "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

document.addEventListener("submit", handleSubmit);
document.addEventListener("click", handleClick);
document.addEventListener("input", handleInput);
globalSearch.addEventListener("keydown", handleGlobalSearch);
scanDialog.addEventListener("cancel", closeScanner);

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./sw.js").catch((error) => console.warn("Service worker registration failed", error));
}

render();
