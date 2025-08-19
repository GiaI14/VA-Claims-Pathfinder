document.addEventListener('DOMContentLoaded', () => {
  const symptomEntriesContainer = document.getElementById('symptomEntriesContainer');
  const dynamicSymptomsList = document.getElementById('dynamicSymptomsList');
  const resultsDiv = document.getElementById('results');
  
  const systemImages = {
    'Dental and Oral Conditions': '512px-202402_Oral_Cavity.svg.png',
    'Hemic and Lymphatic Conditions': '1024px-Circulatory_System_en.svg.png',
    'Infectious Diseases, Immune Disorders and Nutritional Deficiencies': '1024px-Blausen_0623_ImmuneSystem.png',
    'Musculoskeletal System': '1024px-Skeletal_system.svg.png',
    'Neurological Conditions': '1024px-Blausen_0657_MultinodalNeuron.png',
    'Respiratory System': '1024px-Respiratory_system_complete_en.svg.png',
    'Sensory Organs': '1024px-Sense_Organs_en.svg.png',
    'Skin Conditions': '1024px-Skin_layers.png'
  };

  // IMAGE + SYSTEM SELECTION
  symptomEntriesContainer.addEventListener('change', (e) => {
    if (e.target.classList.contains('system-select')) {
      const entry = e.target.closest('.symptom-entry');
      const system = e.target.value;
      const image = entry.querySelector('.system-image');
      if (systemImages[system]) {
        image.src = systemImages[system];
        image.style.display = 'block';
      } else {
        image.src = '';
        image.style.display = 'none';
      }
    }
  });

  // INPUT METHOD TOGGLE
  symptomEntriesContainer.addEventListener('change', (e) => {
    if (e.target.name === 'inputMethod') {
      const entry = e.target.closest('.symptom-entry');
      const typedInput = entry.querySelector('.typed-symptoms');
      const dynamicList = entry.querySelector('.dynamic-symptoms-list');

      if (e.target.value === 'typed') {
        typedInput.style.display = 'block';
        dynamicList.style.display = 'none';
      } else if (e.target.value === 'selected') {
        typedInput.style.display = 'none';
        dynamicList.style.display = 'block';
      }
    }
  });

  // ANALYZE SYMPTOMS
  document.getElementById('analyzeButton').addEventListener('click', async () => {
    resultsDiv.innerHTML = '<p>Analyzing symptoms...</p>';

    const csrfToken = document.getElementById('csrfToken').value;
    const symptomEntries = document.querySelectorAll('.symptom-entry');

    const symptomsData = [];

    symptomEntries.forEach(entry => {
      const system = entry.querySelector('.system-select').value;
      const subSystem = entry.querySelector('.sub-system-select').value;
      const typedInput = entry.querySelector('.typed-symptoms').value.trim();
      const selectedSymptoms = Array.from(
        entry.querySelectorAll('.dynamic-symptoms-list input[type="checkbox"]:checked')
      ).map(cb => cb.value);

      symptomsData.push({
        system,
        subSystem,
        typedInput,
        selectedSymptoms
      });
    });

    try {
      const response = await fetch('/compareSymptomsToConditions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken
        },
        body: JSON.stringify({ symptomsData })
      });

      const data = await response.json();

      if (data.error) {
        resultsDiv.innerHTML = `<p style="color:red;">${data.error}</p>`;
      } else {
        resultsDiv.innerHTML = `<pre>${JSON.stringify(data.matches, null, 2)}</pre>`;
      }
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      resultsDiv.innerHTML = `<p style="color:red;">An error occurred while analyzing symptoms.</p>`;
    }
  });

  // --- RESET ENTRY + CLEAR RESULTS (Remove Entry button) ---
  symptomEntriesContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.remove-entry-button');
    if (!btn) return;

    const entry = btn.closest('.symptom-entry');
    if (!entry) return;

    // Reset system select
    const systemSelect = entry.querySelector('.system-select');
    if (systemSelect) systemSelect.selectedIndex = 0;

    // Reset sub-system select
    const subSystemSelect = entry.querySelector('.sub-system-select');
    if (subSystemSelect) {
      subSystemSelect.innerHTML = `<option value="" disabled selected hidden>Select a sub-system</option>`;
    }

    // Hide & clear image
    const systemImage = entry.querySelector('.system-image');
    if (systemImage) {
      systemImage.src = '';
      systemImage.style.display = 'none';
    }

    // Reset input method radios
    entry.querySelectorAll('input[type="radio"]').forEach(r => (r.checked = false));

    // Hide & clear typed input
    const typedInput = entry.querySelector('.typed-symptoms');
    if (typedInput) {
      typedInput.value = '';
      typedInput.style.display = 'none';
    }

    // Hide & clear dynamic symptoms (inside the entry)
    const dynamicList = entry.querySelector('.dynamic-symptoms-list');
    if (dynamicList) {
      dynamicList.innerHTML = '';
      dynamicList.style.display = 'none';
    }

    // If you also have the external #dynamicSymptomsList, clear it too
    if (dynamicSymptomsList) dynamicSymptomsList.innerHTML = '';

    // Clear results
    resultsDiv.innerHTML = '';
  });
});
