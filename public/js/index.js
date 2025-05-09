function addDisability() {
    const disabilitiesDiv = document.getElementById("disabilities");
    const newEntry = document.createElement("div");
    newEntry.classList.add("disability-entry");

    // Create a dropdown instead of number input
    let dropdown = `<select class="rating">
        ${Array.from({ length: 11 }, (_, i) => i * 10)
            .map(value => `<option value="${value}">${value}%</option>`)
            .join("")}
    </select>`;

    newEntry.innerHTML = `
        ${dropdown}
         <button class="remove-disability-btn">Remove</button>
    `;

    disabilitiesDiv.appendChild(newEntry);
}

// Use event delegation for remove buttons
document.getElementById("disabilities").addEventListener('click', function(event) {
    if (event.target.classList.contains('remove-disability-btn')) {
        removeDisability(event.target);
    }
});

function removeDisability(button) {
    button.closest('.disability-entry').remove();
}


async function calculateDisability() {
    // Collect ratings and filter out invalid entries
    const ratings = [...document.querySelectorAll(".rating")]
        .map(input => parseInt(input.value) || 0)  // Parse the input values as integers
        .filter(r => r > 0); // Only keep valid ratings greater than 0

    // Log the ratings being sent to the back-end
    console.log("Ratings array being sent:", ratings);

    const spouse = document.getElementById("spouse").checked;
    const childrenUnder18 = parseInt(document.getElementById("childrenUnder18").value) || 0;
    const childrenOver18 = parseInt(document.getElementById("childrenOver18").value) || 0;
    const numParents = parseInt(document.getElementById("numParents").value) || 0;

    // Check if ratings array is empty
    if (ratings.length === 0) {
        alert("Please enter at least one disability rating.");
        return;
    }

    try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        const response = await fetch("/api/calculate-disability", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken},
            credintials: "same-origin",
            body: JSON.stringify({ ratings, spouse, childrenUnder18, childrenOver18, numParents })
        });

        const data = await response.json();
        
        console.log("Response from server:", data);  // Log the server's response for troubleshooting

        if (data.error) {
            alert(`Error: ${data.error}`);
            return;
        }

        // Display the result on the page
        document.getElementById("exactRating").innerText = `${data.exactRating}%`;
        document.getElementById("roundedRating").innerText = `${data.roundedRating}%`;
        document.getElementById("result").innerText = `$${data.totalCompensation}`;
    } catch (error) {
        alert("An error occurred while calculating the disability compensation. Please try again.");
        console.error("Error details:", error);
    }
}
