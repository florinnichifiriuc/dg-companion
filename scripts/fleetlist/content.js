/**
 * Quick filters + quick search
 * 
 * @TODO enable group by prefix (remember option in storage)
 */

const coordsPattern = /(\d+)\.(\d+)\.(\d+).(\d+)[\s](.*)/;
const searchMinLength = 3; // search only if atleast 3 chars

const header = document.querySelector('#contentBox > .header');
const listPlanets = Array.from(document.querySelectorAll('#contentBox .entry .coords'));
const listFleets = Array.from(document.querySelectorAll('#contentBox .entry'));

/*
 * Index all fleets & planets
 */

const planets = {
    neutral: {},
    neutralSorted: [],
    hostile: {},
    hostileSorted: [],
    friendly: {},
    friendlySorted: [],
    allied: {},
    alliedSorted: [],
    sectors: {},
    sectorsSorted: [],
    systems: {},
    systemsSorted: [],
};

const parsePlanet = (el) => {
    let id = el.innerText;
    let sys = el.innerText;
    let sec = el.innerText;
    if (el.innerText.match(coordsPattern)) {
        const [, x, y, z, w, name] = coordsPattern.exec(el.innerText);
        id = ['p', x, y, z, w].join('-');
        sys = [x, y, z].join('.');
        sec = [x, y].join('.');
    }
    return {
        id: id,
        sys: sys,
        sec: sec,
        name: el.innerText,
        type: '',
    }
}

listPlanets.forEach((el) => {
    const pl = parsePlanet(el);
    const type = getSchemeType(el);
    pl.type = type;
    planets[type] || (planets[type] = {});
    planets[type][pl.id] = pl;
    planets.sectors['sec-' + pl.sec] = pl.sec;
    planets.systems['sys-' + pl.sys] = pl.sys;
    const row = el.closest('.entry');
    row.classList.add(pl.id);
    row.classList.add('t-' + type);
    row.classList.add('sec-' + pl.sec);
    row.classList.add('sys-' + pl.sys);
    if (row.innerText.match(/Moving\sfrom/)) {
        row.classList.add('t-moving');
    } else if (row.innerText.match(/Waiting\sat/)) {
        row.classList.add('t-waiting');
    }
});
Object.entries(planets.neutral).forEach((a) => planets.neutralSorted.push(a[1]));
Object.entries(planets.hostile).forEach((a) => planets.hostileSorted.push(a[1]));
Object.entries(planets.friendly).forEach((a) => planets.friendlySorted.push(a[1]));
Object.entries(planets.allied).forEach((a) => planets.alliedSorted.push(a[1]));
Object.entries(planets.sectors).forEach((a) => planets.sectorsSorted.push(a[1]));
Object.entries(planets.systems).forEach((a) => planets.systemsSorted.push(a[1]));
planets.neutralSorted.sort((a, b) => a.id.localeCompare(b.id));
planets.hostileSorted.sort((a, b) => a.id.localeCompare(b.id));
planets.friendlySorted.sort((a, b) => a.id.localeCompare(b.id));
planets.alliedSorted.sort((a, b) => a.id.localeCompare(b.id));
planets.sectorsSorted.sort();
planets.systemsSorted.sort();


/*
 * Build filter & search form
 */

const radioOption = (label, value, selected) => {
    return `<label for="id-qf-${value}">
                <input type="radio" name="quickFilter" class="filter" id="id-qf-${value}" value="${value}" ${selected}/>
                <span class="label">${label}</span>
            </label>`;
};

const buildPlanetOptionsHtml = (planetsSorted) => {
    let itemsHtml = '';
    planetsSorted.forEach((o) => {
        itemsHtml += `
            <option value="${o.id}">${o.name}</options>
        `;
    });
    return itemsHtml;
}

const buildOptionsHtml = (pre, items) => {
    let itemsHtml = '';
    items.forEach((label) => {
        itemsHtml += `<option value="${pre}-${label}">${label}</options>`;
    });
    return itemsHtml;
}

if (header) {
    header.classList.add('d-flex');
    header.insertAdjacentHTML('beforeend', `
        <span id="quick-filter">
            <button id="id-qf-reset">Reset</button>
            <label for="id-qf-planet">                
                <select id="id-qf-planet" class="filter" placeholder="Filter by planet">
                    <option selected>Filter by planet</option>
                    <optgroup label="Friendly">
                        ${buildPlanetOptionsHtml(planets.friendlySorted)}
                    </optgroup>
                    <optgroup label="Allied">
                        ${buildPlanetOptionsHtml(planets.alliedSorted)}
                    </optgroup>
                    <optgroup label="Hostile">
                        ${buildPlanetOptionsHtml(planets.hostileSorted)}
                    </optgroup>
                    <optgroup label="Neutral">
                        ${buildPlanetOptionsHtml(planets.neutralSorted)}
                    </optgroup>
                </select>
            </label>
             <label for="id-qf-sect">                
                <select id="id-qf-sect" class="filter" placeholder="by sector">
                    <option selected>by sector</option>
                    ${buildOptionsHtml('sec', planets.sectorsSorted)}
                </select>
            </label>  
            ${radioOption('Fleets waiting', 't-waiting')}
            ${radioOption('Hostile planets', 't-hostile')}
        </span>
        <span id="quick-search">
            <input id="input-quick-search" class="filter" type="text" name="quickSearch" value="" placeholder="Quick search..." />
        </span>
    `);
}


/*
 * Run filters & search
 */

const elSearchInput = document.querySelector('#input-quick-search');
const elFiltersContainer = document.querySelector('#quick-filter');
const elResetFilters = document.querySelector('#quick-filter #id-qf-reset');
const allFilters = header.querySelectorAll('.filter');

const resetFleets = () => listFleets.forEach((el) => toggleElement(el, true));
const searchFleets = (search) => {
    const searchPattern = new RegExp(search, 'gi');
    listFleets.forEach((el) => toggleElement(el, el.innerText.match(searchPattern)));
};

elResetFilters.addEventListener('click', () => { resetFilters(allFilters); resetFleets(); });
elFiltersContainer.addEventListener('input', (event) => {
    resetFilters(allFilters, event.target);
    resetFleets();
    const filterByValue = event.target.value;
    listFleets.forEach((el) => toggleElement(el, el.classList.contains(filterByValue)));
});
elSearchInput.addEventListener('keydown', (event) => {
    if (event.keyCode == 27) {
        resetFilters(allFilters);
        resetFleets();
    }
});
elSearchInput.addEventListener('input', (event) => {
    resetFilters(allFilters, event.target);
    const search = event.target.value;
    if (String(search).length >= searchMinLength) {
        searchFleets(search);
    } else {
        resetFleets();
    }
});