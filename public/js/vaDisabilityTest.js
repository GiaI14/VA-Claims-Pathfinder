document.addEventListener('DOMContentLoaded', () => {
  const symptomEntriesContainer = document.getElementById('symptomEntriesContainer');
  const addEntryButton = document.getElementById('addEntryButton');
  const analyzeButton = document.getElementById('analyzeButton');
  const resultsDiv = document.getElementById('results');
  
  const systemImages = {
    'Dental and Oral Conditions': '512px-202402_Oral_Cavity.svg.png',
    'Hemic and Lymphatic Systems': '512px-2201_Anatomy_of_the_Lymphatic_System.jpg',
    'Cardiovascular system': '512px-Circulatory_System_en_edited.svg.png',
    'Skin': '512px-Dermatology_-_Integumentary_system_1_--_Smart-Servier.png',
    'Digestive System': '512px-Digestive_system_diagram_en.svg.png',
    'Endocrine system': '512px-Endocrine_English.svg.png',
    'Gynecological conditions and disprders of the breast': '512px-Female_genital_system_-_Sagittal_view.svg.png',
    'Eye': '512px-Lateral_orbit_nerves_chngd.jpg',
    'Genitourinary system': '512px-Male_and_female_genital_organs.svg.png',
    'Musculoskeletal system': '512px-Skeleton_and_muscles.png',
    'Respiratory system': '512px-Respiratory_system_complete_fr_simplified.svg.png',
    'Ear': 'Auditory_System.jpg',
    'Sense Organs': 'Sense-Organ.png',
  };


 // ------------------- RADIO BUTTON TOGGLE LOGIC -------------------
function toggleSymptomInput(entry, value) {
  const typingInput = entry.querySelector('.typing-input-container');
  const listInput = entry.querySelector('.dynamic-symptoms-container');
  const section = entry.querySelector('.symptom-input-section');

  // Always show wrapper once a choice is made
  section.style.display = 'block';

  if (value === 'typing') {
    typingInput.style.display = 'block';
    listInput.style.display = 'none';
  } else if (value === 'selecting') {
    typingInput.style.display = 'none';
    listInput.style.display = 'block';
  }
}

// Hook up radios for each entry
function bindRadios(entry) {
  const radios = entry.querySelectorAll('input[type="radio"]');
  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      toggleSymptomInput(entry, radio.value);
    });
  });
}

