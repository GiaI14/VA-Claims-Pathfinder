document.addEventListener('DOMContentLoaded', () => {
  const symptomEntriesContainer = document.getElementById('symptomEntriesContainer');
  const addEntryButton = document.getElementById('addEntryButton');
  const analyzeButton = document.getElementById('analyzeButton');
  const dynamicSymptomsList = document.getElementById('dynamicSymptomsList');

  // Track which entry's sub-system is currently driving the global symptoms list
  let currentActiveEntry = null;

  // Get list of systems from first entry's select so we can duplicate options for new entries
  const systems = Array.from(document.querySelectorAll('.system-select > option'))
    .slice(1)
    .map(opt => opt.value);

  // Raw (original) map — keep yours here; I added a couple of aliases to be forgiving
  const systemImagesRaw = {
    "Dental and Oral Conditions": "512px-202402_Oral_Cavity.svg.png",
    "Hemic and Lymphatic Systems": "512px-2201_Anatomy_of_the_Lymphatic_System.jpg",
    "Cardiovascular system": "512px-Circulatory_System_en_edited.svg.png",
    "Cardiovascular System": "512px-Circulatory_System_en_edited.svg.png", // alias
    "Skin": "512px-Dermatology_-_Integumentary_system_1_--_Smart-Servier.png",
    "Digestive System": "512px-Digestive_system_diagram_en.svg.png",
    "Endocrine system": "512px-Endocrine_English.svg.png",
    "Gynecological conditions and disprders of the breast": "512px-Female_genital_system_-_Sagittal_view.svg.png",
    "Gynecological conditions and disorders of the breast": "512px-Female_genital_system_-_Sagittal_view.svg.png", // alias (typo fix)
    "Eye": "512px-Lateral_orbit_nerves_chngd.jpg",
    "Genitourinary system": "512px-Male_and_female_genital_organs.svg.png",
    "Musculoskeletal system": "512px-Skeleton_and_muscles.png",
    "Respiratory system": "512px-Respiratory_system_complete_fr_simplified.svg.png",
    "Nervous System": "512px-TE-Nervous_system_diagram.svg.png",
    "Ear": "Auditory_System.jpg",
    "Sense Organs": "Sense-Organ.png"
  };

  // Build a normalized (lowercased/trimmed) lookup to be resilient to casing
  const normalizedImageMap = {};
  Object.keys(systemImagesRaw).forEach(k => {
    normalizedImageMap[k.toLowerCase().trim()] = systemImagesRaw[k];
  });

  function setSystemImage(entry, systemValue) {
    const img = entry.querySelector('.system-image');
    const key = (systemValue || '').toLowerCase().trim();
    const file = normalizedImageMap[key];

    if (file) {
      img.src = `/images/${file}`;
      img.style.display = 'block';
    } else {
      img.removeAttribute('src');
      img.style.display = 'none';
    }
  }

  // Add a new entry (system + sub-system + image + remove button)
  addEntryButton.addEventListener('click', addSymptomEntry);

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
    entryDiv.appendChild(img);
    entryDiv.appendChild(removeBtn);

    symptomEntriesContainer.appendChild(entryDiv);
  }

  // Remove entry
  symptomEntriesContainer.addEventListener('click', e => {
    if (!e.target.classList.contains('remove-entry-button')) return;

    const entry = e.target.closest('.symptom-entry');
    if (symptomEntriesContainer.children.length > 1) {
      // If removing the active entry, clear active + symptoms
      if (currentActiveEntry === entry) {
        currentActiveEntry = null;
        dynamicSymptomsList.innerHTML = '';
      }
      entry.remove();
    } else {
      resetEntry(entry);
    }
    document.getElementById('results').innerHTML = '';
  });

  // System/Sub-system change → show image, load sub-systems, load symptoms
  symptomEntriesContainer.addEventListener('change', async e => {
    const entry = e.target.closest('.symptom-entry');
    if (!entry) return;

    // SYSTEM changed
    if (e.target.classList.contains('system-select')) {
      const system = e.target.value;
      const subSystemSelect = entry.querySelector('.sub-system-select');

      // Update image robustly
      setSystemImage(entry, system);

      // Reset sub-system dropdown + global symptoms
      subSystemSelect.innerHTML = `<option value="">Select a sub-system</option>`;
      dynamicSymptomsList.innerHTML = '';
      currentActiveEntry = null;

      if (!system) return;

      // Load sub-systems for this system
      try {
        const res = await fetch(`/api/sub-systems/${encodeURIComponent(system)}`);
        if (!res.ok) throw new Error('Failed to fetch sub-systems');
        const subSystems = await res.json();

        subSystems.forEach(sub => {
          const option = document.createElement('option');
          option.value = sub;
          option.textContent = sub;
          subSystemSelect.appendChild(option);
        });
      } catch (err) {
        console.error('Error loading sub-systems:', err);
        alert('Error loading sub-systems');
      }
    }

    // SUB-SYSTEM changed
    if (e.target.classList.contains('sub-system-select')) {
      const subSystem = e.target.value;
      dynamicSymptomsList.innerHTML = '';

      if (!subSystem) {
        currentActiveEntry = null;
        return;
      }

      currentActiveEntry = entry;

      try {
        const res = await fetch(`/api/symptoms/${encodeURIComponent(subSystem)}`);
        if (!res.ok) throw new Error('Failed to fetch symptoms');
        const symptoms = await res.json();

        // Build symptoms grid (labels)
        const frag = document.createDocumentFragment();
        symptoms.forEach(symptom => {
          const label = document.createElement('label');
          label.className = 'symptom-item';
          label.innerHTML = `<input type="checkbox" value="${symptom}"> ${symptom}`;
          frag.appendChild(label);
        });
        dynamicSymptomsList.appendChild(frag);
      } catch (err) {
        console.error('Failed to load symptoms:', err);
        dynamicSymptomsList.innerHTML = '<p>Failed to load symptoms</p>';
      }
    }
  });

  // Analyze — uses only the CURRENT active entry + checked symptoms
  analyzeButton.addEventListener('click', async event => {
    event.preventDefault();

    const csrfToken = document.getElementById('csrfToken').value;

    if (!currentActiveEntry) {
      alert('Please select a system and sub-system, then pick symptoms.');
      return;
    }

    const system = currentActiveEntry.querySelector('.system-select').value.trim();
    const subSystem = currentActiveEntry.querySelector('.sub-system-select').value.trim();

    if (!system || !subSystem) {
      alert('Please select system and sub-system.');
      return;
    }

    const checkedSymptoms = Array.from(
      dynamicSymptomsList.querySelectorAll('input[type=checkbox]:checked')
    ).map(cb => cb.value);

    if (checkedSymptoms.length === 0) {
      alert('Please select at least one symptom.');
      return;
    }

    const payload = [{ system, subSystem, symptoms: checkedSymptoms }];

    try {
      const res = await fetch('/api/analyze-symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify(payload),
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

  function resetEntry(entry) {
    entry.querySelector('.system-select').value = '';
    entry.querySelector('.sub-system-select').innerHTML = `<option value="">Select a sub-system</option>`;
    const img = entry.querySelector('.system-image');
    img.removeAttribute('src');
    img.style.display = 'none';
    dynamicSymptomsList.innerHTML = '';
    currentActiveEntry = null;
  }

  // Results: show only system header; include % match from backend
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

    // Show system → subSystem (only if subSystem present)
    const heading = document.createElement('h3');
    heading.textContent = entry.subSystem ? `${entry.system} → ${entry.subSystem}` : entry.system;
    section.appendChild(heading);

    // Show image for the system if available
    const key = (entry.system || '').toLowerCase().trim();
    const imageFile = normalizedImageMap[key];
    if (imageFile) {
      const img = document.createElement('img');
      img.src = `/images/${imageFile}`;
      img.alt = entry.system;
      img.className = 'result-system-image';
      section.appendChild(img);
    }

    if (!entry.possibleConditions || entry.possibleConditions.length === 0) {
      const noCondMsg = document.createElement('p');
      noCondMsg.textContent = entry.message || 'No specific conditions matched. Please provide more detailed symptoms.';
      section.appendChild(noCondMsg);
    } else {
      const conditionsContainer = document.createElement('div');
      conditionsContainer.classList.add('conditions-container');

      entry.possibleConditions.forEach(condition => {
        const conditionBlock = document.createElement('div');
        conditionBlock.classList.add('condition-block');

        // Condition title + medical code + match percentage
        const title = document.createElement('div');
        title.className = 'condition-title';
        title.innerHTML = `
          ${condition.condition_name} 
          ${condition.medical_code ? `<span class="medical-code">(${condition.medical_code})</span>` : ''}
          <span class="match-percent" style="float:right; font-weight:bold;">
            ${(condition.match_percentage ?? condition.matchPercent ?? 0)}% match
          </span>
        `;
        conditionBlock.appendChild(title);

        // Matched symptoms list (if available)
        if (condition.matched_symptoms && condition.matched_symptoms.length > 0) {
          const matchedSympDiv = document.createElement('div');
          matchedSympDiv.className = 'matched-symptoms';
          matchedSympDiv.textContent = 'Matched Symptoms: ' + condition.matched_symptoms.join(', ');
          conditionBlock.appendChild(matchedSympDiv);
        }

        // Additional details block
        const hasDetails =
          condition.presumptive_raw ||
          condition.qualifying_circumstance ||
          condition.evidence_basis;

        if (hasDetails) {
          const detailsDiv = document.createElement('div');
          detailsDiv.className = 'condition-details';

          if (condition.presumptive_raw) {
            detailsDiv.innerHTML += `<div><strong>Presumptive Type:</strong> ${condition.presumptive_raw}</div>`;
          }
          if (condition.qualifying_circumstance) {
            detailsDiv.innerHTML += `<div><strong>Qualifying Circumstance:</strong> ${condition.qualifying_circumstance}</div>`;
          }
          if (condition.evidence_basis) {
            detailsDiv.innerHTML += `<div><strong>Evidence Basis:</strong> ${condition.evidence_basis}</div>`;
          }
          conditionBlock.appendChild(detailsDiv);
        }

        conditionsContainer.appendChild(conditionBlock);
      });

      section.appendChild(conditionsContainer);
    }

    resultsContainer.appendChild(section);
  });
}

