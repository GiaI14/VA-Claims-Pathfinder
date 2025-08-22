document.addEventListener("DOMContentLoaded", () => {
  const flowContainer = document.getElementById("flowContainer");
  const showFlowBtn = document.getElementById("showFlowBtn");

  showFlowBtn.addEventListener("click", () => {
    if (flowContainer.style.display === "block") {
      flowContainer.style.display = "none";  // hide if already open
      flowContainer.innerHTML = "";           // clear previous steps
    } else {
      flowContainer.style.display = "block"; // show flow chart
      renderFlowChart();                      // populate flow chart
    }
  });

  function renderFlowChart() {
    const flowChartData = {
      step1: { question: "Are you honorably discharged?", answers: [{ text: "Yes", next: "step2" }, { text: "No", next: "notEligible" }] },
      notEligible: { question: "Sorry, unfortunately, you cannot apply for VA Disability.", answers: [{ text: "Start Over", next: "step1" }] },
      step2: { question: "Are you applying for a new claim?", answers: [{ text: "Yes", next: "newClaim" }, { text: "No", next: "step3" }] },
      step3: { question: "Have you been denied?", answers: [{ text: "Yes", next: "chooseDeniedOption" }, { text: "No", next: "step1" }] },
      chooseDeniedOption: { question: "Choose your path:", answers: [{ text: "Supplemental Claim", next: "supplementalClaim" }, { text: "Higher Level Review", next: "higherReview" }] }
    };

    function renderStep(stepId) {
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
          if (["newClaim","supplementalClaim","higherReview"].includes(ans.next)) {
            document.getElementById(ans.next).style.display = "block";
          } else {
            renderStep(ans.next);
          }
          stepDiv.querySelectorAll("button").forEach(b => b.disabled = true);
        });
        stepDiv.appendChild(btn);
      });

      flowContainer.appendChild(stepDiv);
    }

    renderStep("step1"); // start flow
  }
});