// Bind existing entries on page load
document.querySelectorAll('.symptom-entry').forEach(bindRadios);

  // ------------------- ADD ENTRY -------------------
  addEntryButton.addEventListener('click', addSymptomEntry);

  function addSymptomEntry() {
    const entry = document.createElement('div');
    entry.className = 'symptom-entry';

    // System select
    const systemSelect = document.createElement('select');
    systemSelect.className = 'system-select';
    systemSelect.innerHTML = `<option value="">Select a system</option>`;
    Object.keys(systemImages).forEach(sys => {
      systemSelect.innerHTML += `<option value="${sys}">${sys}</option>`;
    });

    // Sub-system select
    const subSystemSelect = document.createElement('select');
    subSystemSelect.className = 'sub-system-select';
    subSystemSelect.innerHTML = `<option value="">Select a sub-system</option>`;

    // System image
    const systemImg = document.createElement('img');
    systemImg.className = 'system-image';
    systemImg.style.display = 'none';
    systemImg.style.cursor = 'pointer';

    // Input method radio (always visible)
    const inputMethodDiv = document.createElement('div');
    const radioName = `inputMethod${Date.now()}`;
    inputMethodDiv.innerHTML = `
      <label><input type="radio" name="${radioName}" value="typing"> Type Symptoms</label>
      <label><input type="radio" name="${radioName}" value="selecting"> Select from List</label>
    `;

    // Text input
    const typingInput = document.createElement('input');
    typingInput.type = 'text';
    typingInput.className = 'typed-symptoms';
    typingInput.placeholder = 'Enter symptoms separated by commas';
    typingInput.style.display = 'none';

    // List container
    const dynamicList = document.createElement('div');
    dynamicList.className = 'dynamic-symptoms-list';
    dynamicList.style.display = 'none';

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove Entry';
    removeBtn.className = 'remove-entry-button';

    // Append elements
    entry.appendChild(systemSelect);
    entry.appendChild(subSystemSelect);
    entry.appendChild(systemImg);
    entry.appendChild(inputMethodDiv);
    entry.appendChild(typingInput);
    entry.appendChild(dynamicList);
    entry.appendChild(removeBtn);
    symptomEntriesContainer.appendChild(entry);

    // Bind radio buttons for this new entry
    bindRadios(entry);
  }

  // ------------------- REMOVE ENTRY -------------------
  symptomEntriesContainer.addEventListener('click', (e) => {
    if (!e.target.classList.contains('remove-entry-button')) return;
    removeSymptomEntry(e.target);
  });

  function removeSymptomEntry(button) {
    const entry = button.closest('.symptom-entry');
    const allEntries = symptomEntriesContainer.querySelectorAll('.symptom-entry');

    if (allEntries.length > 1) {
      entry.remove();
    } else {
      entry.querySelector('.typed-symptoms').value = '';
      entry.querySelector('.system-select').selectedIndex = 0;
      entry.querySelector('.sub-system-select').selectedIndex = 0;
      const img = entry.querySelector('.system-image');
      img.src = '';
      img.style.display = 'none';
      const list = entry.querySelector('.dynamic-symptoms-list');
      list.innerHTML = '';
    }

    resultsDiv.innerHTML = '';
  }

  // ------------------- SYSTEM SELECT: fetch sub-systems -------------------
  symptomEntriesContainer.addEventListener('change', async e => {
    if (!e.target.classList.contains('system-select')) return;

    const entry = e.target.closest('.symptom-entry');
    if (!entry) return;

    const system = e.target.value;
    const subSystemSelect = entry.querySelector('.sub-system-select');
    const systemImage = entry.querySelector('.system-image');

    subSystemSelect.innerHTML = `<option value="">Select a sub-system</option>`;

    if (system && systemImages[system]) {
      systemImage.src = `/images/${systemImages[system]}`;
      systemImage.style.display = 'inline-block';
    } else {
      systemImage.src = '';
      systemImage.style.display = 'none';
    }

    if (!system) return;

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
  });

  // ------------------- SUB-SYSTEM SELECT: fetch symptoms -------------------
  symptomEntriesContainer.addEventListener('change', async e => {
    if (!e.target.classList.contains('sub-system-select')) return;

    const entry = e.target.closest('.symptom-entry');
    const subSystem = e.target.value;
    const dynamicList = entry.querySelector('.dynamic-symptoms-list');
    dynamicList.innerHTML = '';

    if (!subSystem) return;

    try {
      const res = await fetch(`/api/symptoms/${encodeURIComponent(subSystem)}`);
      if (!res.ok) throw new Error('Failed to fetch symptoms');
      const symptoms = await res.json();

      const frag = document.createDocumentFragment();
      symptoms.forEach(symptom => {
        const label = document.createElement('label');
        label.className = 'symptom-item';
        label.innerHTML = `<input type="checkbox" value="${symptom}"> ${symptom}`;
        frag.appendChild(label);
      });
      dynamicList.appendChild(frag);
    } catch (err) {
      console.error('Failed to load symptoms:', err);
      dynamicList.innerHTML = '<p>Failed to load symptoms</p>';
    }
  });

  // ------------------- ANALYZE SYMPTOMS -------------------
  analyzeButton.addEventListener('click', async e => {
    e.preventDefault();

    const csrfToken = document.getElementById("csrfToken").value;
    const entries = document.querySelectorAll('.symptom-entry');
    const data = [];

    entries.forEach(entry => {
      const system = entry.querySelector('.system-select').value;
      const subSystem = entry.querySelector('.sub-system-select').value;

      const inputMethod = entry.querySelector('input[type="radio"]:checked');
      let chosenSymptoms = [];

      if (!inputMethod) return;

      if (inputMethod.value === 'typing') {
        const typed = entry.querySelector('.typed-symptoms').value;
        chosenSymptoms = typed.split(',').map(s => s.trim()).filter(s => s);
      } else if (inputMethod.value === 'selecting') {
        chosenSymptoms = Array.from(entry.querySelectorAll('.dynamic-symptoms-list input[type="checkbox"]:checked'))
          .map(cb => cb.value);
      }

      if (system && subSystem && chosenSymptoms.length > 0) {
        data.push({ system, subSystem, chosenSymptoms });
      }
    });

    if (data.length === 0) {
      alert('Please select a system, sub-system, and symptoms.');
      return;
    }

    try {
      const res = await fetch('/analyze-symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(data),
        credentials: 'same-origin'
      });

      if (!res.ok) throw new Error('Failed to analyze symptoms');
      const result = await res.json();
      displayResults(result);
    } catch (err) {
      console.error('Error analyzing symptoms:', err);
      resultsDiv.innerHTML = `<p>Error analyzing symptoms: ${err.message}</p>`;
    }
  });

  // ------------------- DISPLAY RESULTS -------------------
  function displayResults(data) {
    resultsDiv.innerHTML = '';
    if (!data || data.length === 0) {
      resultsDiv.innerHTML = '<p>No matching conditions found.</p>';
      return;
    }

    data.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'result-item';
    div.innerHTML = `
      <h4>${entry.condition}</h4>
      <p>Confidence: ${entry.confidence || 'N/A'}%</p>
      <p>Matched Symptoms: ${entry.matchedSymptoms?.join(', ') || 'None'}</p>
    `;
    resultsDiv.appendChild(div);
  });
}
});
