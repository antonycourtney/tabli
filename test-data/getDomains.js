/*
 * simple, hacky node.js script to open top500Domains.csv
 * and dump the domains as JSON.
 */

const fs = require('fs');

function main() {
    let rawContents = fs.readFileSync('./top500Domains.csv', {
        encoding: 'utf-8'
    });
    let lines = rawContents.split('\n').slice(1);
    let qdomains = lines.map(line => line.split(',')[1]);
    let domains = qdomains.map(qd => (qd ? qd.split('"')[1] : ''));
    let obj = { domains };
    fs.writeFileSync('./top500Domains.json', JSON.stringify(obj, null, 2));
    console.log(obj);
}

main();
