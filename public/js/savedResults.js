async function saveResults(results) {
  try {
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

    const response = await fetch('/save-results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({ results }),
      credentials: 'same-origin'  // 👈 important: sends session cookie
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const data = await response.json();
    console.log('Save result response:', data);

    if (data.success) {
      alert('Results saved successfully!');
      await loadSavedResults(); // reload the saved list
    } else {
      alert(`Save failed: ${data.message}`);
    }
  } catch (err) {
    console.error('Error saving results:', err);
    alert('Error saving results. See console for details.');
  }
}

async function loadSavedResults() {
  try {
    const response = await fetch('/get-saved-results', { credentials: 'same-origin' });
    const data = await response.json();

    const container = document.getElementById('saved-results');
    container.innerHTML = '';

    if (!data || data.length === 0) {
      container.innerHTML = '<p>No saved results found.</p>';
      return;
    }

    data.forEach(item => {

      // 🔹 TEMP: log first condition keys to check match percentage field name
      if (item.results_json && item.results_json[0].possibleConditions && item.results_json[0].possibleConditions.length > 0) {
        console.log("All keys in first condition:", item.results_json[0].possibleConditions[0]);
      }

      const card = document.createElement('div');
      card.className = 'result-card';

      // Header with save date
      const header = document.createElement('div');
      header.className = 'card-header';
      header.textContent = `Saved on: ${new Date(item.created_at).toLocaleString()}`;
      card.appendChild(header);

      const content = document.createElement('div');
      content.className = 'card-content';

      // Loop through results_json array
      item.results_json.forEach(entry => {
        // Show system
        const systemDiv = document.createElement('div');
        systemDiv.style.fontWeight = 'bold';
        systemDiv.style.marginTop = '10px';
        systemDiv.textContent = `System: ${entry.system || 'N/A'}`;
        content.appendChild(systemDiv);

        // Loop through possibleConditions
        if (entry.possibleConditions && entry.possibleConditions.length > 0) {
          entry.possibleConditions.forEach(cond => {
            const table = document.createElement('table');
            table.className = 'results-table';
            const tbody = document.createElement('tbody');

            ['condition_name', 'medical_code', 'match_percentage'].forEach(field => {
              if (cond[field] !== undefined) {
                const tr = document.createElement('tr');

                const tdKey = document.createElement('td');
                tdKey.textContent = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                tdKey.style.fontWeight = 'bold';

                const tdValue = document.createElement('td');
                tdValue.textContent = cond[field];

                tr.appendChild(tdKey);
                tr.appendChild(tdValue);
                tbody.appendChild(tr);
              }
            });

            table.appendChild(tbody);
            content.appendChild(table);
            content.appendChild(document.createElement('hr')); // separator between conditions
          });
        }
      });

      card.appendChild(content);
      container.appendChild(card);
    });

  } catch (err) {
    console.error('Error loading saved results:', err);
    const container = document.getElementById('saved-results');
    container.innerHTML = `<p style="color:red;">Error loading saved results.</p>`;
  }
}

document.addEventListener('DOMContentLoaded', loadSavedResults);

