const fs = require('fs');
const Decisions = require('./utils/decisions.js');

function readInputFile(path) {
    let board = [];
    let availTiles = [];

    let data = fs.readFileSync(path, 'ascii');

    let input = data.split('\n');
    board = input.slice(0, -1);
    board = board.map(line => line.split(''))
    availTiles = input.slice(-1)[0].split('');

    return [board, availTiles];
}

(function main() {
    const [input, availTiles] = readInputFile(process.argv[2]);
    const decisions = new Decisions(input, availTiles);
    let word = decisions.bestDecision();
    fs.writeFile(
        process.argv[2] + '.answer',
        word ? `(${word.x},${word.y},${word.word},${word.vertical})` : 'error', (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });
})()