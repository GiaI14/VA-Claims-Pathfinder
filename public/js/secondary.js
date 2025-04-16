// let disabilitiesData = []; // Array to store all disabilities
// let symptomEntriesData = []; // Array to store all symptoms

// // Function to add a new disability entry
// function addDisability() {
//     const disabilitiesContainer = document.getElementById("disabilities");

//     // Create new disability entry form
//     const newDisabilityEntry = document.createElement("div");
//     newDisabilityEntry.classList.add("disability-entry", "mb-3");

//     newDisabilityEntry.innerHTML = `
//         <label>Disability Name: 
//             <input type="text" class="disability-name" placeholder="e.g., Knee Pain" required>
//         </label><br>
        
//         <label>Percentage: 
//             <select class="disability-percentage" required>
//                 <option value="">Select %</option>
//                 <option value="0">0%</option>
//                 <option value="10">10%</option>
//                 <option value="20">20%</option>
//                 <option value="30">30%</option>
//                 <option value="40">40%</option>
//                 <option value="50">50%</option>
//                 <option value="60">60%</option>
//                 <option value="70">70%</option>
//                 <option value="80">80%</option>
//                 <option value="90">90%</option>
//                 <option value="100">100%</option>
//             </select>
//         </label>
        
//         <!-- Save button for each disability entry -->
//         <button type="button" onclick="saveDisability(this)">Save Disability</button>
        
//         <!-- Remove button for each disability entry -->
//         <button type="button" onclick="removeDisability(this)">Remove</button>
//         <br><br>
//     `;

//     // Append the new entry to the disabilities container
//     disabilitiesContainer.appendChild(newDisabilityEntry);
// }

// // Function to save the disability record
// function saveDisability(button) {
//     const disabilityEntry = button.parentElement;
//     const disabilityName = disabilityEntry.querySelector(".disability-name").value.trim();
//     const disabilityPercentage = disabilityEntry.querySelector(".disability-percentage").value.trim();

//     if (disabilityName && disabilityPercentage) {
//         // Create a new disability object and push it to the disabilitiesData array
//         const disability = { 
//             name: disabilityName, 
//             percentage: disabilityPercentage 
//         };

//         disabilitiesData.push(disability);  // Add to global disabilitiesData array

//         // Log the disabilities data in the browser console
//         console.log("Disabilities received:", disabilitiesData);

//         // Alert the user that the disability has been added
//         alert("Disability Added!");

//         // Disable the "Save Disability" button after adding
//         button.disabled = true;
//         button.textContent = "Added";
//     } else {
//         alert("Please fill in both fields (Name and Percentage) before saving.");
//     }
// }

// // Function to remove a disability entry
// function removeDisability(button) {
//     const disabilityEntry = button.parentElement;

//     // Remove the disability entry from the DOM
//     disabilityEntry.remove();

//     // Optional: Remove the corresponding entry from the disabilitiesData array
//     const disabilityName = disabilityEntry.querySelector(".disability-name").value.trim();
//     disabilitiesData = disabilitiesData.filter(disability => disability.name !== disabilityName);

//     // Log the updated disabilities data in the terminal after removal
//     console.log("Updated Disabilities Data after Removal:", JSON.stringify(disabilitiesData, null, 2));
// }

// // Function to add a new symptom entry
// function addSymptomEntry() {
//     const symptomEntriesContainer = document.getElementById("symptomEntries");

//     // Create new symptom entry form
//     const newSymptomEntry = document.createElement("div");
//     newSymptomEntry.classList.add("symptom-entry");

//     newSymptomEntry.innerHTML = `
//         <label>Body Part Affected: 
//             <input type="text" class="body-part" placeholder="e.g., Knee, Back, Mental Health" required>
//         </label><br>

//         <label>Symptoms: 
//             <input type="text" class="symptoms" placeholder="Enter symptoms (comma separated)" required>
//         </label><br><br>

//         <button type="button" onclick="removeSymptomEntry(this)">Remove Entry</button>
//     `;

//     // Append the new entry to the symptomEntries container
//     symptomEntriesContainer.appendChild(newSymptomEntry);
// }

// // Function to remove a symptom entry
// function removeSymptomEntry(button) {
//     const symptomEntry = button.parentElement;

//     // Remove the symptom entry from the DOM
//     symptomEntry.remove();
// }

// // Improved analysis of symptoms with potential claim suggestions
// function analyzeSymptoms() {
//     const symptomEntries = document.querySelectorAll(".symptom-entry");
//     const symptomsData = [];

//     symptomEntries.forEach(entry => {
//         const bodyPart = entry.querySelector(".body-part").value.trim();
//         const symptomsInput = entry.querySelector(".symptoms").value.trim();
//         const symptoms = symptomsInput.split(",").map(s => s.trim());

//         if (bodyPart && symptoms.length > 0) {
//             symptomsData.push({ bodyPart, symptoms });
//         }
//     });

//     if (symptomsData.length > 0) {
//         // Simulating an API call to analyze symptoms
//         setTimeout(() => {
//             const possibleClaims = analyzePossibleClaims(symptomsData);
//             document.getElementById("results").innerHTML = JSON.stringify(possibleClaims, null, 2);
//         }, 1000);
//     } else {
//         alert("Please enter at least one symptom with a body part.");
//     }
// }

// // Analyzing the symptoms and matching them with possible claims
// function analyzePossibleClaims(symptoms) {
//     return symptoms.map(symptom => {
//         // Initialize an empty list of possible claims
//         let possibleClaims = [];

//         // Check for symptoms and suggest possible claims based on keywords
//         symptom.symptoms.forEach(symptomText => {
//             if (symptomText.toLowerCase().includes("pain")) {
//                 possibleClaims.push("Pain Management");
//             }
//             if (symptomText.toLowerCase().includes("swelling")) {
//                 possibleClaims.push("Swelling Treatment");
//             }
//             if (symptomText.toLowerCase().includes("stiffness")) {
//                 possibleClaims.push("Stiffness Relief");
//             }
//             if (symptomText.toLowerCase().includes("weakness")) {
//                 possibleClaims.push("Weakness Treatment");
//             }
//             if (symptomText.toLowerCase().includes("numbness")) {
//                 possibleClaims.push("Numbness Management");
//             }
//             if (symptomText.toLowerCase().includes("mental health") || symptomText.toLowerCase().includes("anxiety") || symptomText.toLowerCase().includes("depression")) {
//                 possibleClaims.push("Mental Health Care");
//             }
//             if (symptomText.toLowerCase().includes("insomnia")) {
//                 possibleClaims.push("Sleep Disorder Claims");
//             }
//             // Add more conditions based on your requirements
//         });

//         return {
//             bodyPart: symptom.bodyPart,
//             possibleClaims: possibleClaims.length > 0 ? possibleClaims : ["Further Evaluation Needed"]
//         };
//     });
// }
