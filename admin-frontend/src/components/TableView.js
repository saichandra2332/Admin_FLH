
// // admin-frontend/src/components/TableView.js - UPDATED WITH IMAGE DISPLAY
// import React, { useEffect, useState } from "react";
// import { api } from "../api";

// function TableView({ tableName }) {
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [selectedRow, setSelectedRow] = useState(null);
//   const [modalMode, setModalMode] = useState(null);
//   const [editData, setEditData] = useState({});
//   const [message, setMessage] = useState("");
//   const [imageFile, setImageFile] = useState(null);
//   const [imagePreview, setImagePreview] = useState(null);
  
  
//   // ECB Cashback states
//   const [showCashbackModal, setShowCashbackModal] = useState(false);
//   const [selectedUpload, setSelectedUpload] = useState(null);
//   const [cashbackAmount, setCashbackAmount] = useState("");
//   const [showImageModal, setShowImageModal] = useState(false);
//   const [selectedImageInfo, setSelectedImageInfo] = useState(null);
//   const [imageLoading, setImageLoading] = useState(false);

//   // Lucky Draw states
//   const [showWinnerModal, setShowWinnerModal] = useState(false);
//   const [selectedDraw, setSelectedDraw] = useState(null);
//   const [participants, setParticipants] = useState([]);
//   const [loadingParticipants, setLoadingParticipants] = useState(false);
//   const [winnersHistory, setWinnersHistory] = useState([]);
//   const [showWinnersModal, setShowWinnersModal] = useState(false);

//   const fetchData = async () => {
//     if (!tableName) return;

//     setLoading(true);
//     setError("");
//     setMessage("");
//     try {
//       let endpoint = `/admin/table/${tableName}`;
      
//       // For products table, use the products API
//       if (tableName === "products") {
//         endpoint = "/api/products";
//       }
      
//       const res = await api.get(endpoint, {
//         params: { limit: 100, offset: 0 },
//       });
//       setRows(res.data.rows || res.data || []);
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
//     setEditData({
//       name: "",
//       description: "",
//       prize: "",
//       prize_amount: "",
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
//           data: editData,
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

//   /* ---------------------------- ECB CASHBACK FUNCTIONS --------------------------- */

//   // 🆕 UPDATED: View bill image with actual image display
// const viewBillImage = async (upload) => {
//   setImageLoading(true);
//   try {
//     // Get the admin token
//     const adminToken = localStorage.getItem('adminToken');
    
//     // First get image info
//     const res = await api.get(`/admin/ecb/bill-image-info/${upload.id}`);
//     const imageInfo = res.data;
    
//     // Add token to image URL for authentication
//     imageInfo.image_url_with_token = `http://localhost:8001/admin/ecb/bill-image/${upload.id}?token=${adminToken}`;
//     imageInfo.public_image_url = `http://localhost:8001/public/ecb/bill-image/${upload.id}`;
    
//     setSelectedImageInfo(imageInfo);
//     setShowImageModal(true);
//   } catch (err) {
//     console.error(err);
//     alert("Failed to load bill image: " + (err.response?.data?.detail || err.message));
//   } finally {
//     setImageLoading(false);
//   }
// };


//   // Approve cashback
//   const approveCashback = async () => {
//     if (!cashbackAmount || cashbackAmount <= 0) {
//       alert("Please enter a valid cashback amount");
//       return;
//     }

//     const confirmApprove = window.confirm(
//       `Approve ₹${cashbackAmount} cashback for user ${selectedUpload.user_id}?`
//     );

//     if (!confirmApprove) return;

//     try {
//       const res = await api.post(`/admin/ecb/approve-cashback/${selectedUpload.id}`, {
//         cashback_amount: parseFloat(cashbackAmount)
//       });

//       alert(`✅ Cashback approved!\n\nAmount: ₹${cashbackAmount}\nUser ID: ${selectedUpload.user_id}\nNew Balance: ₹${res.data.new_balance}`);
      
//       setShowCashbackModal(false);
//       setMessage("Cashback approved successfully!");
//       fetchData();
//     } catch (err) {
//       console.error(err);
//       alert("Failed to approve cashback: " + (err.response?.data?.detail || err.message));
//     }
//   };

//   const openCashbackModal = (upload) => {
//     setSelectedUpload(upload);
//     setCashbackAmount("");
//     setShowCashbackModal(true);
//   };

//   /* ---------------------------- WINNER FUNCTIONS --------------------------- */

//   const openWinnerModal = async (draw) => {
//     setSelectedDraw(draw);
//     setLoadingParticipants(true);
    
