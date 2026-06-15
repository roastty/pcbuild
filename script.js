/**
 * PC Architect Simulator Engine
 * Features: Smart Drag Scrolling, Expanding Scrollbars, Auto-Format, Red Alerts, AI Modal
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
    currency: 'IDR', exchangeRate: 17989.10, searchQuery: '', platform: null, 
    isOverclocked: false, useStockCooler: false, filters: {},
    activeCategory: null, budget: 0, casePrice: 0, 
    loadout: { cpu: null, cooler: null, mobo: null, ram: [], gpu: null, ssd: [], hdd: [], case_fan: [], psu: null }
};

const MULTI_SLOT_CATEGORIES = ['ram', 'ssd', 'hdd', 'case_fan'];
const imgFallback = "https://placehold.co/64x64/1c1c1e/86868b?text=No+Image";
const tkpdSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`;

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

const SHORT_NAMES = { cpu: "PROCESSOR", cooler: "COOLER", mobo: "MOTHERBOARD", ram: "MEMORY", gpu: "GRAPHICS", ssd: "SSD", hdd: "HDD", case_fan: "FAN", psu: "POWER" };

function getSafeImageUrl(url) {
    if (!url) return imgFallback;
    if (url.includes('placehold.co') || url.includes('wsrv.nl')) return url;
    return `https://wsrv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ''))}`;
}

// --- DRAG TO SCROLL ENGINE ---
function applyDragScroll(ele) {
    if (!ele) return;
    let isDown = false;
    let startX, startY, scrollLeft, scrollTop;
    let dragged = false;

    ele.addEventListener('mousedown', (e) => {
        isDown = true;
        dragged = false;
        ele.classList.add('grabbing');
        startX = e.pageX - ele.offsetLeft;
        startY = e.pageY - ele.offsetTop;
        scrollLeft = ele.scrollLeft;
        scrollTop = ele.scrollTop;
    });
    ele.addEventListener('mouseleave', () => { isDown = false; ele.classList.remove('grabbing'); });
    ele.addEventListener('mouseup', () => { 
        isDown = false; 
        ele.classList.remove('grabbing'); 
        setTimeout(() => { dragged = false; }, 50); 
    });
    ele.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - ele.offsetLeft;
        const y = e.pageY - ele.offsetTop;
        const walkX = (x - startX) * 1.5;
        const walkY = (y - startY) * 1.5;
        
        if (Math.abs(walkX) > 5 || Math.abs(walkY) > 5) dragged = true;
        
        ele.scrollLeft = scrollLeft - walkX;
        ele.scrollTop = scrollTop - walkY;
    });
    ele.addEventListener('click', (e) => {
        if (dragged) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    ele.addEventListener('wheel', (e) => {
        const isHorizontalTarget = ele.classList.contains('brand-chips') || (ele.classList.contains('sidebar-nav') && window.innerWidth <= 900);
        if (isHorizontalTarget && e.deltaY !== 0) {
            e.preventDefault();
            ele.scrollLeft += e.deltaY;
        }
    }, { passive: false });
}

async function init() {
    initTheme();
    try {
        const response = await fetch('data.json');
        db = await response.json();
    } catch (error) { console.warn("Failed to load data.json."); }
    db.categories.forEach(cat => state.filters[cat.id] = { brand: 'All', sort: 'default' });
    setupEventListeners(); renderSidebar(); renderBlueprint(); updateMetrics();
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
    if (theme === 'dark') { icon.innerHTML = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`; } 
    else { icon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`; }
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
    document.getElementById('btn-local-download').addEventListener('click', downloadLocal);
    document.getElementById('btn-local-upload').addEventListener('click', () => document.getElementById('file-upload-input').click());
    document.getElementById('file-upload-input').addEventListener('change', uploadLocal);

    document.getElementById('btn-budget').addEventListener('click', openBudgetModal);
    document.getElementById('btn-close-budget').addEventListener('click', () => document.getElementById('budget-modal').classList.add('hidden'));
    document.getElementById('btn-save-budget').addEventListener('click', saveBudget);
    document.getElementById('btn-clear-budget').addEventListener('click', () => { state.budget = 0; document.getElementById('budget-modal').classList.add('hidden'); updateMetrics(); });

    document.getElementById('btn-case-price').addEventListener('click', openCaseModal);
    document.getElementById('btn-close-case').addEventListener('click', () => document.getElementById('case-modal').classList.add('hidden'));
    document.getElementById('btn-save-case').addEventListener('click', saveCasePrice);
    document.getElementById('btn-clear-case').addEventListener('click', () => { state.casePrice = 0; document.getElementById('case-modal').classList.add('hidden'); updateMetrics(); });
    
    document.getElementById('btn-close-item').addEventListener('click', () => document.getElementById('item-details-modal').classList.add('hidden'));

    const formatInput = function(e) {
        let value = this.value.replace(/\D/g, ''); 
        if (!value) { this.value = ''; return; }
        this.value = parseInt(value, 10).toLocaleString(state.currency === 'IDR' ? 'id-ID' : 'en-US');
    };
    document.getElementById('input-budget').addEventListener('input', formatInput);
    document.getElementById('input-case').addEventListener('input', formatInput);
}

function renderSidebar() {
    const nav = document.getElementById('sidebar-nav');
    nav.innerHTML = '';
    db.categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'nav-item';
        btn.id = `nav-${cat.id}`;
        btn.innerHTML = `${ICONS[cat.id] || ICONS['cpu']} <span>${SHORT_NAMES[cat.id]}</span>`;
        btn.onclick = () => openDrawer(cat.id);
        nav.appendChild(btn);
    });
    applyDragScroll(nav); // Enable Drag Scroll
}

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) { hash = Math.imul(31, hash) + str.charCodeAt(i) | 0; }
    return Math.abs(hash);
}

window.showItemDetails = function(categoryId, itemId) {
    const item = db.items[categoryId].find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('ai-item-title').innerText = item.name;
    const h = hashString(item.id);
    let perfScore = item.perf || (h % 50) + 40; 
    let buildScore = (h % 40) + 60; 
    let valueScore = ((h >> 2) % 30) + 70; 

    const premium = ["Noctua", "ASUS", "Corsair", "Samsung", "G.Skill", "MSI"];
    const budget = ["Kaizen", "V-GeN", "Cube Gaming", "RUIX", "Power Up"];
    if(premium.includes(item.brand)) { buildScore = Math.min(100, buildScore + 15); valueScore = Math.max(50, valueScore - 10); }
    if(budget.includes(item.brand)) { valueScore = Math.min(100, valueScore + 15); buildScore = Math.max(50, buildScore - 15); }

    perfScore = Math.min(100, perfScore); buildScore = Math.min(100, buildScore); valueScore = Math.min(100, valueScore);

    let desc = `The <strong>${item.brand || 'component'} ${item.name}</strong> offers a compelling mix of features. `;
    if(perfScore > 85) desc += `As a top-tier part in its category, it delivers enthusiast-level performance suited for heavy workloads. `;
    else if(perfScore > 65) desc += `It sits comfortably in the mid-range, providing great balance for standard gaming builds. `;
    else desc += `This is an entry-level option, perfect for tight budgets and basic tasks. `;
    if(valueScore > 85) desc += `It stands out with an exceptional value-to-price ratio.`;
    else desc += `While slightly premium, the build quality justifies the investment.`;

    document.getElementById('ai-item-desc').innerHTML = desc;
    document.getElementById('ai-score-perf').innerText = perfScore;
    document.getElementById('ai-score-build').innerText = buildScore;
    document.getElementById('ai-score-value').innerText = valueScore;

    document.getElementById('ai-bar-perf').style.width = '0%';
    document.getElementById('ai-bar-build').style.width = '0%';
    document.getElementById('ai-bar-value').style.width = '0%';
    document.getElementById('item-details-modal').classList.remove('hidden');

    setTimeout(() => {
        document.getElementById('ai-bar-perf').style.width = `${perfScore}%`;
        document.getElementById('ai-bar-build').style.width = `${buildScore}%`;
        document.getElementById('ai-bar-value').style.width = `${valueScore}%`;
    }, 100);
}

function openBudgetModal() {
    document.getElementById('budget-modal').classList.remove('hidden');
    document.getElementById('budget-currency-label').innerText = state.currency === 'IDR' ? 'Rp' : '$';
    const input = document.getElementById('input-budget');
    if (state.budget > 0) {
        let val = state.currency === 'IDR' ? Math.round(state.budget * state.exchangeRate) : Math.round(state.budget);
        input.value = val.toLocaleString(state.currency === 'IDR' ? 'id-ID' : 'en-US');
    } else { input.value = ''; }
}

function saveBudget() {
    let rawStr = document.getElementById('input-budget').value.replace(/\D/g, '');
    const val = parseFloat(rawStr);
    if (isNaN(val) || val <= 0) state.budget = 0;
    else state.budget = state.currency === 'IDR' ? val / state.exchangeRate : val;
    document.getElementById('budget-modal').classList.add('hidden');
    updateMetrics();
}

function openCaseModal() {
    document.getElementById('case-modal').classList.remove('hidden');
    document.getElementById('case-currency-label').innerText = state.currency === 'IDR' ? 'Rp' : '$';
    const input = document.getElementById('input-case');
    if (state.casePrice > 0) {
        let val = state.currency === 'IDR' ? Math.round(state.casePrice * state.exchangeRate) : Math.round(state.casePrice);
        input.value = val.toLocaleString(state.currency === 'IDR' ? 'id-ID' : 'en-US');
    } else { input.value = ''; }
}

function saveCasePrice() {
    let rawStr = document.getElementById('input-case').value.replace(/\D/g, '');
    const val = parseFloat(rawStr);
    if (isNaN(val) || val < 0) state.casePrice = 0;
    else state.casePrice = state.currency === 'IDR' ? val / state.exchangeRate : val;
    document.getElementById('case-modal').classList.add('hidden');
    updateMetrics();
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

    let validItems = (db.items[catId] || []).filter(item => smartSearchMatch(item, state.searchQuery));
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
        applyDragScroll(filterContainer.querySelector('.brand-chips')); // ENABLE DRAG SCROLL HERE
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
        let count = 0; let isEquipped = false;
        if (isMulti) count = state.loadout[catId].filter(i => i.id === item.id).length;
        else isEquipped = state.loadout[catId]?.id === item.id;
        
        let tags = '';
        if(item.socket) tags += `<span class="tag">${item.socket}</span>`;
        if(item.type) tags += `<span class="tag">${item.type}</span>`;
        if(item.watt) tags += `<span class="tag">${item.watt}W</span>`;

        let displayName = item.name;
        let ramQtyHtml = '';
        if (catId === 'ram') {
            const qtyMatch = displayName.match(/\s*\(([\dxX]+[gG][bB])\)$/i);
            if (qtyMatch) {
                ramQtyHtml = `<div class="ram-qty-label">KIT: ${qtyMatch[1].toUpperCase()}</div>`;
                displayName = displayName.replace(qtyMatch[0], ''); 
            }
        }

        const btnText = isMulti ? (count > 0 ? `Add (+${count})` : 'Add') : (isEquipped ? 'Equipped' : 'Equip');
        const finalImgSrc = getSafeImageUrl(item.imageUrl);
        const itemLink = item.link || `https://www.tokopedia.com/search?q=${encodeURIComponent(item.name)}`;

        const card = document.createElement('div');
        card.className = 'item-card';
        card.onclick = () => window.showItemDetails(catId, item.id);
        
        card.innerHTML = `
            <img class="item-img" src="${finalImgSrc}" alt="${displayName}" loading="lazy" onerror="this.onerror=null; this.src='${imgFallback}'">
            <div class="item-info">
                <div class="item-brand">${item.brand || 'Generic'}</div>
                <h4 title="${displayName}">${displayName}</h4>
                <div class="tags">${tags}</div>
                ${ramQtyHtml}
                <p class="price-tag" data-usd="${item.priceUsd}">${formatPrice(item.priceUsd)}</p>
            </div>
            <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end; justify-content:center;">
                <button class="btn-equip ${isEquipped ? 'equipped' : ''}" onclick="event.stopPropagation(); window.equipItem('${catId}', '${item.id}')">${btnText}</button>
                <a href="${itemLink}" target="_blank" class="btn-tokopedia-mini" style="display: inline-flex; align-items: center; justify-content: center; background: #00AA5B; color: #ffffff; text-decoration: none; width: 30px; height: 30px; border-radius: 8px;" title="Lihat di Tokopedia" onclick="event.stopPropagation();">${tkpdSvg}</a>
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

function setPlatform(platform) {
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

    const errList = [];
    if(state.loadout.mobo) {
        if(state.loadout.cpu && state.loadout.cpu.socket !== state.loadout.mobo.socket) errList.push('cpu', 'mobo');
        let hasRamError = false;
        state.loadout.ram.forEach(r => {
            if(r.type !== state.loadout.mobo.type) { hasRamError = true; errList.push(r.instanceId); }
        });
        if(hasRamError) errList.push('mobo');
    }

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
                    const isErr = errList.includes(item.instanceId) || errList.includes(cat.id);

                    innerHtml += `
                        <div class="slot-item-row ${isErr ? 'incompatible-item' : ''}">
                            <div class="slot-item-name ${isErr ? 'incompatible-text' : ''}">
                                <img src="${finalImgSrc}" class="item-img" style="width:36px; height:36px; padding:0;" onerror="this.onerror=null; this.src='${imgFallback}'">
                                <span>${item.name}</span>
                            </div>
                            <div class="slot-actions">
                                <span class="blueprint-price">${formatPrice(item.priceUsd)}</span>
                                <a href="${itemLink}" target="_blank" class="btn-tokopedia-mini" title="Lihat di Tokopedia">${tkpdSvg}</a>
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
                        <div class="slot-actions"><span class="blueprint-price">Rp 0</span></div>
                    </div>`;
            } else if (!item) {
                innerHtml = `<div class="slot-empty">Awaiting hardware...</div>`;
            } else {
                const finalImgSrc = getSafeImageUrl(item.imageUrl);
                const itemLink = item.link || `https://www.tokopedia.com/search?q=${encodeURIComponent(item.name)}`;
                const isErr = errList.includes(cat.id);

                innerHtml = `
                    <div class="slot-item-row ${isErr ? 'incompatible-item' : ''}">
                        <div class="slot-item-name ${isErr ? 'incompatible-text' : ''}">
                            <img src="${finalImgSrc}" class="item-img" style="width:36px; height:36px; padding:0;" onerror="this.onerror=null; this.src='${imgFallback}'">
                            <span>${item.name}</span>
                        </div>
                        <div class="slot-actions">
                            <span class="blueprint-price">${formatPrice(item.priceUsd)}</span>
                            <a href="${itemLink}" target="_blank" class="btn-tokopedia-mini" title="Lihat di Tokopedia">${tkpdSvg}</a>
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
        item.instanceId = Date.now().toString() + Math.random().toString(); 
        state.loadout[categoryId].push(item);
    } else {
        state.loadout[categoryId] = item;
        if (categoryId === 'cpu') {
            state.platform = item.brand;
            document.querySelectorAll('.btn-platform').forEach(btn => {
                btn.classList.remove('active-intel', 'active-amd');
                if(btn.dataset.platform === state.platform) btn.classList.add(state.platform === 'INTEL' ? 'active-intel' : 'active-amd');
            });
        }
    }
    renderInventoryList(); renderBlueprint(); updateMetrics();
};

window.removeSingleItem = function(categoryId) {
    state.loadout[categoryId] = null;
    renderInventoryList(); renderBlueprint(); updateMetrics();
};

window.removeMultiItem = function(categoryId, instanceId) {
    state.loadout[categoryId] = state.loadout[categoryId].filter(i => i.instanceId !== instanceId);
    renderInventoryList(); renderBlueprint(); updateMetrics();
};

function toggleCurrency() {
    state.currency = state.currency === 'USD' ? 'IDR' : 'USD';
    document.getElementById('currency-toggle').innerText = state.currency === 'USD' ? 'USD ($)' : 'IDR (Rp.)';
    
    const budgetInput = document.getElementById('input-budget');
    if(state.budget > 0) {
        let val = state.currency === 'IDR' ? Math.round(state.budget * state.exchangeRate) : Math.round(state.budget);
        budgetInput.value = val.toLocaleString(state.currency === 'IDR' ? 'id-ID' : 'en-US');
    }
    const caseInput = document.getElementById('input-case');
    if(state.casePrice > 0) {
        let val = state.currency === 'IDR' ? Math.round(state.casePrice * state.exchangeRate) : Math.round(state.casePrice);
        caseInput.value = val.toLocaleString(state.currency === 'IDR' ? 'id-ID' : 'en-US');
    }
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
    const { cpu, cooler, gpu, ram, psu, mobo } = state.loadout;
    const ocWattMult = state.isOverclocked ? 1.20 : 1.0;
    const ocPerfMult = state.isOverclocked ? 1.08 : 1.0;

    const alertsContainer = document.getElementById('telemetry-alerts');
    let sysAlerts = [];
    
    if (cpu && mobo && cpu.socket !== mobo.socket) {
        sysAlerts.push(`CPU and Motherboard sockets do not match! (${cpu.socket} vs ${mobo.socket})`);
    }

    let avgRamPerf = 0;
    if (ram && ram.length > 0) {
        let totalRamPerf = 0;
        let speeds = new Set();
        let types = new Set();
        
        ram.forEach(r => {
            totalUsd += r.priceUsd;
            sysWattage += (r.watt || 0);
            totalRamPerf += r.perf;
            if(r.type) types.add(r.type);
            const match = r.name.match(/(\d+)MHz/i);
            if(match) speeds.add(match[1]);
        });
        avgRamPerf = totalRamPerf / ram.length;

        if (mobo && types.size > 0 && !types.has(mobo.type)) {
            sysAlerts.push(`RAM type does not match Motherboard! (Needs ${mobo.type})`);
        }
        if (speeds.size > 1) {
            sysAlerts.push(`RAM Warning: Mixed frequencies detected. System will run at the slowest RAM speed.`);
        }
        if (ram.length % 2 !== 0 && ram.length > 1) {
            sysAlerts.push(`RAM Warning: Asymmetric channel configuration detected. Pair modules for optimal Dual-Channel performance.`);
        }
    }

    Object.keys(state.loadout).forEach(key => {
        if (key === 'ram') return; 
        if (key === 'cooler' && state.useStockCooler) return; 
        
        if (MULTI_SLOT_CATEGORIES.includes(key)) {
            state.loadout[key].forEach(item => { totalUsd += item.priceUsd; sysWattage += (item.watt || 0); });
        } else {
            const item = state.loadout[key];
            if (item) {
                totalUsd += item.priceUsd;
                if (key !== 'psu' && item.watt) {
                    if (key === 'cpu' || key === 'gpu') sysWattage += Math.round(item.watt * ocWattMult);
                    else sysWattage += item.watt;
                }
            }
        }
    });

    if (state.useStockCooler) sysWattage += 5;
    totalUsd += state.casePrice;

    if (sysAlerts.length > 0) {
        alertsContainer.innerHTML = sysAlerts.join('<br><br>');
        alertsContainer.className = 'alert-box danger visible';
    } else {
        alertsContainer.className = 'alert-box hidden';
    }

    if (cpu && gpu && ram.length > 0) {
        let ramBonus = (ram.length >= 2) ? 1.0 : 0.85;
        let cpuP = cpu.perf * ocPerfMult; let gpuP = gpu.perf * ocPerfMult;
        gameScore = Math.round(((gpuP * 0.65) + (cpuP * 0.30) + ((avgRamPerf * ramBonus) * 0.05)) * 10);
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

    const totalPriceEl = document.getElementById('total-price');
    const budgetWarning = document.getElementById('budget-warning');

    if (totalPriceEl) {
        totalPriceEl.innerText = formatPrice(totalUsd);
        if (state.budget > 0 && totalUsd > state.budget) {
            totalPriceEl.style.color = 'var(--accent-red)';
            if(budgetWarning) budgetWarning.style.display = 'block';
        } else {
            totalPriceEl.style.color = 'var(--text-main)';
            if(budgetWarning) budgetWarning.style.display = 'none';
        }
    }

    if(pStatus) {
        if (!psu && sysWattage > 50) { pStatus.innerText = "Awaiting PSU"; updateDot('psu-dot', 'warn'); } 
        else if (psu) {
            if (sysWattage > psuMax * 0.9) { pStatus.innerText = "Critical Overload Risk"; updateDot('psu-dot', 'danger'); } 
            else if (sysWattage > psuMax * 0.75) { pStatus.innerText = "Efficient Load"; updateDot('psu-dot', 'ok'); } 
            else { pStatus.innerText = "Sufficient"; updateDot('psu-dot', 'ok'); }
        } else { pStatus.innerText = "Awaiting Hardware"; updateDot('psu-dot', ''); }
    }
    
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
    renderBlueprint();
}

function serializeLoadout() { return { cpu: state.loadout.cpu?.id || null, cooler: state.loadout.cooler?.id || null, mobo: state.loadout.mobo?.id || null, ram: state.loadout.ram.map(i=>i.id), gpu: state.loadout.gpu?.id || null, psu: state.loadout.psu?.id || null, ssd: state.loadout.ssd.map(i => i.id), hdd: state.loadout.hdd.map(i => i.id), case_fan: state.loadout.case_fan.map(i => i.id), isOverclocked: state.isOverclocked, useStockCooler: state.useStockCooler, budget: state.budget, casePrice: state.casePrice }; }
function deserializeLoadout(data) { state.loadout = { cpu: null, cooler: null, mobo: null, ram: [], gpu: null, ssd: [], hdd: [], case_fan: [], psu: null }; const findItem = (cat, id) => db.items[cat]?.find(i => i.id === id) || null; if (data.cpu) state.loadout.cpu = findItem('cpu', data.cpu); if (data.cooler) state.loadout.cooler = findItem('cooler', data.cooler); if (data.mobo) state.loadout.mobo = findItem('mobo', data.mobo); if (data.gpu) state.loadout.gpu = findItem('gpu', data.gpu); if (data.psu) state.loadout.psu = findItem('psu', data.psu); if (data.budget !== undefined) state.budget = data.budget; if (data.casePrice !== undefined) state.casePrice = data.casePrice; if (data.isOverclocked !== undefined) { state.isOverclocked = data.isOverclocked; const ocBtn = document.getElementById('btn-overclock'); if (state.isOverclocked) ocBtn.classList.add('active'); else ocBtn.classList.remove('active'); } if (data.useStockCooler !== undefined) { state.useStockCooler = data.useStockCooler; const scBtn = document.getElementById('btn-stock-cooler'); if (state.useStockCooler) { scBtn.classList.add('active'); scBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12c-3-3-3-9 0-9 3 0 3 6 0 9Z"/><path d="M12 12c3-3 9-3 9 0 0 3-6 3-9 0Z"/><path d="M12 12c3 3 3 9 0 9-3 0-3-6 0-9Z"/><path d="M12 12c-3 3-9 3-9 0 0-3 6-3 9 0Z"/></svg> Stock Cooler: ON`; } else { scBtn.classList.remove('active'); scBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12c-3-3-3-9 0-9 3 0 3 6 0 9Z"/><path d="M12 12c3-3 9-3 9 0 0 3-6 3-9 0Z"/><path d="M12 12c3 3 3 9 0 9-3 0-3-6 0-9Z"/><path d="M12 12c-3 3-9 3-9 0 0-3 6-3 9 0Z"/></svg> Stock Cooler: OFF`; } } ['ram','ssd', 'hdd', 'case_fan'].forEach(cat => { if (data[cat]) data[cat].forEach(id => { const item = findItem(cat, id); if (item) state.loadout[cat].push({ ...item, instanceId: Date.now().toString() + Math.random().toString() }); }); }); if (state.loadout.cpu) { state.platform = state.loadout.cpu.brand; state.requiredSocket = state.loadout.cpu.socket; } else { state.platform = null; state.requiredSocket = null; } closeDrawer(); renderBlueprint(); updateMetrics(); }
async function saveToCloud() { if (!dbFirestore) return; const code = Math.random().toString(36).substring(2, 8).toUpperCase(); const btn = document.getElementById('btn-cloud-save'); btn.innerText = "Saving..."; btn.disabled = true; try { await setDoc(doc(dbFirestore, "builds", code), serializeLoadout()); document.getElementById('cloud-code-display').classList.remove('hidden'); document.getElementById('generated-code').innerText = code; } catch (e) { alert("Failed to save."); } finally { btn.innerText = "Generate Code"; btn.disabled = false; } }
async function loadFromCloud() { if (!dbFirestore) return; const codeInput = document.getElementById('input-cloud-code').value.toUpperCase().trim(); if (codeInput.length !== 6) return; const btn = document.getElementById('btn-cloud-load'); btn.innerText = "Loading..."; btn.disabled = true; try { const docSnap = await getDoc(doc(dbFirestore, "builds", codeInput)); if (docSnap.exists()) deserializeLoadout(docSnap.data()); else alert("Code not found!"); } catch (e) { alert("Failed to load."); } finally { btn.innerText = "Load"; btn.disabled = false; } }
function downloadLocal() { const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(serializeLoadout())); const downloadAnchorNode = document.createElement('a'); downloadAnchorNode.setAttribute("href", dataStr); downloadAnchorNode.setAttribute("download", "pc_build.json"); document.body.appendChild(downloadAnchorNode); downloadAnchorNode.click(); downloadAnchorNode.remove(); }
function uploadLocal(event) { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function(e) { try { deserializeLoadout(JSON.parse(e.target.result)); } catch(err) { alert("Invalid JSON file."); } }; reader.readAsText(file); event.target.value = ''; }

document.addEventListener('DOMContentLoaded', init);
