/*
 * paste planet coords
 */
const inputs = Array.from(document.querySelectorAll('.coordsInput input[type="number"]'));
const submit = document.querySelector('.coordsInput input[type="Submit"]') || document.querySelector('#dgt-scan-next-button')
inputs[0] && inputs[0].addEventListener('paste', (event) => {
    const values = (event.clipboardData || window.clipboardData).getData("text").split('.');
    if (values.length === 4) {
        values.forEach((v, idx) => {
            inputs[idx].value = v;
        });
        submit && submit.focus();
    }
    event.preventDefault();
    event.stopPropagation();
    return false;
});
const updateCoordinateValue = function() {
    var inputField = document.querySelector('input[name="coordinate.3"]');
    var currentValue = parseInt(inputField.value, 10);

    if (currentValue < 12) {
        currentValue++;
    } else {
        currentValue = 1;
    }

    inputField.value = currentValue;
}

const ajaxScan = function () {
    document.getElementById('ajaxScanBt').disabled = true;

    fetch(document.querySelector("form").getAttribute("action"), {
        method: 'POST',
        body: new URLSearchParams(new FormData(document.querySelector("form"))),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
        .then(response => response.text()) // or response.json() if the response is JSON
        .then(data => {
            // Handle success
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, 'text/html');
            const jsonPageData = getJsonPageData(doc);
            const processor = ScanProcessorFactory.factory(jsonPageData.scanType, jsonPageData.turnNumber);
            processor.parse(jsonPageData.scanResult, false);

            // last #planetHeader in page (works on scan page and news page)
            const scanContainer = Array.from(doc.querySelectorAll('#planetHeader')).pop();
            const scanHeader = scanContainer ? scanContainer.parentNode.querySelector('.header') : null; // scan result header
            const planetName = scanContainer ? scanContainer.querySelector('.planetName') : null;
            const imgContainer = scanContainer ? scanContainer.querySelector('#planetImage') : null;
            const ownerContainer = scanContainer ? scanContainer.querySelector('.planetHeadSection:nth-child(3)') : null;

            /*
             * Workers capacity
             */
            if (processor.type === ScanProcessor.TYPE_SURFACE_SCAN && scanContainer) {
                const popPattern = /([\d,]+)\s+\/\s+([\d,]+)\s+\(([\d,]+)\s+available\)/; // will split population  data ex: '52,126 / 100,000 (47,126 available)'
                scanContainer.querySelectorAll('.resource img').forEach((el) => {
                    const resText = el.closest('.resource').innerText;
                    const resType = el.getAttribute('title');
                    if (resType.match(/Workers/) && popPattern.test(resText)) {
                        const [, total, housing, available] = resText.match(popPattern);
                        processor.setHouseingCapacity(parseValue(housing));
                    }
                });
            }

            let exportXLSData =processor.exportXls();
            navigator.clipboard.writeText(exportXLSData);
            globalMessage('Data copied to cliboard!');
            console.log(exportXLSData);
            updateCoordinateValue();
            document.getElementById('ajaxScanBt').disabled = false;
        })
        .catch(error => {
            // Handle errors
            console.error('Error:', error);
        });
}


let divSubmit = submit.parentNode;
divSubmit.insertAdjacentHTML('afterend', '<div class="right"><input type="button" style="width: 140px" id="ajaxScanBt" value="AJAX Scan and next"></div>');
document.querySelector('#ajaxScanBt').addEventListener('click', ajaxScan);
