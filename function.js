// --- CONFIGURATION ---
// This is a new, stable public database URL from jsonblob.com.
const DATABASE_URL = 'https://jsonblob.com/api/jsonBlob/1276205847623958528';

// --- DOM ELEMENTS ---
const clockElement = document.getElementById('live-clock');
const reviewForm = document.getElementById('review-form');
const reviewText = document.getElementById('review-text');
const ratingSlider = document.getElementById('rating-slider');
const ratingValue = document.getElementById('rating-value');
const reviewsList = document.getElementById('reviews-list');
const averageRatingDisplay = document.getElementById('average-rating');
const reviewCountDisplay = document.getElementById('review-count');
const loadingReviews = document.getElementById('loading-reviews');
const modal = document.getElementById('message-modal');
const modalText = document.getElementById('modal-text');
const submitButton = document.getElementById('submit-button');

// --- HELPER FUNCTIONS ---
function showModal(message) {
    modalText.textContent = message;
    modal.classList.remove('hidden');
}

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    if (clockElement) {
        clockElement.textContent = `${hours}:${minutes}:${seconds}`;
    }
}

function renderReviews(reviews) {
    if (!loadingReviews || !reviewsList) return;

    loadingReviews.style.display = 'none';
    reviewsList.innerHTML = '';
    
    let totalRating = 0;

    // Sort reviews from newest to oldest
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (reviews.length > 0) {
        reviews.forEach(review => totalRating += review.rating);
        const averageRating = (totalRating / reviews.length).toFixed(1);
        averageRatingDisplay.textContent = averageRating;
        reviewCountDisplay.textContent = `Berdasarkan ${reviews.length} ulasan`;

        reviews.forEach(reviewData => {
            const reviewElement = document.createElement('div');
            reviewElement.className = 'bg-white/10 p-3 rounded-lg';
            
            const textElement = document.createElement('p');
            textElement.className = 'text-gray-200';
            textElement.textContent = reviewData.text;
            
            const ratingElement = document.createElement('p');
            ratingElement.className = 'text-xs text-cyan-400 font-bold mt-2 text-right';
            ratingElement.textContent = `Peringkat: ${reviewData.rating}/100`;
            
            reviewElement.appendChild(textElement);
            reviewElement.appendChild(ratingElement);
            reviewsList.appendChild(reviewElement);
        });

    } else {
        averageRatingDisplay.textContent = '0';
        reviewCountDisplay.textContent = 'Belum ada ulasan';
        reviewsList.innerHTML = '<p class="text-center text-gray-400">Jadilah yang pertama memberi ulasan!</p>';
    }
}

// --- DATABASE FUNCTIONS ---
async function loadReviews() {
    try {
        const response = await fetch(DATABASE_URL);
        if (!response.ok) {
            // If the database is empty (404), we treat it as an empty review list
            if (response.status === 404) {
                return [];
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.reviews || []; 
    } catch (error) {
        console.error("Error loading reviews:", error);
        showModal("Gagal memuat ulasan dari database.");
        return []; // Return empty array on failure
    }
}

async function saveReview(newReview) {
    submitButton.disabled = true;
    submitButton.textContent = 'Mengirim...';

    try {
        // 1. Get the current list of reviews
        const existingReviews = await loadReviews();
        
        // 2. Add the new review
        existingReviews.push(newReview);
        
        // 3. Save the entire updated list back to the database
        const response = await fetch(DATABASE_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reviews: existingReviews }),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        showModal("Terima kasih atas ulasan Anda!");
        renderReviews(existingReviews);
        reviewForm.reset();
        ratingValue.textContent = '50';

    } catch (error) {
        console.error("Error saving review:", error);
        showModal("Gagal menyimpan ulasan ke database.");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Kirim Ulasan';
    }
}

// --- INITIALIZATION ---
async function startApp() { 
    // Start the clock
    updateClock();
    setInterval(updateClock, 1000);

    // Initial load of reviews
    const reviews = await loadReviews();
    renderReviews(reviews);

    // Handle form submission
    reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const reviewContent = reviewText.value.trim();
        const rating = parseInt(ratingSlider.value, 10);

        if (!reviewContent) {
            showModal("Ulasan tidak boleh kosong.");
            return;
        }

        const newReview = {
            text: reviewContent,
            rating: rating,
            createdAt: new Date().toISOString(),
        };

        saveReview(newReview);
    });
    
    // Update slider value display
    ratingSlider.addEventListener('input', () => {
        ratingValue.textContent = ratingSlider.value;
    });
}

// Run app initialization when the script is loaded
startApp();
