
// Add JavaScript to handle beforeunload event
window.addEventListener('beforeunload', function (e) {
    e.preventDefault();
    e.returnValue = '';
});

// Add JavaScript to remove the beforeunload event when the form is submitted
document.getElementById('myForm').addEventListener('submit', function () {
    window.removeEventListener('beforeunload', function () {});
});
