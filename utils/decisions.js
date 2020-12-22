const fs = require('fs');
const G = require('generatorics');
const STree = require('@munizart/suffixtrie');
const SCORES = require('./scores.js');

const Board = require('./board.js');
let DICT = null;

class Decisions extends Board {

    constructor(board = [], availTiles = []) {
        super(board, availTiles);
        this.isIntialMove = this.checkBoardState();
        this.possibleScores = new Set();
        this.wordsFromTiles = this.getAvailTilesWords();

        if (!this.isIntialMove) {
            this.setCrossAxisPossibilites();
            this.setMainAxisPossibilites();
            this.set2XPossibilities();
        }

        this.bestMove = null;
    }

    // checks the board state
    checkBoardState() {
        return this.board[7][7] == '-';
    }

    // generator to get the nxt match in a word
    * getNxtIdx(word, char) {
        let start = 0;
        while (start < word.length) {
            let idx = word.indexOf(char, start);
            if (idx > -1) {
                start = idx + 1;
                yield idx;
            } else {
                break;
            }
        }
    }

    // gives back all the words surrounding a word
    getSurroundingChars(word, range = []) {
        let { x, y, vertical } = word;
        let board = this.board;
        let start = vertical ? y : x;
        let idx = start;
        let surroundingChars = [];
        while (idx < start + word.word.length) {
            if (range.length === 2 && (idx >= range[0] && idx <= range[1])) {
                continue;
            }
            if (vertical) {
                if ((x - 1 > -1 && x - 1 < 15) && board[idx][x - 1] !== '-') {
                    surroundingChars.push(board[idx][x - 1]);
                }
                if ((x + 1 > -1 && x + 1 < 15) && board[idx][x + 1] !== '-') {
                    surroundingChars.push(board[idx][x - 1]);
                }
            } else {
                if ((y - 1 > -1 && y - 1 < 15) && board[y - 1][idx] !== '-') {
                    surroundingChars.push(board[y - 1][idx]);
                }
                if ((y + 1 > -1 && y + 1 < 15) && board[y + 1][idx] !== '-') {
                    surroundingChars.push(board[y + 1][idx]);
                }
            }
            if (idx > 13) {
                break;
            }
            idx++;
        }

        if (vertical) {
            if ((start - 1 > -1) && board[start - 1][x] !== '-') {
                surroundingChars.push(board[start - 1][x]);
            }
            if ((start + word.word.length + 1 < 15) && board[start + word.word.length + 1][x] !== '-') {
                surroundingChars.push(this.board[y + 1][x]);
            }
        } else {
            if ((start - 1 > -1) && board[y][start - 1] !== '-') {
                surroundingChars.push(this.board[y][start - 1]);
            }
            if ((start + word.word.length + 1 < 15) && board[y][start + word.word.length + 1] !== '-') {
                surroundingChars.push(this.board[y][start + word.word.length + 1]);
            }
        }

        return surroundingChars;
    }

    // create a node in the cross axis
    createNxtWordAcross(word, move, position) {
        let { commonChar, word: newWord } = move;
        let { vertical } = word;
        let posIterator = this.getNxtIdx(newWord, commonChar);
        for (const newwordPos in posIterator) {
            let startX = -1;
            let startY = -1;
            let endX = -1;
            let endY = -1;
            if (vertical) {
                startX = word.x - newwordPos;
                startY = word.y + position;
                endX = startX + newWord.length;
                if (startX < 0 || startY > 14 || endX > 14) {
                    continue;
                }
                let wordDetails = { word: newWord, x: startX, y: startY, vertical: !vertical }
                let surrChars = this.getSurroundingChars(wordDetails);
                if (surrChars.length > 2) {
                    continue;
                }
                return wordDetails;
            } else {
                startX = word.x + position;
                startY = word.y - newwordPos;
                endY = startY + newWord.length;
                if (startX > 14 || startY < 0 || endY > 14) {
                    continue;
                }
                let wordDetails = { word: newWord, x: startX, y: startY, vertical: !vertical };
                let surrChars = this.getSurroundingChars(wordDetails);
                if (surrChars.length > 2) {
                    continue;
                }
                return wordDetails;
            }
        }

    }

