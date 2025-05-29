document.addEventListener('DOMContentLoaded', function () {
    const currentPage = window.location.pathname.split("/").pop();
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    const ratingButtons = document.querySelectorAll('.rating-btn');
    const selectedRatingsContainer = document.getElementById('selected-ratings');

    ratingButtons.forEach(button => {
        button.addEventListener('click', () => {
            const rating = button.getAttribute('data-rating');

            const selectedBtn = document.createElement('button');
            selectedBtn.className = 'rating-btn selected';
            selectedBtn.setAttribute('data-rating', rating);
            selectedBtn.textContent = rating + '%';

            selectedBtn.addEventListener('click', () => {
                selectedBtn.remove();
                calculateDisability();
            });

            selectedRatingsContainer.appendChild(selectedBtn);
            calculateDisability()
        });
    });

    // Toggle Dependents Section
    const toggleBtn = document.getElementById('toggle-dependents');
    const dependentsContainer = document.getElementById('dependents-container');

    toggleBtn.addEventListener('click', () => {
        const isVisible = dependentsContainer.style.display === 'block';
        dependentsContainer.style.display = isVisible ? 'none' : 'block';
        toggleBtn.textContent = isVisible ? 'Add Dependents' : 'Hide Dependents';
    });

    // Restore values from localStorage
    const spouse = document.getElementById("spouse");
    const childrenUnder18 = document.getElementById("childrenUnder18");
    const childrenOver18 = document.getElementById("childrenOver18");
    const numParents = document.getElementById("numParents");


    spouse.addEventListener('change', () => {
        localStorage.setItem('spouse', spouse.checked);
        calculateDisability()
    });
    childrenUnder18.addEventListener('input', () => {
        localStorage.setItem('childrenUnder18', childrenUnder18.value);
        calculateDisability()
    });
    childrenOver18.addEventListener('input', () => {
        localStorage.setItem('childrenOver18', childrenOver18.value);
        calculateDisability()
    });
    numParents.addEventListener('change', () => {
        localStorage.setItem('numParents', numParents.value);
        calculateDisability()
    });
});

async function calculateDisability() {
    const ratings = [...document.querySelectorAll("#selected-ratings .rating-btn")]
        .map(btn => parseInt(btn.dataset.rating) || 0)
        .filter(r => r > 0);

    if (ratings.length === 0) {
        alert("Please enter at least one disability rating.");
        return;
    }

    const spouse = document.getElementById("spouse").checked;
    const childrenUnder18 = parseInt(document.getElementById("childrenUnder18").value) || 0;
    const childrenOver18 = parseInt(document.getElementById("childrenOver18").value) || 0;
    const numParents = parseInt(document.getElementById("numParents").value) || 0;

    try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        const response = await fetch("/api/calculate-disability", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken
            },
            body: JSON.stringify({ ratings, spouse, childrenUnder18, childrenOver18, numParents })
        });

        const data = await response.json();

        if (data.error) {
            alert(`Error: ${data.error}`);
            return;
        }

        document.getElementById("exactRating").innerText = `${data.exactRating}%`;
        document.getElementById("roundedRating").innerText = `${data.roundedRating}%`;
        document.getElementById("result").innerText = `$${data.totalCompensation}`;
    } catch (error) {
        alert("An error occurred while calculating the disability compensation. Please try again.");
        console.error("Error details:", error);
    }
}

 
