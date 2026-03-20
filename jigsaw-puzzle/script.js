document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const piecesContainer = document.getElementById('pieces-container');
    const board = document.getElementById('board');
    const slots = document.querySelectorAll('.slot');
    const message = document.getElementById('message');

    let pieces = [];
    const GRID_SIZE = 3;
    const PIECE_SIZE = 100;

    // Initialize game state and create pieces
    function initGame() {
        piecesContainer.innerHTML = '';
        message.classList.add('hidden');
        board.style.gap = '2px';
        pieces = [];

        // Clear pieces from the board
        slots.forEach(slot => {
            if (slot.firstChild) {
                slot.removeChild(slot.firstChild);
            }
        });

        // Generate 9 pieces
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            const row = Math.floor(i / GRID_SIZE);
            const col = i % GRID_SIZE;
            
            const piece = document.createElement('div');
            piece.classList.add('piece');
            piece.dataset.index = i;
            piece.setAttribute('draggable', true);
            
            // Set background position based on 300x300 image size
            const xOffset = -(col * PIECE_SIZE);
            const yOffset = -(row * PIECE_SIZE);
            piece.style.backgroundPosition = `${xOffset}px ${yOffset}px`;

            // Drag and drop event listeners
            piece.addEventListener('dragstart', dragStart);
            piece.addEventListener('dragend', dragEnd);

            pieces.push(piece);
        }

        // Shuffle pieces and append to container
        shuffleArray(pieces).forEach(piece => {
            piecesContainer.appendChild(piece);
        });
    }

    // Array shuffle utility using Fisher-Yates
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Drag API variables
    let draggedPiece = null;
    let originContainer = null;

    function dragStart(e) {
        draggedPiece = this;
        originContainer = this.parentElement;
        setTimeout(() => this.classList.add('dragging'), 0);
    }

    function dragEnd() {
        this.classList.remove('dragging');
        draggedPiece = null;
        originContainer = null;
        checkWin();
    }

    // Attach drop events to an element (slot or container)
    const attachDropEvents = (element) => {
        element.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necessary to allow dropping
            if (element.classList.contains('slot')) {
                element.classList.add('drag-over');
            }
        });

        element.addEventListener('dragleave', () => {
            if (element.classList.contains('slot')) {
                element.classList.remove('drag-over');
            }
        });

        element.addEventListener('drop', function(e) {
            e.preventDefault();
            if (this.classList.contains('slot')) {
                this.classList.remove('drag-over');
                
                // If slot is empty, simply append the piece
                if (!this.firstChild) {
                    this.appendChild(draggedPiece);
                } else {
                    // If slot has a piece, swap their positions
                    const existingPiece = this.firstChild;
                    originContainer.appendChild(existingPiece);
                    this.appendChild(draggedPiece);
                }
            } else if (this === piecesContainer) {
                // Moving back to container
                this.appendChild(draggedPiece);
            }
        });
    };

    // Attach events to all slots and the general piece container
    slots.forEach(slot => attachDropEvents(slot));
    attachDropEvents(piecesContainer);

    // Check if the puzzle is completed
    function checkWin() {
        let isWin = true;
        let piecesOnBoard = 0;

        slots.forEach(slot => {
            const piece = slot.firstChild;
            if (piece) {
                piecesOnBoard++;
                // Compare piece index with slot index
                if (parseInt(piece.dataset.index) !== parseInt(slot.dataset.index)) {
                    isWin = false;
                }
            } else {
                isWin = false;
            }
        });

        // If win condition met and no missing pieces on board
        if (isWin && piecesOnBoard === 9) {
            message.classList.remove('hidden');
            
            // Completion animation effects (remove gaps and shadow for a unified picture)
            board.style.gap = '0';
            slots.forEach(slot => {
                const p = slot.firstChild;
                p.style.boxShadow = 'none';
                p.style.borderRadius = '0';
            });
        } else {
            // Restore visual layout if a piece is moved again
            board.style.gap = '2px';
            slots.forEach(slot => {
                if (slot.firstChild) {
                    const p = slot.firstChild;
                    p.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                    p.style.borderRadius = '5px';
                }
            });
        }
    }

    // Start game on initialization and button click
    startBtn.addEventListener('click', initGame);
    initGame();
});
