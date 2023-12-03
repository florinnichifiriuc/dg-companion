/**
 * Total score
 *
 * @TODO wait time wizard
 * @TODO transfer all in fleet transfer page
 * @TODO 9999 link in fleet transfer page
 */

const shipPattern = /([\d,]+)x\s(.*)/; // 6,123x Fighter
const scoreTemplate = (unitScore, label) => `
    <span class="score neutral right"><em>${formatNumber(unitScore.toFixed(2))}</em> ${label}</span>
`;

const fleetComposition = [];
const [totalScore, wfScore] = Array.from(document.querySelectorAll('#contentBox .fleetRight .entry'))
    .reduce((carry, item) => {
        if (shipPattern.test(item.innerText)) {
            const [, cnt, name] = item.innerText.match(shipPattern);
            const ss = parseValue(cnt) * getItemScoreByName(name);
            fleetComposition.push({
                cnt: cnt,
                name: name,
            });
            carry[0] += ss;
            if (getItemByName(name).warfleet) {
                carry[1] += ss;
            }
            item.querySelector('div:last-child').insertAdjacentHTML('beforeend', `${scoreTemplate(ss, 'score')}`);
        }
        return carry;
    }, [0, 0]);
document.querySelector('#contentBox .right.fleetRight') &&
document.querySelector('#contentBox .right.fleetRight')
    .insertAdjacentHTML('beforeend', `
        <div class="right ofHidden lightBorder opacDarkBackground seperator seperatorLeft fleetRight"> 
            <div class="header border">
                <img src="/images/buttons/construction.png" class="icon" width="28" height="29">
                Score
            </div> 
            <div class="entry opacBackground" style="line-height: 24px; padding: 4px"> 
                <span class="left">WarFleet only</span>                 
                <span class="right">${scoreTemplate(wfScore, 'score')}</span> 
            </div> 
            <div class="entry opacLightBackground" style="line-height: 24px; padding: 4px"> 
                <span class="left">Total</span>                 
                <span class="right">${scoreTemplate(totalScore, 'score')}</span> 
            </div> 
       </div>
    `);

/*
 * 999999
 */
Array.from(document.querySelectorAll('.fleetLeft .transferRow')).forEach((row) => {
    row.insertAdjacentHTML('beforeend', `<div class="left"><span class="add-max-icon" title="Click to fill max value"></span></div>`);
    row.addEventListener('click', e => {
        if (e.target.classList.contains('add-max-icon')) {
            const input = row.querySelector('input').value = MAX_INPUT_VALUE;
        }
    });
});
Array.from(document.querySelectorAll('.fleetLeft .tableHeader')).forEach((row) => {
    if (/Amount/.test(row.innerText)) {
        row.querySelector(':last-child').insertAdjacentHTML('beforeend', `<span class="add-max-icon" title="Click to fill max value for all rows"></span>`);
        row.addEventListener('click', e => {
            if (e.target.classList.contains('add-max-icon')) {
                Array.from(row.parentNode.querySelectorAll('.transferRow input')).forEach((item) => {
                    item.value = MAX_INPUT_VALUE;
                });
            }
        });
    }
});


/*
 * copy/paste summary
 */
const fleetHeader = String(document.querySelector('#contentBox > .header').innerText);
const [, fleetName] = (fleetHeader && /Fleet List -[\s«]+(.*)[»]?/i.exec(fleetHeader)) || ['', ''];
const fleetActivity = cleanText(document.querySelector('#contentBox .fleetRight > .fleetRight .entry') && document.querySelector('#contentBox .fleetRight > .fleetRight .entry').innerText || '');
const fleetScore = `Score: ${formatNumber(totalScore)} / wf: ${formatNumber(wfScore)}`;
const fleetCompositionStr = fleetComposition.reduce((carry, fl) => carry + `${pe(fl.name, 13)} ${ps(fl.cnt, 6)}\n`, ``);
const fleetQueue = Array.from(document.querySelectorAll('#fleetQueue .entry .nameColumn'));
const fleetQueueStr = fleetQueue.reduce((carry, el) => carry + cleanText(el.innerText) + "\n", '');

document.querySelector('#contentBox > .header')
    .insertAdjacentHTML('afterbegin', `
        <span class="right copy-hint cursor-pointer">Click to copy to clipboard</span>
    `);
