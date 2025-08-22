document.addEventListener("DOMContentLoaded", () => {
  const flowContainer = document.getElementById("flowContainer");
  const showFlowBtn = document.getElementById("showFlowBtn");

  showFlowBtn.addEventListener("click", () => {
    if (flowContainer.style.display === "block") {
      flowContainer.style.display = "none";
      flowContainer.innerHTML = "";
    } else {
      flowContainer.style.display = "block";
      renderFlowChart();
    }
  });

 function renderFlowChart() {
  const flowChartData = {
    step1: {
      question: "Are you honorably discharged?",
      answers: [
        { text: "Yes", next: "step2" },
        { text: "No", next: "notEligible" }
      ]
    },
    notEligible: {
      question: "Sorry, unfortunately, you do not qualify for VA Disability",
      answers: [
        { text: "Start Over", next: "step1" }
      ]
    },
    step2: {
      question: "Are you applying for a new claim?",
      answers: [
        { text: "Yes", next: "newClaim" },
        { text: "No", next: "step3" }
      ]
    },
    step3: {
      question: "Have you been denied a VA claim?",
      answers: [
        { text: "Yes", next: "disagreeDecision" },
        { text: "No", next: "newClaim" }
      ]
    },
    disagreeDecision: {
      question: "Do you disagree with the decision?",
      answers: [
        { text: "Yes", next: "additionalEvidence" },
        { text: "No", next: "newClaim" }
      ]
    },
    additionalEvidence: {
      question: "Do you have additional evidence (treatment records, Nexus letters, DBQs, or other developments)?",
      answers: [
        { text: "Yes", next: "supplementalClaim", message: "You can submit a Supplemental Claim." },
        { text: "No", next: "higherReview", message: "You can file a Higher Level Review request." }
      ]
    },
    newClaim: {
      question: "Proceed with filing a new claim",
      message: "You can submit a new claim.",
      answers: [
        { text: "Start Over", next: "step1" }
      ]
    },
    supplementalClaim: {
      question: "Proceed with a Supplemental Claim",
      message: "You can submit a Supplemental Claim.",
      answers: [
        { text: "Start Over", next: "step1" }
      ]
    },
    higherReview: {
      question: "Proceed with a Higher Level Review",
      message: "You can file a Higher Level Review request.",
      answers: [
        { text: "Start Over", next: "step1" }
      ]
    }
  };

  function renderStep(stepKey) {
  const step = flowChartData[stepKey];
  const flowContainer = document.getElementById("flowContainer");
  
  // Clear previous content
  flowContainer.innerHTML = "";

  // Show the question
  const questionEl = document.createElement("p");
  questionEl.textContent = step.question;
  flowContainer.appendChild(questionEl);

  // Show the message if it exists
  if (step.message) {
    const messageEl = document.createElement("p");
    messageEl.style.fontWeight = "bold"; // optional styling
    messageEl.textContent = step.message;
    flowContainer.appendChild(messageEl);
  }

  // Show answers as buttons
  step.answers.forEach(answer => {
    const button = document.createElement("button");
    button.textContent = answer.text;
    button.addEventListener("click", () => renderStep(answer.next));
    flowContainer.appendChild(button);

    // Show message from answer if it exists
    if (answer.message) {
      const answerMessageEl = document.createElement("p");
      answerMessageEl.style.fontStyle = "italic"; // optional styling
      answerMessageEl.textContent = answer.message;
      flowContainer.appendChild(answerMessageEl);
    }
  });

  flowContainer.style.display = "block"; // make container visible
}

   

  // Original toggle logic for main claim options
  document.querySelectorAll('.option').forEach(option => {
    option.addEventListener('click', () => {
      const targetId = option.getAttribute('data-target');
      const contentDiv = document.getElementById(targetId);

      // Toggle
      if (contentDiv.style.display === 'block') {
        contentDiv.style.display = 'none';
      } else {
        // Close others
        document.querySelectorAll('.content').forEach(c => c.style.display = 'none');
        contentDiv.style.display = 'block';
      }
    });
  });
});
