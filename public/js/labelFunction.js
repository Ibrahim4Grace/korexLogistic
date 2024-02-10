'use strict';

$(document).ready(function () {
  let current_fs, next_fs, previous_fs; //fieldsets
  let opacity;
  let current = 1;
  let steps = $("fieldset").length;

  setProgressBar(current);

  $(".next").click(function () {
    if (validateForm(current)) {
      current_fs = $(this).parent();
      next_fs = $(this).parent().next();

      // Add Class Active
      $("#progressbar li").eq($("fieldset").index(next_fs)).addClass("active");

      // Show the next fieldset
      next_fs.show();
      // Hide the current fieldset with style
      current_fs.animate(
        { opacity: 0 },
        {
          step: function (now) {
            // For making fieldset appear animation
            opacity = 1 - now;

            current_fs.css({
              display: "none",
              position: "relative",
            });
            next_fs.css({ opacity: opacity });
          },
          duration: 500,
        }
      );
      setProgressBar(++current);

    } else {
      alert("Please fill in all the required fields.");
    }
  });

  $(".previous").click(function () {
    current_fs = $(this).parent();
    previous_fs = $(this).parent().prev();

    // Remove class active
    $("#progressbar li").eq($("fieldset").index(current_fs)).removeClass("active");

    // Show the previous fieldset
    previous_fs.show();

    // Hide the current fieldset with style
    current_fs.animate(
      { opacity: 0 },
      {
        step: function (now) {
          // For making fieldset appear animation
          opacity = 1 - now;

          current_fs.css({
            display: "none",
            position: "relative",
          });
          previous_fs.css({ opacity: opacity });
        },
        duration: 500,
      }
    );
    setProgressBar(--current);
  });

  function setProgressBar(curStep) {
    let percent = parseFloat((100 / steps) * curStep);
    percent = percent.toFixed();
    $(".progress-bar").css("width", percent + "%");
  }

  function validateForm(step) {
    let isValid = true;
    let currentFieldset = $("fieldset").eq(step - 1);

    currentFieldset.find("input[required], select[required]").each(function () {
      if ($(this).val() === "") {
        isValid = false;
        return false; // Break out of the loop if any required field is empty
      }
    });

    return isValid;
  }
});