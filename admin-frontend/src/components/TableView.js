// import React, { useEffect, useState } from "react";
// import { api } from "../api";

// function TableView({ tableName }) {
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [selectedRow, setSelectedRow] = useState(null);
//   const [modalMode, setModalMode] = useState(null); // view | edit | create
//   const [editData, setEditData] = useState({});
//   const [message, setMessage] = useState("");

//   const fetchData = async () => {
//     if (!tableName) return;

//     setLoading(true);
//     setError("");
//     setMessage("");
//     try {
//       const res = await api.get(`/admin/table/${tableName}`, {
//         params: { limit: 100, offset: 0 },
//       });
//       setRows(res.data.rows || []);
//     } catch (err) {
//       console.error(err);
//       setError("Failed to fetch data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, [tableName]);

//   /* ---------------------------- MODAL FUNCTIONS --------------------------- */

//   const openViewModal = (row) => {
//     setSelectedRow(row);
//     setEditData(row);
//     setModalMode("view");
//   };

//   const openEditModal = (row) => {
//     setSelectedRow(row);
//     setEditData(row);
//     setModalMode("edit");
//   };

//   const openCreateModal = () => {
//     setSelectedRow(null);

//     // Default create fields (useful for lucky_draw_master)
//     setEditData({
//       name: "",
//       description: "",
//       prize: "",
//       ticket_price: "",
//       frequency: "",
//       status: "active",
//       created_at: new Date().toISOString().slice(0, 10),
//     });

//     setModalMode("create");
//   };

//   const closeModal = () => {
//     setSelectedRow(null);
//     setModalMode(null);
//     setEditData({});
//   };

//   const handleEditChange = (col, value) => {
//     setEditData((prev) => ({ ...prev, [col]: value }));
//   };

//   /* ---------------------------- SAVE HANDLER ------------------------------ */

//   const handleSave = async () => {
//     try {
//       if (modalMode === "edit") {
//         await api.put(`/admin/table/${tableName}/${editData.id}`, {
//           data: editData,
//         });
//         setMessage("Row updated successfully");
//       }

//       if (modalMode === "create") {
//         await api.post(`/admin/table/${tableName}`, {
//           data: editData, // IMPORTANT
//         });
//         setMessage("Row created successfully");
//       }

//       closeModal();
//       fetchData();
//     } catch (err) {
//       console.error(err);
//       alert("Save failed: " + err.message);
//     }
//   };

//   /* ---------------------------- DELETE HANDLER ---------------------------- */

//   const handleDelete = async (row) => {
//     if (!row.id) return alert("Cannot delete: Missing ID");

//     const confirmDelete = window.confirm(
//       `Delete id=${row.id} from ${tableName}?`
//     );
//     if (!confirmDelete) return;

//     try {
//       await api.delete(`/admin/table/${tableName}/${row.id}`);
//       setMessage("Row deleted");
//       fetchData();
//     } catch (err) {
//       console.error(err);
//       alert("Delete failed");
//     }
//   };

//   /* ----------------------------- RENDER LOGIC ----------------------------- */

//   if (!tableName) return <p>Select table</p>;
//   if (loading) return <p>Loading {tableName}...</p>;
//   if (error) return <p style={{ color: "red" }}>{error}</p>;

//   const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

//   return (
//     <div style={{ overflowX: "auto" }}>
//       <h2 style={{ display: "flex", justifyContent: "space-between" }}>
//         {tableName}

//         {tableName === "lucky_draw_master" && (
//           <button
//             onClick={openCreateModal}
//             style={{
//               background: "#4CAF50",
//               color: "white",
//               border: "none",
//               padding: "6px 12px",
//               borderRadius: 4,
//               cursor: "pointer",
//             }}
//           >
//             + Create Draw
//           </button>
//         )}
//       </h2>

//       {message && <p style={{ color: "green" }}>{message}</p>}

//       {rows.length === 0 ? (
//         <p>No data</p>
//       ) : (
//         <table style={{ borderCollapse: "collapse", width: "100%" }}>
//           <thead>
//             <tr>
//               {columns.map((col) => (
//                 <th key={col} style={{ border: "1px solid #ccc", padding: 8 }}>
//                   {col}
//                 </th>
//               ))}
//               <th style={{ border: "1px solid #ccc", padding: 8 }}>Actions</th>
//             </tr>
//           </thead>

