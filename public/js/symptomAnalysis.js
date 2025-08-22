document.querySelectorAll('.option').forEach(option => {
  option.addEventListener('click', async () => {
    const targetId = option.getAttribute('data-target');
    const contentDiv = document.getElementById(targetId);

    if (contentDiv.style.display === 'block') {
      contentDiv.style.display = 'none';
      return;
    }

    // Hide other sections
    document.querySelectorAll('.content').forEach(c => c.style.display = 'none');

    // Fetch content from server
    const typeMap = { newClaim: 'new', supplementalClaim: 'supplemental', higherReview: 'higher' };
    const res = await fetch(`/claim/${typeMap[targetId]}`);
    const html = await res.text();

    contentDiv.innerHTML = html;
    contentDiv.style.display = 'block';
  });
});
