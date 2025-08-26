document.addEventListener("DOMContentLoaded", () => {
  const flowContainer = document.getElementById("flowContainer");
  const showFlowBtn = document.getElementById("showFlowBtn");

  // Toggle flow chart visibility
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
          { text: "Start Over 🔄", next: "step1" }
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
        question: "Do you have additional evidence (treatment, Nexus letters, DBQs, or other developments)?",
        answers: [
          { text: "Yes", next: "supplementalClaim" },
          { text: "No", next: "higherReview" }
        ]
      },
      newClaim: {
        question: "",
        message: "You can submit a new claim.",
        answers: [
          { text: "Start Over 🔄", next: "step1" }
        ]
      },
      supplementalClaim: {
        question: "",
        message: "You can submit a Supplemental Claim.",
        answers: [
          { text: "Start Over 🔄", next: "step1" }
        ]
      },
      higherReview: {
        question: "",
        message: "You can file a Higher Level Review request.",
        answers: [
          { text: "Start Over 🔄", next: "step1" }
        ]
      }
    };

    const stepHistory = []; // Track previous steps

function renderStep(stepId) {
  const step = flowChartData[stepId];
  if (!step) return;

  // Save current step to history if it's not step1
  if (flowContainer.firstChild) {
    stepHistory.push(flowContainer.firstChild);
  }

  // Clear container
  flowContainer.innerHTML = "";

  const stepDiv = document.createElement("div");
  stepDiv.classList.add("flow-step");

  // Question
  if (step.question) {
    const questionP = document.createElement("p");
    questionP.textContent = step.question;
    stepDiv.appendChild(questionP);
  }

  // Message
  if (step.message) {
    const messageP = document.createElement("p");
    messageP.textContent = step.message;
    messageP.style.fontWeight = "bold";
    stepDiv.appendChild(messageP);

    // Show related option content
    const optionEl = document.querySelector(`.option[data-target="${stepId}"]`);
    if (optionEl) {
      const contentDiv = document.getElementById(optionEl.dataset.target);
      document.querySelectorAll(".content").forEach(c => c.style.display = "none");
      if (contentDiv) contentDiv.style.display = "block";
    }
  }

  // Answer buttons
  step.answers.forEach(ans => {
    const btn = document.createElement("button");
    btn.textContent = ans.text;
    btn.style.margin = "5px";

    btn.addEventListener("click", () => {
      if (ans.text.includes("Start Over")) {
        stepHistory.length = 0;
        flowContainer.innerHTML = "";
        document.querySelectorAll(".content").forEach(c => c.style.display = "none");
        renderStep("step1");
        return;
      }
      if (ans.next) renderStep(ans.next);
    });

    stepDiv.appendChild(btn);
  });

  // Back button
  if (stepHistory.length > 0) {
    const backBtn = document.createElement("button");
    backBtn.textContent = "⬅ Back";
    backBtn.classList.add("backBtn");
    backBtn.style.margin = "5px";

    backBtn.addEventListener("click", () => {
      flowContainer.innerHTML = "";
      const previousStep = stepHistory.pop();
      if (previousStep) flowContainer.appendChild(previousStep);
    });

    stepDiv.appendChild(backBtn);
  }

  flowContainer.appendChild(stepDiv);
}

    // Start flow
    renderStep("step1");
  }

  // Original .option toggles for guidance content
  document.querySelectorAll(".option").forEach(option => {
    option.addEventListener("click", () => {
      const targetId = option.getAttribute("data-target");
      const contentDiv = document.getElementById(targetId);
      if (contentDiv.style.display === "block") {
        contentDiv.style.display = "none";
      } else {
        document.querySelectorAll(".content").forEach(c => {
          if (c !== contentDiv) c.style.display = "none";
        });
        if (contentDiv) contentDiv.style.display = "block";
      }
    });
  });
});
