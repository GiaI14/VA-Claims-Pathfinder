document.addEventListener("DOMContentLoaded", function () {
  const symptomEntriesContainer = document.getElementById('symptomEntriesContainer');
  const addEntryButton = document.getElementById('addEntryButton');
  const analyzeButton = document.getElementById('analyzeButton');

  // new entry adding
  addEntryButton.addEventListener('click', addSymptomEntry);

  //Removing entry 
  symptomEntriesContainer.addEventListener('click', function(event) {
    if (event.target.classList.contains('remove-entry-button')) {
      removeSymptomEntry(event.target);
    }
  });

  // Analyze symptoms
  analyzeButton.addEventListener('click', analyzeSymptoms);
});

function addSymptomEntry() {
  const symptomEntriesContainer = document.getElementById('symptomEntriesContainer');
  const templateEntry = symptomEntriesContainer.querySelector('.symptom-entry');
  const newEntry = templateEntry.cloneNode(true);
  
  // Clearing values in the cloned entry
  newEntry.querySelector('.symptoms').value = '';
  newEntry.querySelector('.body-part').selectedIndex = 0;

  symptomEntriesContainer.appendChild(newEntry);
}

function removeSymptomEntry(button) {
  const entry = button.closest('.symptom-entry');
  if (entry && document.querySelectorAll('.symptom-entry').length > 1) {
    entry.remove();
  } else {
    alert("You must have at least one symptom entry.");
  }
}

async function analyzeSymptoms(event) {
  event.preventDefault();
  const csrfToken = document.getElementById("csrfToken").value;
  const symptomEntries = document.querySelectorAll(".symptom-entry");
  const symptomsData = [];

  symptomEntries.forEach((entry) => {
    const system = entry.querySelector(".body-part").value.trim();
    const symptomsInput = entry.querySelector(".symptoms").value.trim();
    const symptoms = symptomsInput.split(",").map(s => s.trim()).filter(s => s !== "");

    if (system && symptoms.length > 0) {
      symptomsData.push({ system, symptoms });
    }
  });

  if (symptomsData.length === 0) {
    alert("Please select a system and enter at least one symptom for each entry.");
    return;
  }

  // Validate that each entry has at least 5 symptoms
  const invalidEntries = symptomsData.filter(entry => entry.symptoms.length < 5);
  if (invalidEntries.length > 0) {
    alert("Each entry must have at least 5 symptoms. Please check your inputs.");
    return;
  }

  try {
    const response = await fetch("/api/analyze-symptoms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      },
      body: JSON.stringify(symptomsData),
      credentials: "include",
    });

    console.log("CSRF token being sent:", csrfToken);

    if (!response.ok) throw new Error("Failed to analyze symptoms");

    const result = await response.json();
    displayResults(result);
  } catch (error) {
    console.error("Error analyzing symptoms:", error.message);
    document.getElementById("results").innerHTML =
      `<p>An error occurred while processing your request. Details: ${error.message}</p>`;
  }
}


function displayResults(data) {
  const resultsContainer = document.getElementById("results");
  resultsContainer.innerHTML = "";

  if (!data || data.length === 0) {
    resultsContainer.innerHTML = "<p>No matching conditions found. Please add more symptoms for a more accurate analysis!</p>";
    return;
  }

  data.forEach((entry) => {
    const section = document.createElement("div");
    section.classList.add("result-section");

    let htmlContent = `<h3>${entry.system}</h3>`;

    if (entry.message) {
      htmlContent += `<p>${entry.message}</p>`;
    } else if (entry.possibleConditions?.length > 0) {
      htmlContent += `<div class="conditions-container">`;
      
      entry.possibleConditions.forEach((condition) => {
        const hasDetails = condition.presumptive_raw || 
                         condition.qualifying_circumstance || 
                         condition.evidence_basis;

        htmlContent += `
          <div class="condition-block">
            <div class="condition-title">
              ${condition.condition_name} <span class="medical-code">(${condition.medical_code})</span>
              <span class="match-percentage">${condition.match_percentage.toFixed(2)}% match</span>
            </div>

            ${hasDetails ? `
              <div class="condition-details">
                ${condition.presumptive_raw ? `
                  <div class="detail-item">
                    <span class="detail-label"><strong>Presumptive Type:</strong></span>
                    <span class="detail-text">${condition.presumptive_raw}</span>
                  </div>` : ''}
                
                ${condition.qualifying_circumstance ? `
                  <div class="detail-item">
                    <span class="detail-label"><strong>Qualifying Circumstances:</strong></span>
                    <span class="detail-text">${condition.qualifying_circumstance}</span>
                  </div>` : ''}
                
                ${condition.evidence_basis ? `
                  <div class="detail-item">
                    <span class="detail-label"><strong>Evidence Basis:</strong></span>
                    <span class="detail-text">${condition.evidence_basis}</span>
                  </div>` : ''}
              </div>
            ` : ''}
          </div>
        `;
      });
      
      htmlContent += `</div>`; // Close conditions-container
    } else {
      htmlContent += "<p>No specific conditions matched. Please provide more detailed symptoms.</p>";
    }

    section.innerHTML = htmlContent;
    resultsContainer.appendChild(section);
  });
} 

symptomEntriesContainer.addEventListener('click', function(e) {
  if (e.target.classList.contains('system-image') && e.target.src) {
    lightboxImg.src = e.target.src;
    lightbox.style.display = 'block';
  }
});

// Close lightbox when clicking outside OR on the image itself
lightbox.addEventListener('click', function(e) {
  if (e.target === lightbox || e.target === lightboxImg) {
    closeLightbox();
  }
});

function closeLightbox() {
  lightbox.style.display = 'none';
  lightboxImg.src = '';
}
window.closeLightbox = closeLightbox; 