//     try {
//       const res = await api.get(`/admin/lucky-draws/${draw.id}/participants`);
//       setParticipants(res.data.participants || []);
//       setShowWinnerModal(true);
//     } catch (err) {
//       console.error(err);
//       alert("Failed to load participants");
//     } finally {
//       setLoadingParticipants(false);
//     }
//   };

//   const selectRandomWinner = async () => {
//     if (!selectedDraw) return;
    
//     const confirmSelect = window.confirm(
//       `Select a random winner for "${selectedDraw.name}"? This action cannot be undone.`
//     );
    
//     if (!confirmSelect) return;

//     try {
//       const res = await api.post(`/admin/lucky-draws/${selectedDraw.id}/select-random-winner`);
      
//       alert(`🎉 Winner Selected!\n\nWinner: ${res.data.winner.participant_name}\nEmail: ${res.data.winner.email}\nTicket: ${res.data.winner.ticket_number}\nPrize: ₹${res.data.prize_amount}`);
      
//       setShowWinnerModal(false);
//       setMessage("Winner selected successfully!");
//       fetchData();
//     } catch (err) {
//       console.error(err);
//       alert("Failed to select winner: " + (err.response?.data?.detail || err.message));
//     }
//   };

//   const selectManualWinner = async (ticket) => {
//     const confirmSelect = window.confirm(
//       `Select ${ticket.participant_name} as winner for "${selectedDraw.name}"? This action cannot be undone.`
//     );
    
//     if (!confirmSelect) return;

//     try {
//       const res = await api.post(`/admin/lucky-draws/${selectedDraw.id}/select-winner-manual`, {
//         ticket_id: ticket.id
//       });
      
//       alert(`🎉 Winner Selected!\n\nWinner: ${res.data.winner.participant_name}\nEmail: ${res.data.winner.email}\nTicket: ${res.data.winner.ticket_number}\nPrize: ₹${res.data.prize_amount}`);
      
//       setShowWinnerModal(false);
//       setMessage("Winner selected successfully!");
//       fetchData();
//     } catch (err) {
//       console.error(err);
//       alert("Failed to select winner: " + (err.response?.data?.detail || err.message));
//     }
//   };

//   const viewWinnersHistory = async () => {
//     try {
//       const res = await api.get("/admin/lucky-draws/winners");
//       setWinnersHistory(res.data.winners || []);
//       setShowWinnersModal(true);
//     } catch (err) {
//       console.error(err);
//       alert("Failed to load winners history");
//     }
//   };

//   /* ----------------------------- RENDER LOGIC ----------------------------- */

//   if (!tableName) return <p>Select table</p>;
//   if (loading) return <p>Loading {tableName}...</p>;
//   if (error) return <p style={{ color: "red" }}>{error}</p>;

//   const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

//   return (
//     <div style={{ overflowX: "auto" }}>
//       <h2 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//         {tableName}

//         <div style={{ display: "flex", gap: "10px" }}>
//           {/* ECB Actions */}
//           {tableName === "bill_uploads" && (
//             <button
//               onClick={viewWinnersHistory}
//               style={{
//                 background: "#4CAF50",
//                 color: "white",
//                 border: "none",
//                 padding: "6px 12px",
//                 borderRadius: 4,
//                 cursor: "pointer",
//                 fontSize: "14px"
//               }}
//             >
//               📊 ECB Reports
//             </button>
//           )}

//           {/* Lucky Draw Actions */}
//           {tableName === "lucky_draw_master" && (
//             <button
//               onClick={viewWinnersHistory}
//               style={{
//                 background: "#FFB93B",
//                 color: "white",
//                 border: "none",
//                 padding: "6px 12px",
//                 borderRadius: 4,
//                 cursor: "pointer",
//                 fontSize: "14px"
//               }}
//             >
//               🏆 Winners History
//             </button>
//           )}

//           {tableName === "lucky_draw_master" && (
//             <button
//               onClick={openCreateModal}
//               style={{
//                 background: "#4CAF50",
//                 color: "white",
//                 border: "none",
//                 padding: "6px 12px",
//                 borderRadius: 4,
//                 cursor: "pointer",
//               }}
//             >
//               + Create Draw
//             </button>
//           )}
//         </div>
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
//                   {/* ECB Actions for bill_uploads */}
//                   {tableName === "bill_uploads" && row.status === "under_review" && (
//                     <>
//                       <button 
//                         onClick={() => viewBillImage(row)}
//                         style={{
//                           background: "#2196F3",
//                           color: "white",
//                           border: "none",
//                           padding: "4px 8px",
//                           borderRadius: 4,
//                           cursor: "pointer",
//                           marginRight: "4px",
//                           fontSize: "12px"
//                         }}
//                       >
//                         {imageLoading ? "Loading..." : "📷 View Bill"}
//                       </button>
//                       <button 
//                         onClick={() => openCashbackModal(row)}
//                         style={{
//                           background: "#4CAF50",
//                           color: "white",
//                           border: "none",
//                           padding: "4px 8px",
//                           borderRadius: 4,
//                           cursor: "pointer",
//                           marginRight: "4px",
//                           fontSize: "12px"
//                         }}
//                       >
//                         💰 Approve Cashback
//                       </button>
//                     </>
//                   )}
                  
