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
    inputMethodDiv.innerHTML = `
      <label><input type="radio" name="inputMethod${Date.now()}" value="typing"> Type Symptoms</label>
      <label><input type="radio" name="inputMethod${Date.now()}" value="selecting"> Select from List</label>
    `;

    // Text input
    const typingInput = document.createElement('input');
    typingInput.type = 'text';
    typingInput.className = 'typed-symptoms';
    typingInput.placeholder = 'Enter symptoms separated by commas';

    // List container
    const dynamicList = document.createElement('div');
    dynamicList.className = 'dynamic-symptoms-list';

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
  }

  // Event delegation
  symptomEntriesContainer.addEventListener('change', async (e) => {
    const entry = e.target.closest('.symptom-entry');
    if (!entry) return;

    const systemSelect = entry.querySelector('.system-select');
    const subSystemSelect = entry.querySelector('.sub-system-select');
    const systemImg = entry.querySelector('.system-image');
    const typingInput = entry.querySelector('.typed-symptoms');
    const dynamicList = entry.querySelector('.dynamic-symptoms-list');

    // System select → load image + sub-systems
    if (e.target.classList.contains('system-select')) {
      const system = e.target.value;
      systemImg.style.display = systemImages[system] ? 'inline-block' : 'none';
      systemImg.src = systemImages[system] ? `/images/${systemImages[system]}` : '';
      subSystemSelect.innerHTML = `<option value="">Select a sub-system</option>`;
      dynamicList.innerHTML = '';

      if (!system) return;

      try {
        const res = await fetch(`/api/sub-systems/${encodeURIComponent(system)}`);
        const subs = await res.json();
        subs.forEach(sub => {
          const option = document.createElement('option');
          option.value = sub;
          option.textContent = sub;
          subSystemSelect.appendChild(option);
        });
      } catch (err) {
        console.error(err);
      }
    }

    // Sub-system select → load symptoms list if input method = selecting
    if (e.target.classList.contains('sub-system-select')) {
      const method = entry.querySelector('input[type="radio"]:checked')?.value;
      if (method === 'selecting') await loadSymptomsList(entry);
    }

    // Input method change
    if (e.target.type === 'radio') {
      if (e.target.value === 'typing') {
        typingInput.style.display = 'inline-block';
        dynamicList.style.display = 'none';
      } else {
        typingInput.style.display = 'none';
        dynamicList.style.display = 'block';
        await loadSymptomsList(entry);
      }
    }
  });

  async function loadSymptomsList(entry) {
    const subSystem = entry.querySelector('.sub-system-select').value;
    const dynamicList = entry.querySelector('.dynamic-symptoms-list');
    dynamicList.innerHTML = '';
    if (!subSystem) return;

    try {
      const res = await fetch(`/api/symptoms/${encodeURIComponent(subSystem)}`);
      const symptoms = await res.json();
      symptoms.forEach(s => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" value="${s}"> ${s}`;
        dynamicList.appendChild(label);
      });
    } catch (err) {
      console.error(err);
      dynamicList.innerHTML = '<p>Failed to load symptoms</p>';
    }
  }

  // Remove entry
  symptomEntriesContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-entry-button')) {
      e.target.closest('.symptom-entry').remove();
    }
  });

  // Analyze symptoms
  document.getElementById('symptom-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const csrfToken = document.querySelector('input[name="_csrf"]').value;
    const entries = symptomEntriesContainer.querySelectorAll('.symptom-entry');

    const payload = [];
    for (const entry of entries) {
      const system = entry.querySelector('.system-select').value.trim();
      const subSystem = entry.querySelector('.sub-system-select').value.trim();
      const method = entry.querySelector('input[type="radio"]:checked')?.value;
      let symptoms = [];

      if (method === 'typing') {
        symptoms = entry.querySelector('.typed-symptoms').value.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        symptoms = Array.from(entry.querySelectorAll('.dynamic-symptoms-list input[type="checkbox"]:checked')).map(cb => cb.value);
      }

      if (system && subSystem && symptoms.length > 0) payload.push({ system, subSystem, symptoms });
    }

    if (!payload.length) return alert('Please fill in all entries correctly.');

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
