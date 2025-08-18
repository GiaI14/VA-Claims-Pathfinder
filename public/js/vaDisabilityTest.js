document.addEventListener('DOMContentLoaded', () => {
  const systemSelect = document.querySelector('.system-select');
  const subSystemSelect = document.querySelector('.sub-system-select');
  const systemImage = document.querySelector('.system-image');
  const dynamicSymptomsList = document.getElementById('dynamicSymptomsList');
  const analyzeButton = document.getElementById('analyzeButton');
  const resultsDiv = document.getElementById('results');
  const csrfToken = document.querySelector('input[name="_csrf"]').value;

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
    'Sense Organs': 'Sense-Organ.png'
  };

  // --- Load sub-systems on system change ---
  systemSelect.addEventListener('change', async () => {
    const system = systemSelect.value;
    subSystemSelect.innerHTML = `<option value="" disabled selected hidden>Select a sub-system</option>`;
    dynamicSymptomsList.innerHTML = '';
    resultsDiv.innerHTML = '';

    if (systemImages[system]) {
      systemImage.src = `/images/${systemImages[system]}`;
      systemImage.style.display = 'inline-block';
    } else {
      systemImage.src = '';
      systemImage.style.display = 'none';
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
    } catch (err) {
      console.error(err);
      alert('Failed to load sub-systems');
    }
  });

  // --- Load symptoms on sub-system change ---
  subSystemSelect.addEventListener('change', async () => {
    dynamicSymptomsList.innerHTML = '';
    if (!subSystemSelect.value) return;

    try {
      const res = await fetch(`/api/symptoms/${encodeURIComponent(subSystemSelect.value)}`);
      const symptoms = await res.json();
      symptoms.forEach(symptom => {
        const label = document.createElement('label');
        label.className = 'symptom-item';
        label.innerHTML = `<input type="checkbox" value="${symptom}"> ${symptom}`;
        dynamicSymptomsList.appendChild(label);
      });
    } catch (err) {
      console.error(err);
      dynamicSymptomsList.innerHTML = '<p>Failed to load symptoms</p>';
    }
  });

  // --- Analyze symptoms ---
  analyzeButton.addEventListener('click', async e => {
    e.preventDefault();
    const chosenSymptoms = Array.from(dynamicSymptomsList.querySelectorAll('input[type="checkbox"]:checked'))
      .map(cb => cb.value);
    if (!subSystemSelect.value || chosenSymptoms.length === 0) {
      alert('Select sub-system and at least one symptom.');
      return;
    }

    try {
      const res = await fetch('/analyze-symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ subSystem: subSystemSelect.value, chosenSymptoms }),
      });
      const data = await res.json();
      if (!data || data.length === 0) {
        resultsDiv.innerHTML = '<p>No matching conditions found.</p>';
        return;
      }

      let html = '<h2>Possible Conditions</h2><table><thead><tr><th>Condition Name</th><th>Medical Code</th><th>Match %</th></tr></thead><tbody>';
      data.forEach(row => {
        if (row.condition_name) {
          html += `<tr>
            <td>${row.condition_name}</td>
            <td>${row.medical_code}</td>
            <td>${row.match_percentage}%</td>
          </tr>`;
        }
      });
      html += '</tbody></table>';
      resultsDiv.innerHTML = html;

    } catch (err) {
      console.error(err);
      resultsDiv.innerHTML = '<p>Error analyzing symptoms.</p>';
    }
  });
});
