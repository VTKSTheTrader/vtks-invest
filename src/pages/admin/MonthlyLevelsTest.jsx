import { useState } from "react";
import MonthlyLevelModal from "../../components/admin/modals/MonthlyLevelModal";

export default function MonthlyLevelsTest() {
  const [showModal, setShowModal] = useState(true);

  const handleSave = async (form) => {
    console.log("Monthly level form:", form);
    alert("Form working. Check browser console.");
  };

  return (
    <main style={{ padding: "40px" }}>
      <h1>Monthly Levels Modal Test</h1>

      <button
        type="button"
        onClick={() => setShowModal(true)}
      >
        Open Modal
      </button>

      {showModal && (
        <MonthlyLevelModal
          editingLevel={null}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </main>
  );
}