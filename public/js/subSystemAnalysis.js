document.addEventListener('DOMContentLoaded', () => {
  const symptomEntriesContainer = document.getElementById('symptomEntriesContainer');
  const addEntryButton = document.getElementById('addEntryButton');
  const analyzeButton = document.getElementById('analyzeButton');

  // Grab systems from first select options for new entries
  const systems = Array.from(document.querySelectorAll('.system-select > option'))
    .slice(1) // skip placeholder option
    .map(opt => opt.value);

  addEntryButton.addEventListener('click', addSymptomEntry);

  symptomEntriesContainer.addEventListener('click', e => {
    if (e.target.classList.contains('remove-entry-button')) {
      const entry = e.target.closest('.symptom-entry');
      if (symptomEntriesContainer.children.length > 1) {
        entry.remove();
      } else {
        resetEntry(entry);
      }
      document.getElementById('results').innerHTML = '';
    }
  });

  // Define system images mapping
  const systemImages = {
    "Dental and Oral Conditions": "512px-202402_Oral_Cavity.svg.png",
    "Hemic and Lymphatic Systems": "512px-2201_Anatomy_of_the_Lymphatic_System.jpg",
    "Cardiovascular system": "512px-Circulatory_System_en_edited.svg.png",
    "Skin": "512px-Dermatology_-_Integumentary_system_1_--_Smart-Servier.png",
    "Digestive System": "512px-Digestive_system_diagram_en.svg.png",
    "Endocrine system": "512px-Endocrine_English.svg.png",
    "Gynecological conditions and disprders of the breast": "512px-Female_genital_system_-_Sagittal_view.svg.png",
    "Eye": "512px-Lateral_orbit_nerves_chngd.jpg",
    "Genitourinary system": "512px-Male_and_female_genital_organs.svg.png",
    "Musculoskeletal system": "512px-Skeleton_and_muscles.png",
    "Respiratory system": "512px-Respiratory_system_complete_fr_simplified.svg.png",
    "Nervous System": "512px-TE-Nervous_system_diagram.svg.png",
    "Ear": "Auditory_System.jpg",
    "Sense Organs": "Sense-Organ.png"
  };

  symptomEntriesContainer.addEventListener('change', async e => {
    if (e.target.classList.contains('system-select')) {
      const system = e.target.value;
      const entry = e.target.closest('.symptom-entry');
      const subSystemSelect = entry.querySelector('.sub-system-select');
      const symptomList = entry.querySelector('.symptom-list');
      const img = entry.querySelector('.system-image');

      subSystemSelect.innerHTML = `<option value="">Select a sub-system</option>`;
      symptomList.innerHTML = '';

      if (system) {
        // Show system image if available
        if (systemImages[system]) {
          img.src = `/images/${systemImages[system]}`;
          img.style.display = 'block';
        } else {
          img.src = '';
          img.style.display = 'none';
        }

        try {
          const res = await fetch(`/api/sub-systems/${encodeURIComponent(system)}`);
          const subSystems = await res.json();

          subSystems.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub;
            option.textContent = sub;
            subSystemSelect.appendChild(option);
          });
        } catch (error) {
          console.error('Failed to load sub-systems:', error);
        }
      } else {
        img.src = '';
        img.style.display = 'none';
      }
    }

    if (e.target.classList.contains('sub-system-select')) {
      const subSystem = e.target.value;
      const entry = e.target.closest('.symptom-entry');
      const symptomList = entry.querySelector('.symptom-list');

      symptomList.innerHTML = '';

      if (!subSystem) return;

      try {
        // Fetch symptoms for selected sub-system
        const res = await fetch(`/api/symptoms/${encodeURIComponent(subSystem)}`);
        const symptoms = await res.json();

        // Render each symptom as a checkbox
        symptoms.forEach(symptom => {
          const label = document.createElement('label');
          label.innerHTML = `<input type="checkbox" value="${symptom}"> ${symptom}`;
          symptomList.appendChild(label);
        });
      } catch (error) {
        console.error('Failed to load symptoms:', error);
      }
    }
  });

  analyzeButton.addEventListener('click', async event => {
    event.preventDefault();

    const csrfToken = document.getElementById('csrfToken').value;
    const entries = symptomEntriesContainer.querySelectorAll('.symptom-entry');
    const symptomsData = [];

    entries.forEach(entry => {
      const system = entry.querySelector('.system-select').value.trim();
      const subSystem = entry.querySelector('.sub-system-select').value.trim();
      const checked = entry.querySelectorAll('.symptom-list input[type=checkbox]:checked');
      const symptoms = Array.from(checked).map(cb => cb.value);

      if (system && subSystem && symptoms.length > 0) {
        symptomsData.push({ system, subSystem, symptoms });
      }
    });

    if (symptomsData.length === 0) {
      alert('Please select system, sub-system, and at least one symptom in each entry.');
      return;
    }

    try {
      const res = await fetch('/api/analyze-symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify(symptomsData),
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to analyze symptoms');

      const results = await res.json();
      displayResults(results);
    } catch (err) {
      console.error('Error analyzing symptoms:', err);
      document.getElementById('results').innerHTML = `<p>Error: ${err.message}</p>`;
    }
  });

  function addSymptomEntry() {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'symptom-entry';

    // System select
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

    // Sub-system select
    const labelSubSystem = document.createElement('label');
    labelSubSystem.textContent = ' Sub-System: ';
    const selectSubSystem = document.createElement('select');
    selectSubSystem.className = 'sub-system-select';
    selectSubSystem.required = true;
    selectSubSystem.innerHTML = `<option value="">Select a sub-system</option>`;
    labelSubSystem.appendChild(selectSubSystem);

    // Symptom list container
    const symptomListDiv = document.createElement('div');
    symptomListDiv.className = 'symptom-list';

    // Image
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

  function resetEntry(entry) {
    entry.querySelector('.system-select').value = '';
    entry.querySelector('.sub-system-select').innerHTML = `<option value="">Select a sub-system</option>`;
    entry.querySelector('.symptom-list').innerHTML = '';
    const img = entry.querySelector('.system-image');
    img.src = '';
    img.style.display = 'none';
  }

  function displayResults(data) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    if (!data || data.length === 0) {
      resultsContainer.innerHTML = '<p>No matching conditions found. Please add more symptoms for a more accurate analysis!</p>';
      return;
    }

    data.forEach(entry => {
      const section = document.createElement('div');
      section.classList.add('result-section');

      let htmlContent = `<h3>${entry.system} → ${entry.subSystem}</h3>`;

      if (!entry.possibleConditions || entry.possibleConditions.length === 0) {
        htmlContent += `<p>No specific conditions matched. Please provide more detailed symptoms.</p>`;
      } else {
        htmlContent += `<div class="conditions-container">`;

        entry.possibleConditions.forEach(condition => {
          const hasDetails =
            condition.presumptive_raw ||
            condition.qualifying_circumstance ||
            condition.evidence_basis;

          htmlContent += `
            <div class="condition-block">
              <div class="condition-title">
                ${condition.condition_name} <span class="medical-code">(${condition.medical_code})</span>
              </div>
              ${hasDetails ? `
              <div class="condition-details">
                ${condition.presumptive_raw ? `<div><strong>Presumptive Type:</strong> ${condition.presumptive_raw}</div>` : ''}
                ${condition.qualifying_circumstance ? `<div><strong>Qualifying Circumstance:</strong> ${condition.qualifying_circumstance}</div>` : ''}
                ${condition.evidence_basis ? `<div><strong>Evidence Basis:</strong> ${condition.evidence_basis}</div>` : ''}
              </div>` : ''}
            </div>
          `;
        });

        htmlContent += `</div>`;
      }

      section.innerHTML = htmlContent;
      resultsContainer.appendChild(section);
    });
  }
});