//                   {/* Status badge for processed ECB */}
//                   {tableName === "bill_uploads" && row.status === "approved" && (
//                     <span style={{
//                       background: "#4CAF50",
//                       color: "white",
//                       padding: "4px 8px",
//                       borderRadius: 4,
//                       fontSize: "12px",
//                       marginRight: "4px"
//                     }}>
//                       ✅ Approved
//                     </span>
//                   )}

//                   {/* Lucky Draw Actions */}
//                   {tableName === "lucky_draw_master" && row.status === "active" && !row.winner_selected && (
//                     <button 
//                       onClick={() => openWinnerModal(row)}
//                       style={{
//                         background: "#FFB93B",
//                         color: "white",
//                         border: "none",
//                         padding: "4px 8px",
//                         borderRadius: 4,
//                         cursor: "pointer",
//                         marginRight: "4px",
//                         fontSize: "12px"
//                       }}
//                     >
//                       🎯 Select Winner
//                     </button>
//                   )}
                  
//                   {tableName === "lucky_draw_master" && row.winner_selected && (
//                     <span style={{
//                       background: "#4CAF50",
//                       color: "white",
//                       padding: "4px 8px",
//                       borderRadius: 4,
//                       fontSize: "12px",
//                       marginRight: "4px"
//                     }}>
//                       ✅ Winner Selected
//                     </span>
//                   )}

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
//                 : ["name", "description", "prize", "prize_amount", "ticket_price", "frequency", "status"]
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

//       {/* Cashback Approval Modal */}
//       {showCashbackModal && selectedUpload && (
//         <div className="modal-backdrop">
//           <div className="modal-container">
//             <h3>💰 Approve Cashback</h3>
//             <div style={{ marginBottom: "16px" }}>
//               <p><strong>User ID:</strong> {selectedUpload.user_id}</p>
//               <p><strong>Ticket Type:</strong> {selectedUpload.ticket_type}</p>
//               <p><strong>Bill Amount:</strong> ₹{selectedUpload.bill_amount}</p>
//               <p><strong>Description:</strong> {selectedUpload.description}</p>
//             </div>

//             <div style={{ marginBottom: "16px" }}>
//               <label style={{ display: "block", marginBottom: "8px" }}>
//                 Cashback Amount (₹):
//               </label>
//               <input
//                 type="number"
//                 value={cashbackAmount}
//                 onChange={(e) => setCashbackAmount(e.target.value)}
//                 placeholder="Enter cashback amount"
//                 style={{
//                   width: "100%",
//                   padding: "8px",
//                   border: "1px solid #ccc",
//                   borderRadius: "4px"
//                 }}
//               />
//             </div>

//             <div className="modal-footer">
//               <button 
//                 onClick={approveCashback}
//                 style={{
//                   background: "#4CAF50",
//                   color: "white",
//                   border: "none",
//                   padding: "8px 16px",
//                   borderRadius: "4px",
//                   cursor: "pointer"
//                 }}
//               >
//                 Approve Cashback
//               </button>
//               <button onClick={() => setShowCashbackModal(false)}>Cancel</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* 🆕 UPDATED: Bill Image Modal with Actual Image Display */}
//       {showImageModal && selectedImageInfo && (
//   <div className="modal-backdrop">
//     <div className="modal-container" style={{ maxWidth: "90vw", maxHeight: "90vh" }}>
//       <h3>📷 Bill Image - Upload #{selectedImageInfo.upload_id}</h3>
      
//       <div style={{ marginBottom: "16px" }}>
//         <p><strong>User ID:</strong> {selectedImageInfo.user_id}</p>
//         <p><strong>Ticket Type:</strong> {selectedImageInfo.ticket_type}</p>
//         <p><strong>Bill Amount:</strong> ₹{selectedImageInfo.bill_amount}</p>
//         <p><strong>Description:</strong> {selectedImageInfo.description}</p>
//         <p><strong>File Status:</strong> 
//           <span style={{ color: selectedImageInfo.file_exists ? 'green' : 'red', marginLeft: '8px' }}>
//             {selectedImageInfo.file_exists ? '✅ Available' : '❌ Not Found'}
//           </span>
//         </p>
//       </div>

