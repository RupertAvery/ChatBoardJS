
var Board = require("./board-server.js");

function BoardManager() {
	var boards = {};
	var updatehandles = {}; 

	function createBoard(name) {
		var board = new Board(name)
        board.onupdate = function() { updateBoard(board);};
		boards[board.id] = board;
		return board;
	}
	
	function saveBoards() {
		for(var key in boards){
			boards[key].save();
		}
	}

	function loadBoards() {
		
    }
    
    function updateBoard(board){
        if(updatehandles[board.id]) {
            clearTimeout(updatehandles[board.id]);
        }
        updatehandles[board.id] = setTimeout(function() { board.save() }, 5000);
    }

	function getBoardById(id) {
		var board = boards[id];

		if(!board){
			board = Board.load(id);
			if(board){
    			board.onupdate = function() { updateBoard(board);};
				boards[board.id] = board;
			}
		}

		return board;
	}

	return {
		createBoard: createBoard,
		saveBoards: saveBoards,
		loadBoards: loadBoards,
		getBoardById: getBoardById
	}
}

module.exports = BoardManager
