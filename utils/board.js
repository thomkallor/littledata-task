class Board {

    constructor(board = [], availTiles = []) {
        this.availTiles = availTiles;
        this.board = board;
        this.currWords = this.getWordsInBoard();
    }

    // gives all words in an axis vertical or horizontal
    getWordsInAxis(vertical = true) {
        let currWords = [];

        for (let i = 0; i < 15; i++) {
            let word = '';

            for (let j = 0; j < 15; j++) {
                let x = vertical ? i : j;
                let y = vertical ? j : i;

                if (this.board[y][x] !== '-') {
                    word += this.board[y][x];
                }

                if (word.length === 2) {
                    let prevX = vertical ? i : j - 1;
                    let prevY = vertical ? j - 1 : i;
                    if (this.board[prevY][prevX] === '-') {
                        word = this.board[y][x];
                    }
                }

                if (this.board[y][x] === '-' && word.length > 1) {
                    let node = {
                        word: word,
                        vertical: vertical,
                        x: vertical ? x : x - word.length,
                        y: vertical ? y - word.length : y
                    }
                    currWords.push(node);
                    word = '';
                }

            }

            if (word.length > 1) {
                let node = {
                    word: word,
                    vertical: vertical,
                    x: vertical ? 15 - word.length : i,
                    y: vertical ? i : 15 - word.length
                }
                currWords.push(node);
                word = '';
            }
        }

        return currWords;
    }

    // Gives all words in the board
    getWordsInBoard() {
        let currWords = [];
        let horzWords = this.getWordsInAxis(false);
        let vertWords = this.getWordsInAxis(true);
        currWords = currWords.concat(horzWords, vertWords);
        return currWords;
    }

}

module.exports = Board;