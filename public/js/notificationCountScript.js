
const notificationSocket = io('/notifications');

// Function to update the notification count in the UI
function updateNotificationCountUI(count) {
  // Update count in the sidebar
  const sidebarNotificationOutput = document.getElementById('notificationOutput');
  if (sidebarNotificationOutput) {
    sidebarNotificationOutput.textContent = count;
  }

  // Update count in the navbar
  const navbarNotificationOutput = document.getElementById('navNotificationOutput');
  if (navbarNotificationOutput) {
    navbarNotificationOutput.textContent = count;
  }
}

// Listen for 'notification-count-updated' event
notificationSocket.on('notification-count-updated', (data) => {
  console.log('Notification count updated:', data);

  // Update the UI with the new notification count
  updateNotificationCountUI(data.count);
});

// Listen for 'new-notification' event
notificationSocket.on('new-notification', (data) => {
  console.log('New notification received:', data);

  // Update the UI with the new notification
  const notificationTable = document.getElementById('notificationTable');
  const newRow = document.createElement('tr');
  newRow.innerHTML = `
    <td>${data.senderName}</td>
    <td>${data.message}</td>
    <td>${data.status}</td>
    <td>${new Date(data.date_added).toLocaleString()}</td>
    <td data-label="Delete">
      <a href="/admin/deleteNotification/${data._id}">
        <i class="typcn typcn-trash menu-icon" style="color: blue;"></i>
      </a>
    </td>
  `;
  notificationTable.insertBefore(newRow, notificationTable.firstChild);

  // Increment the count and update the UI
  notificationCount++;
  updateNotificationCountUI(notificationCount);
});

