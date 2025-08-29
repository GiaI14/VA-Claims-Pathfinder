document.addEventListener('DOMContentLoaded', () => {
  const symptomEntriesContainer = document.getElementById('symptomEntriesContainer');
  const dynamicSymptomsList = document.getElementById('dynamicSymptomsList');
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
    //'Nervous System': '512px-Nervous_system_diagram-en.svg.png',
    'Ear': 'Auditory_System.jpg',
    'Sense Organs': 'Sense-Organ.png',
  };

  // --- SYSTEM SELECT: load sub-systems & image
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

  // --- SUB-SYSTEM SELECT: fetch symptoms
  symptomEntriesContainer.addEventListener('change', async e => {
    if (!e.target.classList.contains('sub-system-select')) return;

    const subSystem = e.target.value;
    dynamicSymptomsList.innerHTML = '';

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
      dynamicSymptomsList.appendChild(frag);
    } catch (err) {
      console.error('Failed to load symptoms:', err);
      dynamicSymptomsList.innerHTML = '<p>Failed to load symptoms</p>';
    }
  });

  // --- REMOVE ENTRY BUTTON ---
  symptomEntriesContainer.addEventListener('click', e => {
    if (!e.target.classList.contains('remove-entry-button')) return;

    const entry = e.target.closest('.symptom-entry');
    if (!entry) return;

    const systemSelect = entry.querySelector('.system-select');
    const subSystemSelect = entry.querySelector('.sub-system-select');
    const systemImage = entry.querySelector('.system-image');

    systemSelect.value = '';
    subSystemSelect.innerHTML = `<option value="">Select a sub-system</option>`;
    systemImage.src = '';
    systemImage.style.display = 'none';

    dynamicSymptomsList.innerHTML = '';
    resultsDiv.innerHTML = '<p>No analysis yet.</p>';
  });

  // --- ANALYZE SYMPTOMS ---
  document.getElementById('symptom-form').addEventListener('submit', async e => {
    e.preventDefault();
    const csrfToken = document.querySelector('input[name="_csrf"]').value;
    const subSystemSelect = document.querySelector('.sub-system-select');
    const subSystem = subSystemSelect ? subSystemSelect.value : '';
    const chosenSymptoms = Array.from(document.querySelectorAll('#dynamicSymptomsList input[type="checkbox"]:checked'))
      .map(cb => cb.value);

    if (!subSystem || chosenSymptoms.length === 0) {
      alert('Please select a sub-system and at least one symptom.');
      return;
    }

    try {
      const res = await fetch('/analyze-symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ subSystem, chosenSymptoms }),
        credentials: 'same-origin'
      });

      if (!res.ok) throw new Error('Failed to analyze symptoms');
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        resultsDiv.innerHTML = '<p>No matching conditions found.</p>';
        return;
      }

      let html = '<h2>Possible Conditions</h2><table><thead><tr><th>Condition Name</th><th>Medical Code</th><th>Match %</th></tr></thead><tbody>';
      data[0].possibleConditions?.forEach(row => {
        html += `<tr>
          <td>${row.condition_name}</td>
          <td>${row.medical_code}</td>
          <td>${row.match_percentage}%</td>
        </tr>`;
      });
      html += '</tbody></table>';
      resultsDiv.innerHTML = html;

    } catch (err) {
      console.error('Error analyzing symptoms:', err);
      resultsDiv.innerHTML = '<p>Error analyzing symptoms.</p>';
    }
  });
});