//       <div style={{ 
//         maxHeight: "70vh", 
//         overflow: "auto",
//         textAlign: "center",
//         backgroundColor: "#f5f5f5",
//         padding: "20px",
//         borderRadius: "8px",
//         border: "2px dashed #ccc"
//       }}>
//         {selectedImageInfo.file_exists ? (
//           <div>
//             {/* Try authenticated URL first */}
//             <img 
//               src={selectedImageInfo.image_url_with_token}
//               alt={`Bill upload ${selectedImageInfo.upload_id}`}
//               style={{
//                 maxWidth: "100%",
//                 maxHeight: "500px",
//                 border: "1px solid #ddd",
//                 borderRadius: "8px",
//                 boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
//               }}
//               onLoad={() => {
//                 console.log("✅ Image loaded successfully with token");
//                 document.getElementById('fallback-content').style.display = 'none';
//               }}
//               onError={(e) => {
//                 console.log("🔄 Authenticated image failed, trying public URL...");
//                 // Try public URL if authenticated fails
//                 e.target.src = selectedImageInfo.public_image_url;
//               }}
//             />
            
//             {/* Fallback content */}
//             <div id="fallback-content" style={{ display: 'none', marginTop: '16px', padding: '20px' }}>
//               <p style={{ color: '#d32f2f', fontSize: '16px', fontWeight: 'bold' }}>
//                 🔄 Trying public image URL...
//               </p>
//             </div>
            
//             <p style={{ marginTop: "16px", fontSize: "14px", color: "#666" }}>
//               <strong>Filename:</strong> {selectedImageInfo.filename}
//             </p>
//           </div>
//         ) : (
//           <div style={{ padding: "40px", color: "#666" }}>
//             <p style={{ fontSize: "18px", color: "#d32f2f", fontWeight: "bold" }}>
//               ❌ Image file not found on server
//             </p>
//             <p><strong>Expected filename:</strong> {selectedImageInfo.filename}</p>
//           </div>
//         )}
//       </div>

//       <div className="modal-footer" style={{ marginTop: "16px" }}>
//         <button onClick={() => setShowImageModal(false)}>Close</button>
//         {selectedImageInfo.file_exists && (
//           <>
//             <a 
//               href={selectedImageInfo.image_url_with_token}
//               target="_blank"
//               rel="noopener noreferrer"
//               style={{
//                 background: "#2196F3",
//                 color: "white",
//                 border: "none",
//                 padding: "8px 16px",
//                 borderRadius: "4px",
//                 cursor: "pointer",
//                 textDecoration: "none",
//                 marginLeft: "8px"
//               }}
//             >
//               Open in New Tab
//             </a>
//             <a 
//               href={selectedImageInfo.public_image_url}
//               target="_blank"
//               rel="noopener noreferrer"
//               style={{
//                 background: "#FF9800",
//                 color: "white",
//                 border: "none",
//                 padding: "8px 16px",
//                 borderRadius: "4px",
//                 cursor: "pointer",
//                 textDecoration: "none",
//                 marginLeft: "8px"
//               }}
//             >
//               Public Link
//             </a>
//           </>
//         )}
//       </div>
//     </div>
//   </div>
// )}


//       {/* Lucky Draw Winner Selection Modal */}
//       {showWinnerModal && selectedDraw && (
//         <div className="modal-backdrop">
//           <div className="modal-container" style={{ maxWidth: "800px", maxHeight: "80vh" }}>
//             <h3>🎯 Select Winner for: {selectedDraw.name}</h3>
//             <p><strong>Prize Amount:</strong> ₹{selectedDraw.prize_amount || 0}</p>
//             <p><strong>Total Participants:</strong> {participants.length}</p>

//             <div style={{ margin: "16px 0" }}>
//               <button
//                 onClick={selectRandomWinner}
//                 style={{
//                   background: "#FFB93B",
//                   color: "white",
//                   border: "none",
//                   padding: "10px 16px",
//                   borderRadius: 6,
//                   cursor: "pointer",
//                   fontSize: "16px",
//                   fontWeight: "bold",
//                   marginRight: "10px"
//                 }}
//               >
//                 🎲 Select Random Winner
//               </button>
//               <small style={{ color: "#666" }}>Randomly select a winner from all participants</small>
//             </div>

//             <div style={{ maxHeight: "400px", overflowY: "auto", marginTop: "20px" }}>
//               <h4>Participants ({participants.length})</h4>
              
