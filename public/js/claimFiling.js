
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("flowContainer");

  const flowChartData = {
    step1: { question: "Are you honorably discharged?", answers: [{ text: "Yes", next: "step2" }, { text: "No", next: "notEligible" }] },
    notEligible: { question: "Sorry, you cannot apply for VA Disability.", answers: [{ text: "Start Over", next: "step1" }] },
    step2: { question: "Are you applying for a new claim?", answers: [{ text: "Yes", next: "newClaim" }, { text: "No", next: "step3" }] },
    step3: { question: "Have you been denied?", answers: [{ text: "Yes", next: "chooseDeniedOption" }, { text: "No", next: "step1" }] },
    chooseDeniedOption: { question: "Choose your path:", answers: [{ text: "Supplemental Claim", next: "supplementalClaim" }, { text: "Higher Level Review", next: "higherReview" }] }
  };

  function renderStep(stepId) {
    const step = flowChartData[stepId];
    if (!step) return;

    const stepDiv = document.createElement("div");
    stepDiv.classList.add("flow-step");

    const questionP = document.createElement("p");
    questionP.textContent = step.question;
    stepDiv.appendChild(questionP);

    step.answers.forEach(ans => {
      const btn = document.createElement("button");
      btn.textContent = ans.text;
      btn.addEventListener("click", () => {
        if (["newClaim","supplementalClaim","higherReview"].includes(ans.next)) {
          document.getElementById(ans.next).style.display = "block";
        } else {
          renderStep(ans.next);
        }
        // disable buttons after click
        stepDiv.querySelectorAll("button").forEach(b => b.disabled = true);
      });
      stepDiv.appendChild(btn);
    });

    container.appendChild(stepDiv);
  }

  renderStep("step1"); // start flow
});
