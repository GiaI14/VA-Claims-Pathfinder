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

    console.log('Saved results raw:', data); // 🔥 log the exact structure

    const results = data.results || data;

    const container = document.getElementById('saved-results');
    container.innerHTML = '<p>Check console for saved results structure.</p>';
  } catch (err) {
    console.error('Error loading saved results:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadSavedResults);


