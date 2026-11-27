const buttons = document.querySelectorAll(".filter-btn");
const rows = document.querySelectorAll("#tools-tbody tr");

buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const filter = btn.getAttribute("data-filter") || "all";
    buttons.forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");

    rows.forEach((row) => {
      const cat = row.getAttribute("data-cat");
      if (filter === "all" || cat === filter) {
        row.classList.remove("is-hidden");
      } else {
        row.classList.add("is-hidden");
      }
    });
  });
});
