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

   function renderStep(stepId) {
      if (stepId === "step1") flowContainer.innerHTML = "";

      const step = flowChartData[stepId];
      if (!step) return;

      const stepDiv = document.createElement("div");
      stepDiv.classList.add("flow-step");
      stepDiv.style.marginTop = "10px";

      const questionP = document.createElement("p");
      questionP.textContent = step.question;
      stepDiv.appendChild(questionP);

      step.answers.forEach(ans => {
        const btn = document.createElement("button");
        btn.textContent = ans.text;
        btn.style.margin = "5px";

        btn.addEventListener("click", () => {
          if (["newClaim", "supplementalClaim", "higherReview"].includes(ans.next)) {
            // Trigger the original .option click
            const optionEl = document.querySelector(`.option[data-target="${ans.next}"]`);
            if (optionEl) optionEl.click();
          } else {
            renderStep(ans.next);
          }
        });

        stepDiv.appendChild(btn);
      });

      flowContainer.appendChild(stepDiv);
    }

    renderStep("step1");
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