//               {loadingParticipants ? (
//                 <p>Loading participants...</p>
//               ) : participants.length === 0 ? (
//                 <p>No participants found for this draw.</p>
//               ) : (
//                 <table style={{ width: "100%", borderCollapse: "collapse" }}>
//                   <thead>
//                     <tr style={{ background: "#f5f5f5" }}>
//                       <th style={{ border: "1px solid #ddd", padding: "8px" }}>Name</th>
//                       <th style={{ border: "1px solid #ddd", padding: "8px" }}>Email</th>
//                       <th style={{ border: "1px solid #ddd", padding: "8px" }}>Phone</th>
//                       <th style={{ border: "1px solid #ddd", padding: "8px" }}>Ticket No.</th>
//                       <th style={{ border: "1px solid #ddd", padding: "8px" }}>Action</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {participants.map((participant, index) => (
//                       <tr key={participant.id}>
//                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
//                           {participant.participant_name}
//                         </td>
//                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
//                           {participant.email}
//                         </td>
//                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
//                           {participant.phone}
//                         </td>
//                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
//                           {participant.ticket_number}
//                         </td>
//                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
//                           <button
//                             onClick={() => selectManualWinner(participant)}
//                             style={{
//                               background: "#4CAF50",
//                               color: "white",
//                               border: "none",
//                               padding: "6px 12px",
//                               borderRadius: 4,
//                               cursor: "pointer",
//                               fontSize: "12px"
//                             }}
//                           >
//                             Select as Winner
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               )}
//             </div>

//             <div className="modal-footer">
//               <button onClick={() => setShowWinnerModal(false)}>Close</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Winners History Modal */}
//       {showWinnersModal && (
//         <div className="modal-backdrop">
//           <div className="modal-container" style={{ maxWidth: "900px", maxHeight: "80vh" }}>
//             <h3>🏆 Lucky Draw Winners History</h3>
            
//             <div style={{ maxHeight: "500px", overflowY: "auto", marginTop: "20px" }}>
//               {winnersHistory.length === 0 ? (
//                 <p>No winners history found.</p>
//               ) : (
//                 <table style={{ width: "100%", borderCollapse: "collapse" }}>
//                   <thead>
//                     <tr style={{ background: "#f5f5f5" }}>
//                       <th style={{ border: "1px solid #ddd", padding: "8px" }}>Draw Name</th>
//                       <th style={{ border: "1px solid #ddd", padding: "8px" }}>Winner</th>
//                       <th style={{ border: "1px solid #ddd", padding: "8px" }}>Email</th>
//                       <th style={{ border: "1px solid #ddd", padding: "8px" }}>Phone</th>
//                       <th style={{ border: "1px solid #ddd", padding: "8px" }}>Ticket No.</th>
//                       <th style={{ border: "1px solid #ddd", padding: "8px" }}>Prize Amount</th>
//                       <th style={{ border: "1px solid #ddd", padding: "8px" }}>Won At</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {winnersHistory.map((winner, index) => (
//                       <tr key={index}>
//                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
//                           {winner.draw_name}
//                         </td>
//                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
//                           {winner.participant_name}
//                         </td>
//                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
//                           {winner.email}
//                         </td>
//                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
//                           {winner.phone}
//                         </td>
//                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
//                           {winner.ticket_number}
//                         </td>
//                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
//                           ₹{winner.prize_amount}
//                         </td>
//                         <td style={{ border: "1px solid #ddd", padding: "8px" }}>
//                           {new Date(winner.winner_selected_at).toLocaleString()}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               )}
//             </div>

//             <div className="modal-footer">
//               <button onClick={() => setShowWinnersModal(false)}>Close</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default TableView;







// admin-frontend/src/components/TableView.js - COMPLETE UPDATED VERSION
import React, { useEffect, useState } from "react";
import { api } from "../api";

