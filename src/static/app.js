document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error("Failed to load activities");
      }
      const activities = await response.json();
      const selectedActivity = activitySelect.value;

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.querySelectorAll("option:not(:first-child)").forEach((option) => option.remove());

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const title = document.createElement("h4");
        title.textContent = name;

        const description = document.createElement("p");
        description.textContent = details.description;

        const schedule = document.createElement("p");
        schedule.innerHTML = "<strong>Schedule:</strong> ";
        schedule.append(document.createTextNode(details.schedule));

        const availability = document.createElement("p");
        availability.innerHTML = "<strong>Availability:</strong> ";
        availability.append(document.createTextNode(`${spotsLeft} spots left`));

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = `Participants (${details.participants.length})`;
        participantsSection.appendChild(participantsHeading);

        if (details.participants.length > 0) {
          const participantsList = document.createElement("ul");
          participantsList.className = "participant-list";
          details.participants.forEach((email) => {
            const participant = document.createElement("li");
            const participantRow = document.createElement("div");
            participantRow.className = "participant-row";

            const participantEmail = document.createElement("span");
            participantEmail.className = "participant-email";
            participantEmail.textContent = email;

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "remove-participant";
            removeButton.title = "Unregister participant";
            removeButton.setAttribute("aria-label", `Unregister ${email} from ${name}`);

            const removeIcon = document.createElement("span");
            removeIcon.className = "remove-icon";
            removeIcon.setAttribute("aria-hidden", "true");
            removeButton.appendChild(removeIcon);

            const removeError = document.createElement("p");
            removeError.className = "participant-error hidden";
            removeError.setAttribute("role", "alert");

            removeButton.addEventListener("click", async () => {
              removeButton.disabled = true;
              removeButton.setAttribute("aria-busy", "true");
              removeError.classList.add("hidden");

              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );
                if (!response.ok) {
                  const result = await response.json();
                  throw new Error(result.detail || "Failed to unregister. Please try again.");
                }
                await fetchActivities();
              } catch (error) {
                removeError.textContent = error.message || "Failed to unregister. Please try again.";
                removeError.classList.remove("hidden");
              } finally {
                removeButton.disabled = false;
                removeButton.removeAttribute("aria-busy");
              }
            });

            participantRow.append(participantEmail, removeButton);
            participant.append(participantRow, removeError);
            participantsList.appendChild(participant);
          });
          participantsSection.appendChild(participantsList);
        } else {
          const emptyMessage = document.createElement("p");
          emptyMessage.className = "empty-participants";
          emptyMessage.textContent = "No participants yet.";
          participantsSection.appendChild(emptyMessage);
        }

        activityCard.append(title, description, schedule, availability, participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
      activitySelect.value = selectedActivity;
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
