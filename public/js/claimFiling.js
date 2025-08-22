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
      notEligible: { question: "Sorry, you cannot apply for VA Disability.", answers: [{ text: "Start Over", next: "step1" }] },
      step2: { question: "Are you applying for a new claim?", answers: [{ text: "Yes", next: "newClaim" }, { text: "No", next: "step3" }] },
      step3: { question: "Have you been denied?", answers: [{ text: "Yes", next: "chooseDeniedOption" }, { text: "No", next: "step1" }] },
      chooseDeniedOption: { question: "Choose your path:", answers: [{ text: "Supplemental Claim", next: "supplementalClaim" }, { text: "Higher Level Review", next: "higherReview" }] }
    };

    function renderStep(stepId) {
      // if Start Over, clear everything
      if (stepId === "step1") {
        flowContainer.innerHTML = "";
      }

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
            renderStep(ans.next); // next step
          }
        });

        stepDiv.appendChild(btn);
      });

      flowContainer.appendChild(stepDiv);
    }

    renderStep("step1");
  }
});
