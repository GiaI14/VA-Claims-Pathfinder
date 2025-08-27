document.addEventListener('DOMContentLoaded', () => {
  const symptomEntriesContainer = document.getElementById('symptomEntriesContainer');
  const analyzeButton = document.getElementById('analyzeButton');
  const resultsDiv = document.getElementById('results');

  const systemImages = {
    'Dental and Oral Conditions': '512px-202402_Oral_Cavity.svg.png',
    'Hemic and Lymphatic Systems': '512px-2201_Anatomy_of_the_Lymphatic_System.jpg',
    'Cardiovascular system': '512px-Circulatory_System_en_edited.svg.png',
    'Skin': '512px-Dermatology_-_Integumentary_system_1_--_Smart-Servier.png',
    'Digestive System': '512px-Digestive_system_diagram_en.svg.png',
    'Endocrine system': '512px-Endocrine_English.svg.png',
    'Gynecological conditions and disorders of the breast': '512px-Female_genital_system_-_Sagittal_view.svg.png',
    'Eye': '512px-Lateral_orbit_nerves_chngd.jpg',
    'Genitourinary system': '512px-Male_and_female_genital_organs.svg.png',
    'Musculoskeletal system': '512px-Skeleton_and_muscles.png',
    'Respiratory system': '512px-Respiratory_system_complete_fr_simplified.svg.png',
    'Ear': 'Auditory_System.jpg',
    'Sense Organs': 'Sense-Organ.png',
  };

  // ------------------- LIGHTBOX / IMAGE ENLARGE -------------------
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = lightbox?.querySelector('.close');

  function closeLightbox() {
    if (lightbox) {
      lightbox.style.display = 'none';
      lightboxImg.src = '';
    }
  }

  // Click on system image to open lightbox
  symptomEntriesContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('system-image') && e.target.src) {
      if (lightbox && lightboxImg) {
        lightboxImg.src = e.target.src;
        lightbox.style.display = 'flex';
      }
    }
  });

  // Close lightbox on overlay click or image click or close button
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  lightboxImg?.addEventListener('click', closeLightbox);
  closeBtn?.addEventListener('click', closeLightbox);


  // ------------------- TOGGLE INPUT METHOD -------------------
  function toggleSymptomInput(entry, value) {
    const typingInput = entry.querySelector('.typed-symptoms');
    const listInput = entry.querySelector('.dynamic-symptoms-list');

    if (value === 'typing') {
      typingInput.style.display = 'block';
      listInput.style.display = 'none';
    } else if (value === 'selecting') {
      typingInput.style.display = 'none';
      listInput.style.display = 'block';
    }
  }

  function bindRadios(entry) {
    const radios = entry.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        toggleSymptomInput(entry, radio.value);
      });
    });
  }

  document.querySelectorAll('.symptom-entry').forEach(bindRadios);

  // ------------------- SYSTEM SELECT -------------------
  symptomEntriesContainer.addEventListener('change', async e => {
    if (!e.target.classList.contains('system-select')) return;

    const entry = e.target.closest('.symptom-entry');
    const system = e.target.value;
    const subSystemSelect = entry.querySelector('.sub-system-select');
    const systemImage = entry.querySelector('.system-image');

    subSystemSelect.innerHTML = `<option value="">Select a sub-system</option>`;

    // Show system image
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

  // ------------------- SUB-SYSTEM SELECT -------------------
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
      const inputMethod = entry.querySelector('input[type="radio"]:checked')?.value;
      if (!system || !subSystem || !inputMethod) return;

      let symptoms = [];
      if (inputMethod === 'typing') {
        const typed = entry.querySelector('.typed-symptoms').value;
        symptoms = typed.split(',').map(s => s.trim()).filter(s => s);
      } else {
        symptoms = Array.from(entry.querySelectorAll('.dynamic-symptoms-list input[type="checkbox"]:checked'))
          .map(cb => cb.value);
      }

      if (symptoms.length > 0) {
        data.push({ system, subSystem, inputMethod, symptoms });
      }
    });

    if (data.length === 0) {
      alert('Please select a system, sub-system, and at least one symptom.');
      return;
    }

    try {
      const res = await fetch('/api/analyze-symptoms', {
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

      if (entry.possibleConditions && entry.possibleConditions.length > 0) {
        const conditionsHtml = entry.possibleConditions.map(cond => `
          <h4>${cond.condition_name} (Code: ${cond.medical_code})</h4>
          <p>Confidence: ${cond.match_percentage}%</p>
        `).join('<hr>');

        div.innerHTML = `
          <h3>System: ${entry.system}</h3>
          ${conditionsHtml}
        `;
      } else {
        div.innerHTML = `
          <h3>System: ${entry.system}</h3>
          <p>${entry.message || 'No matching conditions found.'}</p>
        `;
      }

      resultsDiv.appendChild(div);
    });

    /////////////added/////////////////////////////////////////////////////
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save Results';
    saveBtn.className = 'save-results-btn';
    resultsDiv.appendChild(saveBtn);

    saveBtn.addEventListener('click', () => saveResults(data));
  }
  ////////////////////////////////////////////////////////////////////////////
  // ------------------- REMOVE ENTRY -------------------
  symptomEntriesContainer.addEventListener('click', (e) => {
    if (!e.target.classList.contains('remove-entry-button')) return;

    const entry = e.target.closest('.symptom-entry');
    if (!entry) return;

    const systemSelect = entry.querySelector('.system-select');
    if (systemSelect) {
      systemSelect.selectedIndex = 0;
      const event = new Event('change', { bubbles: true });
      systemSelect.dispatchEvent(event);
    }

    const subSystemSelect = entry.querySelector('.sub-system-select');
    if (subSystemSelect) {
      subSystemSelect.innerHTML = `<option value="" disabled selected hidden>Select a sub-system</option>`;
    }

    const systemImage = entry.querySelector('.system-image');
    if (systemImage) {
      systemImage.src = '';
      systemImage.style.display = 'none';
    }

    entry.querySelectorAll('input[type="radio"]').forEach(r => (r.checked = false));

    const typedInput = entry.querySelector('.typed-symptoms');
    if (typedInput) {
      typedInput.value = '';
      typedInput.style.display = 'none';
    }

    const dynamicList = entry.querySelector('.dynamic-symptoms-list');
    if (dynamicList) {
      dynamicList.innerHTML = '';
      dynamicList.style.display = 'none';
    }

    resultsDiv.innerHTML = '';
  });
});
