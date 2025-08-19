document.addEventListener('DOMContentLoaded', () => {
  const symptomEntriesContainer = document.getElementById('symptomEntriesContainer');
  const resultsDiv = document.getElementById('results');
  const addButton = document.getElementById('addEntry');
  const analyzeButton = document.getElementById('analyzeSymptoms');
  const removeButton = document.getElementById('removeEntry'); // your "remove" button

  // ---- ADD ENTRY ----
  if (addButton) {
    addButton.addEventListener('click', () => {
      const entry = document.createElement('div');
      entry.classList.add('symptom-entry');

      entry.innerHTML = `
        <label>System:</label>
        <select class="body-part">
          <option value="">-- Select System --</option>
          ${systemsFromServer.map(system => `<option value="${system}">${system}</option>`).join('')}
        </select>

        <label>Type:</label>
        <select class="symptom-type">
          <option value="">-- Select Type --</option>
          <option value="input">Manual Input</option>
          <option value="list">Select from List</option>
        </select>

        <div class="symptom-input-container"></div>
      `;

      symptomEntriesContainer.appendChild(entry);
    });
  }

  // ---- ANALYZE ----
  if (analyzeButton) {
    analyzeButton.addEventListener('click', async () => {
      const symptomEntries = document.querySelectorAll('.symptom-entry');
      const symptomsData = [];

      symptomEntries.forEach(entry => {
        const system = entry.querySelector('.body-part').value.trim();
        const type = entry.querySelector('.symptom-type').value.trim();
        const inputContainer = entry.querySelector('.symptom-input-container');
        let symptoms = '';

        if (type === 'input') {
          symptoms = inputContainer.querySelector('input')?.value.trim() || '';
        } else if (type === 'list') {
          symptoms = Array.from(inputContainer.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => cb.value)
            .join(', ');
        }

        if (system && symptoms) {
          symptomsData.push({ system, symptoms });
        }
      });

      // send to backend
      if (symptomsData.length > 0) {
        const csrfToken = document.getElementById('csrfToken').value;

        const response = await fetch('/analyzeSymptoms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CSRF-Token': csrfToken
          },
          body: JSON.stringify({ symptomsData })
        });

        const result = await response.json();
        resultsDiv.innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
      } else {
        resultsDiv.innerHTML = '<p>Please enter at least one system with symptoms.</p>';
      }
    });
  }

  // ---- REMOVE (RESET EVERYTHING) ----
  if (removeButton) {
    removeButton.addEventListener('click', () => {
      // Reset to original state (just 1 empty entry)
      symptomEntriesContainer.innerHTML = `
        <div class="symptom-entry">
          <label>System:</label>
          <select class="body-part">
            <option value="">-- Select System --</option>
            ${systemsFromServer.map(system => `<option value="${system}">${system}</option>`).join('')}
          </select>

          <label>Type:</label>
          <select class="symptom-type">
            <option value="">-- Select Type --</option>
            <option value="input">Manual Input</option>
            <option value="list">Select from List</option>
          </select>

          <div class="symptom-input-container"></div>
        </div>
      `;

      // Clear results
      resultsDiv.innerHTML = '';
    });
  }
});
