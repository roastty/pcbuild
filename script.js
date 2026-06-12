/**
 * PC Architect Simulator Engine
 * Features: Dark Theme, Sliding Drawer, Cloud Sync, Tokopedia Links, Stock Cooler, Overclocking
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAk0Ty1REKW99i3c7z3MMjpe8fN_PnKYp8",
    authDomain: "pc-building-project-fa8b6.firebaseapp.com",
    projectId: "pc-building-project-fa8b6"
};

let dbFirestore = null;
try {
    const app = initializeApp(firebaseConfig);
    dbFirestore = getFirestore(app);
} catch (e) { console.error("Firebase init failed:", e); }

let db = { categories: [], items: {} };

const state = {
    currency: 'USD', exchangeRate: 17989.10, searchQuery: '', platform: null, 
    requiredSocket: null, requiredRamType: null, ramQuantity: 2, 
    isOverclocked: false, useStockCooler: false, filters: {},
    activeCategory: null,
    loadout: { cpu: null, cooler: null, mobo: null, ram: null, gpu: null, ssd: [], hdd: [], case_fan: [], psu: null }
};

const MULTI_SLOT_CATEGORIES = ['ssd', 'hdd', 'case_fan'];
const imgFallback = "https://placehold.co/64x64/1c1c1e/86868b?text=No+Image";
const tkpdSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`;

const ICONS = {
    cpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>',
    cooler: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line><line x1="4.93" y1="19.07" x2="19.07" y2="4.93"></line></svg>',
    mobo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>',
    ram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"></path><line x1="6" y1="10" x2="6" y2="14"></line><line x1="10" y1="10" x2="10" y2="14"></line><line x1="14" y1="10" x2="14" y2="14"></line><line x1="18" y1="10" x2="18" y2="14"></line></svg>',
    gpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
    ssd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12H2"></path><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path><line x1="6" y1="16" x2="6.01" y2="16"></line><line x1="10" y1="16" x2="10.01" y2="16"></line></svg>',
    hdd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>',
    case_fan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.827 16.379a6.082 6.082 0 0 1-8.618-7.002l5.412 1.45a6.082 6.082 0 0 1 7.002-8.618l-1.45 5.412a6.082 6.082 0 0 1 8.618 7.002l-5.412-1.45a6.082 6.082 0 0 1-7.002 8.618l1.45-5.412Z"></path><circle cx="12" cy="12" r="2"></circle></svg>',
    psu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>'
};

const SHORT_NAMES = {
    cpu: "PROCESSOR",
    cooler: "COOLER",
    mobo: "MOTHERBOARD",
    ram: "MEMORY",
    gpu: "GRAPHICS",
    ssd: "SSD",
    hdd: "HDD",
    case_fan: "FAN",
    psu: "POWER"
};

function getSafeImageUrl(url) {
    if (!url) return imgFallback;
    if (url.includes('placehold.co') || url.includes('wsrv.nl')) return url;
    return `https://wsrv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ''))}`;
}

async function init() {
    initTheme();
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error("Data.json not found");
        db = await response.json();
        db.categories.forEach(cat => state.filters[cat.id] = { brand: 'All', sort: 'default' });
        setupEventListeners(); 
        renderSidebar(); 
        renderBlueprint(); 
        updateMetrics();
    } catch (error) {
        console.error("Data load failed. You are likely running this on file:/// instead of a local server.", error);
        
        // Show an error on the sidebar instead of leaving it blank!
        const nav = document.getElementById('sidebar-nav');
        if(nav) {
            nav.innerHTML = `
                <div style="color: var(--accent-red); font-size: 0.75rem; text-align: center; padding: 1rem; font-weight: bold;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:8px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <br>DATA BLOCKED
                    <br><br><span style="color: var(--text-muted); font-weight: normal;">Please use a Local Server or upload to GitHub.</span>
                </div>`;
        }
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}
function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-icon');
    if (theme === 'dark') {
        icon.innerHTML = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
    } else {
        icon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
    }
}

function setupEventListeners() {
    document.getElementById('btn-theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('currency-toggle').addEventListener('click', toggleCurrency);
    document.getElementById('search-box').addEventListener('input', (e) => { state.searchQuery = e.target.value.toLowerCase(); renderInventoryList(); });
    document.querySelectorAll('.btn-platform').forEach(btn => btn.addEventListener('click', (e) => setPlatform(e.target.dataset.platform)));
    
    document.getElementById('btn-close-drawer').addEventListener('click', closeDrawer);
    document.getElementById('btn-overclock').addEventListener('click', toggleOverclock);
    document.getElementById('btn-stock-cooler').addEventListener('click', toggleStockCooler);
    
    document.getElementById('btn-open-sync').addEventListener('click', () => document.getElementById('sync-modal').classList.remove('hidden'));
    document.getElementById('btn-close-sync').addEventListener('click', () => document.getElementById('sync-modal').classList.add('hidden'));
    document.getElementById('btn-cloud-save').addEventListener('click', saveToCloud);
    document.getElementById('btn-cloud-load').addEventListener('click', loadFromCloud);
}

function renderSidebar() {
    const nav = document.getElementById('sidebar-nav');
    nav.innerHTML = '';
    db.categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'nav-item';
        btn.id = `nav-${cat.id}`;
        btn.innerHTML = `${ICONS[cat.id] || ICONS['cpu']} <span>${SHORT_NAMES[cat.id] || cat.name.split(' ')[0]}</span>`;
        btn.onclick = () => openDrawer(cat.id);
        nav.appendChild(btn);
    });
}

function openDrawer(catId) {
    state.activeCategory = catId;
    const catData = db.categories.find(c => c.id === catId);
    
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`nav-${catId}`).classList.add('active');
    document.getElementById('drawer-title').innerText = catData.name;
    
    const platContainer = document.querySelector('.platform-container');
    if (catId === 'cpu' || catId === 'mobo') platContainer.classList.add('active');
    else platContainer.classList.remove('active');

    document.getElementById('component-drawer').classList.add('open');
    updateCompatibilityAlert();
    renderInventoryList();
}

function closeDrawer() {
    state.activeCategory = null;
    document.getElementById('component-drawer').classList.remove('open');
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
}

window.setFilter = function(type, value) { 
    if(!state.activeCategory) return;
    state.filters[state.activeCategory][type] = value; 
    renderInventoryList(); 
}

function renderInventoryList() {
    if(!state.activeCategory) return;
    const catId = state.activeCategory;
    const container = document.getElementById('drawer-list');
    const filterContainer = document.getElementById('filter-container');
    container.innerHTML = ''; filterContainer.innerHTML = '';

    let validItems = (db.items[catId] || []).filter(item => smartSearchMatch(item, state.searchQuery) && checkCompatibility(catId, item));
    const currentFilter = state.filters[catId];
    const brands = ['All', ...new Set(validItems.map(i => i.brand || i.name.split(' ')[0]))];

    if (validItems.length > 0 || currentFilter.brand !== 'All') {
        filterContainer.innerHTML = `
            <div class="filter-bar">
                <div class="brand-chips">
                    ${brands.map(b => `<button class="chip ${currentFilter.brand === b ? 'active' : ''}" onclick="window.setFilter('brand', '${b}')">${b}</button>`).join('')}
                </div>
                <select class="sort-select" onchange="window.setFilter('sort', this.value)">
                    <option value="default" ${currentFilter.sort === 'default' ? 'selected' : ''}>Default Sort</option>
                    <option value="price_asc" ${currentFilter.sort === 'price_asc' ? 'selected' : ''}>Price: Low to High</option>
                    <option value="price_desc" ${currentFilter.sort === 'price_desc' ? 'selected' : ''}>Price: High to Low</option>
                </select>
            </div>
        `;
    }

    if (currentFilter.brand !== 'All') validItems = validItems.filter(i => (i.brand || i.name.split(' ')[0]) === currentFilter.brand);
    if (currentFilter.sort === 'price_asc') validItems.sort((a, b) => a.priceUsd - b.priceUsd);
    else if (currentFilter.sort === 'price_desc') validItems.sort((a, b) => b.priceUsd - a.priceUsd);

    if (validItems.length === 0) {
        container.innerHTML = `<div class="item-card" style="justify-content:center"><p style="color:var(--text-muted);">No compatible hardware found.</p></div>`;
        return;
    }

    validItems.forEach(item => {
        const isMulti = MULTI_SLOT_CATEGORIES.includes(catId);
        const count = isMulti ? state.loadout[catId].filter(i => i.id === item.id).length : 0;
        const isEquipped = !isMulti && state.loadout[catId]?.id === item.id;
        
        let tags = '';
        if(item.socket) tags += `<span class="tag">${item.socket}</span>`;
        if(item.type) tags += `<span class="tag">${item.type}</span>`;
        if(item.watt) tags += `<span class="tag">${item.watt}W</span>`;

        const btnText = isMulti ? (count > 0 ? `Add (+${count})` : 'Add') : (isEquipped ? 'Equipped' : 'Equip');
        const finalImgSrc = getSafeImageUrl(item.imageUrl);
        const itemLink = item.link || `https://www.tokopedia.com/search?q=${encodeURIComponent(item.name)}`;

        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <img class="item-img" src="${finalImgSrc}" alt="${item.name}" loading="lazy" onerror="this.onerror=null; this.src='${imgFallback}'">
            <div class="item-info">
                <h4 title="${item.name}">${item.name}</h4>
                <div class="tags">${tags}</div>
                <p class="price-tag" data-usd="${item.priceUsd}">${formatPrice(item.priceUsd)}</p>
            </div>
            <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
                <button class="btn-equip ${isEquipped ? 'equipped' : ''}" onclick="window.equipItem('${catId}', '${item.id}')">${btnText}</button>
                <a href="${itemLink}" target="_blank" class="btn-tokopedia-mini" style="display: inline-flex; align-items: center; justify-content: center; background: #00AA5B; color: #ffffff; text-decoration: none; width: 30px; height: 30px; border-radius: 8px;" title="Lihat di Tokopedia">${tkpdSvg}</a>
            </div>
        `;
        container.appendChild(card);
    });
}

function smartSearchMatch(item, query) {
    if (!query.trim()) return true;
    const text = `${item.name} ${item.brand || ''} ${item.socket || ''} ${item.type || ''}`.toLowerCase();
    const terms = query.toLowerCase().replace(/\b(gen|generation)\b/g, ' ').split(/\s+/).filter(t => t.length > 0);
    return terms.every(term => text.includes(term));
}

function checkCompatibility(catId, item) {
    if (catId === 'cpu' && state.platform && item.brand !== state.platform) return false;
    if (catId === 'mobo' && state.requiredSocket && item.socket !== state.requiredSocket) return false;
    if (catId === 'ram' && state.requiredRamType && item.type !== state.requiredRamType) return false;
    return true;
}

function updateCompatibilityAlert() {
    const alertBox = document.getElementById('compatibility-alert');
    let msgs = [];
    if (!state.platform && (state.activeCategory==='cpu'||state.activeCategory==='mobo')) msgs.push("Select a Platform (Intel/AMD).");
    else {
        if (!state.loadout.cpu && state.activeCategory==='mobo') msgs.push(`Select a CPU first.`);
        if (state.loadout.cpu && !state.loadout.mobo && state.activeCategory==='mobo') msgs.push(`Locked to Socket: ${state.requiredSocket}.`);
        if (state.loadout.mobo && !state.loadout.ram && state.activeCategory==='ram') msgs.push(`Locked to RAM: ${state.requiredRamType}.`);
    }

    if (msgs.length > 0) { alertBox.innerHTML = msgs.join("<br>"); alertBox.classList.add('visible'); } 
    else { alertBox.classList.remove('visible'); }
}

function setPlatform(platform) {
    if (state.platform && state.platform !== platform) {
        state.loadout.cpu = null; state.loadout.mobo = null; state.loadout.ram = null;
        state.requiredSocket = null; state.requiredRamType = null;
    }
    state.platform = platform;
    document.querySelectorAll('.btn-platform').forEach(btn => {
        btn.classList.remove('active-intel', 'active-amd');
        if(btn.dataset.platform === platform) btn.classList.add(platform === 'INTEL' ? 'active-intel' : 'active-amd');
    });
    renderInventoryList(); renderBlueprint(); updateMetrics();
}

function renderBlueprint() {
    const container = document.getElementById('loadout-slots');
    if (!container) return;
    container.innerHTML = '';

    db.categories.forEach(cat => {
        const slot = document.createElement('div');
        slot.className = 'loadout-slot';
        let innerHtml = '';
        const isMulti = MULTI_SLOT_CATEGORIES.includes(cat.id);
        
        if (isMulti) {
            const arr = state.loadout[cat.id];
            if (arr.length === 0) innerHtml = `<div class="slot-empty">Awaiting hardware...</div>`;
            else {
                arr.forEach(item => {
                    const finalImgSrc = getSafeImageUrl(item.imageUrl);
                    const itemLink = item.link || `https://www.tokopedia.com/search?q=${encodeURIComponent(item.name)}`;
                    innerHtml += `
                        <div class="slot-item-row">
                            <div class="slot-item-name">
                                <img src="${finalImgSrc}" class="item-img" style="width:36px; height:36px; padding:0;" onerror="this.onerror=null; this.src='${imgFallback}'">
                                <span>${item.name}</span>
                            </div>
                            <div class="slot-actions">
                                <a href="${itemLink}" target="_blank" class="btn-tokopedia-mini" style="display: inline-flex; align-items: center; justify-content: center; background: #00AA5B; color: #ffffff; text-decoration: none; width: 30px; height: 30px; border-radius: 8px;" title="Lihat di Tokopedia">${tkpdSvg}</a>
                                <button class="btn-remove" onclick="window.removeMultiItem('${cat.id}', '${item.instanceId}')">Remove</button>
                            </div>
                        </div>`;
                });
            }
        } else {
            const item = state.loadout[cat.id];
            if (cat.id === 'cooler' && state.useStockCooler) {
                let brandText = state.platform === 'INTEL' ? 'Intel' : (state.platform === 'AMD' ? 'AMD' : 'Generic');
                innerHtml = `
                    <div class="slot-item-row">
                        <div class="slot-item-name">
                            <div class="item-img" style="width:36px; height:36px; padding:0; display:flex; align-items:center; justify-content:center; color:var(--text-muted);">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><path d="M12 12c-3-3-3-9 0-9 3 0 3 6 0 9Z"/><path d="M12 12c3-3 9-3 9 0 0 3-6 3-9 0Z"/><path d="M12 12c3 3 3 9 0 9-3 0-3-6 0-9Z"/><path d="M12 12c-3 3-9 3-9 0 0-3 6-3 9 0Z"/></svg>
                            </div>
                            <span>${brandText} Stock Cooler (In-Box)</span>
                        </div>
                    </div>`;
            } else if (!item) {
                innerHtml = `<div class="slot-empty">Awaiting hardware...</div>`;
            } else {
                let modifier = '';
                if (cat.id === 'ram') {
                    modifier = `<div class="ram-controls"><button class="ram-btn" onclick="window.changeRamQty(-1)">-</button><span style="font-size:0.85rem; font-weight:600;">${state.ramQuantity}x</span><button class="ram-btn" onclick="window.changeRamQty(1)">+</button></div>`;
                }
                const finalImgSrc = getSafeImageUrl(item.imageUrl);
                const itemLink = item.link || `https://www.tokopedia.com/search?q=${encodeURIComponent(item.name)}`;
                innerHtml = `
                    <div class="slot-item-row">
                        <div class="slot-item-name">
                            <img src="${finalImgSrc}" class="item-img" style="width:36px; height:36px; padding:0;" onerror="this.onerror=null; this.src='${imgFallback}'">
                            <span>${item.name}</span>
                            ${modifier}
                        </div>
                        <div class="slot-actions">
                            <a href="${itemLink}" target="_blank" class="btn-tokopedia-mini" style="display: inline-flex; align-items: center; justify-content: center; background: #00AA5B; color: #ffffff; text-decoration: none; width: 30px; height: 30px; border-radius: 8px;" title="Lihat di Tokopedia">${tkpdSvg}</a>
                            <button class="btn-remove" onclick="window.removeSingleItem('${cat.id}')">Remove</button>
                        </div>
                    </div>`;
            }
        }
        slot.innerHTML = `<div class="slot-header">${cat.name}</div>` + innerHtml;
        container.appendChild(slot);
    });
}

window.equipItem = function(categoryId, itemId) {
    const item = {...db.items[categoryId].find(i => i.id === itemId)};
    if (categoryId === 'cooler' && state.useStockCooler) toggleStockCooler();

    if (MULTI_SLOT_CATEGORIES.includes(categoryId)) {
        item.instanceId = Date.now().toString() + Math.random().toString(); state.loadout[categoryId].push(item);
    } else {
        state.loadout[categoryId] = item;
        if (categoryId === 'cpu') {
            state.requiredSocket = item.socket;
            if (state.loadout.mobo && state.loadout.mobo.socket !== item.socket) { state.loadout.mobo = null; state.requiredRamType = null; state.loadout.ram = null; }
        }
        if (categoryId === 'mobo') {
            state.requiredRamType = item.type;
            if (state.loadout.ram && state.loadout.ram.type !== item.type) state.loadout.ram = null;
        }
    }
    renderInventoryList(); renderBlueprint(); updateMetrics();
};

window.removeSingleItem = function(categoryId) {
    state.loadout[categoryId] = null;
    if (categoryId === 'cpu') { state.requiredSocket = null; state.loadout.mobo = null; state.requiredRamType = null; state.loadout.ram = null; }
    if (categoryId === 'mobo') { state.requiredRamType = null; state.loadout.ram = null; }
    renderInventoryList(); renderBlueprint(); updateMetrics();
};

window.removeMultiItem = function(categoryId, instanceId) {
    state.loadout[categoryId] = state.loadout[categoryId].filter(i => i.instanceId !== instanceId);
    renderInventoryList(); renderBlueprint(); updateMetrics();
};

window.changeRamQty = function(delta) {
    let newQty = state.ramQuantity + delta;
    if (newQty >= 1 && newQty <= 4) { state.ramQuantity = newQty; renderBlueprint(); updateMetrics(); }
};

function toggleCurrency() {
    state.currency = state.currency === 'USD' ? 'IDR' : 'USD';
    document.getElementById('currency-toggle').innerText = state.currency === 'USD' ? 'USD ($)' : 'IDR (Rp.)';
    document.querySelectorAll('.price-tag').forEach(tag => { tag.innerText = formatPrice(parseFloat(tag.getAttribute('data-usd'))); });
    updateMetrics();
}

function formatPrice(usdPrice) {
    if (state.currency === 'USD') return `$${usdPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    return `Rp ${Math.round(usdPrice * state.exchangeRate).toLocaleString('id-ID')}`;
}

function toggleOverclock() {
    state.isOverclocked = !state.isOverclocked;
    const btn = document.getElementById('btn-overclock');
    const indicator = document.getElementById('oc-indicator');
    if (state.isOverclocked) {
        btn.classList.add('active');
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Overclock: ON`;
        if(indicator) indicator.style.display = 'block';
    } else {
        btn.classList.remove('active');
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Overclock: OFF`;
        if(indicator) indicator.style.display = 'none';
    }
    updateMetrics();
}

function toggleStockCooler() {
    state.useStockCooler = !state.useStockCooler;
    const btn = document.getElementById('btn-stock-cooler');
    if (state.useStockCooler) { 
        btn.classList.add('active'); 
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12c-3-3-3-9 0-9 3 0 3 6 0 9Z"/><path d="M12 12c3-3 9-3 9 0 0 3-6 3-9 0Z"/><path d="M12 12c3 3 3 9 0 9-3 0-3-6 0-9Z"/><path d="M12 12c-3 3-9 3-9 0 0-3 6-3 9 0Z"/></svg> Stock Cooler: ON`; 
    } else { 
        btn.classList.remove('active'); 
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12c-3-3-3-9 0-9 3 0 3 6 0 9Z"/><path d="M12 12c3-3 9-3 9 0 0 3-6 3-9 0Z"/><path d="M12 12c3 3 3 9 0 9-3 0-3-6 0-9Z"/><path d="M12 12c-3 3-9 3-9 0 0-3 6-3 9 0Z"/></svg> Stock Cooler: OFF`; 
    }
    renderBlueprint(); updateMetrics();
}

function updateDot(id, statusClass) {
    const el = document.getElementById(id);
    if(el) el.className = `status-dot ${statusClass}`;
}

function updateMetrics() {
    let totalUsd = 0; let sysWattage = 50; let gameScore = 0;
    const { cpu, cooler, gpu, ram, psu } = state.loadout;
    const ocWattMult = state.isOverclocked ? 1.20 : 1.0;
    const ocPerfMult = state.isOverclocked ? 1.08 : 1.0;

    Object.keys(state.loadout).forEach(key => {
        if (key === 'cooler' && state.useStockCooler) return; 
        if (MULTI_SLOT_CATEGORIES.includes(key)) {
            state.loadout[key].forEach(item => { totalUsd += item.priceUsd; sysWattage += (item.watt || 0); });
        } else {
            const item = state.loadout[key];
            if (item) {
                let multiplier = (key === 'ram') ? state.ramQuantity : 1;
                totalUsd += (item.priceUsd * multiplier);
                if (key !== 'psu' && item.watt) {
                    if (key === 'cpu' || key === 'gpu') sysWattage += Math.round(item.watt * ocWattMult);
                    else sysWattage += (item.watt * multiplier);
                }
            }
        }
    });

    if (state.useStockCooler) sysWattage += 5;

    if (cpu && gpu && ram) {
        let ramBonus = (state.ramQuantity >= 2) ? 1.0 : 0.85;
        let cpuP = cpu.perf * ocPerfMult; let gpuP = gpu.perf * ocPerfMult;
        gameScore = Math.round(((gpuP * 0.65) + (cpuP * 0.30) + ((ram.perf * ramBonus) * 0.05)) * 10);
        if (gameScore > 1000) gameScore = 1000;
    }

    const bStatus = document.getElementById('bottleneck-status');
    const bReadout = document.getElementById('bottleneck-readout');
    if (bStatus && bReadout) {
        if (cpu && gpu) {
            const cpuP = cpu.perf * ocPerfMult; const gpuP = gpu.perf * ocPerfMult;
            if (gpuP > cpuP * 1.3) { bReadout.innerText = "Severe CPU Limit"; bStatus.innerText = "GPU Starved"; updateDot('bottleneck-dot', 'danger'); } 
            else if (gpuP > cpuP * 1.15) { bReadout.innerText = "CPU Limit"; bStatus.innerText = "GPU Waiting"; updateDot('bottleneck-dot', 'warn'); } 
            else if (cpuP > gpuP * 1.3) { bReadout.innerText = "GPU Limit"; bStatus.innerText = "CPU Overkill"; updateDot('bottleneck-dot', 'warn'); } 
            else { bReadout.innerText = "Optimal"; bStatus.innerText = "Balanced"; updateDot('bottleneck-dot', 'ok'); }
        } else { bReadout.innerText = "N/A"; bStatus.innerText = "Incomplete"; updateDot('bottleneck-dot', ''); }
    }

    const tStatus = document.getElementById('thermal-status');
    const tReadout = document.getElementById('thermal-readout');
    if(tStatus && tReadout) {
        let activeCooler = state.useStockCooler ? { tdp_max: 65 } : cooler;

        if (cpu && activeCooler) {
            let currentCpuWatt = Math.round(cpu.watt * ocWattMult);
            const headroom = activeCooler.tdp_max - currentCpuWatt;
            if (headroom < -10) { tReadout.innerText = `${headroom}W Deficit`; tStatus.innerText = "Thermal Throttling"; updateDot('thermal-dot', 'danger'); } 
            else if (headroom < 30) { tReadout.innerText = `${headroom}W Clearance`; tStatus.innerText = "Warm / Loud Fans"; updateDot('thermal-dot', 'warn'); } 
            else { tReadout.innerText = `+${headroom}W Headroom`; tStatus.innerText = "Excellent Cooling"; updateDot('thermal-dot', 'ok'); }
        } else if (cpu && !activeCooler) { tReadout.innerText = "Overheating Risk"; tStatus.innerText = "No Cooler"; updateDot('thermal-dot', 'danger'); } 
        else { tReadout.innerText = "N/A"; tStatus.innerText = "Awaiting CPU/Cooler"; updateDot('thermal-dot', ''); }
    }

    const pStatus = document.getElementById('psu-status');
    const pReadout = document.getElementById('wattage-readout');
    const psuMax = psu ? psu.watt : 0;
    if(pReadout) pReadout.innerText = `${sysWattage} / ${psuMax} W`;

    if(pStatus) {
        if (!psu && sysWattage > 50) { pStatus.innerText = "Awaiting PSU"; updateDot('psu-dot', 'warn'); } 
        else if (psu) {
            if (sysWattage > psuMax * 0.9) { pStatus.innerText = "Critical Overload Risk"; updateDot('psu-dot', 'danger'); } 
            else if (sysWattage > psuMax * 0.75) { pStatus.innerText = "Efficient Load"; updateDot('psu-dot', 'ok'); } 
            else { pStatus.innerText = "Sufficient"; updateDot('psu-dot', 'ok'); }
        } else { pStatus.innerText = "Awaiting Hardware"; updateDot('psu-dot', ''); }
    }

    const totalPriceEl = document.getElementById('total-price');
    if(totalPriceEl) totalPriceEl.innerText = formatPrice(totalUsd);
    
    const gamingBarEl = document.getElementById('gaming-bar');
    if(gamingBarEl) gamingBarEl.style.width = `${(gameScore/1000)*100}%`;
    
    const gamingScoreEl = document.getElementById('gaming-score');
    if(gamingScoreEl) {
        let tierHTML = '';
        if (gameScore === 0) tierHTML = `<span class="tier-badge grade-none">Incomplete</span>`;
        else if (gameScore >= 900) tierHTML = `<span class="tier-badge grade-s">Grade S - Enthusiast</span>`;
        else if (gameScore >= 700) tierHTML = `<span class="tier-badge grade-a">Grade A - High End</span>`;
        else if (gameScore >= 500) tierHTML = `<span class="tier-badge grade-b">Grade B - Mid Range</span>`;
        else if (gameScore >= 300) tierHTML = `<span class="tier-badge grade-c">Grade C - Budget</span>`;
        else tierHTML = `<span class="tier-badge grade-d">Grade D - Entry Level</span>`;

        gamingScoreEl.innerHTML = `${tierHTML} <span>${gameScore} / 1000</span>`;
    }
}

// Serialization and Cloud Methods
function serializeLoadout() {
    return {
        cpu: state.loadout.cpu?.id || null, cooler: state.loadout.cooler?.id || null,
        mobo: state.loadout.mobo?.id || null, ram: state.loadout.ram?.id || null,
        ramQuantity: state.ramQuantity, gpu: state.loadout.gpu?.id || null, psu: state.loadout.psu?.id || null,
        ssd: state.loadout.ssd.map(i => i.id), hdd: state.loadout.hdd.map(i => i.id),
        case_fan: state.loadout.case_fan.map(i => i.id), 
        isOverclocked: state.isOverclocked, useStockCooler: state.useStockCooler
    };
}

function deserializeLoadout(data) {
    state.loadout = { cpu: null, cooler: null, mobo: null, ram: null, gpu: null, ssd: [], hdd: [], case_fan: [], psu: null };
    const findItem = (cat, id) => db.items[cat]?.find(i => i.id === id) || null;

    if (data.cpu) state.loadout.cpu = findItem('cpu', data.cpu);
    if (data.cooler) state.loadout.cooler = findItem('cooler', data.cooler);
    if (data.mobo) state.loadout.mobo = findItem('mobo', data.mobo);
    if (data.ram) state.loadout.ram = findItem('ram', data.ram);
    if (data.ramQuantity) state.ramQuantity = data.ramQuantity;
    if (data.gpu) state.loadout.gpu = findItem('gpu', data.gpu);
    if (data.psu) state.loadout.psu = findItem('psu', data.psu);
    
    if (data.isOverclocked !== undefined) {
        state.isOverclocked = data.isOverclocked;
        const ocBtn = document.getElementById('btn-overclock');
        if (state.isOverclocked) ocBtn.classList.add('active'); else ocBtn.classList.remove('active');
    }

    if (data.useStockCooler !== undefined) {
        state.useStockCooler = data.useStockCooler;
        const scBtn = document.getElementById('btn-stock-cooler');
        if (state.useStockCooler) {
            scBtn.classList.add('active'); 
            scBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12c-3-3-3-9 0-9 3 0 3 6 0 9Z"/><path d="M12 12c3-3 9-3 9 0 0 3-6 3-9 0Z"/><path d="M12 12c3 3 3 9 0 9-3 0-3-6 0-9Z"/><path d="M12 12c-3 3-9 3-9 0 0-3 6-3 9 0Z"/></svg> Stock Cooler: ON`;
        } else {
            scBtn.classList.remove('active'); 
            scBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12c-3-3-3-9 0-9 3 0 3 6 0 9Z"/><path d="M12 12c3-3 9-3 9 0 0 3-6 3-9 0Z"/><path d="M12 12c3 3 3 9 0 9-3 0-3-6 0-9Z"/><path d="M12 12c-3 3-9 3-9 0 0-3 6-3 9 0Z"/></svg> Stock Cooler: OFF`;
        }
    }

    ['ssd', 'hdd', 'case_fan'].forEach(cat => {
        if (data[cat]) data[cat].forEach(id => {
            const item = findItem(cat, id);
            if (item) state.loadout[cat].push({ ...item, instanceId: Date.now().toString() + Math.random().toString() });
        });
    });

    if (state.loadout.cpu) {
        state.platform = state.loadout.cpu.brand; state.requiredSocket = state.loadout.cpu.socket;
    } else { state.platform = null; state.requiredSocket = null; }
    
    state.requiredRamType = state.loadout.mobo ? state.loadout.mobo.type : null;
    closeDrawer(); renderBlueprint(); updateMetrics();
}

async function saveToCloud() {
    if (!dbFirestore) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase(); 
    const btn = document.getElementById('btn-cloud-save'); btn.innerText = "Saving..."; btn.disabled = true;
    try {
        await setDoc(doc(dbFirestore, "builds", code), serializeLoadout());
        document.getElementById('cloud-code-display').classList.remove('hidden');
        document.getElementById('generated-code').innerText = code;
    } catch (e) { alert("Failed to save."); } finally { btn.innerText = "Generate Code"; btn.disabled = false; }
}

async function loadFromCloud() {
    if (!dbFirestore) return;
    const codeInput = document.getElementById('input-cloud-code').value.toUpperCase().trim();
    if (codeInput.length !== 6) return;
    const btn = document.getElementById('btn-cloud-load'); btn.innerText = "Loading..."; btn.disabled = true;
    try {
        const docSnap = await getDoc(doc(dbFirestore, "builds", codeInput));
        if (docSnap.exists()) deserializeLoadout(docSnap.data()); else alert("Code not found!");
    } catch (e) { alert("Failed to load."); } finally { btn.innerText = "Load"; btn.disabled = false; }
}

function downloadLocal() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(serializeLoadout()));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "pc_build.json");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function uploadLocal(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try { deserializeLoadout(JSON.parse(e.target.result)); } 
        catch(err) { alert("Invalid JSON file."); }
    }
    reader.readAsText(file);
    event.target.value = '';
}

document.addEventListener('DOMContentLoaded', init);