//           <tbody>
//             {rows.map((row, idx) => (
//               <tr key={idx}>
//                 {columns.map((col) => (
//                   <td
//                     key={col}
//                     style={{ border: "1px solid #ccc", padding: 8 }}
//                   >
//                     {String(row[col])}
//                   </td>
//                 ))}

//                 <td style={{ border: "1px solid #ccc", padding: 8 }}>
//                   <button onClick={() => openViewModal(row)}>View</button>{" "}
//                   <button onClick={() => openEditModal(row)}>Edit</button>{" "}
//                   <button
//                     onClick={() => handleDelete(row)}
//                     style={{ color: "white", background: "red" }}
//                   >
//                     Delete
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}

//       {/* ------------------------- MODAL --------------------------- */}

//       {modalMode && (
//         <div className="modal-backdrop">
//           <div className="modal-container">

//             <h3>
//               {modalMode === "create"
//                 ? "Create New Draw"
//                 : modalMode === "edit"
//                 ? "Edit Row"
//                 : "View Row"}
//             </h3>

//             <div className="modal-body">
//               {(columns.length > 0
//                 ? columns
//                 : ["name", "description", "prize", "ticket_price", "frequency", "status"]
//               ).map((col) => (
//                 <div key={col} style={{ marginBottom: 8 }}>
//                   <label>{col}</label>

//                   {modalMode === "view" || col === "id" ? (
//                     <div>{editData[col]}</div>
//                   ) : (
//                     <input
//                       value={editData[col] || ""}
//                       onChange={(e) => handleEditChange(col, e.target.value)}
//                     />
//                   )}
//                 </div>
//               ))}
//             </div>

//             <div className="modal-footer">
//               {(modalMode === "create" || modalMode === "edit") && (
//                 <button onClick={handleSave}>Save</button>
//               )}
//               <button onClick={closeModal}>Close</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default TableView;




import React, { useEffect, useState } from "react";
import { api } from "../api";

