document.addEventListener("DOMContentLoaded", function () {
  const symptomEntriesContainer = document.getElementById('symptomEntriesContainer');
  const addEntryButton = document.getElementById('addEntryButton');
  const analyzeButton = document.getElementById('analyzeButton');

  // Lightbox elements
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = lightbox ? lightbox.querySelector('.close') : null;

  // Add initial symptom entry
  addSymptomEntry();

  // Add new entry on button click
  addEntryButton.addEventListener('click', addSymptomEntry);

  // Remove symptom entry
  symptomEntriesContainer.addEventListener('click', function (event) {
    if (event.target.classList.contains('remove-entry-button')) {
      removeSymptomEntry(event.target);
    }
  });

  // Handle system and sub-system dropdown changes
  document.addEventListener("change", async function (e) {
    // System changed
    if (e.target.classList.contains("system-select")) {
      const system = e.target.value;
      const entry = e.target.closest(".symptom-entry");

      // Reset sub-system and symptom list
      const subSystemSelect = entry.querySelector(".sub-system-select");
      subSystemSelect.innerHTML = `<option value="">Select a sub-system</option>`;
      const symptomList = entry.querySelector(".symptom-list");
      symptomList.innerHTML = "";

      // Update image
      const img = entry.querySelector(".system-image");
      if (system) {
        img.src = `/images/systems/${encodeURIComponent(system)}.jpg`;
        img.style.display = 'block';
      } else {
        img.src = '';
        img.style.display = 'none';
      }

      if (!system) return;

      // Load sub-systems
      const res = await fetch(`/api/sub-systems/${encodeURIComponent(system)}`);
      const subSystems = await res.json();
      subSystems.forEach(sub => {
        const opt = document.createElement("option");
        opt.value = sub;
        opt.textContent = sub;
        subSystemSelect.appendChild(opt);
      });
    }

    // Sub-system changed
    if (e.target.classList.contains("sub-system-select")) {
      const subSystem = e.target.value;
      const entry = e.target.closest(".symptom-entry");
      const symptomList = entry.querySelector(".symptom-list");
      symptomList.innerHTML = "";

      if (!subSystem) return;

      // Load symptoms
      const res = await fetch(`/api/symptoms/${encodeURIComponent(subSystem)}`);
      const symptoms = await res.json();

      symptoms.forEach(symptom => {
        const label = document.createElement("label");
        label.innerHTML = `<input type="checkbox" value="${symptom}"> ${symptom}`;
        symptomList.appendChild(label);
      });
    }
  });

  // Analyze button click
  analyzeButton.addEventListener('click', analyzeSymptoms);

  // Lightbox open
  symptomEntriesContainer.addEventListener('click', function (event) {
    if (event.target.classList.contains('system-image') && event.target.src) {
      lightboxImg.src = event.target.src;
      lightbox.style.display = 'flex';
    }
  });

  // Lightbox close
  lightbox?.addEventListener('click', function (event) {
    if (event.target === lightbox) closeLightbox();
  });
  lightboxImg?.addEventListener('click', closeLightbox);
  closeBtn?.addEventListener('click', closeLightbox);

  function closeLightbox() {
    lightbox.style.display = 'none';
    lightboxImg.src = '';
  }

  // Add new symptom entry
  function addSymptomEntry() {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'symptom-entry';

    // System dropdown
    const labelSystem = document.createElement('label');
    labelSystem.textContent = 'System Affected: ';
    const selectSystem = document.createElement('select');
    selectSystem.className = 'system-select';
    selectSystem.required = true;

    const defaultOptionSys = document.createElement('option');
    defaultOptionSys.value = '';
    defaultOptionSys.textContent = 'Select a system';
    selectSystem.appendChild(defaultOptionSys);

    systems.forEach(sys => {
      const option = document.createElement('option');
      option.value = sys;
      option.textContent = sys;
      selectSystem.appendChild(option);
    });

    labelSystem.appendChild(selectSystem);

    // Sub-system dropdown
    const labelSubSystem = document.createElement('label');
    labelSubSystem.textContent = ' Sub-System: ';
    const selectSubSystem = document.createElement('select');
    selectSubSystem.className = 'sub-system-select';
    selectSubSystem.required = true;
    selectSubSystem.innerHTML = `<option value="">Select a sub-system</option>`;
    labelSubSystem.appendChild(selectSubSystem);

    // Symptom checkboxes container
    const symptomListDiv = document.createElement('div');
    symptomListDiv.className = 'symptom-list';

    // System image
    const img = document.createElement('img');
    img.className = 'system-image';
    img.alt = 'System Image';
    img.style.display = 'none';
    img.style.cursor = 'pointer';

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-entry-button';
    removeBtn.textContent = 'Remove Entry';

    entryDiv.appendChild(labelSystem);
    entryDiv.appendChild(labelSubSystem);
    entryDiv.appendChild(symptomListDiv);
    entryDiv.appendChild(img);
    entryDiv.appendChild(removeBtn);

    symptomEntriesContainer.appendChild(entryDiv);
  }

  // Remove entry
  function removeSymptomEntry(button) {
    const entry = button.closest('.symptom-entry');
    const allEntries = symptomEntriesContainer.querySelectorAll('.symptom-entry');

    if (allEntries.length > 1) {
      entry.remove();
    } else {
      entry.querySelector('.system-select').selectedIndex = 0;
      entry.querySelector('.sub-system-select').innerHTML = `<option value="">Select a sub-system</option>`;
      entry.querySelector('.symptom-list').innerHTML = '';
      const img = entry.querySelector('.system-image');
      img.src = '';
      img.style.display = 'none';
    }
    document.getElementById('results').innerHTML = '';
  }

  // Analyze symptoms
  async function analyzeSymptoms(event) {
    event.preventDefault();

    const csrfToken = document.getElementById("csrfToken").value;
    const symptomEntries = document.querySelectorAll(".symptom-entry");
    const symptomsData = [];

    symptomEntries.forEach((entry) => {
      const system = entry.querySelector(".system-select").value.trim();
      const subSystem = entry.querySelector(".sub-system-select").value.trim();
      const checked = entry.querySelectorAll(".symptom-list input[type=checkbox]:checked");
      const symptoms = Array.from(checked).map(cb => cb.value);

      if (system && subSystem && symptoms.length > 0) {
        symptomsData.push({ system, subSystem, symptoms });
      }
    });

    if (symptomsData.length === 0) {
      alert("Please select a system, sub-system, and at least one symptom for each entry.");
      return;
    }

    // Require at least 5 symptoms per entry
    const invalidEntries = symptomsData.filter(entry => entry.symptoms.length < 5);
    if (invalidEntries.length > 0) {
      alert("Each entry must have at least 5 symptoms. Please check your selections.");
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

  // Display results
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

      let htmlContent = `<h3>${entry.system} → ${entry.subSystem}</h3>`;

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
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
  }
});
