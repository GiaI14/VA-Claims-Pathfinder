const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';

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
      credentials: 'same-origin'
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

    const container = document.getElementById('saved-results-cards');
    container.innerHTML = '';

    if (!data || data.length === 0) {
      container.innerHTML = '<p>No saved results found.</p>';
      return;
    }

    data.forEach(item => {
      const card = document.createElement('div');
      card.className = 'result-card';

      const header = document.createElement('div');
      header.className = 'card-header';
      header.textContent = `Saved on: ${new Date(item.created_at).toLocaleString()}`;
      card.appendChild(header);

      const content = document.createElement('div');
      content.className = 'card-content';

      item.results_json.forEach(entry => {
        const systemDiv = document.createElement('div');
        systemDiv.style.fontWeight = 'bold';
        systemDiv.style.marginTop = '10px';
        systemDiv.textContent = `System: ${entry.system || 'N/A'}`;
        content.appendChild(systemDiv);

        if (entry.possibleConditions && entry.possibleConditions.length > 0) {
          const table = document.createElement('table');
          table.className = 'results-table';
          table.style.width = '100%';
          table.style.borderCollapse = 'collapse';
          table.style.marginBottom = '10px';

          const thead = document.createElement('thead');
          const headerRow = document.createElement('tr');
          ['Condition Name', 'Medical Code', 'Match %'].forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            th.style.fontWeight = 'bold';
            th.style.textAlign = 'left';
            th.style.padding = '4px 6px';
            th.style.borderBottom = '1px solid #ddd';
            headerRow.appendChild(th);
          });
          thead.appendChild(headerRow);
          table.appendChild(thead);

          const tbody = document.createElement('tbody');
          entry.possibleConditions.forEach(cond => {
            const tr = document.createElement('tr');

            const tdName = document.createElement('td');
            tdName.textContent = cond.condition_name || '';
            tdName.style.padding = '4px 6px';

            const tdCode = document.createElement('td');
            tdCode.textContent = cond.medical_code || '';
            tdCode.style.padding = '4px 6px';

            const tdMatch = document.createElement('td');
            tdMatch.textContent = cond.match_percentage !== undefined ? cond.match_percentage + '%' : '';
            tdMatch.style.padding = '4px 6px';

            tr.appendChild(tdName);
            tr.appendChild(tdCode);
            tr.appendChild(tdMatch);
            tbody.appendChild(tr);
          });

          table.appendChild(tbody);
          content.appendChild(table);
        }
      });

      card.appendChild(content);
////////////////////////////////////////////////////////////////////////////////////////////
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = "Delete";
      deleteBtn.className = "delete-btn";
      deleteBtn.style.marginTop = "10px";
      deleteBtn.addEventListener('click', async () => {
        if (confirm("Are you sure you want to delete this saved result?")) {
          try {
            const res = await fetch(`/delete-saved-result/${item.id}`, {
              method: 'DELETE',
              headers: { 'X-CSRF-Token': csrfToken },
              credentials: 'same-origin'
            });
            const result = await res.json();
            if (result.success) card.remove();
            else alert("Failed to delete result.");
          } catch (err) {
            console.error("Error deleting result:", err);
            alert("Error deleting result.");
          }
        }
      });
      card.appendChild(deleteBtn);

      container.appendChild(card);
    });

  } catch (err) {
    console.error('Error loading saved results:', err);
    const container = document.getElementById('saved-results');
    container.innerHTML = `<p style="color:red;">Error loading saved results.</p>`;
  }
}

// =================== NEEDS DELETING ======================
async function loadSavedSecondaryConditions() {
  try {
    
    const response = await fetch('/api/saved-secondary', { 
      method: 'GET',
      credentials: 'same-origin'
    });
    const data = await response.json();

    const container = document.getElementById('saved-secondary-cards');
    container.innerHTML = '';

    if (!data || data.length === 0) {
      container.innerHTML = '<p>No saved secondary conditions found.</p>';
      return;
    }

    data.forEach(item => {
      const card = document.createElement('div');
      card.className = 'result-card';

      // Card header
      const header = document.createElement('div');
      header.className = 'card-header';
      header.textContent = `Saved on: ${new Date(item.created_at).toLocaleString()}`;
      card.appendChild(header);

      // Card content
      const content = document.createElement('div');
      content.className = 'card-content';

        item.results.forEach(entry => {
        const conditionsArray = Array.isArray(entry.conditions) ? entry.conditions : [];

        conditionsArray.forEach(condStr => {
          const div = document.createElement('div');
          div.style.marginTop = '10px';

          // Display as "Disability: <condition_name>"
          const disabilityDiv = document.createElement('div');
          disabilityDiv.style.fontWeight = 'bold';
          disabilityDiv.textContent = `Disability: ${condStr.split('\n')[0] || 'Unknown'}`;
          div.appendChild(disabilityDiv);

          // Display as "Secondary Conditions: ..."
          const secondaryDiv = document.createElement('div');
          const secondaryText = condStr.includes('\n')
            ? condStr.split('\n')[1].replace('Secondary Conditions:', '').trim()
            : 'None';
          secondaryDiv.textContent = `Secondary Conditions: ${secondaryText}`;
          div.appendChild(secondaryDiv);

          content.appendChild(div);
        });
      });

      card.appendChild(content);
////////////////////////////////////////////////////////////////////////////////////////////////////////
      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = "Delete";
      deleteBtn.className = "delete-btn";
      deleteBtn.style.marginTop = "10px";

      deleteBtn.addEventListener('click', async () => {
        if (confirm("Are you sure you want to delete this saved result?")) {
          try {
            const res = await fetch(`/api/delete-saved-secondary/${item.id}`, {
              method: 'DELETE',
              headers: { 'X-CSRF-Token': csrfToken },
              credentials: 'same-origin'
            });
            const result = await res.json();
            if (result.success) card.remove();
            else alert("Failed to delete saved secondary condition.");
          } catch (err) {
            console.error("Error deleting saved secondary condition:", err);
            alert("Error deleting saved secondary condition.");
          }
        }
      });

      card.appendChild(deleteBtn);
      container.appendChild(card);
    });

  } catch (err) {
    console.error('Error loading saved secondary conditions:', err);
    const container = document.getElementById('savedSecondaryContainer');
    container.innerHTML = `<p style="color:red;">Error loading saved secondary conditions.</p>`;
  }
}


document.addEventListener('DOMContentLoaded', () => {
  const resultsContainer = document.getElementById('saved-results');
  const secondaryContainer = document.getElementById('savedSecondaryContainer');

  const showResultsBtn = document.getElementById('showResultsBtn');
  if (showResultsBtn) {
    showResultsBtn.addEventListener('click', async () => {
      if (resultsContainer.style.display === 'none' || !resultsContainer.style.display) {
        resultsContainer.style.display = 'block';
        showResultsBtn.textContent = "Hide VA Disability Results";
        await loadSavedResults(); // load only when button pressed
      } else {
        resultsContainer.style.display = 'none';
        showResultsBtn.textContent = "VA Disability Results";
      }
    });
  }

  const showSecondaryBtn = document.getElementById('showSecondaryBtn');
  if (showSecondaryBtn) {
    showSecondaryBtn.addEventListener('click', async () => {
      if (secondaryContainer.style.display === 'none' || !secondaryContainer.style.display) {
        secondaryContainer.style.display = 'block';
        showSecondaryBtn.textContent = "Hide Secondary Conditions";
        await loadSavedSecondaryConditions(); // load only when button pressed
      } else {
        secondaryContainer.style.display = 'none';
        showSecondaryBtn.textContent = "Show Secondary Conditions";
      }
    });
  }
});




