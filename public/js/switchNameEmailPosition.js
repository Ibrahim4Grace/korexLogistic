const staffNameDropdown = document.getElementById("staffName");
const staffEmailInput = document.getElementById("staffEmail");
const staffPositionInput = document.getElementById("staffPosition");
const staffNumberInput = document.getElementById("staffNumber");

// Fetch the list of staff from the server
fetch('/api/staffs')
  .then(response => response.json())
  .then(staffs => {
    // Attach an event listener to update the email and position
    staffNameDropdown.addEventListener("change", function() {
      const selectedStaffName = staffNameDropdown.value;
      const selectedStaffInfo = staffs.find(staff => staff.staffName === selectedStaffName);
      
      if (selectedStaffInfo) {
        staffEmailInput.value = selectedStaffInfo.staffEmail;
        staffPositionInput.value = selectedStaffInfo.staffPosition;
        staffNumberInput.value = selectedStaffInfo.staffNumber;
      } else {
        staffEmailInput.value = ''; // Clear the email input
        staffPositionInput.value = '';
        staffNumberInput.value = '';
      }
    });
  })
  .catch(error => {
    console.error("Error fetching staff data:", error);
  });
