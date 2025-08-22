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
      step1: { question: "Are you honorably discharged?", answers: [{ text: "Yes", next: "step2" }, { text: "No", next: "notEligible" }] },
      notEligible: { question: "Sorry, unfortunately, you do not qualify for VA Disability", answers: [{ text: "Start Over", next: "step1" }] },
      step2: { question: "Are you applying for a new claim?", answers: [{ text: "Yes", next: "newClaim" }, { text: "No", next: "step3" }] },
      step3: { question: "Have you been denied a VA claim?", answers: [{ text: "Yes", next: "disagreeDecision" }, { text: "No", next: "newClaim" }] },
      disagreeDecision: { question: "Do you disagree with the decision?", answers: [{ text: "Yes", next: "additionalEvidence" }, { text: "No", next: "newClaim" }] },
      additionalEvidence: { question: "Do you have additional evidence?", answers: [{ text: "Yes", next: "supplementalClaim", message: "You can submit a Supplemental Claim." }, { text: "No", next: "higherReview", message: "You can file a Higher Level Review request." }] },
      newClaim: { question: "Proceed with filing a new claim", message: "You can submit a new claim.", answers: [{ text: "Start Over", next: "step1" }] },
      supplementalClaim: { question: "Proceed with a Supplemental Claim", message: "You can submit a Supplemental Claim.", answers: [{ text: "Start Over", next: "step1" }] },
      higherReview: { question: "Proceed with a Higher Level Review", message: "You can file a Higher Level Review request.", answers: [{ text: "Start Over", next: "step1" }] }
    };

    function renderStep(stepId) {
      if (!flowChartData[stepId]) return;

      // Only clear container at step1
      if (stepId === "step1") flowContainer.innerHTML = "";

      const step = flowChartData[stepId];
      const stepDiv = document.createElement("div");
      stepDiv.classList.add("flow-step");
      stepDiv.style.marginTop = "10px";

      const questionP = document.createElement("p");
      questionP.textContent = step.question;
      stepDiv.appendChild(questionP);

      if (step.message) {
        const messageP = document.createElement("p");
        messageP.textContent = step.message;
        messageP.style.fontWeight = "bold";
        stepDiv.appendChild(messageP);

        // Show corresponding content div automatically
        const optionEl = document.querySelector(`.option[data-target="${stepId}"]`);
        if (optionEl) {
          const targetId = optionEl.getAttribute("data-target");
          const contentDiv = document.getElementById(targetId);
          document.querySelectorAll(".content").forEach(c => {
            if (c !== contentDiv) c.style.display = "none";
          });
          if (contentDiv) contentDiv.style.display = "block";
        }
      }

      // Answers
      step.answers.forEach(ans => {
        const btn = document.createElement("button");
        btn.textContent = ans.text;
        btn.style.margin = "5px";

        btn.addEventListener("click", () => {
          // Show answer message if exists
          if (ans.message) {
            const ansMessageP = document.createElement("p");
            ansMessageP.textContent = ans.message;
            ansMessageP.style.fontStyle = "italic";
            stepDiv.appendChild(ansMessageP);

            // Show corresponding option content
            const optionEl = document.querySelector(`.option[data-target="${ans.next}"]`);
            if (optionEl) {
              const targetId = optionEl.getAttribute("data-target");
              const contentDiv = document.getElementById(targetId);
              document.querySelectorAll(".content").forEach(c => {
                if (c !== contentDiv) c.style.display = "none";
              });
              if (contentDiv) contentDiv.style.display = "block";
            }
          }

          // Render next step
          if (ans.next) renderStep(ans.next);
        });

        stepDiv.appendChild(btn);
      });

      flowContainer.appendChild(stepDiv);
      stepDiv.scrollIntoView({ behavior: "smooth" });
    }

    renderStep("step1");
  }

  // Keep original .option toggles working
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
