// Tabs
singleTab.onclick = () => {
  singleBox.classList.remove("hidden");
  multiBox.classList.add("hidden");
  singleTab.classList.add("active");
  multiTab.classList.remove("active");
};

multiTab.onclick = () => {
  multiBox.classList.remove("hidden");
  singleBox.classList.add("hidden");
  multiTab.classList.add("active");
  singleTab.classList.remove("active");
};

// Toggle folders
document.querySelectorAll(".toggle").forEach(t => {
  t.onclick = () => {
    t.parentElement.classList.toggle("open");
    t.textContent = t.parentElement.classList.contains("open") ? "▼" : "▶";
  };
});

// Search
function setupSearch(id) {
  document.getElementById(id).addEventListener("input", e => {
    const val = e.target.value.toLowerCase();
    document.querySelectorAll(".tree label").forEach(l => {
      l.style.display = l.textContent.toLowerCase().includes(val) ? "block" : "none";
    });
  });
}

setupSearch("searchSingle");
setupSearch("searchMulti");

// Parent → Child auto select
document.querySelectorAll('#multiBox .node > label > input[type="checkbox"]').forEach(parentCheckbox => {
  parentCheckbox.addEventListener('change', function () {
    const children = this.closest('.node').querySelectorAll('.children input[type="checkbox"]');
    children.forEach(child => {
      child.checked = this.checked;
    });
  });
});

// Child → Parent auto update
document.querySelectorAll('#multiBox .children input[type="checkbox"]').forEach(childCheckbox => {
  childCheckbox.addEventListener('change', function () {
    const node = this.closest('.node');
    const parent = node.querySelector('label > input[type="checkbox"]');
    const allChildren = node.querySelectorAll('.children input[type="checkbox"]');

    const allChecked = [...allChildren].every(cb => cb.checked);
    const anyChecked = [...allChildren].some(cb => cb.checked);

    parent.checked = allChecked;
    parent.indeterminate = !allChecked && anyChecked; // mixed state
  });
});