document.addEventListener("DOMContentLoaded", function () {
  const symptomEntriesContainer = document.getElementById('symptomEntriesContainer');
  const addEntryButton = document.getElementById('addEntryButton');
  const analyzeButton = document.getElementById('analyzeButton');

  // Lightbox elements
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = lightbox ? lightbox.querySelector('.close') : null;

  // Add symptom entry on button click
  addEntryButton.addEventListener('click', addSymptomEntry);

  // Remove symptom entry when remove button clicked
  symptomEntriesContainer.addEventListener('click', function (event) {
    if (event.target.classList.contains('remove-entry-button')) {
      removeSymptomEntry(event.target);
    }
  });

  // Analyze symptoms on form submit
  analyzeButton.addEventListener('click', analyzeSymptoms);

  // Open lightbox on image click
  symptomEntriesContainer.addEventListener('click', function (event) {
    if (event.target.classList.contains('system-image') && event.target.src) {
      lightboxImg.src = event.target.src;
      lightbox.style.display = 'flex';
    }
  });

  // Close lightbox on overlay or close button click
  lightbox?.addEventListener('click', function (event) {
    if (event.target === lightbox) closeLightbox();
  });
  lightboxImg?.addEventListener('click', closeLightbox);
  closeBtn?.addEventListener('click', closeLightbox);

  function closeLightbox() {
    lightbox.style.display = 'none';
    lightboxImg.src = '';
  }

  // Add new symptom entry (build fresh, no cloning)
  function addSymptomEntry() {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'symptom-entry';

    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';

    const labelSystem = document.createElement('label');
    labelSystem.textContent = 'System Affected: ';
    const selectSystem = document.createElement('select');
    selectSystem.className = 'body-part';
    selectSystem.required = true;

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a system';
    selectSystem.appendChild(defaultOption);

    // Use the same systems array from your server-side by making it global or passing to client
    systems.forEach(sys => {
      const option = document.createElement('option');
      option.value = sys;
      option.textContent = sys;
      selectSystem.appendChild(option);
    });

    labelSystem.appendChild(selectSystem);

    const labelSymptoms = document.createElement('label');
    labelSymptoms.textContent = 'Symptoms: ';
    const inputSymptoms = document.createElement('input');
    inputSymptoms.type = 'text';
    inputSymptoms.className = 'symptoms';
    inputSymptoms.placeholder = 'Enter symptoms (comma separated)';
    inputSymptoms.required = true;
    labelSymptoms.appendChild(inputSymptoms);

    inputGroup.appendChild(labelSystem);
    inputGroup.appendChild(labelSymptoms);

    const img = document.createElement('img');
    img.className = 'system-image';
    img.alt = 'System Image';
    img.style.display = 'none';
    img.style.cursor = 'pointer';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-entry-button';
    removeBtn.textContent = 'Remove Entry';

    entryDiv.appendChild(inputGroup);
    entryDiv.appendChild(img);
    entryDiv.appendChild(removeBtn);

    symptomEntriesContainer.appendChild(entryDiv);
  }

  // Remove symptom entry or reset last one
  function removeSymptomEntry(button) {
    const entry = button.closest('.symptom-entry');
    const allEntries = symptomEntriesContainer.querySelectorAll('.symptom-entry');

    if (allEntries.length > 1) {
      entry.remove();
    } else {
      // Reset inputs and hide image if only one left, no alert
      entry.querySelector('.symptoms').value = '';
      entry.querySelector('.body-part').selectedIndex = 0;
      const img = entry.querySelector('.system-image');
      img.src = '';
      img.style.display = 'none';
    }
     const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = '';
  }

  // Analyze symptoms form submit handler
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

    // Require at least 5 symptoms per entry
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

      if (!response.ok) throw new Error("Failed to analyze symptoms");

      const result = await response.json();
      displayResults(result);
    } catch (error) {
      console.error("Error analyzing symptoms:", error.message);
      document.getElementById("results").innerHTML =
        `<p>An error occurred while processing your request. Details: ${error.message}</p>`;
    }
  }

  // Display results function (customize as needed)
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

        htmlContent += `</div>`;
      } else {
        htmlContent += "<p>No specific conditions matched. Please provide more detailed symptoms.</p>";
      }

      section.innerHTML = htmlContent;
      resultsContainer.appendChild(section);
    });
  }
});