document.querySelector('#contentBox .copy-hint')
    .addEventListener('click', e => {
        e.preventDefault();
        copyToClipboard(textStats(), 'Fleet summary copied to clipboard!', e.target);
        return false;
    });
const txtBorder = '====================';
const txtSpacer = '--------------------';
const textStats = () => `
${txtBorder}
Turn: ${currentTurn()} / Fleet: "${fleetName.trim()}"
${fleetActivity} 
${fleetScore}
${txtSpacer}
${fleetCompositionStr.trim()}
${txtSpacer}
Full queue:
${fleetQueueStr.trim()}
${txtBorder}
`;

console.log(textStats());

function insertTotalFleetPanel(fleetComposition) {
    const fleetCompositionObj = fleetComposition.reduce((carry, fl) => {
        carry[fl.name] = parseInt(fl.cnt.replace(',', ''));
        return carry;
    }, {});
// method to store all the ships in local storage and use it to calculate all total per multiple fleet pages
    const getAllFleet = () => {
        const items = JSON.parse(localStorage.getItem('fleetData')) || {};
        return items || {};
    }
    const setFleetByName = (name, data) => {
        const items = JSON.parse(localStorage.getItem('fleetData')) || {};
        items[name] = data;
        localStorage.setItem('fleetData', JSON.stringify(items));
    }
    const clearAllFleet = () => {
        localStorage.removeItem('fleetData');
    }
    // clear only a fleet by name from local storage
    const clearFleetByName = (name) => {
        const items = JSON.parse(localStorage.getItem('fleetData')) || {};
        delete items[name];
        localStorage.setItem('fleetData', JSON.stringify(items));
    }

// add a total fleet section
    setFleetByName(fleetName.trim(), fleetCompositionObj);

    const exportXls = (allFleet) => {
        const data = [allFleet['Soldier'], allFleet['Invasion Ship'], allFleet['Fighter'], allFleet['Bomber'], allFleet['Frigate'], allFleet['Destroyer'], allFleet['Cruiser'], allFleet['Battleship'], allFleet['Worker']];
        return data.join("\t"); // tabs will go to next cell
    }
    const exportText = (allFleet) => {
        const data = [];
        const fleet = getAllFleet();
        // GO TO ALL FLEETS and sum all the ships in fleet
        // ignore all the key and just get the values of the object fleet as array
        let totalFleets = Object.keys(fleet).length
        data.push(ps(` Total fleets ${totalFleets}`, 23, '='));
        data.push(ps(``, 23, '-'));
        data.push(pe('Soldiers', 13) + ps(allFleet['Soldier'], 6));
        data.push(pe('Invasion Ships', 13) + ps(allFleet['Invasion Ship'], 6));
        data.push(pe('Fighters', 13) + ps(allFleet['Fighter'], 6));
        data.push(pe('Bombers', 13) + ps(allFleet['Bomber'], 6));
        data.push(pe('Frigates', 13) + ps(allFleet['Frigate'], 6));
        data.push(pe('Destroyers', 13) + ps(allFleet['Destroyer'], 6));
        data.push(pe('Cruisers', 13) + ps(allFleet['Cruiser'], 6));
        data.push(pe('Battleship', 13) + ps(allFleet['Battleship'], 6));
        data.push(pe('Workers', 13) + ps(allFleet['Worker'], 6));
        data.push(ps(``, 23, '-'));
        return data.join("\n"); // tabs will go to next cell
    }
    const textAllFleets = () => {
        let allFleet = {};
        const fleet = getAllFleet();
        // GO TO ALL FLEETS and sum all the ships in fleet
        // ignore all the key and just get the values of the object fleet as array
        Object.values(fleet).reduce((carry, fl) => {
            // go through all the keys of the object fl and sum the values
            Object.keys(fl).forEach((key) => {
                if (!carry[key]) {
                    carry[key] = 0;
                }
                carry[key] += fl[key];
            });
            return carry;
        }, allFleet);
        // export in this order Soldiers	Invasion Ships	Fighters	Bombers	Frigates	Destroyers	Cruisers	Battleship	Workers	Planet limit
        if (!allFleet['Soldier']) allFleet['Soldier'] = 0;
        if (!allFleet['Invasion Ship']) allFleet['Invasion Ship'] = 0;
        if (!allFleet['Fighter']) allFleet['Fighter'] = 0;
        if (!allFleet['Bomber']) allFleet['Bomber'] = 0;
        if (!allFleet['Frigate']) allFleet['Frigate'] = 0;
        if (!allFleet['Destroyer']) allFleet['Destroyer'] = 0;
        if (!allFleet['Cruiser']) allFleet['Cruiser'] = 0;
        if (!allFleet['Battleship']) allFleet['Battleship'] = 0;
        if (!allFleet['Worker']) allFleet['Worker'] = 0;
        return allFleet;
    }
    const allFleet = textAllFleets();

    const shipTemplate = (name, count) => `
        <tr class="opacBackground lightBorderBottom">
            <td class="padding">${name}</td>
            <td class="padding" style="width:70px;text-align:right;">${count}</td>
        </tr>
    `;
    const allShipsTemplate = (allFleet) => {
        const shipsOrderData = ['Soldier', 'Invasion Ship', 'Fighter', 'Bomber', 'Frigate', 'Destroyer', 'Cruiser', 'Battleship', 'Worker'];
        const fleet = getAllFleet();
        const nrOfFleets = Object.keys(fleet).length;
        const tplHeader = `
            <div class="opacLightBackground ofHidden padding">
                <div class="allied">
                    <div class="allianceName">My total fleet for ${nrOfFleets} fleets</div>                         
                     <span class="right copyPaste">
                            <span class="xls"><i class="icon"></i> sheet</span>
                            <span class="chat"><i class="icon"></i> chat</span>
                            <span class="copy-style  add-delete-icon" title="Delete cache"><i class="deleteIcon"></i>Delete all</span>
                    </span>
                </div>
            </div>
        `;

        // include ships that are in my predefined order and exists in the global fleet scan (shipsInScan)
        let tplBody = shipsOrderData.reduce((carry, name) => {
            return carry + shipTemplate(name, allFleet[name] || '0');
        }, '');
        // include ships that are in my predefined order and exists in the global fleet scan (shipsInScan)
        let tplFleetsBody = Object.keys(fleet).reduce((carry, name) => {
            return carry + shipTemplate(name,
                `
                        <span class="delete copyPaste hostile" data-name="${name}">
                            <i class="deleteIcon"></i> delete
                        </span>
                        `);
        }, '');


        return `
            <div class="lightBorder column">
                ${tplHeader}
                 <table class="left"><tbody>
                    ${tplFleetsBody}
                </tbody></table>
                <table class="right"><tbody>
                    ${tplBody}
                </tbody></table>               
            </div>
             <div class="score-container neutral opacLightBackground">
                   
                </div>
        `;
    }
    document.querySelector('#contentBox .right.fleetRight').insertAdjacentHTML('beforeend',  `
            <div class="lightBorder ofHidden opacDarkBackground fleetscanTotals">           
                <div class="header border">Fleet Total              
                 </div>
                <div class="d-flex">
                    ${allShipsTemplate(allFleet)}
                </div>        
            </div>
        `);

    document.querySelectorAll('#contentBox .delete.copyPaste').forEach((row) => {
        row.addEventListener('click', e => {
            e.preventDefault();

            let element = e.target;
            let name = element.getAttribute('data-name');
            clearFleetByName(name);
            globalMessage('Fleet ' + name + ' deleted! Refresh page to see the changes');
            if (element) {
                element.classList.toggle('content-copied');
                setTimeout(() => element.classList.toggle('content-copied'), 500);
            }
            return false;
        });
    });
    document.querySelector('#contentBox .copyPaste .xls')
        .addEventListener('click', e => {
            e.preventDefault();
            let exportXLSData = exportXls(allFleet);
            copyToClipboard(exportXLSData, 'Fleet totals copied to clipboard!', e.target);
            return false;
        });
    console.log(exportText(allFleet));
    document.querySelector('#contentBox .copyPaste .chat')
        .addEventListener('click', e => {
            e.preventDefault();
            let exportTextData = exportText(allFleet);
            copyToClipboard(exportTextData, 'Fleet totals copied to clipboard!', e.target);
            return false;
        });

    document.querySelector('#contentBox .add-delete-icon')
        .addEventListener('click', e => {
            clearAllFleet();
            globalMessage('Cache deleted!');
            let element = e.target;
            if (element) {
                element.classList.toggle('content-copied');
                setTimeout(() => element.classList.toggle('content-copied'), 500);
            }
        });

}

if (document.querySelector('#current-action')) {
    insertTotalFleetPanel(fleetComposition);
}