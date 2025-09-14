// // script.js

// document.addEventListener('DOMContentLoaded', () => {
//     const hamburger = document.getElementById('hamburger');
//     const navLinks = document.getElementById('nav-links');

//     hamburger.addEventListener('click', () => {
//         navLinks.classList.toggle('active');
//     });
// });

// // Add this to your script.js file

// const contactForm = document.getElementById('contact-form');
// const successMessage = document.getElementById('success-message');

// // Check if the form exists on the current page before adding event listener
// if (contactForm) {
//     contactForm.addEventListener('submit', (e) => {
//         // Prevent the default form submission (page reload)
//         e.preventDefault();

//         // Hide the form
//         contactForm.style.display = 'none';

//         // Show the success message
//         successMessage.style.display = 'block';
//     });
// }

// script.js

document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
});

// This is the new code for the contact form
const contactForm = document.getElementById('contact-form');
const successMessage = document.getElementById('success-message');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        contactForm.style.display = 'none';
        successMessage.style.display = 'block';
    });
}



// Add this new code to the bottom of script.js

const homeSearchForm = document.getElementById('home-search-form');

// Check if the homepage search form exists on the current page
if (homeSearchForm) {
    homeSearchForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Stop the form from reloading the page

        // Get the search input element within the form
        const searchInput = homeSearchForm.querySelector('input[type="search"]');
        
        // Get the value the user typed, trimming any extra spaces
        const query = searchInput.value.trim();

        // If the user actually typed something, redirect them
        if (query) {
            // Redirect to the search results page with the query in the URL
            window.location.href = `search-results.html?query=${encodeURIComponent(query)}`;
        }
    });
}



// Add this new code to the bottom of script.js

const searchResultsHeading = document.getElementById('search-results-heading');

// Check if the heading exists on the current page
if (searchResultsHeading) {
    // Get the full URL of the current page
    const urlParams = new URLSearchParams(window.location.search);
    
    // Get the value of the 'query' parameter from the URL
    const query = urlParams.get('query');

    // If a query exists, update the heading text
    if (query) {
        searchResultsHeading.textContent = `Search Results for '${query}'`;
    }
}