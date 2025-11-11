// script.js - Updated with Enhanced Search Algorithm Integration

// --- API Configuration ---
const API_BASE_URL = 'http://127.0.0.1:5000';

// --- Runs when the page content is loaded ---
document.addEventListener('DOMContentLoaded', () => {

    // --- Hamburger Menu Logic ---
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // --- Dark Mode Toggle Logic ---
    const themeToggle = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;
    if (themeToggle) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            htmlEl.setAttribute('data-theme', savedTheme);
        }
        themeToggle.addEventListener('click', () => {
            const currentTheme = htmlEl.getAttribute('data-theme');
            const newTheme = (currentTheme === 'dark') ? 'light' : 'dark';
            htmlEl.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // --- Particle Background Initialization (Homepage Only) ---
    if (document.getElementById('particles-js')) {
        if (typeof tsParticles !== 'undefined') {
            tsParticles.load("particles-js", {
                fpsLimit: 60,
                interactivity: {
                    events: {
                        onHover: { enable: true, mode: "repulse" },
                        resize: true,
                    },
                    modes: {
                        repulse: { distance: 100, duration: 0.4 },
                    },
                },
                particles: {
                    color: { value: "#ffffff" },
                    links: {
                        color: "#ffffff",
                        distance: 150,
                        enable: true,
                        opacity: 0.3,
                        width: 1,
                    },
                    collisions: { enable: true },
                    move: {
                        direction: "none",
                        enable: true,
                        outModes: { default: "bounce" },
                        random: false,
                        speed: 1,
                        straight: false,
                    },
                    number: {
                        density: { enable: true, area: 800 },
                        value: 80,
                    },
                    opacity: { value: 0.3 },
                    shape: { type: "circle" },
                    size: { value: { min: 1, max: 3 } },
                },
                detectRetina: true,
            });
        } else {
            console.error("tsParticles library not loaded.");
        }
    }

    // --- Search Auto-Suggestion Logic (Homepage Only) ---
    const searchInput = document.getElementById('search-input');
    const suggestionsList = document.getElementById('suggestions-list');
    if (searchInput && suggestionsList) {
        // Updated suggestions based on new categories
        const sampleSuggestions = [
            "Calculus", "Algebra", "Geometry", "Trigonometry", "Statistics",
            "Physics", "Chemistry", "Biology", "Astronomy",
            "Python Programming", "JavaScript", "Web Development", "Data Structures", "Machine Learning",
            "English Grammar", "Spanish Learning", "French Basics",
            "Economics", "Accounting", "Marketing", "Finance",
            "World History", "Ancient Civilizations", "Modern History",
            "Electrical Engineering", "Mechanical Engineering", "Civil Engineering"
        ];

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            suggestionsList.innerHTML = '';
            suggestionsList.style.display = 'none';

            if (query.length > 0) {
                const filteredSuggestions = sampleSuggestions.filter(item =>
                    item.toLowerCase().includes(query)
                );

                if (filteredSuggestions.length > 0) {
                    const ul = document.createElement('ul');
                    filteredSuggestions.slice(0, 8).forEach(item => { // Show max 8 suggestions
                        const li = document.createElement('li');
                        li.textContent = item;
                        li.addEventListener('click', () => {
                            searchInput.value = item;
                            suggestionsList.innerHTML = '';
                            suggestionsList.style.display = 'none';
                        });
                        ul.appendChild(li);
                    });
                    suggestionsList.appendChild(ul);
                    suggestionsList.style.display = 'block';
                }
            }
        });

        document.addEventListener('click', (e) => {
            if (searchInput && suggestionsList && !searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
                suggestionsList.innerHTML = '';
                suggestionsList.style.display = 'none';
            }
        });
    }

    // --- Initial Page Fade-in ---
    document.body.classList.add('fade-in');

}); // --- End of DOMContentLoaded ---


// --- Contact Form Logic (About Page) ---
const contactForm = document.getElementById('contact-form');
const successMessage = document.getElementById('success-message');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log('Simulating form submission...');
        setTimeout(() => {
            contactForm.style.display = 'none';
            successMessage.style.display = 'block';
            console.log('Submission successful!');
        }, 500);
    });
}


// --- Homepage Search Form Redirect ---
const homeSearchForm = document.getElementById('home-search-form');
const homeSearchInput = document.getElementById('search-input');
if (homeSearchForm) {
    homeSearchForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const query = homeSearchInput ? homeSearchInput.value.trim() : '';
        if (query) {
            window.location.href = `search-results.html?query=${encodeURIComponent(query)}`;
        }
    });
}