function TableView({ tableName }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [editData, setEditData] = useState({});
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // ECB Cashback states
  const [showCashbackModal, setShowCashbackModal] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState(null);
  const [cashbackAmount, setCashbackAmount] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageInfo, setSelectedImageInfo] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Lucky Draw states
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
      let endpoint = `/admin/table/${tableName}`;
      
      // For products table, use the products API
      if (tableName === "products") {
        endpoint = "/api/products";
      }
      
      const res = await api.get(endpoint, {
        params: { limit: 100, offset: 0 },
      });
      setRows(res.data.rows || res.data || []);
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

  /* ---------------------------- PRODUCT FUNCTIONS --------------------------- */
  
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleSave = async () => {
    try {
      if (modalMode === "edit") {
        await api.put(`/admin/table/${tableName}/${editData.id}`, {
          data: editData,
        });
        setMessage("Row updated successfully");
      }

      if (modalMode === "create") {
        // For products, use form data to handle image upload
        if (tableName === "products") {
          const formData = new FormData();
          
          // Add all product fields to form data
          Object.keys(editData).forEach(key => {
            if (editData[key] !== null && editData[key] !== undefined) {
              formData.append(key, editData[key]);
            }
          });
          
          // Add image file
          if (imageFile) {
            formData.append('image', imageFile);
          }
          
          await api.post(`/admin/table/${tableName}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } else {
          await api.post(`/admin/table/${tableName}`, {
            data: editData,
          });
        }
        setMessage("Row created successfully");
      }

      closeModal();
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Save failed: " + err.message);
    }
  };

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
    setImagePreview(row.image_url ? `http://localhost:8001${row.image_url}` : null);
  };

  const openCreateModal = () => {
    setSelectedRow(null);
    setEditData({
      name: "",
      description: "",
      price: "",
      old_price: "",
      category: "",
      brand: "",
      stock_quantity: 0,
      is_featured: false,
      status: "active",
    });
    setModalMode("create");
    setImageFile(null);
    setImagePreview(null);
  };

  const closeModal = () => {
    setSelectedRow(null);
    setModalMode(null);
    setEditData({});
    setImageFile(null);
    setImagePreview(null);
  };

  const handleEditChange = (col, value) => {
    setEditData((prev) => ({ ...prev, [col]: value }));
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

  /* ---------------------------- ECB CASHBACK FUNCTIONS --------------------------- */

  const viewBillImage = async (upload) => {
    setImageLoading(true);
    try {
      // Get the admin token
      const adminToken = localStorage.getItem('adminToken');
      
      // First get image info
      const res = await api.get(`/admin/ecb/bill-image-info/${upload.id}`);
      const imageInfo = res.data;
      
      // Add token to image URL for authentication
      imageInfo.image_url_with_token = `http://localhost:8001/admin/ecb/bill-image/${upload.id}?token=${adminToken}`;
      imageInfo.public_image_url = `http://localhost:8001/public/ecb/bill-image/${upload.id}`;
      
      setSelectedImageInfo(imageInfo);
      setShowImageModal(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load bill image: " + (err.response?.data?.detail || err.message));
    } finally {
      setImageLoading(false);
    }
  };

  // Approve cashback
  const approveCashback = async () => {
    if (!cashbackAmount || cashbackAmount <= 0) {
      alert("Please enter a valid cashback amount");
      return;
    }

    const confirmApprove = window.confirm(
      `Approve ₹${cashbackAmount} cashback for user ${selectedUpload.user_id}?`
    );

    if (!confirmApprove) return;

    try {
      const res = await api.post(`/admin/ecb/approve-cashback/${selectedUpload.id}`, {
        cashback_amount: parseFloat(cashbackAmount)
      });

      alert(`✅ Cashback approved!\n\nAmount: ₹${cashbackAmount}\nUser ID: ${selectedUpload.user_id}\nNew Balance: ₹${res.data.new_balance}`);
      
      setShowCashbackModal(false);
      setMessage("Cashback approved successfully!");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to approve cashback: " + (err.response?.data?.detail || err.message));
    }
  };

  const openCashbackModal = (upload) => {
    setSelectedUpload(upload);
    setCashbackAmount("");
    setShowCashbackModal(true);
  };

  /* ---------------------------- WINNER FUNCTIONS --------------------------- */

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
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to select winner: " + (err.response?.data?.detail || err.message));
    }
  };

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
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to select winner: " + (err.response?.data?.detail || err.message));
    }
  };

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
          {/* Products Actions */}
          {tableName === "products" && (
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
              + Add Product
            </button>
          )}

          {/* ECB Actions */}
          {tableName === "bill_uploads" && (
            <button
              onClick={viewWinnersHistory}
              style={{
                background: "#4CAF50",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              📊 ECB Reports
            </button>
          )}

          {/* Lucky Draw Actions */}
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
                    {col === 'image_url' && row[col] ? (
                      <img 
                        src={`http://localhost:8001${row[col]}`} 
                        alt="product" 
                        style={{ width: 50, height: 50, objectFit: 'cover' }}
                      />
                    ) : col === 'is_featured' ? (
                      row[col] ? '✅' : '❌'
                    ) : (
                      String(row[col])
                    )}
                  </td>
                ))}

                <td style={{ border: "1px solid #ccc", padding: 8 }}>
                  {/* ECB Actions for bill_uploads */}
                  {tableName === "bill_uploads" && row.status === "under_review" && (
                    <>
                      <button 
                        onClick={() => viewBillImage(row)}
                        style={{
                          background: "#2196F3",
                          color: "white",
                          border: "none",
                          padding: "4px 8px",
                          borderRadius: 4,
                          cursor: "pointer",
                          marginRight: "4px",
                          fontSize: "12px"
                        }}
                      >
                        {imageLoading ? "Loading..." : "📷 View Bill"}
                      </button>
                      <button 
                        onClick={() => openCashbackModal(row)}
                        style={{
                          background: "#4CAF50",
                          color: "white",
                          border: "none",
                          padding: "4px 8px",
                          borderRadius: 4,
                          cursor: "pointer",
                          marginRight: "4px",
                          fontSize: "12px"
                        }}
                      >
                        💰 Approve Cashback
                      </button>
                    </>
                  )}
                  
                  {/* Status badge for processed ECB */}
                  {tableName === "bill_uploads" && row.status === "approved" && (
                    <span style={{
                      background: "#4CAF50",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: "12px",
                      marginRight: "4px"
                    }}>
                      ✅ Approved
                    </span>
                  )}

                  {/* Lucky Draw Actions */}
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

      {/* ------------------------- PRODUCT MODAL --------------------------- */}

      {modalMode && tableName === "products" && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: "600px" }}>
            <h3>
              {modalMode === "create"
                ? "Create New Product"
                : modalMode === "edit"
                ? "Edit Product"
                : "View Product"}
            </h3>

            <div className="modal-body">
              {/* Product Image Upload */}
              <div style={{ marginBottom: 16 }}>
                <label>Product Image</label>
                {modalMode !== "view" && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ marginTop: 8, marginBottom: 8 }}
                  />
                )}
                {(imagePreview || editData.image_url) && (
                  <img 
                    src={imagePreview || `http://localhost:8001${editData.image_url}`}
                    alt="product preview"
                    style={{ 
                      width: 100, 
                      height: 100, 
                      objectFit: 'cover', 
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  />
                )}
              </div>

              {/* Product Form Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label>Name</label>
                  {modalMode === "view" ? (
                    <div>{editData.name}</div>
                  ) : (
                    <input
                      value={editData.name || ""}
                      onChange={(e) => handleEditChange("name", e.target.value)}
                      placeholder="Product name"
                    />
                  )}
                </div>

                <div>
                  <label>Price</label>
                  {modalMode === "view" ? (
                    <div>{editData.price}</div>
                  ) : (
                    <input
                      type="number"
                      value={editData.price || ""}
                      onChange={(e) => handleEditChange("price", parseFloat(e.target.value))}
                      placeholder="Price"
                      step="0.01"
                    />
                  )}
                </div>

                <div>
                  <label>Old Price</label>
                  {modalMode === "view" ? (
                    <div>{editData.old_price || "-"}</div>
                  ) : (
                    <input
                      type="number"
                      value={editData.old_price || ""}
                      onChange={(e) => handleEditChange("old_price", parseFloat(e.target.value))}
                      placeholder="Old price (optional)"
                      step="0.01"
                    />
                  )}
                </div>

                <div>
                  <label>Category</label>
                  {modalMode === "view" ? (
                    <div>{editData.category}</div>
                  ) : (
                    <input
                      value={editData.category || ""}
                      onChange={(e) => handleEditChange("category", e.target.value)}
                      placeholder="Category"
                    />
                  )}
                </div>

                <div>
                  <label>Brand</label>
                  {modalMode === "view" ? (
                    <div>{editData.brand}</div>
                  ) : (
                    <input
                      value={editData.brand || ""}
                      onChange={(e) => handleEditChange("brand", e.target.value)}
                      placeholder="Brand"
                    />
                  )}
                </div>

                <div>
                  <label>Stock Quantity</label>
                  {modalMode === "view" ? (
                    <div>{editData.stock_quantity}</div>
                  ) : (
                    <input
                      type="number"
                      value={editData.stock_quantity || 0}
                      onChange={(e) => handleEditChange("stock_quantity", parseInt(e.target.value))}
                      placeholder="Stock quantity"
                    />
                  )}
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label>Description</label>
                  {modalMode === "view" ? (
                    <div>{editData.description}</div>
                  ) : (
                    <textarea
                      value={editData.description || ""}
                      onChange={(e) => handleEditChange("description", e.target.value)}
                      placeholder="Product description"
                      rows="3"
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  )}
                </div>

                <div>
                  <label>
                    <input
                      type="checkbox"
                      checked={editData.is_featured || false}
                      onChange={(e) => handleEditChange("is_featured", e.target.checked)}
                      disabled={modalMode === "view"}
                    />
                    Featured Product
                  </label>
                </div>

                <div>
                  <label>Status</label>
                  {modalMode === "view" ? (
                    <div>{editData.status}</div>
                  ) : (
                    <select
                      value={editData.status || "active"}
                      onChange={(e) => handleEditChange("status", e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {(modalMode === "create" || modalMode === "edit") && (
                <button onClick={handleSave}>
                  {modalMode === "create" ? "Create Product" : "Update Product"}
                </button>
              )}
              <button onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------- DEFAULT MODAL FOR OTHER TABLES --------------------------- */}

      {modalMode && tableName !== "products" && (
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

      {/* Cashback Approval Modal */}
      {showCashbackModal && selectedUpload && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <h3>💰 Approve Cashback</h3>
            <div style={{ marginBottom: "16px" }}>
              <p><strong>User ID:</strong> {selectedUpload.user_id}</p>
              <p><strong>Ticket Type:</strong> {selectedUpload.ticket_type}</p>
              <p><strong>Bill Amount:</strong> ₹{selectedUpload.bill_amount}</p>
              <p><strong>Description:</strong> {selectedUpload.description}</p>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>
                Cashback Amount (₹):
              </label>
              <input
                type="number"
                value={cashbackAmount}
                onChange={(e) => setCashbackAmount(e.target.value)}
                placeholder="Enter cashback amount"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px"
                }}
              />
            </div>

            <div className="modal-footer">
              <button 
                onClick={approveCashback}
                style={{
                  background: "#4CAF50",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Approve Cashback
              </button>
              <button onClick={() => setShowCashbackModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Image Modal with Actual Image Display */}
      {showImageModal && selectedImageInfo && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: "90vw", maxHeight: "90vh" }}>
            <h3>📷 Bill Image - Upload #{selectedImageInfo.upload_id}</h3>
            
            <div style={{ marginBottom: "16px" }}>
              <p><strong>User ID:</strong> {selectedImageInfo.user_id}</p>
              <p><strong>Ticket Type:</strong> {selectedImageInfo.ticket_type}</p>
              <p><strong>Bill Amount:</strong> ₹{selectedImageInfo.bill_amount}</p>
              <p><strong>Description:</strong> {selectedImageInfo.description}</p>
              <p><strong>File Status:</strong> 
                <span style={{ color: selectedImageInfo.file_exists ? 'green' : 'red', marginLeft: '8px' }}>
                  {selectedImageInfo.file_exists ? '✅ Available' : '❌ Not Found'}
                </span>
              </p>
            </div>

            <div style={{ 
              maxHeight: "70vh", 
              overflow: "auto",
              textAlign: "center",
              backgroundColor: "#f5f5f5",
              padding: "20px",
              borderRadius: "8px",
              border: "2px dashed #ccc"
            }}>
              {selectedImageInfo.file_exists ? (
                <div>
                  {/* Try authenticated URL first */}
                  <img 
                    src={selectedImageInfo.image_url_with_token}
                    alt={`Bill upload ${selectedImageInfo.upload_id}`}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "500px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
                    }}
                    onLoad={() => {
                      console.log("✅ Image loaded successfully with token");
                      document.getElementById('fallback-content').style.display = 'none';
                    }}
                    onError={(e) => {
                      console.log("🔄 Authenticated image failed, trying public URL...");
                      // Try public URL if authenticated fails
                      e.target.src = selectedImageInfo.public_image_url;
                    }}
                  />
                  
                  {/* Fallback content */}
                  <div id="fallback-content" style={{ display: 'none', marginTop: '16px', padding: '20px' }}>
                    <p style={{ color: '#d32f2f', fontSize: '16px', fontWeight: 'bold' }}>
                      🔄 Trying public image URL...
                    </p>
                  </div>
                  
                  <p style={{ marginTop: "16px", fontSize: "14px", color: "#666" }}>
                    <strong>Filename:</strong> {selectedImageInfo.filename}
                  </p>
                </div>
              ) : (
                <div style={{ padding: "40px", color: "#666" }}>
                  <p style={{ fontSize: "18px", color: "#d32f2f", fontWeight: "bold" }}>
                    ❌ Image file not found on server
                  </p>
                  <p><strong>Expected filename:</strong> {selectedImageInfo.filename}</p>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ marginTop: "16px" }}>
              <button onClick={() => setShowImageModal(false)}>Close</button>
              {selectedImageInfo.file_exists && (
                <>
                  <a 
                    href={selectedImageInfo.image_url_with_token}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: "#2196F3",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      textDecoration: "none",
                      marginLeft: "8px"
                    }}
                  >
                    Open in New Tab
                  </a>
                  <a 
                    href={selectedImageInfo.public_image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: "#FF9800",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      textDecoration: "none",
                      marginLeft: "8px"
                    }}
                  >
                    Public Link
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lucky Draw Winner Selection Modal */}
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

      {/* Winners History Modal */}
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