    // gives back the first node which is valid
    chooseCrossAxisMove(word, moves) {
        let chosenMove = null;
        for (const move of moves) {
            let posIterator = this.getNxtIdx(word.word, move.commonChar);
            for (const pos of posIterator) {
                chosenMove = this.createNxtWordAcross(word, move, pos);
                if (chosenMove) {
                    return chosenMove;
                }
            }
        }
        return chosenMove;
    }

    // create a node that makes 2 words;
    createNxtWord2X(word, move, position) {
        let { isSuffix, word: newWord } = move;
        let { vertical } = word;
        let startX = -1;
        let startY = -1;
        let endX = -1;
        let endY = -1;
        let wordDetails = null;
        if (vertical) {
            startX = word.x - position;
            startY = isSuffix ? word.y + word.word.length : word.y - 1;
            endX = startX + newWord.length;
            if (startX < 0 || startY > 14 || endX > 14) {
                return wordDetails;
            }
            wordDetails = { word: newWord, x: startX, y: startY, vertical: !vertical };
            let surrChars = this.getSurroundingChars(wordDetails);
            if (surrChars.length > 1) {
                return null;
            }

        } else {
            startX = isSuffix ? word.x + word.word.length : word.x - 1;
            startY = word.y - position;
            endY = startY + newWord.length;
            if (startX > 14 || startY < 0 || endY > 14) {
                return wordDetails;
            }
            wordDetails = { word: newWord, x: startX, y: startY, vertical: !vertical };
            let surrChars = this.getSurroundingChars(wordDetails);
            if (surrChars.length > 1) {
                return null;
            }
        }
        return wordDetails;

    }

    // gives back the first node that can make 2 words
    choose2XMove(word, moves) {
        let chosenMove = null;
        for (const move of moves) {
            let posIterator = this.getNxtIdx(move.word, move.addedChar);
            for (const pos of posIterator) {
                chosenMove = this.createNxtWord2X(word, move, pos);
                if (chosenMove) {
                    return chosenMove;
                }
            }
        }
        return chosenMove;
    }

    // gives back a node that is a suffix of the given node
    createNxtWordExt(word, move, position) {
        let { vertical } = word;
        let { word: newWord } = move;
        let startX = -1;
        let startY = -1;
        let endX = -1;
        let endY = -1;
        let wordDetails = null;
        if (vertical) {
            startX = word.x;
            startY = word.y - position;
            endY = startY + newWord.length;
            if (startY < 0 || endY > 14) {
                return wordDetails;
            }
            wordDetails = { word: newWord, x: startX, y: startY, vertical: vertical };
            let surrChars = this.getSurroundingChars(wordDetails, [word.y, word.y + word.word.length]);
            if (surrChars.length > 0) {
                return null;
            }
        } else {
            startX = word.x - position;
            startY = word.y;
            endX = startX + newWord.length;
            if (startX < 0 || endX > 14) {
                return wordDetails;
            }
            wordDetails = { word: newWord, x: startX, y: startY, vertical: vertical };
            let surrChars = this.getSurroundingChars(wordDetails, [word.x, word.x + word.word.length]);
            if (surrChars.length > 0) {
                return null;
            }
        }
        return wordDetails;
    }

    // gives back the first node that is valid
    chooseMainAxisMove(word, moves) {
        let chosenMove = null;
        for (const move of moves) {
            let posIterator = this.getNxtIdx(move.word, move.addedChar);
            for (const pos of posIterator) {
                chosenMove = this.createNxtWordExt(word, move, pos);
                if (chosenMove) {
                    return chosenMove;
                }
            }
        }
        return chosenMove;
    }

    // gives back the best decision made
    bestDecision() {
        let sortedScores = [...this.possibleScores].sort((a, b) => b - a);
        let bestMove = null;
        for (const score of sortedScores) {
            let possibleMoves = [];
            if (this.isIntialMove) {
                possibleMoves = this.wordsFromTiles.filter(word => word.score === score);
                if (possibleMoves.length) {
                    return { word: possibleMoves[0].word, vertical: false, x: 6, y: 7 };
                }
                return null;
            } else {
                for (const node of this.currWords) {
                    possibleMoves = node.doublingPossibilities.filter(word => word.score === score);
                    bestMove = this.choose2XMove(node, possibleMoves);
                    if (bestMove) {
                        return bestMove;
                    }
                    possibleMoves = node.crossAxisPossibilites.filter(word => word.score === score);
                    bestMove = this.chooseCrossAxisMove(node, possibleMoves);
                    if (bestMove) {
                        return bestMove;
                    }
                    possibleMoves = node.mainAxisPossibilites.filter(word => word.score === score);
                    bestMove = this.chooseMainAxisMove(node, possibleMoves);
                    if (bestMove) {
                        return bestMove;
                    }
                }
            }
        }
        return bestMove;
    }