// --- Signup Page Logic ---
if (document.title.includes("Sign Up")) {
    const signUpPageForm = document.querySelector('.login-form');
    const signUpSuccessPopup = document.getElementById('success-popup');
    const errorMessageElement = document.getElementById('error-message');
    if (signUpPageForm) {
        signUpPageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (errorMessageElement) {
                errorMessageElement.style.display = 'none';
            }
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch(`${API_BASE_URL}/api/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                const data = await response.json();
                if (response.ok) {
                    if (signUpSuccessPopup) {
                        signUpSuccessPopup.classList.add('show');
                    }
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    if (errorMessageElement) {
                        errorMessageElement.textContent = data.message || 'Signup failed. Please try again.';
                        errorMessageElement.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error('Signup error:', error);
                if (errorMessageElement) {
                    errorMessageElement.textContent = 'An error occurred. Please check your connection.';
                    errorMessageElement.style.display = 'block';
                }
            }
        });
    }
}


// --- Login Page Logic ---
if (document.title.includes("Login")) {
    const loginPageForm = document.getElementById('login-form');
    const loginSuccessPopup = document.getElementById('success-popup');
    const errorMessageElement = document.getElementById('error-message');
    if (loginPageForm) {
        loginPageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (errorMessageElement) {
                errorMessageElement.style.display = 'none';
            }
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch(`${API_BASE_URL}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('eduVaultToken', data.access_token);
                    if (loginSuccessPopup) {
                        loginSuccessPopup.classList.add('show');
                    }
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                } else {
                    if (errorMessageElement) {
                        errorMessageElement.textContent = data.message || 'Login failed. Please try again.';
                        errorMessageElement.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error('Login error:', error);
                if (errorMessageElement) {
                    errorMessageElement.textContent = 'An error occurred. Please check your connection.';
                    errorMessageElement.style.display = 'block';
                }
            }
        });
    }
}


