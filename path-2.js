const fs = require('fs');
const PF = require('pathfinding');
const readline = require('readline');

class PathFinder {
    constructor(start = [0, 0], treasure = [], reefs = [], maxRow = 10, maxCol = 10) {
        this.reefs = reefs;
        this.start = start;
        this.treasure = treasure;
        this.maxRow = maxRow;
        this.maxCol = maxCol;
        this.grid = this.createGrid();
        this.sea = new PF.Grid(this.grid);
        this.path = this.findPath();
        this.map = this.createMap();
    }

    // creates the grid 0 or 1 matrix for sea and reef
    createGrid() {
        let grid = [];
        for (i = 0; i < this.maxRow; i++) {
            const row = new Array(this.maxCol).fill(0);
            grid.push(row);
        }
        for (const block of this.reefs) {
            grid[block[1]][block[0]] = 1
        }
        return grid;
    }

    // finds the path to the treasure
    findPath() {
        const finder = new PF.AStarFinder();
        const path = finder.findPath(this.start[0], this.start[1], this.treasure[0], this.treasure[1], this.sea);
        return path;
    }

    // creates the map x,.,O,S,E in the sea
    createMap() {
        let grid = [...this.grid];

        for (let i = 0; i < this.maxRow; i++) {
            for (let j = 0; j < this.maxCol; j++) {
                if (grid[i][j]) {
                    grid[i][j] = 'x';
                } else {
                    grid[i][j] = '.';
                }
            }
        }

        for (const coords of this.path) {
            grid[coords[1]][coords[0]] = 'O';
        }

        const [startX, startY] = this.start;
        grid[startY][startX] = 'S';
        const [endX, endY] = this.treasure;
        grid[endY][endX] = 'E';
        return grid;
    }
}

async function readFile(path) {
    let input = [];

    const readInterface = readline.createInterface({
        input: fs.createReadStream(path)
    });

    let maxX = 0;
    let maxY = 0;

    for await (const line of readInterface) {
        coords = line.split(',');
        for (i = 0; i < coords.length; i++) {
            if (coords[i].length < 4) {
                continue;
            }
            if (coords[i][0] !== 'x') {
                continue;
            }
            if (coords[i][2] !== 'y') {
                continue;
            }
            let x = parseInt(coords[i][1]);
            let y = parseInt(coords[i][3]);
            maxX = x + 1 > maxX ? x + 1 : maxX;
            maxY = y + 1 > maxY ? y + 1 : maxY;
            if (!isNaN(x) && !isNaN(y)) {
                input.push([x, y]);
            }
        }
    }

    return [input, maxY, maxX];
}

// function printMap(map) {
//     for (const row of map) {
//         let str = '';
//         for (const col of row) {
//             str += col;
//         }
//         console.log(str);
//     }
// }

// write the map to the answer file
function writeMap(map, path) {
    const outputStream = fs.createWriteStream(path + '.answer', {
        flags: 'a'
    })
    for (let i = 0; i < map.length; i++) {
        let str = '';
        for (const col of map[i]) {
            str += col;
        }

        if (i === map.length - 1) {
            outputStream.write(str);
        } else {
            outputStream.write(str + '\n');
        }
    }
}

(async function main() {
    let [input, maxRow, maxCol] = await readFile(process.argv[2]);
    let start = input.shift();
    let end = input.pop();
    let blocks = input;
    let finder = new PathFinder(start, end, blocks, maxRow, maxCol);
    let map = finder.map;
    if (finder.path.length) {
        writeMap(map, process.argv[2]);
    } else {
        writeMap(['error'], process.argv[2]);
    }
})()