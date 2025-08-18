document.addEventListener('DOMContentLoaded', () => {
  const symptomEntriesContainer = document.getElementById('symptomEntriesContainer');
  const addEntryButton = document.getElementById('addEntryButton');
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

  // --- ADD NEW ENTRY ---
  addEntryButton.addEventListener('click', () => {
    addSymptomEntry();
  });

  function addSymptomEntry() {
    const entry = document.createElement('div');
    entry.className = 'symptom-entry';

    // System select
    const systemLabel = document.createElement('label');
    systemLabel.textContent = 'System Affected: ';
    const systemSelect = document.createElement('select');
    systemSelect.className = 'system-select';
    systemSelect.innerHTML = `<option value="">Select a system</option>`;
    Object.keys(systemImages).forEach(sys => {
      systemSelect.innerHTML += `<option value="${sys}">${sys}</option>`;
    });
    systemLabel.appendChild(systemSelect);

    // Sub-system select
    const subSystemLabel = document.createElement('label');
    subSystemLabel.textContent = 'Sub-System: ';
    const subSystemSelect = document.createElement('select');
    subSystemSelect.className = 'sub-system-select';
    subSystemSelect.innerHTML = `<option value="">Select a sub-system</option>`;
    subSystemLabel.appendChild(subSystemSelect);

    // Image
    const systemImg = document.createElement('img');
    systemImg.className = 'system-image';
    systemImg.style.display = 'none';
    systemImg.style.cursor = 'pointer';

    // Input method radio
    const inputMethodDiv = document.createElement('div');
    inputMethodDiv.className = 'input-method-container';
    inputMethodDiv.style.display = 'none';
    inputMethodDiv.innerHTML = `
      <label><input type="radio" name="inputMethod" value="typing"> Type Symptoms</label>
      <label><input type="radio" name="inputMethod" value="selecting"> Select from List</label>
    `;

    // Text input
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-input-container';
    typingDiv.style.display = 'none';
    typingDiv.innerHTML = `<input type="text" class="typed-symptoms" placeholder="Enter symptoms separated by commas">`;

    // List container
    const listDiv = document.createElement('div');
    listDiv.className = 'dynamic-symptoms-container';
    listDiv.style.display = 'none';
    listDiv.innerHTML = `<div class="dynamic-symptoms-list"></div>`;

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-entry-button';
    removeBtn.textContent = 'Remove Entry';

    entry.appendChild(systemLabel);
    entry.appendChild(subSystemLabel);
    entry.appendChild(systemImg);
    entry.appendChild(inputMethodDiv);
    entry.appendChild(typingDiv);
    entry.appendChild(listDiv);
    entry.appendChild(removeBtn);

    symptomEntriesContainer.appendChild(entry);
  }

  // --- EVENT DELEGATION ---
  symptomEntriesContainer.addEventListener('change', async (e) => {
    const entry = e.target.closest('.symptom-entry');
    if (!entry) return;

    const systemSelect = entry.querySelector('.system-select');
    const subSystemSelect = entry.querySelector('.sub-system-select');
    const systemImg = entry.querySelector('.system-image');
    const inputMethodDiv = entry.querySelector('.input-method-container');
    const typingDiv = entry.querySelector('.typing-input-container');
    const listDiv = entry.querySelector('.dynamic-symptoms-container');
    const dynamicList = entry.querySelector('.dynamic-symptoms-list');

    // --- SYSTEM SELECT ---
    if (e.target.classList.contains('system-select')) {
      const system = e.target.value;
      subSystemSelect.innerHTML = `<option value="">Select a sub-system</option>`;
      dynamicList.innerHTML = '';
      typingDiv.style.display = 'none';
      listDiv.style.display = 'none';
      inputMethodDiv.style.display = 'none';
      systemImg.style.display = systemImages[system] ? 'inline-block' : 'none';
      systemImg.src = systemImages[system] ? `/images/${systemImages[system]}` : '';
      
      if (!system) return;

      try {
        const res = await fetch(`/api/sub-systems/${encodeURIComponent(system)}`);
        if (!res.ok) throw new Error('Failed to fetch sub-systems');
        const subs = await res.json();
        subs.forEach(sub => {
          const option = document.createElement('option');
          option.value = sub;
          option.textContent = sub;
          subSystemSelect.appendChild(option);
        });
      } catch (err) {
        console.error(err);
        alert('Error loading sub-systems');
      }
    }

    // --- SUB-SYSTEM SELECT ---
    if (e.target.classList.contains('sub-system-select')) {
      inputMethodDiv.style.display = 'block';
      dynamicList.innerHTML = '';
    }

    // --- INPUT METHOD ---
    if (e.target.name === 'inputMethod') {
      if (e.target.value === 'typing') {
        typingDiv.style.display = 'block';
        listDiv.style.display = 'none';
      } else {
        typingDiv.style.display = 'none';
        listDiv.style.display = 'block';

        const subSystem = subSystemSelect.value;
        if (!subSystem) return;

        try {
          const res = await fetch(`/api/symptoms/${encodeURIComponent(subSystem)}`);
          if (!res.ok) throw new Error('Failed to fetch symptoms');
          const symptoms = await res.json();
          dynamicList.innerHTML = '';
          symptoms.forEach(symptom => {
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" value="${symptom}"> ${symptom}`;
            dynamicList.appendChild(label);
          });
        } catch (err) {
          console.error(err);
          dynamicList.innerHTML = '<p>Failed to load symptoms</p>';
        }
      }
    }
  });

  // --- REMOVE ENTRY ---
  symptomEntriesContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-entry-button')) {
      const entry = e.target.closest('.symptom-entry');
      entry.remove();
    }
  });

  // --- ANALYZE ALL SYMPTOMS ---
  document.getElementById('symptom-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const csrfToken = document.querySelector('input[name="_csrf"]').value;
    const entries = symptomEntriesContainer.querySelectorAll('.symptom-entry');

    const payload = [];
    for (const entry of entries) {
      const system = entry.querySelector('.system-select').value.trim();
      const subSystem = entry.querySelector('.sub-system-select').value.trim();
      let symptoms = [];

      if (entry.querySelector('input[name="inputMethod"]:checked')?.value === 'typing') {
        symptoms = entry.querySelector('.typed-symptoms').value.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        symptoms = Array.from(entry.querySelectorAll('.dynamic-symptoms-list input[type="checkbox"]:checked')).map(cb => cb.value);
      }

      if (system && subSystem && symptoms.length > 0) {
        payload.push({ system, subSystem, symptoms });
      }
    }

    if (!payload.length) {
      alert('Please select system, sub-system, and provide symptoms for each entry.');
      return;
    }

    try {
      const res = await fetch('/api/analyze-symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      const result = await res.json();
      displayResults(result);
    } catch (err) {
      console.error(err);
      resultsDiv.innerHTML = '<p>Error analyzing symptoms.</p>';
    }
  });

  function displayResults(data) {
    resultsDiv.innerHTML = '';
    if (!data.length) return resultsDiv.innerHTML = '<p>No matching conditions found.</p>';

    data.forEach(entry => {
      const section = document.createElement('div');
      section.className = 'result-section';
      section.innerHTML = `<h3>${entry.system} / ${entry.subSystem}</h3>`;
      if (!entry.possibleConditions?.length) section.innerHTML += '<p>No conditions matched.</p>';
      else {
        entry.possibleConditions.forEach(cond => {
          section.innerHTML += `<div>${cond.condition_name} (${cond.medical_code}) - ${cond.match_percentage.toFixed(2)}%</div>`;
        });
      }
      resultsDiv.appendChild(section);
    });
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
  }
});