// --- Search Results Page Logic (UPDATED WITH ENHANCED SEARCH) ---
if (document.title.includes("Search Results")) {
    const searchResultsHeading = document.getElementById('search-results-heading');
    const resultsList = document.getElementById('results-list');
    const filterCheckboxes = document.querySelectorAll('#filter-list input[type="checkbox"]');
    const token = localStorage.getItem('eduVaultToken');

    // 1. Filter Function
    const applyFilters = () => {
        const resultCards = document.querySelectorAll('#results-list .result-card:not(.skeleton-card)');
        if (resultCards.length === 0) return;
        
        const checkedTypes = [];
        filterCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                checkedTypes.push(checkbox.dataset.type);
            }
        });
        
        const showAll = checkedTypes.length === 0;
        
        resultCards.forEach(card => {
            const cardType = card.dataset.type;
            if (showAll || checkedTypes.includes(cardType)) {
                card.classList.remove('card-hidden');
            } else {
                card.classList.add('card-hidden');
            }
        });
    };
    
    // 2. Load Search Results (ENHANCED VERSION)
    const loadSearchResults = async () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const query = urlParams.get('query') || '';

            if (searchResultsHeading) {
                if (query) {
                    searchResultsHeading.textContent = `Search Results for "${decodeURIComponent(query)}"`;
                } else {
                    searchResultsHeading.textContent = 'All Resources';
                }
            }

            // Call the new enhanced search endpoint
            const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}&limit=20`);
            const data = await response.json();

            if (!response.ok) {
                resultsList.innerHTML = `<p>Failed to load resources. ${data.message || ''}</p>`;
                return;
            }

            // Check if we got results
            const resources = data.results || data; // Handle both response formats
            
            if (!resources || resources.length === 0) {
                resultsList.innerHTML = '<p>No resources found for this query. Try different keywords!</p>';
                return;
            }

            resultsList.innerHTML = ''; // Clear skeleton loaders

            // Display search statistics
            if (data.total_found) {
                const statsDiv = document.createElement('div');
                statsDiv.style.marginBottom = '20px';
                statsDiv.style.color = 'var(--subtle-text-color)';
                statsDiv.innerHTML = `Found ${data.total_found} results, showing top ${data.returned}`;
                resultsList.appendChild(statsDiv);
            }

            resources.forEach(resource => {
                const type = resource.type || 'article';
                const tagClass = `${type.toLowerCase()}-tag`;
                
                // Handle different field names (relevance_score vs suitability_score)
                const score = resource.relevance_score || resource.suitability_score || 0;
                
                // Safely get rating and visits
                const ratingCount = resource.ratingCount || 0;
                const ratingSum = resource.ratingSum || 0;
                const visits = resource.visits || 0;
                
                const rating = ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : 'N/A';
                const visitCount = visits > 1000 ? `${(visits / 1000).toFixed(1)}k` : visits;
                
                // Show relevance score badge
                const scoreDisplay = score > 0 ? `<span class="relevance-badge" title="Relevance Score">${Math.round(score)}</span>` : '';
                
                const cardHTML = `
                    <div class="result-card" data-type="${type}" data-id="${resource._id}">
                        <button class="save-btn" title="Save resource">
                            <i class="fa-regular fa-bookmark"></i>
                        </button>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span class="result-tag ${tagClass}">${type}</span>
                            ${scoreDisplay}
                        </div>
                        <h3>${resource.title}</h3>
                        <p class="result-description">${resource.description || 'No description available.'}</p>
                        <p class="result-source">Source: ${resource.source || 'N/A'}</p>
                        <div class="result-meta">
                            <span class="visits" title="Views"><i class="fa-solid fa-eye"></i> ${visitCount}</span> 
                            <span class="rating" title="Rating"><i class="fa-solid fa-star"></i> ${rating}</span>
                        </div>
                        <a href="${resource.url}" class="btn-view" target="_blank">View Resource</a>
                    </div>
                `;
                resultsList.insertAdjacentHTML('beforeend', cardHTML);
            });
            
            // Apply filters after loading
            applyFilters(); 

        } catch (error) {
            console.error('Error loading search results:', error);
            resultsList.innerHTML = '<p>An error occurred while loading resources. Please try again.</p>';
        }
    };
    
    // 3. Add Filter Event Listeners
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });

    // 4. Add Save Click Listener (using event delegation)
    if(resultsList) {
        resultsList.addEventListener('click', async (e) => {
            const saveButton = e.target.closest('.save-btn');
            
            if (saveButton) {
                const card = saveButton.closest('.result-card');
                const resourceId = card.dataset.id;
                
                if (!token) {
                    alert('Please login to save resources');
                    window.location.href = 'login.html';
                    return;
                }
                
                // Check if it's a valid MongoDB ObjectId (24 hex characters)
                if (resourceId.length !== 24 || !/^[0-9a-fA-F]+$/.test(resourceId)) {
                    alert("This external resource cannot be saved to your profile yet. Coming soon!");
                    return;
                }

                try {
                    const response = await fetch(`${API_BASE_URL}/api/save/${resourceId}`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    const data = await response.json();

                    if (response.ok) {
                        saveButton.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
                        saveButton.title = "Saved!";
                        saveButton.disabled = true;
                        saveButton.style.opacity = '0.6';
                    } else {
                        alert(data.message);
                    }
                } catch (error) {
                    console.error("Error saving resource:", error);
                    alert("Failed to save resource. Please try again.");
                }
            }
        });
    }

    // 5. Initial Load
    loadSearchResults();
}


// --- Profile Page Logic (Load Profile & Saved) ---
if (document.title.includes("My Profile")) {
    
    async function loadProfileData() {
        const token = localStorage.getItem('eduVaultToken');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/profile`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                document.querySelector('.profile-name').textContent = data.name;
                document.querySelector('.profile-email').textContent = data.email;
            } else {
                localStorage.removeItem('eduVaultToken');
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Profile load error:', error);
            window.location.href = 'login.html';
        }
    }

    async function loadSavedResources() {
        const token = localStorage.getItem('eduVaultToken');
        if (!token) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/saved-resources`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const resources = await response.json();
            
            if (response.ok) {
                const container = document.querySelector('#saved .profile-results-list');
                if (!container) return;
                
                if (resources.length === 0) {
                    container.innerHTML = '<p>You haven\'t saved any resources yet. Start exploring!</p>';
                    return;
                }
                
                container.innerHTML = '';
                
                resources.forEach(resource => {
                    let tagClass = `${resource.type.toLowerCase()}-tag`;
                    const ratingCount = resource.ratingCount || 0;
                    const ratingSum = resource.ratingSum || 0;
                    const visits = resource.visits || 0;
                    const rating = ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : 'N/A';
                    const visitCount = visits > 1000 ? `${(visits / 1000).toFixed(1)}k` : visits;

                    const cardHTML = `
                        <div class="result-card profile-result-card" data-id="${resource._id}">
                            <img src="https://placehold.co/120x80/E0E0E0/333?text=${resource.type.charAt(0).toUpperCase()}" alt="Resource thumbnail" class="result-thumbnail">
                            <div class="result-details">
                                <span class="result-tag ${tagClass}">${resource.type}</span>
                                <h3>${resource.title}</h3>
                                <p class="result-source">Source: ${resource.source || 'N/A'}</p>
                                <div class="result-meta">
                                    <span class="visits" title="Views"><i class="fa-solid fa-eye"></i> ${visitCount}</span> 
                                    <span class="rating" title="Rating"><i class="fa-solid fa-star"></i> ${rating}</span>
                                </div>
                                <a href="${resource.url}" class="btn-view" target="_blank">View Resource</a>
                            </div>
                        </div>
                    `;
                    container.insertAdjacentHTML('beforeend', cardHTML);
                });
            } else {
                console.error("Failed to load saved resources:", resources.message);
            }
        } catch (error) {
            console.error('Error fetching saved resources:', error);
        }
    }
    
    loadProfileData();
    loadSavedResources();
}


// --- Page Transition Fade-Out ---
document.querySelectorAll('a').forEach(link => {
    if (link.hostname === window.location.hostname && 
        link.pathname !== window.location.pathname && 
        !link.hash && 
        link.target !== '_blank') {
        link.addEventListener('click', e => {
            const destination = link.href;
            e.preventDefault();
            document.body.style.opacity = '0';
            setTimeout(() => {
                window.location.href = destination;
            }, 300); 
        });
    }
});


// --- Reveal on Scroll Logic ---
const revealElements = document.querySelectorAll('.reveal-on-scroll');
if (revealElements.length > 0) {
    const revealObserverOptions = {
        root: null, 
        rootMargin: '0px',
        threshold: 0.1 
    };
    
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    };
    
    const revealObserver = new IntersectionObserver(revealCallback, revealObserverOptions);
    revealElements.forEach(el => {
        revealObserver.observe(el);
    });
}