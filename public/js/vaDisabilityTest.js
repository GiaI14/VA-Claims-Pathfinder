document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('symptomEntriesContainer');
  const resultsDiv = document.getElementById('results');
  const csrfToken = document.getElementById('csrfToken').value;

  const systemImages = {
    "Dental and Oral Conditions": "512px-202402_Oral_Cavity.svg.png",
    "Hemic and Lymphatic Conditions": "512px-Circulatory_System_en.svg.png",
    "Neurological Conditions": "512px-Nervous_system_diagram.png"
    // add more as needed
  };

  // Populate subsystem + symptoms when system changes
  function attachSystemListener(entry) {
    const systemSelect = entry.querySelector('.body-part');
    const subsystemSelect = entry.querySelector('.subsystem');
    const symptomSelect = entry.querySelector('.choose-symptom');
    const imageDiv = entry.querySelector('.system-image');

    systemSelect.addEventListener('change', async () => {
      const system = systemSelect.value;
      subsystemSelect.innerHTML = '<option value="">--Select Subsystem--</option>';
      symptomSelect.innerHTML = '<option value="">--Select Symptom--</option>';
      imageDiv.innerHTML = '';

      if (system) {
        // Show system image
        if (systemImages[system]) {
          imageDiv.innerHTML = `<img src="/images/${systemImages[system]}" alt="${system}" style="max-width:150px;">`;
        }

        // Fetch subsystems
        try {
          const res = await fetch(`/api/subsystems?system=${encodeURIComponent(system)}`);
          const data = await res.json();
          data.subsystems.forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub;
            opt.textContent = sub;
            subsystemSelect.appendChild(opt);
          });
        } catch (err) {
          console.error("Error loading subsystems", err);
        }
      }
    });

    // Fetch symptoms when subsystem changes
    subsystemSelect.addEventListener('change', async () => {
      const subsystem = subsystemSelect.value;
      symptomSelect.innerHTML = '<option value="">--Select Symptom--</option>';

      if (subsystem) {
        try {
          const res = await fetch(`/api/symptoms?subsystem=${encodeURIComponent(subsystem)}`);
          const data = await res.json();
          data.symptoms.forEach(sym => {
            const opt = document.createElement('option');
            opt.value = sym;
            opt.textContent = sym;
            symptomSelect.appendChild(opt);
          });
        } catch (err) {
          console.error("Error loading symptoms", err);
        }
      }
    });
  }

  // Attach to first entry
  attachSystemListener(container.querySelector('.symptom-entry'));

  // Add new entry
  document.getElementById('addEntry').addEventListener('click', () => {
    const first = container.querySelector('.symptom-entry');
    const clone = first.cloneNode(true);

    // Reset fields
    clone.querySelector('.body-part').value = "";
    clone.querySelector('.subsystem').innerHTML = '<option value="">--Select Subsystem--</option>';
    clone.querySelector('.choose-symptom').innerHTML = '<option value="">--Select Symptom--</option>';
    clone.querySelector('.typed-symptoms').value = "";
    clone.querySelector('.system-image').innerHTML = "";

    container.appendChild(clone);
    attachSystemListener(clone);
  });

  // Remove/reset all entries
  document.getElementById('removeEntries').addEventListener('click', () => {
    container.innerHTML = '';

    const first = document.createElement('div');
    first.classList.add('symptom-entry');
    first.innerHTML = `
      <label>System:</label>
      <select class="body-part">
        <option value="">--Select System--</option>
        ${Array.from(document.querySelectorAll('.body-part option'))
          .map(opt => `<option value="${opt.value}">${opt.textContent}</option>`)
          .join('')}
      </select>

      <label>Subsystem:</label>
      <select class="subsystem">
        <option value="">--Select Subsystem--</option>
      </select>

      <label>Choose Symptom:</label>
      <select class="choose-symptom">
        <option value="">--Select Symptom--</option>
      </select>

      <label>Or Type Symptoms:</label>
      <input type="text" class="typed-symptoms" placeholder="Type your symptoms">

      <div class="system-image"></div>
    `;

    container.appendChild(first);
    attachSystemListener(first);
    resultsDiv.innerHTML = '';
  });

  // Analyze symptoms
  document.getElementById('symptomForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const entries = container.querySelectorAll('.symptom-entry');
    const symptomsData = [];

    entries.forEach(entry => {
      const system = entry.querySelector('.body-part').value.trim();
      const subsystem = entry.querySelector('.subsystem').value.trim();
      const chosenSymptom = entry.querySelector('.choose-symptom').value.trim();
      const typedSymptom = entry.querySelector('.typed-symptoms').value.trim();

      // Prefer typed symptom if filled, otherwise chosen
      const symptom = typedSymptom || chosenSymptom;

      if (system && subsystem && symptom) {
        symptomsData.push({ system, subsystem, symptom });
      }
    });

    if (symptomsData.length === 0) {
      alert("Please select or type at least one symptom.");
      return;
    }

    try {
      const res = await fetch('/analyzeSymptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken
        },
        body: JSON.stringify({ symptomsData })
      });

      if (!res.ok) throw new Error("Failed to analyze symptoms");

      const data = await res.json();
      resultsDiv.innerHTML = `<h2>Results</h2><pre>${JSON.stringify(data, null, 2)}</pre>`;
    } catch (err) {
      console.error("Error analyzing symptoms:", err);
      resultsDiv.innerHTML = `<p style="color:red;">Error analyzing symptoms. Please try again.</p>`;
    }
  });
});
