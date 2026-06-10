/**
 * Mac Architect PC Simulator Engine
 * Features: Cloud Sync, Overclocking, Advanced Filtering & Sorting, Smart Search
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyAk0Ty1REKW99i3c7z3MMjpe8fN_PnKYp8",
    authDomain: "pc-building-project-fa8b6.firebaseapp.com",
    projectId: "pc-building-project-fa8b6",
    storageBucket: "pc-building-project-fa8b6.firebasestorage.app",
    messagingSenderId: "16604726972",
    appId: "1:16604726972:web:370c1e1718db4c033241b9",
    measurementId: "G-XNK2QCJ85E"
};

let dbFirestore = null;
try {
    if (firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" && firebaseConfig.apiKey !== "") {
        const app = initializeApp(firebaseConfig);
        dbFirestore = getFirestore(app);
    }
} catch (e) {
    console.error("Firebase init failed:", e);
}

let db = { categories: [], items: {} };

const state = {
    currency: 'USD',
    exchangeRate: 16000,
    searchQuery: '',
    platform: null, 
    requiredSocket: null, 
    requiredRamType: null,
    ramQuantity: 2, 
    isOverclocked: false,
    filters: {},
    loadout: { 
        cpu: null, cooler: null, mobo: null, ram: null, gpu: null, 
        ssd: [], hdd: [], case_fan: [], psu: null 
    }
};

const MULTI_SLOT_CATEGORIES = ['ssd', 'hdd', 'case_fan'];

// 1. Core Initialization
async function init() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error("Failed to load JSON");
        db = await response.json();
        
        db.categories.forEach(cat => {
            state.filters[cat.id] = { brand: 'All', sort: 'default' };
        });

        setupEventListeners();
        renderInventory();
        renderBlueprint();
        updateMetrics();
    } catch (error) {
        console.error(error);
        document.getElementById('component-accordion').innerHTML = 
            `<div style="color:var(--accent-red); padding:1rem;">ERROR: Could not load data.json. Ensure you are running a local server.</div>`;
    }
}

function setupEventListeners() {
    document.getElementById('currency-toggle').addEventListener('click', toggleCurrency);
    
    document.getElementById('search-box').addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase();
        renderInventory();
    });
    
    document.querySelectorAll('.btn-platform').forEach(btn => {
        btn.addEventListener('click', (e) => setPlatform(e.target.dataset.platform));
    });

    document.getElementById('btn-overclock').addEventListener('click', toggleOverclock);

    // Modal UI Listeners
    document.getElementById('btn-open-sync').addEventListener('click', () => {
        document.getElementById('sync-modal').classList.remove('hidden');
    });
    document.getElementById('btn-close-sync').addEventListener('click', () => {
        document.getElementById('sync-modal').classList.add('hidden');
    });

    // Cloud & Local Sync Listeners
    document.getElementById('btn-cloud-save').addEventListener('click', saveToCloud);
    document.getElementById('btn-cloud-load').addEventListener('click', loadFromCloud);
    document.getElementById('btn-local-download').addEventListener('click', downloadLocal);
    document.getElementById('btn-local-upload').addEventListener('click', () => document.getElementById('file-upload-input').click());
    document.getElementById('file-upload-input').addEventListener('change', uploadLocal);
}

// 2. Data Serialization Engine
function serializeLoadout() {
    return {
        cpu: state.loadout.cpu?.id || null,
        cooler: state.loadout.cooler?.id || null,
        mobo: state.loadout.mobo?.id || null,
        ram: state.loadout.ram?.id || null,
        ramQuantity: state.ramQuantity,
        gpu: state.loadout.gpu?.id || null,
        psu: state.loadout.psu?.id || null,
        ssd: state.loadout.ssd.map(i => i.id),
        hdd: state.loadout.hdd.map(i => i.id),
        case_fan: state.loadout.case_fan.map(i => i.id),
        isOverclocked: state.isOverclocked
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
        if (state.isOverclocked) {
            ocBtn.classList.add('active');
            ocBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Overclock: ON`;
        } else {
            ocBtn.classList.remove('active');
            ocBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Overclock: OFF`;
        }
    }
    
    ['ssd', 'hdd', 'case_fan'].forEach(cat => {
        if (data[cat]) {
            data[cat].forEach(id => {
                const item = findItem(cat, id);
                if (item) {
                    state.loadout[cat].push({ ...item, instanceId: Date.now().toString() + Math.random().toString() });
                }
            });
        }
    });

    if (state.loadout.cpu) {
        state.platform = state.loadout.cpu.brand;
        state.requiredSocket = state.loadout.cpu.socket;
        document.querySelectorAll('.btn-platform').forEach(btn => {
            btn.classList.remove('active-intel', 'active-amd');
            if(btn.dataset.platform === state.platform) btn.classList.add(state.platform === 'INTEL' ? 'active-intel' : 'active-amd');
        });
    } else {
        state.platform = null; state.requiredSocket = null;
        document.querySelectorAll('.btn-platform').forEach(btn => btn.classList.remove('active-intel', 'active-amd'));
    }
    
    state.requiredRamType = state.loadout.mobo ? state.loadout.mobo.type : null;

    renderInventory(); renderBlueprint(); updateMetrics();
    document.getElementById('sync-modal').classList.add('hidden');
}

async function saveToCloud() {
    if (!dbFirestore) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase(); 
    const payload = serializeLoadout();
    const btn = document.getElementById('btn-cloud-save');
    btn.innerText = "Saving..."; btn.disabled = true;

    try {
        await setDoc(doc(dbFirestore, "builds", code), payload);
        document.getElementById('cloud-code-display').classList.remove('hidden');
        document.getElementById('generated-code').innerText = code;
    } catch (e) {
        alert("Failed to save to cloud.");
    } finally {
        btn.innerText = "Generate Build Code"; btn.disabled = false;
    }
}

async function loadFromCloud() {
    if (!dbFirestore) return;
    const codeInput = document.getElementById('input-cloud-code').value.toUpperCase().trim();
    if (codeInput.length !== 6) return;

    const btn = document.getElementById('btn-cloud-load');
    btn.innerText = "Loading..."; btn.disabled = true;

    try {
        const docSnap = await getDoc(doc(dbFirestore, "builds", codeInput));
        if (docSnap.exists()) deserializeLoadout(docSnap.data());
        else alert("Build code not found!");
    } catch (e) {
        alert("Failed to connect to cloud.");
    } finally {
        btn.innerText = "Load from Cloud"; btn.disabled = false;
    }
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


// --- CORE LOGIC BELOW ---
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

    renderInventory(); renderBlueprint(); updateMetrics();
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

function checkCompatibility(catId, item) {
    if (catId === 'cpu' && state.platform && item.brand !== state.platform) return false;
    if (catId === 'mobo' && state.requiredSocket && item.socket !== state.requiredSocket) return false;
    if (catId === 'ram' && state.requiredRamType && item.type !== state.requiredRamType) return false;
    return true;
}

function updateCompatibilityAlert() {
    const alertBox = document.getElementById('compatibility-alert');
    if (!alertBox) return;
    let msgs = [];
    if (!state.platform) msgs.push("Awaiting Platform Selection (Intel/AMD).");
    else {
        if (!state.loadout.cpu) msgs.push(`Platform: ${state.platform}. Select a CPU.`);
        if (state.loadout.cpu && !state.loadout.mobo) msgs.push(`Socket Locked: ${state.requiredSocket}. Select Motherboard.`);
        if (state.loadout.mobo && !state.loadout.ram) msgs.push(`RAM Locked: ${state.requiredRamType}. Select Memory.`);
    }

    if (msgs.length > 0) { alertBox.innerHTML = msgs.join("<br>"); alertBox.classList.add('visible'); } 
    else { alertBox.classList.remove('visible'); }
}

window.setFilter = function(catId, type, value) {
    state.filters[catId][type] = value;
    renderInventory();
}

// --- NEW SMART SEARCH ENGINE ---
function smartSearchMatch(item, query) {
    if (!query.trim()) return true;
    
    const searchableText = `${item.name} ${item.brand || ''} ${item.socket || ''} ${item.type || ''}`.toLowerCase();
    
    let cleanQuery = query.toLowerCase()
        .replace(/\b(gen|generation)\b/g, ' ')
        .replace(/(\d+)(th|nd|rd|st)\b/g, '$1');
        
    const terms = cleanQuery.split(/\s+/).filter(t => t.length > 0);
    
    return terms.every(term => searchableText.includes(term));
}

function renderInventory() {
    updateCompatibilityAlert();
    const container = document.getElementById('component-accordion');
    if (!container) return;
    const openTabs = Array.from(document.querySelectorAll('.category-block.active')).map(b => b.dataset.cat);
    container.innerHTML = '';

    db.categories.forEach(cat => {
        let validItems = (db.items[cat.id] || []).filter(item => 
            smartSearchMatch(item, state.searchQuery) && checkCompatibility(cat.id, item)
        );

        const currentFilter = state.filters[cat.id];
        const brands = ['All', ...new Set(validItems.map(i => i.brand || i.name.split(' ')[0]))];

        if (currentFilter.brand !== 'All') {
            validItems = validItems.filter(i => (i.brand || i.name.split(' ')[0]) === currentFilter.brand);
        }

        if (currentFilter.sort === 'price_asc') {
            validItems.sort((a, b) => a.priceUsd - b.priceUsd);
        } else if (currentFilter.sort === 'price_desc') {
            validItems.sort((a, b) => b.priceUsd - a.priceUsd);
        }

        let isOpen = openTabs.includes(cat.id);
        if (state.searchQuery.trim() !== '') {
            isOpen = validItems.length > 0; 
        }

        const block = document.createElement('div');
        block.className = `category-block ${isOpen ? 'active' : ''}`;
        block.dataset.cat = cat.id;
        
        let statusText = "";
        if (cat.id === 'mobo' && state.requiredSocket) statusText = `Required: ${state.requiredSocket}`;
        if (cat.id === 'ram' && state.requiredRamType) statusText = `Required: ${state.requiredRamType}`;

        const btn = document.createElement('button');
        btn.className = 'category-btn';
        let statusBadge = statusText ? `<span class="category-status">${statusText}</span>` : '';
        btn.innerHTML = `<span>${cat.name} ${statusBadge}</span> 
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transform: rotate(${isOpen ? '180deg' : '0deg'}); transition: 0.2s;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
        btn.onclick = () => {
            if (!block.classList.contains('active')) {
                block.classList.add('active'); btn.querySelector('svg').style.transform = 'rotate(180deg)';
            } else {
                block.classList.remove('active'); btn.querySelector('svg').style.transform = 'rotate(0deg)';
            }
        };

        const listInner = document.createElement('div');
        listInner.className = 'item-list-inner';

        if (validItems.length === 0) {
            listInner.innerHTML = `<div class="item-card"><p style="color:var(--text-muted);">No compatible hardware found.</p></div>`;
        } else {
            let filterHtml = `
                <div class="filter-bar">
                    <div class="brand-chips">
                        ${brands.map(b => `<button class="chip ${currentFilter.brand === b ? 'active' : ''}" onclick="window.setFilter('${cat.id}', 'brand', '${b}')">${b}</button>`).join('')}
                    </div>
                    <select class="sort-select" onchange="window.setFilter('${cat.id}', 'sort', this.value)">
                        <option value="default" ${currentFilter.sort === 'default' ? 'selected' : ''}>Default Sort</option>
                        <option value="price_asc" ${currentFilter.sort === 'price_asc' ? 'selected' : ''}>Price: Low to High</option>
                        <option value="price_desc" ${currentFilter.sort === 'price_desc' ? 'selected' : ''}>Price: High to Low</option>
                    </select>
                </div>
            `;

            listInner.innerHTML = filterHtml;

            validItems.forEach(item => {
                const isMulti = MULTI_SLOT_CATEGORIES.includes(cat.id);
                const count = isMulti ? state.loadout[cat.id].filter(i => i.id === item.id).length : 0;
                const isEquipped = !isMulti && state.loadout[cat.id]?.id === item.id;
                
                let tags = '';
                if(item.socket) tags += `<span class="tag">${item.socket}</span>`;
                if(item.type) tags += `<span class="tag">${item.type}</span>`;
                if(item.watt) tags += `<span class="tag">${item.watt}W</span>`;
                if(item.tdp_max) tags += `<span class="tag">${item.tdp_max}W Cool</span>`;
                if(item.perf) tags += `<span class="tag">Score: ${item.perf}</span>`;

                const btnText = isMulti ? (count > 0 ? `Add (+${count})` : 'Add') : (isEquipped ? 'Equipped' : 'Equip');
                const imageFallback = `https://placehold.co/200x200/1c1c1e/86868b?text=Image`;

                const card = document.createElement('div');
                card.className = 'item-card';
                card.innerHTML = `
                    <img class="item-img" src="${item.imageUrl || imageFallback}" alt="${item.name}" loading="lazy" onerror="this.src='${imageFallback}'">
                    <div class="item-info">
                        <h4>${item.name}</h4>
                        <div class="tags">${tags}</div>
                        <p class="price-tag" data-usd="${item.priceUsd}">${formatPrice(item.priceUsd)}</p>
                    </div>
                    <button class="btn-equip ${isEquipped ? 'equipped' : ''}" onclick="window.equipItem('${cat.id}', '${item.id}')">
                        ${btnText}
                    </button>
                `;
                listInner.appendChild(card);
            });
        }

        const list = document.createElement('div');
        list.className = 'item-list';
        list.appendChild(listInner);
        block.appendChild(btn);
        block.appendChild(list);
        container.appendChild(block);
    });
}

function renderBlueprint() {
    const container = document.getElementById('loadout-slots');
    if (!container) return;
    container.innerHTML = '';

    db.categories.forEach(cat => {
        const slot = document.createElement('div');
        slot.className = 'loadout-slot';
        
        let header = `<div class="slot-header">${cat.name}</div>`;
        let innerHtml = '';

        const isMulti = MULTI_SLOT_CATEGORIES.includes(cat.id);
        
        if (isMulti) {
            const arr = state.loadout[cat.id];
            if (arr.length === 0) {
                innerHtml = `<div class="slot-empty">Awaiting hardware...</div>`;
            } else {
                arr.forEach(item => {
                    const imageFallback = `https://placehold.co/200x200/1c1c1e/86868b?text=Image`;
                    innerHtml += `
                        <div class="slot-item-row">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <img src="${item.imageUrl || imageFallback}" style="width: 36px; height: 36px; border-radius: 6px; object-fit: contain; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.05); flex-shrink: 0;" onerror="this.src='${imageFallback}'">
                                <span class="slot-item-name">${item.name}</span>
                            </div>
                            <button class="btn-remove" onclick="window.removeMultiItem('${cat.id}', '${item.instanceId}')">Remove</button>
                        </div>
                    `;
                });
            }
        } else {
            const item = state.loadout[cat.id];
            if (!item) {
                innerHtml = `<div class="slot-empty">Awaiting hardware...</div>`;
            } else {
                let modifier = '';
                if (cat.id === 'ram') {
                    modifier = `
                        <div class="ram-controls">
                            <button class="ram-btn" onclick="window.changeRamQty(-1)">-</button>
                            <span style="font-size:0.85rem; font-weight:600;">${state.ramQuantity}x</span>
                            <button class="ram-btn" onclick="window.changeRamQty(1)">+</button>
                        </div>
                    `;
                }
                
                const imageFallback = `https://placehold.co/200x200/1c1c1e/86868b?text=Image`;
                innerHtml = `
                    <div class="slot-item-row">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="${item.imageUrl || imageFallback}" style="width: 36px; height: 36px; border-radius: 6px; object-fit: contain; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.05); flex-shrink: 0;" onerror="this.src='${imageFallback}'">
                            <span class="slot-item-name">${item.name} ${modifier}</span>
                        </div>
                        <button class="btn-remove" onclick="window.removeSingleItem('${cat.id}')">Remove</button>
                    </div>
                `;
            }
        }

        slot.innerHTML = header + innerHtml;
        container.appendChild(slot);
    });
}

window.equipItem = function(categoryId, itemId) {
    const item = {...db.items[categoryId].find(i => i.id === itemId)};
    
    if (MULTI_SLOT_CATEGORIES.includes(categoryId)) {
        item.instanceId = Date.now().toString() + Math.random().toString();
        state.loadout[categoryId].push(item);
    } else {
        state.loadout[categoryId] = item;
        if (categoryId === 'cpu') {
            state.requiredSocket = item.socket;
            if (state.loadout.mobo && state.loadout.mobo.socket !== item.socket) {
                state.loadout.mobo = null; state.requiredRamType = null; state.loadout.ram = null;
            }
        }
        if (categoryId === 'mobo') {
            state.requiredRamType = item.type;
            if (state.loadout.ram && state.loadout.ram.type !== item.type) state.loadout.ram = null;
        }
    }
    renderInventory(); renderBlueprint(); updateMetrics();
};

window.removeSingleItem = function(categoryId) {
    state.loadout[categoryId] = null;
    if (categoryId === 'cpu') {
        state.requiredSocket = null; state.loadout.mobo = null;
        state.requiredRamType = null; state.loadout.ram = null;
    }
    if (categoryId === 'mobo') {
        state.requiredRamType = null; state.loadout.ram = null;
    }
    renderInventory(); renderBlueprint(); updateMetrics();
};

window.removeMultiItem = function(categoryId, instanceId) {
    state.loadout[categoryId] = state.loadout[categoryId].filter(i => i.instanceId !== instanceId);
    renderInventory(); renderBlueprint(); updateMetrics();
};

window.changeRamQty = function(delta) {
    let newQty = state.ramQuantity + delta;
    if (newQty >= 1 && newQty <= 4) {
        state.ramQuantity = newQty;
        renderBlueprint(); updateMetrics();
    }
};

function toggleCurrency() {
    state.currency = state.currency === 'USD' ? 'IDR' : 'USD';
    document.getElementById('currency-toggle').innerText = state.currency === 'USD' ? 'USD ($)' : 'IDR (Rp.)';
    document.querySelectorAll('.price-tag').forEach(tag => {
        tag.innerText = formatPrice(parseFloat(tag.getAttribute('data-usd')));
    });
    updateMetrics();
}

function formatPrice(usdPrice) {
    if (state.currency === 'USD') return `$${usdPrice.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    return `Rp ${(usdPrice * state.exchangeRate).toLocaleString('id-ID')}`;
}

function updateDot(id, statusClass) {
    const el = document.getElementById(id);
    if(el) el.className = `status-dot ${statusClass}`;
}

function updateMetrics() {
    let totalUsd = 0;
    let sysWattage = 50; 
    let gameScore = 0;

    const { cpu, cooler, gpu, ram, psu } = state.loadout;

    // OVERCLOCK MULTIPLIERS (Wattage up 20%, Perf up 8%)
    const ocWattMult = state.isOverclocked ? 1.20 : 1.0;
    const ocPerfMult = state.isOverclocked ? 1.08 : 1.0;

    Object.keys(state.loadout).forEach(key => {
        if (MULTI_SLOT_CATEGORIES.includes(key)) {
            state.loadout[key].forEach(item => {
                totalUsd += item.priceUsd;
                sysWattage += (item.watt || 0);
            });
        } else {
            const item = state.loadout[key];
            if (item) {
                let multiplier = (key === 'ram') ? state.ramQuantity : 1;
                totalUsd += (item.priceUsd * multiplier);
                
                if (key !== 'psu' && item.watt) {
                    if (key === 'cpu' || key === 'gpu') {
                        sysWattage += Math.round(item.watt * ocWattMult);
                    } else {
                        sysWattage += (item.watt * multiplier);
                    }
                }
            }
        }
    });

    if (cpu && gpu && ram) {
        let ramBonus = (state.ramQuantity >= 2) ? 1.0 : 0.85;
        let cpuP = cpu.perf * ocPerfMult;
        let gpuP = gpu.perf * ocPerfMult;

        gameScore = Math.round(((gpuP * 0.65) + (cpuP * 0.30) + ((ram.perf * ramBonus) * 0.05)) * 10);
        if (gameScore > 1000) gameScore = 1000;
    }

    const bStatus = document.getElementById('bottleneck-status');
    const bReadout = document.getElementById('bottleneck-readout');
    if (bStatus && bReadout) {
        if (cpu && gpu) {
            const cpuP = cpu.perf * ocPerfMult; 
            const gpuP = gpu.perf * ocPerfMult;

            if (gpuP > cpuP * 1.3) {
                bReadout.innerText = "Severe CPU Limit"; bStatus.innerText = "GPU Starved"; updateDot('bottleneck-dot', 'danger');
            } else if (gpuP > cpuP * 1.15) {
                bReadout.innerText = "CPU Limit"; bStatus.innerText = "GPU Waiting"; updateDot('bottleneck-dot', 'warn');
            } else if (cpuP > gpuP * 1.3) {
                bReadout.innerText = "GPU Limit"; bStatus.innerText = "CPU Overkill"; updateDot('bottleneck-dot', 'warn');
            } else {
                bReadout.innerText = "Optimal"; bStatus.innerText = "Balanced"; updateDot('bottleneck-dot', 'ok');
            }
        } else {
            bReadout.innerText = "N/A"; bStatus.innerText = "Incomplete"; updateDot('bottleneck-dot', '');
        }
    }

    const tStatus = document.getElementById('thermal-status');
    const tReadout = document.getElementById('thermal-readout');
    if(tStatus && tReadout) {
        if (cpu && cooler) {
            let currentCpuWatt = Math.round(cpu.watt * ocWattMult);
            const headroom = cooler.tdp_max - currentCpuWatt;

            if (headroom < -10) {
                tReadout.innerText = `${headroom}W Deficit`; tStatus.innerText = "Thermal Throttling"; updateDot('thermal-dot', 'danger');
            } else if (headroom < 30) {
                tReadout.innerText = `${headroom}W Clearance`; tStatus.innerText = "Warm / Loud Fans"; updateDot('thermal-dot', 'warn');
            } else {
                tReadout.innerText = `+${headroom}W Headroom`; tStatus.innerText = "Excellent Cooling"; updateDot('thermal-dot', 'ok');
            }
        } else if (cpu && !cooler) {
            tReadout.innerText = "Overheating Risk"; tStatus.innerText = "No Cooler"; updateDot('thermal-dot', 'danger');
        } else {
            tReadout.innerText = "N/A"; tStatus.innerText = "Awaiting CPU/Cooler"; updateDot('thermal-dot', '');
        }
    }

    const pStatus = document.getElementById('psu-status');
    const pReadout = document.getElementById('wattage-readout');
    const psuMax = psu ? psu.watt : 0;
    if(pReadout) pReadout.innerText = `${sysWattage} / ${psuMax} W`;

    if(pStatus) {
        if (!psu && sysWattage > 50) {
            pStatus.innerText = "Awaiting PSU"; updateDot('psu-dot', 'warn');
        } else if (psu) {
            if (sysWattage > psuMax * 0.9) {
                pStatus.innerText = "Critical Overload Risk"; updateDot('psu-dot', 'danger');
            } else if (sysWattage > psuMax * 0.75) {
                pStatus.innerText = "Efficient Load"; updateDot('psu-dot', 'ok');
            } else {
                pStatus.innerText = "Sufficient"; updateDot('psu-dot', 'ok');
            }
        } else {
            pStatus.innerText = "Awaiting Hardware"; updateDot('psu-dot', '');
        }
    }

    const totalPriceEl = document.getElementById('total-price');
    if(totalPriceEl) totalPriceEl.innerText = formatPrice(totalUsd);
    
    const gamingBarEl = document.getElementById('gaming-bar');
    if(gamingBarEl) gamingBarEl.style.width = `${(gameScore/1000)*100}%`;
    
    const gamingScoreEl = document.getElementById('gaming-score');
    if(gamingScoreEl) gamingScoreEl.innerText = `${gameScore} / 1000`;
}

document.addEventListener('DOMContentLoaded', init);
