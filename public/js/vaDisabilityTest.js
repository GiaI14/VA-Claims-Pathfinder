document.addEventListener('DOMContentLoaded', () => {
  const symptomEntriesContainer = document.getElementById('symptomEntriesContainer');
  const resultsDiv = document.getElementById('results');
  const csrfToken = document.querySelector('input[name="_csrf"]').value;

  const systemImages = { /* same as before */ };

  symptomEntriesContainer.addEventListener('change', async e => {
    const entry = e.target.closest('.symptom-entry');
    if (!entry) return;

    const systemSelect = entry.querySelector('.system-select');
    const subSystemSelect = entry.querySelector('.sub-system-select');
    const systemImage = entry.querySelector('.system-image');
    const inputMethodContainer = entry.querySelector('.input-method-container');
    const typingInputContainer = entry.querySelector('.typing-input-container');
    const dynamicSymptomsContainer = entry.querySelector('.dynamic-symptoms-container');
    const dynamicSymptomsList = entry.querySelector('.dynamic-symptoms-list');
    const typedSymptomsInput = entry.querySelector('.typed-symptoms');

    // --- SYSTEM CHANGE ---
    if (e.target === systemSelect) {
      const system = systemSelect.value;
      subSystemSelect.innerHTML = `<option value="" disabled selected hidden>Select a sub-system</option>`;
      dynamicSymptomsList.innerHTML = '';
      inputMethodContainer.style.display = 'none';
      typingInputContainer.style.display = 'none';
      dynamicSymptomsContainer.style.display = 'none';
      typedSymptomsInput.value = '';
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
    }

    // --- SUB-SYSTEM CHANGE ---
    if (e.target === subSystemSelect) {
      dynamicSymptomsList.innerHTML = '';
      typingInputContainer.style.display = 'none';
      dynamicSymptomsContainer.style.display = 'none';
      inputMethodContainer.style.display = 'block'; // SHOW radio buttons
      typedSymptomsInput.value = '';
      resultsDiv.innerHTML = '';

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
    }

    // --- RADIO BUTTONS ---
    if (e.target.name === 'symptomInputMethod') {
      if (e.target.value === 'typing') {
        typingInputContainer.style.display = 'block';
        dynamicSymptomsContainer.style.display = 'none';
      } else if (e.target.value === 'selecting') {
        typingInputContainer.style.display = 'none';
        dynamicSymptomsContainer.style.display = 'block';
      }
    }
  });

  // --- ANALYZE BUTTON ---
  document.getElementById('analyzeButton').addEventListener('click', async e => {
    e.preventDefault();
    const entry = document.querySelector('.symptom-entry'); // single entry

    const subSystemSelect = entry.querySelector('.sub-system-select');
    const typedSymptomsInput = entry.querySelector('.typed-symptoms');
    const dynamicSymptomsList = entry.querySelector('.dynamic-symptoms-list');

    const selectedMethod = entry.querySelector('input[name="symptomInputMethod"]:checked')?.value;
    let chosenSymptoms = [];

    if (selectedMethod === 'typing') {
      chosenSymptoms = typedSymptomsInput.value.split(',').map(s => s.trim()).filter(Boolean);
    } else if (selectedMethod === 'selecting') {
      chosenSymptoms = Array.from(dynamicSymptomsList.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value);
    }

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

  // --- REMOVE ENTRY BUTTON ---
  symptomEntriesContainer.addEventListener('click', e => {
    if (!e.target.classList.contains('remove-entry-button')) return;
    const entry = e.target.closest('.symptom-entry');
    entry.remove();
  });
});
