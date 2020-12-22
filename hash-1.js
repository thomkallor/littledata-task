const fs = require('fs');
const md5 = require('md5');
const readline = require('readline');

class Hash {
    constructor(salt, numZeros = 4, hashLength = 10) {
        this.salt = salt;
        this.numZeros = numZeros;
        this.hashLength = hashLength;
        this.hash = this.getHash();
    }

    // generator function to get the matched hash
    * hashIterator() {
        let i = 1;
        while (true) {
            let msg = this.salt + i;
            let md5Hash = md5(msg);
            let pattern = `^0{${this.numZeros}}[0-${this.hashLength - 1}]`
            let exp = new RegExp(pattern);
            if (exp.test(md5Hash)) {
                yield [md5Hash, i];
            }
            i++;
        }
    }

    // gives all the positions available in the hash
    getAvailPositions() {
        let availPositions = new Array(this.hashLength);
        return [...availPositions.keys()];
    }

    // gives the actual encoded string
    getHash() {
        let i = 0;
        let hash = [];
        let availPositions = this.getAvailPositions();
        const hashGenerator = this.hashIterator();

        while (availPositions.length > 0) {
            const [match, index] = hashGenerator.next().value;
            const val = match[index % 32];
            let position = parseInt(match[this.numZeros]);
            if (availPositions.includes(position)) {
                hash[position] = val;
                availPositions = availPositions.filter(value => value !== position);
            }
        }

        return hash.join('');
    }
}

async function readFile(path) {
    let input = [];

    const readInterface = readline.createInterface({
        input: fs.createReadStream(path)
    });

    for await (const line of readInterface) {
        hashInput = line.split(',');
        input.push(hashInput);
    }

    return input;
}


(async function main() {
    const input = await readFile(process.argv[2]);
    const outputStream = fs.createWriteStream(process.argv[2] + '.answer', {
        flags: 'a'
    })
    for (let i = 0; i < input.length; i++) {
        const [salt, numZeros] = input[i];
        const hash = new Hash(salt, numZeros);
        if (i === input.length - 1) {
            outputStream.write(hash.hash);
        } else {
            outputStream.write(hash.hash + '\n');
        }
    }
})()
