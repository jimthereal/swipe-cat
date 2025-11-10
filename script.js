// Global state
const CAT_COUNT = 15;
let cats = [];
let currentIndex = 0;
let likedCats = [];
let dragStart = { x: 0, y: 0 };
let dragOffset = { x: 0, y: 0 };
let isDragging = false;

// DOM Elements
let currentCard, currentCardImg, nextCard, nextCardImg;
let progress;
let likeBtn, dislikeBtn, restartBtn;
let swipeView, resultsView, loadingView;
let resultsGrid, resultsCount, resultsContent;
let reactionOverlay, reactionIcon;

// Initialize app
function init() {
    // Get DOM elements
    currentCard = document.getElementById('currentCard');
    currentCardImg = document.getElementById('currentCardImg');
    nextCard = document.getElementById('nextCard');
    nextCardImg = document.getElementById('nextCardImg');
    progress = document.getElementById('progress');
    likeBtn = document.getElementById('likeBtn');
    dislikeBtn = document.getElementById('dislikeBtn');
    restartBtn = document.getElementById('restartBtn');
    swipeView = document.getElementById('swipeView');
    resultsView = document.getElementById('resultsView');
    loadingView = document.getElementById('loadingView');
    resultsGrid = document.getElementById('resultsGrid');
    resultsCount = document.getElementById('resultsCount');
    resultsContent = document.getElementById('resultsContent');
    reactionOverlay = document.getElementById('reactionOverlay');
    reactionIcon = document.getElementById('reactionIcon');

    // Initialize cats
    cats = Array.from({ length: CAT_COUNT }, (_, i) => ({
        id: i,
        url: `https://cataas.com/cat?${i}`,
        timestamp: Date.now() + i
    }));

    // Attach event listeners
    attachEventListeners();

    // Show first cat
    updateSwipeView();
    showView('swipe');
}

// View management
function showView(viewName) {
    swipeView.classList.add('hidden');
    resultsView.classList.add('hidden');
    loadingView.classList.add('hidden');

    if (viewName === 'swipe') {
        swipeView.classList.remove('hidden');
    } else if (viewName === 'results') {
        resultsView.classList.remove('hidden');
    } else if (viewName === 'loading') {
        loadingView.classList.remove('hidden');
    }
}

// Update swipe view
function updateSwipeView() {
    const current = cats[currentIndex];
    const hasNext = currentIndex + 1 < cats.length;

    // Update current card
    currentCardImg.src = current.url;
    currentCardImg.alt = `Cat ${current.id}`;

    // Update next card
    if (hasNext) {
        nextCard.style.display = 'block';
        nextCardImg.src = cats[currentIndex + 1].url;
        nextCardImg.alt = 'Next cat';
    } else {
        nextCard.style.display = 'none';
    }

    // Update progress
    progress.textContent = `${currentIndex + 1} / ${cats.length}`;

    // Reset card position
    currentCard.style.transform = '';
    currentCard.style.opacity = '1';
}

// Update results view
function updateResultsView() {
    resultsCount.textContent = `You liked ${likedCats.length} out of ${cats.length} cats`;

    if (likedCats.length > 0) {
        resultsGrid.innerHTML = '';
        likedCats.forEach(cat => {
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.innerHTML = `
                <img src="${cat.url}" alt="Liked cat">
                <div class="heart">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </div>
            `;
            resultsGrid.appendChild(resultCard);
        });
    } else {
        resultsContent.innerHTML = `
            <div class="empty-state">
                <p>No cats matched your preferences</p>
                <p style="font-size: 12px; color: #cccccc;">Maybe give them another chance?</p>
            </div>
        `;
    }
}

// Event listeners
function attachEventListeners() {
    // Mouse events
    currentCard.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);

    // Touch events
    currentCard.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);

    // Button events
    likeBtn.addEventListener('click', handleLike);
    dislikeBtn.addEventListener('click', handleDislike);
    restartBtn.addEventListener('click', restart);
}

// Drag handlers
function handleDragStart(e) {
    isDragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
    currentCard.classList.add('dragging');
}

function handleTouchStart(e) {
    e.preventDefault();
    isDragging = true;
    const touch = e.touches[0];
    dragStart = { x: touch.clientX, y: touch.clientY };
    currentCard.classList.add('dragging');
}

function handleDragMove(e) {
    if (!isDragging) return;
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    dragOffset = {
        x: clientX - dragStart.x,
        y: clientY - dragStart.y
    };
    
    updateCardPosition();
}

function handleTouchMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    dragOffset = {
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
    };
    
    updateCardPosition();
}

function handleDragEnd() {
    if (!isDragging) return;
    
    currentCard.classList.remove('dragging');
    
    const swipeThreshold = 100;
    if (Math.abs(dragOffset.x) > swipeThreshold) {
        if (dragOffset.x > 0) {
            handleLike();
        } else {
            handleDislike();
        }
    } else {
        // Reset position
        dragOffset = { x: 0, y: 0 };
        updateCardPosition();
    }
    
    isDragging = false;
}

function updateCardPosition() {
    const rotation = dragOffset.x * 0.1;
    const opacity = Math.max(0.3, 1 - Math.abs(dragOffset.x) / 200);
    
    currentCard.style.transform = `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`;
    currentCard.style.opacity = opacity;
}

// Action handlers
function handleLike() {
    likedCats.push(cats[currentIndex]);
    showReaction('love');
    moveToNext();
}

function handleDislike() {
    showReaction('dislike');
    moveToNext();
}

function showReaction(type) {
    // Set the icon
    if (type === 'love') {
        reactionIcon.innerHTML = '<i class="fas fa-heart"></i>';
        reactionIcon.className = 'reaction-icon love';
    } else {
        reactionIcon.innerHTML = '<i class="fas fa-heart-broken"></i>';
        reactionIcon.className = 'reaction-icon dislike';
    }
    
    // Trigger animation
    setTimeout(() => {
        reactionIcon.classList.add('show');
    }, 10);
    
    // Hide after animation
    setTimeout(() => {
        reactionIcon.classList.remove('show');
        reactionIcon.classList.add('hide');
    }, 700);
    
    // Reset
    setTimeout(() => {
        reactionIcon.classList.remove('hide', 'love', 'dislike');
    }, 1000);
}

function moveToNext() {
    if (currentIndex + 1 >= cats.length) {
        showResults();
    } else {
        currentIndex++;
        dragOffset = { x: 0, y: 0 };
        updateSwipeView();
    }
}

function showResults() {
    updateResultsView();
    showView('results');
}

function restart() {
    currentIndex = 0;
    likedCats = [];
    dragOffset = { x: 0, y: 0 };
    updateSwipeView();
    showView('swipe');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}