    // gives back words made made from the suffix given and tiles chars
    getAllExtensions(availChars, word = '') {
        let valids = [];
        let words = [];
        if (word.length > 14 || word.length < 1) {
            return valids;
        }
        const combsFor = word ? [word, ...availChars] : availChars;
        const combs = G.permutationCombination(combsFor);
        let i = 0;
        for (const comb of combs) {
            let newWord = comb.join('');

            if (newWord.length > word.length && DICT.has(newWord)) {
                if (!words.includes(newWord)) {
                    words.push(newWord);
                    const score = this.score(newWord);
                    valids.push({ word: newWord, score });
                    this.possibleScores.add(score);
                }
            }
        }

        return valids;
    }

    // gives all permutations of combinations of an array
    getAvailTilesWords() {
        const combs = G.permutationCombination(this.availTiles);
        let wordList = [];
        for (const comb of combs) {
            let newWord = comb.join('');
            if (comb.length > 0 && DICT.has(newWord)) {
                const score = this.score(newWord);
                wordList.push({ word: newWord, score });
                if (this.isIntialMove) {
                    this.possibleScores.add(score);
                }
            }
        }
        return wordList;
    }

    // give all words with the letter given
    getWordsWithLetter(availTiles, letter) {
        const combs = G.permutationCombination(availTiles.concat(letter));
        let wordList = [];

        for (const comb of combs) {
            let newWord = comb.join('');
            if (comb.length > 0 && comb.includes(letter) && DICT.has(newWord)) {
                const score = this.score(newWord);
                wordList.push({ word: newWord, score, commonChar: letter });
                this.possibleScores.add(score);
            }
        }

        return wordList;
    }

    // calculate scores of the words
    score(word) {
        let score = 0;
        for (const letter of word) {
            score += SCORES[letter];
        }
        return score;
    }

    // sets all the possible moves in cross axis of the given word
    setCrossAxisPossibilites() {

        for (const idx in this.currWords) {
            const word = this.currWords[idx].word;
            const uniqueLetters = new Set(word.split(''));

            for (const letter of uniqueLetters) {
                let possibilities = this.getWordsWithLetter(this.availTiles, letter);
                this.currWords[idx].crossAxisPossibilites = possibilities;
            }

        }
    }

    // set the main axis possibilities
    setMainAxisPossibilites() {
        for (const idx in this.currWords) {
            this.currWords[idx].mainAxisPossibilites = this.getAllExtensions(this.availTiles, this.currWords[idx].word);
        }
    }

    // sets double points from prefix/suffix and cross axis
    // possibilities for a 2 word match
    set2XPossibilities() {
        for (const idx in this.currWords) {
            let doublingPossibilities = [];
            for (const ext of this.currWords[idx].mainAxisPossibilites) {
                if (ext.word.length === this.currWords[idx].word.length + 1) {
                    let pos = ext.word.indexOf(this.currWords[idx].word);
                    let extraLetter = ext.word[ext.word.length - 1];
                    let isSuffix = true;
                    if (pos > 0) {
                        extraLetter = ext.word[0];
                        isSuffix = false;
                    }
                    for (const word of this.wordsFromTiles) {
                        if (word.word.includes(extraLetter)) {
                            doublingPossibilities.push({
                                word: word.word,
                                isSuffix: isSuffix,
                                addedChar: extraLetter,
                                score: word.score + ext.score
                            });
                            this.possibleScores.add(word.score + ext.score);
                        }
                    }
                }
            }
            this.currWords[idx].doublingPossibilities = doublingPossibilities;
        }
    }
}

function readDictFile(path) {
    let data = fs.readFileSync(path, 'ascii');
    let dict = data.split('\n');
    return dict;
}

(function main() {
    let dict = readDictFile('./input/dict.txt');
    DICT = STree.empty();

    let i = 0;
    try {
        while (i < dict.length) {
            DICT.add(dict[i]);
            i++;
        }
    } catch (err) {
        console.log(err);
    }
})()


module.exports = Decisions;