function TableView({ tableName }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [modalMode, setModalMode] = useState(null); // view | edit | create
  const [editData, setEditData] = useState({});
  const [message, setMessage] = useState("");
  
  // 🆕 NEW: Winner selection states
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [winnersHistory, setWinnersHistory] = useState([]);
  const [showWinnersModal, setShowWinnersModal] = useState(false);

  const fetchData = async () => {
    if (!tableName) return;

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await api.get(`/admin/table/${tableName}`, {
        params: { limit: 100, offset: 0 },
      });
      setRows(res.data.rows || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tableName]);

  /* ---------------------------- MODAL FUNCTIONS --------------------------- */

  const openViewModal = (row) => {
    setSelectedRow(row);
    setEditData(row);
    setModalMode("view");
  };

  const openEditModal = (row) => {
    setSelectedRow(row);
    setEditData(row);
    setModalMode("edit");
  };

  const openCreateModal = () => {
    setSelectedRow(null);

    // Default create fields (useful for lucky_draw_master)
    setEditData({
      name: "",
      description: "",
      prize: "",
      prize_amount: "",
      ticket_price: "",
      frequency: "",
      status: "active",
      created_at: new Date().toISOString().slice(0, 10),
    });

    setModalMode("create");
  };

  const closeModal = () => {
    setSelectedRow(null);
    setModalMode(null);
    setEditData({});
  };

  const handleEditChange = (col, value) => {
    setEditData((prev) => ({ ...prev, [col]: value }));
  };

  /* ---------------------------- SAVE HANDLER ------------------------------ */

  const handleSave = async () => {
    try {
      if (modalMode === "edit") {
        await api.put(`/admin/table/${tableName}/${editData.id}`, {
          data: editData,
        });
        setMessage("Row updated successfully");
      }

      if (modalMode === "create") {
        await api.post(`/admin/table/${tableName}`, {
          data: editData, // IMPORTANT
        });
        setMessage("Row created successfully");
      }

      closeModal();
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Save failed: " + err.message);
    }
  };

  /* ---------------------------- DELETE HANDLER ---------------------------- */

  const handleDelete = async (row) => {
    if (!row.id) return alert("Cannot delete: Missing ID");

    const confirmDelete = window.confirm(
      `Delete id=${row.id} from ${tableName}?`
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/admin/table/${tableName}/${row.id}`);
      setMessage("Row deleted");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  /* ---------------------------- WINNER FUNCTIONS --------------------------- */

  // 🆕 NEW: Open winner selection modal
  const openWinnerModal = async (draw) => {
    setSelectedDraw(draw);
    setLoadingParticipants(true);
    
    try {
      const res = await api.get(`/admin/lucky-draws/${draw.id}/participants`);
      setParticipants(res.data.participants || []);
      setShowWinnerModal(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load participants");
    } finally {
      setLoadingParticipants(false);
    }
  };

  // 🆕 NEW: Select random winner
  const selectRandomWinner = async () => {
    if (!selectedDraw) return;
    
    const confirmSelect = window.confirm(
      `Select a random winner for "${selectedDraw.name}"? This action cannot be undone.`
    );
    
    if (!confirmSelect) return;

    try {
      const res = await api.post(`/admin/lucky-draws/${selectedDraw.id}/select-random-winner`);
      
      alert(`🎉 Winner Selected!\n\nWinner: ${res.data.winner.participant_name}\nEmail: ${res.data.winner.email}\nTicket: ${res.data.winner.ticket_number}\nPrize: ₹${res.data.prize_amount}`);
      
      setShowWinnerModal(false);
      setMessage("Winner selected successfully!");
      fetchData(); // Refresh the table
    } catch (err) {
      console.error(err);
      alert("Failed to select winner: " + (err.response?.data?.detail || err.message));
    }
  };

  // 🆕 NEW: Select manual winner
  const selectManualWinner = async (ticket) => {
    const confirmSelect = window.confirm(
      `Select ${ticket.participant_name} as winner for "${selectedDraw.name}"? This action cannot be undone.`
    );
    
    if (!confirmSelect) return;

    try {
      const res = await api.post(`/admin/lucky-draws/${selectedDraw.id}/select-winner-manual`, {
        ticket_id: ticket.id
      });
      
      alert(`🎉 Winner Selected!\n\nWinner: ${res.data.winner.participant_name}\nEmail: ${res.data.winner.email}\nTicket: ${res.data.winner.ticket_number}\nPrize: ₹${res.data.prize_amount}`);
      
      setShowWinnerModal(false);
      setMessage("Winner selected successfully!");
      fetchData(); // Refresh the table
    } catch (err) {
      console.error(err);
      alert("Failed to select winner: " + (err.response?.data?.detail || err.message));
    }
  };

  // 🆕 NEW: View winners history
  const viewWinnersHistory = async () => {
    try {
      const res = await api.get("/admin/lucky-draws/winners");
      setWinnersHistory(res.data.winners || []);
      setShowWinnersModal(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load winners history");
    }
  };

  /* ----------------------------- RENDER LOGIC ----------------------------- */

  if (!tableName) return <p>Select table</p>;
  if (loading) return <p>Loading {tableName}...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div style={{ overflowX: "auto" }}>
      <h2 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {tableName}

        <div style={{ display: "flex", gap: "10px" }}>
          {/* 🆕 NEW: Winners History Button */}
          {tableName === "lucky_draw_master" && (
            <button
              onClick={viewWinnersHistory}
              style={{
                background: "#FFB93B",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              🏆 Winners History
            </button>
          )}

          {tableName === "lucky_draw_master" && (
            <button
              onClick={openCreateModal}
              style={{
                background: "#4CAF50",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              + Create Draw
            </button>
          )}
        </div>
      </h2>

      {message && <p style={{ color: "green" }}>{message}</p>}

      {rows.length === 0 ? (
        <p>No data</p>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} style={{ border: "1px solid #ccc", padding: 8 }}>
                  {col}
                </th>
              ))}
              <th style={{ border: "1px solid #ccc", padding: 8 }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td
                    key={col}
                    style={{ border: "1px solid #ccc", padding: 8 }}
                  >
                    {String(row[col])}
                  </td>
                ))}

                <td style={{ border: "1px solid #ccc", padding: 8 }}>
                  {/* 🆕 NEW: Winner Selection Button for lucky_draw_master */}
                  {tableName === "lucky_draw_master" && row.status === "active" && !row.winner_selected && (
                    <button 
                      onClick={() => openWinnerModal(row)}
                      style={{
                        background: "#FFB93B",
                        color: "white",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: 4,
                        cursor: "pointer",
                        marginRight: "4px",
                        fontSize: "12px"
                      }}
                    >
                      🎯 Select Winner
                    </button>
                  )}
                  
                  {/* 🆕 NEW: Winner Badge for completed draws */}
                  {tableName === "lucky_draw_master" && row.winner_selected && (
                    <span style={{
                      background: "#4CAF50",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: "12px",
                      marginRight: "4px"
                    }}>
                      ✅ Winner Selected
                    </span>
                  )}

                  <button onClick={() => openViewModal(row)}>View</button>{" "}
                  <button onClick={() => openEditModal(row)}>Edit</button>{" "}
                  <button
                    onClick={() => handleDelete(row)}
                    style={{ color: "white", background: "red" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ------------------------- MODAL --------------------------- */}

      {modalMode && (
        <div className="modal-backdrop">
          <div className="modal-container">

            <h3>
              {modalMode === "create"
                ? "Create New Draw"
                : modalMode === "edit"
                ? "Edit Row"
                : "View Row"}
            </h3>

            <div className="modal-body">
              {(columns.length > 0
                ? columns
                : ["name", "description", "prize", "prize_amount", "ticket_price", "frequency", "status"]
              ).map((col) => (
                <div key={col} style={{ marginBottom: 8 }}>
                  <label>{col}</label>

                  {modalMode === "view" || col === "id" ? (
                    <div>{editData[col]}</div>
                  ) : (
                    <input
                      value={editData[col] || ""}
                      onChange={(e) => handleEditChange(col, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="modal-footer">
              {(modalMode === "create" || modalMode === "edit") && (
                <button onClick={handleSave}>Save</button>
              )}
              <button onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 NEW: Winner Selection Modal */}
      {showWinnerModal && selectedDraw && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: "800px", maxHeight: "80vh" }}>
            <h3>🎯 Select Winner for: {selectedDraw.name}</h3>
            <p><strong>Prize Amount:</strong> ₹{selectedDraw.prize_amount || 0}</p>
            <p><strong>Total Participants:</strong> {participants.length}</p>

            <div style={{ margin: "16px 0" }}>
              <button
                onClick={selectRandomWinner}
                style={{
                  background: "#FFB93B",
                  color: "white",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                  marginRight: "10px"
                }}
              >
                🎲 Select Random Winner
              </button>
              <small style={{ color: "#666" }}>Randomly select a winner from all participants</small>
            </div>

            <div style={{ maxHeight: "400px", overflowY: "auto", marginTop: "20px" }}>
              <h4>Participants ({participants.length})</h4>
              
              {loadingParticipants ? (
                <p>Loading participants...</p>
              ) : participants.length === 0 ? (
                <p>No participants found for this draw.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f5f5f5" }}>
                      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Name</th>
                      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Email</th>
                      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Phone</th>
                      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Ticket No.</th>
                      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((participant, index) => (
                      <tr key={participant.id}>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                          {participant.participant_name}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                          {participant.email}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                          {participant.phone}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                          {participant.ticket_number}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                          <button
                            onClick={() => selectManualWinner(participant)}
                            style={{
                              background: "#4CAF50",
                              color: "white",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: 4,
                              cursor: "pointer",
                              fontSize: "12px"
                            }}
                          >
                            Select as Winner
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowWinnerModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 NEW: Winners History Modal */}
      {showWinnersModal && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: "900px", maxHeight: "80vh" }}>
            <h3>🏆 Lucky Draw Winners History</h3>
            
            <div style={{ maxHeight: "500px", overflowY: "auto", marginTop: "20px" }}>
              {winnersHistory.length === 0 ? (
                <p>No winners history found.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f5f5f5" }}>
                      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Draw Name</th>
                      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Winner</th>
                      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Email</th>
                      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Phone</th>
                      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Ticket No.</th>
                      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Prize Amount</th>
                      <th style={{ border: "1px solid #ddd", padding: "8px" }}>Won At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {winnersHistory.map((winner, index) => (
                      <tr key={index}>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                          {winner.draw_name}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                          {winner.participant_name}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                          {winner.email}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                          {winner.phone}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                          {winner.ticket_number}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                          ₹{winner.prize_amount}
                        </td>
                        <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                          {new Date(winner.winner_selected_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowWinnersModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TableView;