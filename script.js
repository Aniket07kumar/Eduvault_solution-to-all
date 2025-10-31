// script.js

// script.js

document.addEventListener('DOMContentLoaded', () => {

    // --- Hamburger Menu Logic ---
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');

    if (hamburger) { // Check if hamburger exists on the page
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // --- Dark Mode Toggle Logic ---
    const themeToggle = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement; // This is the <html> tag

    if (themeToggle) { // Check if the toggle exists on the page

        // 1. Check for a saved theme in localStorage
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            htmlEl.setAttribute('data-theme', savedTheme);
        }

        // 2. Add click listener to the toggle
        themeToggle.addEventListener('click', () => {
            // Get the current theme
            const currentTheme = htmlEl.getAttribute('data-theme');
            const newTheme = (currentTheme === 'dark') ? 'light' : 'dark';

            // Set the new theme
            htmlEl.setAttribute('data-theme', newTheme);

            // Save the new preference to localStorage
            localStorage.setItem('theme', newTheme);
        });
    }

    // --- Particle Background Initialization (Only on Homepage) ---
    if (document.getElementById('particles-js')) {
        // Ensure tsParticles is loaded before using it
        if (typeof tsParticles !== 'undefined') {
            tsParticles.load("particles-js", {
                fpsLimit: 60,
                interactivity: {
                    events: {
                        onHover: {
                            enable: true,
                            mode: "repulse",
                        },
                        resize: true,
                    },
                    modes: {
                        repulse: {
                            distance: 100,
                            duration: 0.4,
                        },
                    },
                },
                particles: {
                    color: {
                        value: "#ffffff", // Particle color
                    },
                    links: {
                        color: "#ffffff", // Link color
                        distance: 150,
                        enable: true,
                        opacity: 0.3, // Make links subtle
                        width: 1,
                    },
                    collisions: {
                        enable: true,
                    },
                    move: {
                        direction: "none",
                        enable: true,
                        outModes: {
                            default: "bounce",
                        },
                        random: false,
                        speed: 1, // Slow speed
                        straight: false,
                    },
                    number: {
                        density: {
                            enable: true,
                            area: 800,
                        },
                        value: 80, // Number of particles
                    },
                    opacity: {
                        value: 0.3, // Make particles subtle
                    },
                    shape: {
                        type: "circle",
                    },
                    size: {
                        value: { min: 1, max: 3 }, // Small particle size
                    },
                },
                detectRetina: true,
            });
        } else {
            console.error("tsParticles library not loaded.");
        }
    }

    // --- Search Auto-Suggestion Logic (Only on Homepage) ---
    const searchInput = document.getElementById('search-input');
    const suggestionsList = document.getElementById('suggestions-list');

    if (searchInput && suggestionsList) {
        // Sample list of suggestions (replace with your actual data)
        const sampleSuggestions = [
            "Thermodynamics",
            "Quantum Mechanics",
            "Data Structures",
            "Algorithms",
            "Machine Learning",
            "Artificial Intelligence",
            "Web Development",
            "Fluid Dynamics",
            "Circuit Design",
            "Software Engineering",
            "Structural Analysis",
            "Materials Science"
        ];

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            suggestionsList.innerHTML = ''; // Clear previous suggestions
            suggestionsList.style.display = 'none'; // Hide by default

            if (query.length > 0) {
                const filteredSuggestions = sampleSuggestions.filter(item =>
                    item.toLowerCase().includes(query)
                );

                if (filteredSuggestions.length > 0) {
                    const ul = document.createElement('ul');
                    filteredSuggestions.forEach(item => {
                        const li = document.createElement('li');
                        li.textContent = item;
                        li.addEventListener('click', () => {
                            searchInput.value = item; // Fill input on click
                            suggestionsList.innerHTML = ''; // Clear suggestions
                            suggestionsList.style.display = 'none'; // Hide list
                            // Optionally trigger search form submit here
                            // homeSearchForm.requestSubmit();
                        });
                        ul.appendChild(li);
                    });
                    suggestionsList.appendChild(ul);
                    suggestionsList.style.display = 'block'; // Show suggestions
                }
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            // Check if the click is outside the search input AND outside the suggestions list
            if (searchInput && suggestionsList && !searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
                suggestionsList.innerHTML = '';
                suggestionsList.style.display = 'none';
            }
        });
    }

    // --- Initial Fade-in Call (Ensures animation plays correctly) ---
    // Make sure body has fade-in class on initial load if not already added by CSS animation
    // document.body.classList.add('fade-in'); // This might re-trigger animation, CSS handles initial state


}); // End of DOMContentLoaded listener


// --- Contact Form Logic ---
const contactForm = document.getElementById('contact-form');
const successMessage = document.getElementById('success-message');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // --- Simulate sending data ---
        console.log('Simulating form submission...');

        // --- Show success after a short delay ---
        setTimeout(() => {
            contactForm.style.display = 'none';
            successMessage.style.display = 'block';
            console.log('Submission successful!');
        }, 500); // Simulate network delay
    });
}


