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

    // Current VA Rating input
    const currentRatingInput = document.getElementById('currentRating');

    // Toggle Dependents Section
    const toggleBtn = document.getElementById('toggle-dependents');
    const dependentsContainer = document.getElementById('dependents-container');

    toggleBtn.addEventListener('click', () => {
        const isVisible = dependentsContainer.style.display === 'block';
        dependentsContainer.style.display = isVisible ? 'none' : 'block';
        toggleBtn.textContent = isVisible ? 'Add Dependents' : 'Hide Dependents';
    });

    // Dependents inputs
    const spouse = document.getElementById("spouse");
    const childrenUnder18 = document.getElementById("childrenUnder18");
    const childrenOver18 = document.getElementById("childrenOver18");
    const numParents = document.getElementById("numParents");

    [currentRatingInput, spouse, childrenUnder18, childrenOver18, numParents].forEach(el => {
        el.addEventListener('input', calculateCompensation);
        el.addEventListener('change', calculateCompensation);
    });
});

async function calculateCompensation() {
    const currentRating = parseInt(document.getElementById('currentRating').value) || 0;
    const spouse = document.getElementById("spouse").checked;
    const childrenUnder18 = parseInt(document.getElementById("childrenUnder18").value) || 0;
    const childrenOver18 = parseInt(document.getElementById("childrenOver18").value) || 0;
    const numParents = parseInt(document.getElementById("numParents").value) || 0;

    try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        const response = await fetch("/compensation/calculate-compensation", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken
            },
            body: JSON.stringify({ 
                ratings: [currentRating], 
                spouse, 
                childrenUnder18, 
                childrenOver18, 
                numParents 
            })
        });

        const data = await response.json();

        if (data.error) {
            alert(`Error: ${data.error}`);
            return;
        }

        const pointsMissing = 100 - parseFloat(data.exactRating);

        document.getElementById("exactRating").innerText = `${data.exactRating}%`;
        document.getElementById("roundedRating").innerText = `${data.roundedRating}%`;
        document.getElementById("pointsMissing").innerText = `${pointsMissing}%`;
        document.getElementById("result").innerText = `$${data.totalCompensation}`;
    } catch (error) {
        alert("An error occurred while calculating VA compensation. Please try again.");
        console.error("Error details:", error);
    }
}