// --- Homepage Search Form Redirect ---
const homeSearchForm = document.getElementById('home-search-form');
// Get searchInput defined earlier if it exists (on homepage)
const homeSearchInput = document.getElementById('search-input');

if (homeSearchForm) {
    homeSearchForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Stop the form from reloading the page

        // Get the value the user typed, trimming any extra spaces
        const query = homeSearchInput ? homeSearchInput.value.trim() : '';

        // If the user actually typed something, redirect them
        if (query) {
            // Redirect to the search results page with the query in the URL
            window.location.href = `search-results.html?query=${encodeURIComponent(query)}`;
        }
    });
}


// --- Update Search Results Heading ---
const searchResultsHeading = document.getElementById('search-results-heading');

if (searchResultsHeading) {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');
    if (query) {
        searchResultsHeading.textContent = `Search Results for '${decodeURIComponent(query)}'`; // Decode query
    }
}

// --- Sign-up Success Pop-up and Redirect ---
// Check if we are on the sign-up page FIRST by checking the title
if (document.title.includes("Sign Up")) {
    // Now, select the elements using simpler selectors
    const signUpPageForm = document.querySelector('.login-form'); // Select the form on this page
    const signUpSuccessPopup = document.getElementById('success-popup'); // Select the popup on this page

    // Only add the listener if the form exists on this page
    if (signUpPageForm) {
        signUpPageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (signUpSuccessPopup) {
                signUpSuccessPopup.classList.add('show');
            }
            setTimeout(() => {
                window.location.href = 'index.html'; // Redirect to homepage
            }, 2000);
        });
    }
}


// --- Login Success Pop-up and Redirect ---
// Check if we are on the login page FIRST by checking the title
if (document.title.includes("Login")) {
    const loginPageForm = document.getElementById('login-form');
    // Select the popup using its ID *after* confirming we are on the login page
    const loginSuccessPopup = document.getElementById('success-popup');

    // Only add the listener if the form exists on this page
    if (loginPageForm) {
        loginPageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (loginSuccessPopup) { // Check if the popup was found
                loginSuccessPopup.classList.add('show');
            }
            setTimeout(() => {
                window.location.href = 'index.html'; // Redirect to homepage
            }, 2000);
        });
    }
}

// --- Search Results Filter Logic ---
const filterCheckboxes = document.querySelectorAll('#filter-list input[type="checkbox"]');
const resultCards = document.querySelectorAll('#results-list .result-card');

if (filterCheckboxes.length > 0 && resultCards.length > 0) {

    const applyFilters = () => {
        const checkedTypes = [];
        filterCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                checkedTypes.push(checkbox.dataset.type);
            }
        });

        // If no boxes are checked, show all cards
        const showAll = checkedTypes.length === 0;

        resultCards.forEach(card => {
            const cardType = card.dataset.type;
            // Show card if 'showAll' is true OR if its type is in the checkedTypes array
            if (showAll || checkedTypes.includes(cardType)) {
                card.classList.remove('card-hidden');
            } else {
                card.classList.add('card-hidden');
            }
        });
    };

    // Add event listener to each checkbox
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });

    // Initial filter application on page load to respect default checked state
    applyFilters();
}


// --- Page Transition Fade-Out ---
document.querySelectorAll('a').forEach(link => {
    // Check if it's an internal link (not external or just '#') and doesn't open in a new tab
    if (link.hostname === window.location.hostname && link.pathname !== window.location.pathname && !link.hash && link.target !== '_blank') {
        link.addEventListener('click', e => {
            const destination = link.href;

            // Prevent default navigation
            e.preventDefault();

            // Start fade-out
            document.body.style.opacity = '0';
            // document.body.classList.remove('fade-in'); // Optional: remove fade-in if needed

            // Navigate after fade-out completes
            setTimeout(() => {
                window.location.href = destination;
            }, 300); // Match timeout to body transition duration in CSS
        });
    }
});


// --- Reveal on Scroll Logic ---
const revealElements = document.querySelectorAll('.reveal-on-scroll');

if (revealElements.length > 0) { // Check if elements exist before creating observer
    console.log(`Found ${revealElements.length} elements to reveal.`); // Debug message

    const revealObserverOptions = {
      root: null, // viewport
      rootMargin: '0px',
      threshold: 0.1 // Trigger when 10% is visible
    };

    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            console.log(`Observing: ${entry.target.tagName}, Intersecting: ${entry.isIntersecting}`); // Debug message
            if (entry.isIntersecting) {
                console.log(`Revealing: ${entry.target.tagName}`); // Debug message
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Stop observing once revealed
            }
        });
    };

    const revealObserver = new IntersectionObserver(revealCallback, revealObserverOptions);

    revealElements.forEach(el => {
        console.log(`Setting up observer for: ${el.tagName} with class ${el.className}`); // More detailed debug
        revealObserver.observe(el);
    });
} else {
    console.log("No elements with class 'reveal-on-scroll' found."); // Debug message
}
// ## END: REVEAL ON SCROLL LOGIC ##
