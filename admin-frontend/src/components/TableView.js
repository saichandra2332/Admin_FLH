// // admin-frontend/src/components/TableView.js
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

//   const [showCashbackModal, setShowCashbackModal] = useState(false);
//   const [selectedUpload, setSelectedUpload] = useState(null);
//   const [cashbackAmount, setCashbackAmount] = useState("");
//   const [showImageModal, setShowImageModal] = useState(false);
//   const [selectedImageInfo, setSelectedImageInfo] = useState(null);
//   const [imageLoading, setImageLoading] = useState(false);

//   const [showWinnerModal, setShowWinnerModal] = useState(false);
//   const [selectedDraw, setSelectedDraw] = useState(null);
//   const [participants, setParticipants] = useState([]);
//   const [loadingParticipants, setLoadingParticipants] = useState(false);

//   const [winnersHistory, setWinnersHistory] = useState([]);
//   const [showWinnersModal, setShowWinnersModal] = useState(false);

//   // ----------------------------- DATA SANITIZER ------------------------------
//   const sanitizeForDatabase = (data) => {
//     const cleaned = {};

//     for (let key in data) {
//       let value = data[key];

//       if (value === "" || value === "null") {
//         cleaned[key] = null;
//         continue;
//       }

//       if (value === "true") {
//         cleaned[key] = true;
//         continue;
//       }

//       if (value === "false") {
//         cleaned[key] = false;
//         continue;
//       }

//       if (key === "ticket_price" || key === "prize_amount" || key === "prize") {
//         cleaned[key] = Number(value);
//         continue;
//       }

//       cleaned[key] = value;
//     }

//     return cleaned;
//   };

//   // ------------------------------ FETCH DATA -------------------------------
//   const fetchData = async () => {
//     if (!tableName) return;

//     setLoading(true);
//     setError("");
//     setMessage("");
//     try {
//       let endpoint = `/admin/table/${tableName}`;

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

//   /* ---------------------------- PRODUCT FUNCTIONS --------------------------- */
  
//   const handleImageUpload = (event) => {
//     const file = event.target.files[0];
//     if (file) {
//       setImageFile(file);
//       // Create preview URL
//       const previewUrl = URL.createObjectURL(file);
//       setImagePreview(previewUrl);
//     }
//   };

//     // ---------------------------- HANDLE SAVE --------------------------------
//   const handleSave = async () => {
//     try {
//       if (modalMode === "edit") {
//         const safeData = sanitizeForDatabase(editData);

//         await api.put(`/admin/table/${tableName}/${editData.id}`, {
//           data: safeData,
//         });

//         setMessage("Row updated successfully");
//       }

//       if (modalMode === "create") {
//         if (tableName === "products") {
//           const formData = new FormData();

//           Object.keys(editData).forEach((key) => {
//             if (editData[key] !== null && editData[key] !== undefined) {
//               formData.append(key, editData[key]);
//             }
//           });

//           if (imageFile) {
//             formData.append("image", imageFile);
//           }

//           await api.post(`/admin/table/${tableName}`, formData, {
//             headers: { "Content-Type": "multipart/form-data" },
//           });
//         } else {
//           const safeData = sanitizeForDatabase(editData);

//           delete safeData.created_at;

//           await api.post(`/admin/table/${tableName}`, {
//             data: safeData,
//           });
//         }

//         setMessage("Row created successfully");
//       }

//       closeModal();
//       fetchData();
//     } catch (err) {
//       console.error(err);
//       alert("Save failed: " + (err.response?.data?.detail || err.message));
//     }
//   };

//   // ---------------------------- MODAL FUNCTIONS ----------------------------
//   const openViewModal = (row) => {
//     setSelectedRow(row);
//     setEditData(row);
//     setModalMode("view");
//   };

//   const openEditModal = (row) => {
//     setSelectedRow(row);
//     setEditData(row);
//     setModalMode("edit");
//     setImagePreview(
//       row.image_url ? `http://localhost:8001${row.image_url}` : null
//     );
//   };

//   const openCreateModal = () => {
//     setSelectedRow(null);

//     if (tableName === "lucky_draw_master") {
//       setEditData({
//         name: "",
//         description: "",
//         prize: "",
//         ticket_price: "",
//         frequency: "",
//         status: "active",
//         prize_amount: "",
//         winner_selected: false,
//         winner_user_id: null,
//         winner_selected_at: null,
//       });
//     } else {
//       setEditData({});
//     }

//     setModalMode("create");
//     setImageFile(null);
//     setImagePreview(null);
//   };

//   const closeModal = () => {
//     setSelectedRow(null);
//     setModalMode(null);
//     setEditData({});
//     setImageFile(null);
//     setImagePreview(null);
//   };

//   const handleEditChange = (col, value) => {
//     setEditData((prev) => ({ ...prev, [col]: value }));
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

//   const viewBillImage = async (upload) => {
//     setImageLoading(true);
//     try {
//       // Get the admin token
//       const adminToken = localStorage.getItem('adminToken');
      
//       // First get image info
//       const res = await api.get(`/admin/ecb/bill-image-info/${upload.id}`);
//       const imageInfo = res.data;
      
//       // Add token to image URL for authentication
//       imageInfo.image_url_with_token = `http://localhost:8001/admin/ecb/bill-image/${upload.id}?token=${adminToken}`;
//       imageInfo.public_image_url = `http://localhost:8001/public/ecb/bill-image/${upload.id}`;
      
//       setSelectedImageInfo(imageInfo);
//       setShowImageModal(true);
//     } catch (err) {
//       console.error(err);
//       alert("Failed to load bill image: " + (err.response?.data?.detail || err.message));
//     } finally {
//       setImageLoading(false);
//     }
//   };

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
//           {/* Products Actions */}
//           {tableName === "products" && (
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
//               + Add Product
//             </button>
//           )}

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
//                     {col === 'image_url' && row[col] ? (
//                       <img 
//                         src={`http://localhost:8001${row[col]}`} 
//                         alt="product" 
//                         style={{ width: 50, height: 50, objectFit: 'cover' }}
//                       />
//                     ) : col === 'is_featured' ? (
//                       row[col] ? '✅' : '❌'
//                     ) : (
//                       String(row[col])
//                     )}
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

//       {/* ------------------------- PRODUCT MODAL --------------------------- */}

//       {modalMode && tableName === "products" && (
//         <div className="modal-backdrop">
//           <div className="modal-container" style={{ maxWidth: "600px" }}>
//             <h3>
//               {modalMode === "create"
//                 ? "Create New Product"
//                 : modalMode === "edit"
//                 ? "Edit Product"
//                 : "View Product"}
//             </h3>

//             <div className="modal-body">
//               {/* Product Image Upload */}
//               <div style={{ marginBottom: 16 }}>
//                 <label>Product Image</label>
//                 {modalMode !== "view" && (
//                   <input
//                     type="file"
//                     accept="image/*"
//                     onChange={handleImageUpload}
//                     style={{ marginTop: 8, marginBottom: 8 }}
//                   />
//                 )}
//                 {(imagePreview || editData.image_url) && (
//                   <img 
//                     src={imagePreview || `http://localhost:8001${editData.image_url}`}
//                     alt="product preview"
//                     style={{ 
//                       width: 100, 
//                       height: 100, 
//                       objectFit: 'cover', 
//                       border: '1px solid #ccc',
//                       borderRadius: '4px'
//                     }}
//                   />
//                 )}
//               </div>

//               {/* Product Form Fields */}
//               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
//                 <div>
//                   <label>Name</label>
//                   {modalMode === "view" ? (
//                     <div>{editData.name}</div>
//                   ) : (
//                     <input
//                       value={editData.name || ""}
//                       onChange={(e) => handleEditChange("name", e.target.value)}
//                       placeholder="Product name"
//                     />
//                   )}
//                 </div>

//                 <div>
//                   <label>Price</label>
//                   {modalMode === "view" ? (
//                     <div>{editData.price}</div>
//                   ) : (
//                     <input
//                       type="number"
//                       value={editData.price || ""}
//                       onChange={(e) => handleEditChange("price", parseFloat(e.target.value))}
//                       placeholder="Price"
//                       step="0.01"
//                     />
//                   )}
//                 </div>

//                 <div>
//                   <label>Old Price</label>
//                   {modalMode === "view" ? (
//                     <div>{editData.old_price || "-"}</div>
//                   ) : (
//                     <input
//                       type="number"
//                       value={editData.old_price || ""}
//                       onChange={(e) => handleEditChange("old_price", parseFloat(e.target.value))}
//                       placeholder="Old price (optional)"
//                       step="0.01"
//                     />
//                   )}
//                 </div>

//                 <div>
//                   <label>Category</label>
//                   {modalMode === "view" ? (
//                     <div>{editData.category}</div>
//                   ) : (
//                     <input
//                       value={editData.category || ""}
//                       onChange={(e) => handleEditChange("category", e.target.value)}
//                       placeholder="Category"
//                     />
//                   )}
//                 </div>

//                 <div>
//                   <label>Brand</label>
//                   {modalMode === "view" ? (
//                     <div>{editData.brand}</div>
//                   ) : (
//                     <input
//                       value={editData.brand || ""}
//                       onChange={(e) => handleEditChange("brand", e.target.value)}
//                       placeholder="Brand"
//                     />
//                   )}
//                 </div>

//                 <div>
//                   <label>Stock Quantity</label>
//                   {modalMode === "view" ? (
//                     <div>{editData.stock_quantity}</div>
//                   ) : (
//                     <input
//                       type="number"
//                       value={editData.stock_quantity || 0}
//                       onChange={(e) => handleEditChange("stock_quantity", parseInt(e.target.value))}
//                       placeholder="Stock quantity"
//                     />
//                   )}
//                 </div>

//                 <div style={{ gridColumn: 'span 2' }}>
//                   <label>Description</label>
//                   {modalMode === "view" ? (
//                     <div>{editData.description}</div>
//                   ) : (
//                     <textarea
//                       value={editData.description || ""}
//                       onChange={(e) => handleEditChange("description", e.target.value)}
//                       placeholder="Product description"
//                       rows="3"
//                       style={{ width: '100%', resize: 'vertical' }}
//                     />
//                   )}
//                 </div>

//                 <div>
//                   <label>
//                     <input
//                       type="checkbox"
//                       checked={editData.is_featured || false}
//                       onChange={(e) => handleEditChange("is_featured", e.target.checked)}
//                       disabled={modalMode === "view"}
//                     />
//                     Featured Product
//                   </label>
//                 </div>

//                 <div>
//                   <label>Status</label>
//                   {modalMode === "view" ? (
//                     <div>{editData.status}</div>
//                   ) : (
//                     <select
//                       value={editData.status || "active"}
//                       onChange={(e) => handleEditChange("status", e.target.value)}
//                     >
//                       <option value="active">Active</option>
//                       <option value="inactive">Inactive</option>
//                     </select>
//                   )}
//                 </div>
//               </div>
//             </div>

//             <div className="modal-footer">
//               {(modalMode === "create" || modalMode === "edit") && (
//                 <button onClick={handleSave}>
//                   {modalMode === "create" ? "Create Product" : "Update Product"}
//                 </button>
//               )}
//               <button onClick={closeModal}>Close</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ------------------------- DEFAULT MODAL FOR OTHER TABLES --------------------------- */}

//       {modalMode && tableName !== "products" && (
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

//       {/* Bill Image Modal with Actual Image Display */}
//       {showImageModal && selectedImageInfo && (
//         <div className="modal-backdrop">
//           <div className="modal-container" style={{ maxWidth: "90vw", maxHeight: "90vh" }}>
//             <h3>📷 Bill Image - Upload #{selectedImageInfo.upload_id}</h3>
            
//             <div style={{ marginBottom: "16px" }}>
//               <p><strong>User ID:</strong> {selectedImageInfo.user_id}</p>
//               <p><strong>Ticket Type:</strong> {selectedImageInfo.ticket_type}</p>
//               <p><strong>Bill Amount:</strong> ₹{selectedImageInfo.bill_amount}</p>
//               <p><strong>Description:</strong> {selectedImageInfo.description}</p>
//               <p><strong>File Status:</strong> 
//                 <span style={{ color: selectedImageInfo.file_exists ? 'green' : 'red', marginLeft: '8px' }}>
//                   {selectedImageInfo.file_exists ? '✅ Available' : '❌ Not Found'}
//                 </span>
//               </p>
//             </div>

//             <div style={{ 
//               maxHeight: "70vh", 
//               overflow: "auto",
//               textAlign: "center",
//               backgroundColor: "#f5f5f5",
//               padding: "20px",
//               borderRadius: "8px",
//               border: "2px dashed #ccc"
//             }}>
//               {selectedImageInfo.file_exists ? (
//                 <div>
//                   {/* Try authenticated URL first */}
//                   <img 
//                     src={selectedImageInfo.image_url_with_token}
//                     alt={`Bill upload ${selectedImageInfo.upload_id}`}
//                     style={{
//                       maxWidth: "100%",
//                       maxHeight: "500px",
//                       border: "1px solid #ddd",
//                       borderRadius: "8px",
//                       boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
//                     }}
//                     onLoad={() => {
//                       console.log("✅ Image loaded successfully with token");
//                       document.getElementById('fallback-content').style.display = 'none';
//                     }}
//                     onError={(e) => {
//                       console.log("🔄 Authenticated image failed, trying public URL...");
//                       // Try public URL if authenticated fails
//                       e.target.src = selectedImageInfo.public_image_url;
//                     }}
//                   />
                  
//                   {/* Fallback content */}
//                   <div id="fallback-content" style={{ display: 'none', marginTop: '16px', padding: '20px' }}>
//                     <p style={{ color: '#d32f2f', fontSize: '16px', fontWeight: 'bold' }}>
//                       🔄 Trying public image URL...
//                     </p>
//                   </div>
                  
//                   <p style={{ marginTop: "16px", fontSize: "14px", color: "#666" }}>
//                     <strong>Filename:</strong> {selectedImageInfo.filename}
//                   </p>
//                 </div>
//               ) : (
//                 <div style={{ padding: "40px", color: "#666" }}>
//                   <p style={{ fontSize: "18px", color: "#d32f2f", fontWeight: "bold" }}>
//                     ❌ Image file not found on server
//                   </p>
//                   <p><strong>Expected filename:</strong> {selectedImageInfo.filename}</p>
//                 </div>
//               )}
//             </div>

//             <div className="modal-footer" style={{ marginTop: "16px" }}>
//               <button onClick={() => setShowImageModal(false)}>Close</button>
//               {selectedImageInfo.file_exists && (
//                 <>
//                   <a 
//                     href={selectedImageInfo.image_url_with_token}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     style={{
//                       background: "#2196F3",
//                       color: "white",
//                       border: "none",
//                       padding: "8px 16px",
//                       borderRadius: "4px",
//                       cursor: "pointer",
//                       textDecoration: "none",
//                       marginLeft: "8px"
//                     }}
//                   >
//                     Open in New Tab
//                   </a>
//                   <a 
//                     href={selectedImageInfo.public_image_url}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     style={{
//                       background: "#FF9800",
//                       color: "white",
//                       border: "none",
//                       padding: "8px 16px",
//                       borderRadius: "4px",
//                       cursor: "pointer",
//                       textDecoration: "none",
//                       marginLeft: "8px"
//                     }}
//                   >
//                     Public Link
//                   </a>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

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

  const [showCashbackModal, setShowCashbackModal] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState(null);
  const [cashbackAmount, setCashbackAmount] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageInfo, setSelectedImageInfo] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const [winnersHistory, setWinnersHistory] = useState([]);
  const [showWinnersModal, setShowWinnersModal] = useState(false);

  // ----------------------------- DATA SANITIZER ------------------------------
  const sanitizeForDatabase = (data) => {
    const cleaned = {};

    for (let key in data) {
      let value = data[key];

      if (value === "" || value === "null") {
        cleaned[key] = null;
        continue;
      }

      if (value === "true") {
        cleaned[key] = true;
        continue;
      }

      if (value === "false") {
        cleaned[key] = false;
        continue;
      }

      if (key === "ticket_price" || key === "prize_amount" || key === "prize") {
        cleaned[key] = Number(value);
        continue;
      }

      cleaned[key] = value;
    }

    return cleaned;
  };

  // ------------------------------ FETCH DATA -------------------------------
  const fetchData = async () => {
    if (!tableName) return;

    setLoading(true);
    setError("");
    setMessage("");
    try {
      // FIXED: Always use admin endpoint for products
      const endpoint = `/admin/table/${tableName}`;

      const res = await api.get(endpoint, {
        params: { limit: 100, offset: 0 },
      });
      
      // FIXED: Handle admin endpoint response format
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

  // ---------------------------- HANDLE SAVE --------------------------------
  const handleSave = async () => {
    try {
      if (modalMode === "edit") {
        const safeData = sanitizeForDatabase(editData);

        await api.put(`/admin/table/${tableName}/${editData.id}`, {
          data: safeData,
        });

        setMessage("Row updated successfully");
      }

      if (modalMode === "create") {
        if (tableName === "products") {
          const formData = new FormData();

          Object.keys(editData).forEach((key) => {
            if (editData[key] !== null && editData[key] !== undefined) {
              formData.append(key, editData[key]);
            }
          });

          if (imageFile) {
            formData.append("image", imageFile);
          }

          await api.post(`/admin/table/${tableName}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          const safeData = sanitizeForDatabase(editData);

          delete safeData.created_at;

          await api.post(`/admin/table/${tableName}`, {
            data: safeData,
          });
        }

        setMessage("Row created successfully");
      }

      closeModal();
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Save failed: " + (err.response?.data?.detail || err.message));
    }
  };

  // ---------------------------- MODAL FUNCTIONS ----------------------------
  const openViewModal = (row) => {
    setSelectedRow(row);
    setEditData(row);
    setModalMode("view");
  };

  const openEditModal = (row) => {
    setSelectedRow(row);
    setEditData(row);
    setModalMode("edit");
    setImagePreview(
      row.image_url ? `http://localhost:8001${row.image_url}` : null
    );
  };

  const openCreateModal = () => {
    setSelectedRow(null);

    // Set default data based on table type
    if (tableName === "lucky_draw_master") {
      setEditData({
        name: "",
        description: "",
        prize: "",
        ticket_price: "",
        frequency: "",
        status: "active",
        prize_amount: "",
        winner_selected: false,
        winner_user_id: null,
        winner_selected_at: null,
      });
    } else if (tableName === "products") {
      setEditData({
        name: "",
        description: "",
        price: "",
        old_price: "",
        category: "",
        brand: "",
        stock_quantity: 0,
        is_featured: false,
        status: "active"
      });
    } else {
      // Generic create for other tables - start with empty object
      setEditData({});
    }

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

      alert(`✅ Cashback approved!\n\nAmount: ₹${cashbackAmount}\nUser ID: ${selectedUpload.user_id}\nNew Balance: ₹${res.data.new_user_balance}\nRemaining Admin Balance: ₹${res.data.remaining_admin_balance}`);
      
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

  // Get modal title based on table name
  const getCreateModalTitle = () => {
    const titles = {
      'users': 'Create New User',
      'products': 'Create New Product',
      'orders': 'Create New Order',
      'lucky_draw_master': 'Create New Lucky Draw',
      'lucky_draw_tickets': 'Create New Ticket',
      'bill_uploads': 'Create New Bill Upload',
      'schemes': 'Create New Scheme',
      'wallets': 'Create New Wallet',
      'wallet_transactions': 'Create New Transaction',
      'cart': 'Create New Cart Item',
      'wishlist': 'Create New Wishlist Item',
      'order_items': 'Create New Order Item',
      'admin_wallet': 'Create New Admin Wallet',
      'admin_wallet_transactions': 'Create New Admin Transaction'
    };
    
    return titles[tableName] || `Create New ${tableName.replace(/_/g, ' ')}`;
  };

  // Check if table supports creation
  const canCreateRecord = () => {
    // List of tables that don't support manual creation
    const noCreateTables = [
      'wallet_transactions', // Usually created by system
      'order_items', // Usually created with orders
      'cart', // Usually created by users
      'wishlist', // Usually created by users
      'admin_wallet', // Only one admin wallet
      'admin_wallet_transactions' // Created by system during recharge/cashback
    ];
    
    return !noCreateTables.includes(tableName);
  };

  /* ----------------------------- RENDER LOGIC ----------------------------- */

  if (!tableName) return <div className="empty-state">Select a table to view data</div>;
  if (loading) return <div className="loading-state">Loading {tableName} data...</div>;
  if (error) return <div className="error-state">{error}</div>;

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="table-view">
      <div className="table-section">
        <div className="table-header">
          <div>
            <h3 className="table-title">{tableName}</h3>
            <p className="table-info">{rows.length} records found</p>
          </div>
          <div className="table-actions">
            {/* Products Actions */}
            {tableName === "products" && (
              <button
                onClick={openCreateModal}
                className="btn btn-primary"
              >
                <span className="btn-icon">➕</span>
                Add Product
              </button>
            )}

            {/* Lucky Draw Actions */}
            {tableName === "lucky_draw_master" && (
              <>
                <button
                  onClick={viewWinnersHistory}
                  className="btn btn-warning"
                >
                  <span className="btn-icon">🏆</span>
                  Winners History
                </button>
                <button
                  onClick={openCreateModal}
                  className="btn btn-primary"
                >
                  <span className="btn-icon">➕</span>
                  Create Draw
                </button>
              </>
            )}

            {/* ECB Actions */}
            {tableName === "bill_uploads" && (
              <button
                onClick={viewWinnersHistory}
                className="btn btn-secondary"
              >
                <span className="btn-icon">📊</span>
                ECB Reports
              </button>
            )}

            {/* Generic Add New button for other tables that support creation */}
            {canCreateRecord() && tableName !== "products" && tableName !== "lucky_draw_master" && (
              <button
                onClick={openCreateModal}
                className="btn btn-primary"
              >
                <span className="btn-icon">➕</span>
                Add New
              </button>
            )}
          </div>
        </div>

        {message && (
          <div className="success-message" style={{margin: '0 24px 24px'}}>
            {message}
          </div>
        )}

        {rows.length === 0 ? (
          <div className="empty-data" style={{padding: '60px 24px'}}>
            <div className="empty-icon">📭</div>
            <h3>No data found</h3>
            <p>No records available in the {tableName} table.</p>
            {canCreateRecord() && (
              <button onClick={openCreateModal} className="btn btn-primary" style={{marginTop: '16px'}}>
                Create First Record
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col}>
                        {col.replace(/_/g, ' ').toUpperCase()}
                      </th>
                    ))}
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx}>
                      {columns.map((col) => (
                        <td key={col}>
                          {col === 'image_url' && row[col] ? (
                            <img 
                              src={`http://localhost:8001${row[col]}`} 
                              alt="product" 
                              className="table-image"
                              style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px'}}
                            />
                          ) : col === 'is_featured' ? (
                            <span className={`status-badge ${row[col] ? 'active' : 'inactive'}`}>
                              {row[col] ? '✅ Featured' : '❌ Not Featured'}
                            </span>
                          ) : col === 'status' ? (
                            <span className={`status-badge ${
                              row[col] === 'active' ? 'success' : 
                              row[col] === 'completed' ? 'success' : 
                              row[col] === 'approved' ? 'success' : 'warning'
                            }`}>
                              {row[col]}
                            </span>
                          ) : col === 'amount' && tableName === 'admin_wallet_transactions' ? (
                            <span className={row[col] < 0 ? 'negative-amount' : 'positive-amount'}>
                              {row[col] < 0 ? '-' : '+'}₹{Math.abs(row[col]).toLocaleString()}
                            </span>
                          ) : (
                            <span className="cell-content">
                              {String(row[col] || '-')}
                            </span>
                          )}
                        </td>
                      ))}
                      <td>
                        <div className="action-buttons">
                          {/* ECB Actions */}
                          {tableName === "bill_uploads" && row.status === "under_review" && (
                            <>
                              <button 
                                onClick={() => viewBillImage(row)}
                                className="btn btn-sm btn-info"
                                title="View Bill Image"
                              >
                                📷
                              </button>
                              <button 
                                onClick={() => openCashbackModal(row)}
                                className="btn btn-sm btn-success"
                                title="Approve Cashback"
                              >
                                ✅
                              </button>
                            </>
                          )}
                          
                          {/* Lucky Draw Actions */}
                          {tableName === "lucky_draw_master" && row.status === "active" && !row.winner_selected && (
                            <button 
                              onClick={() => openWinnerModal(row)}
                              className="btn btn-sm btn-warning"
                              title="Select Winner"
                            >
                              🎯
                            </button>
                          )}

                          <button 
                            onClick={() => openViewModal(row)}
                            className="btn btn-sm btn-outline"
                            title="View"
                          >
                            👁️
                          </button>
                          <button 
                            onClick={() => openEditModal(row)}
                            className="btn btn-sm btn-primary"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(row)}
                            className="btn btn-sm btn-danger"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="table-footer">
              <div className="table-info">
                Showing {rows.length} records from {tableName}
              </div>
              <div className="pagination">
                <button className="btn btn-sm btn-outline" disabled>← Previous</button>
                <span style={{padding: '0 12px', fontSize: '14px'}}>Page 1</span>
                <button className="btn btn-sm btn-outline" disabled>Next →</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ------------------------- PRODUCT MODAL --------------------------- */}

      {modalMode && tableName === "products" && (
        <div className="modal-overlay">
          <div className="modal-content product-modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === "create"
                  ? "Create New Product"
                  : modalMode === "edit"
                  ? "Edit Product"
                  : "View Product"}
              </h3>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>

            <div className="modal-body">
              {/* Product Image Upload */}
              <div className="form-section">
                <label className="section-label">Product Image</label>
                {modalMode !== "view" && (
                  <div className="image-upload-area">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="file-input"
                    />
                    <div className="upload-placeholder">
                      <span className="upload-icon">📁</span>
                      <p>Click to upload product image</p>
                    </div>
                  </div>
                )}
                {(imagePreview || editData.image_url) && (
                  <div className="image-preview">
                    <img 
                      src={imagePreview || `http://localhost:8001${editData.image_url}`}
                      alt="product preview"
                      className="preview-image"
                      style={{maxWidth: '200px', maxHeight: '200px', borderRadius: '8px'}}
                    />
                  </div>
                )}
              </div>

              {/* Product Form Fields */}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  {modalMode === "view" ? (
                    <div className="form-value">{editData.name}</div>
                  ) : (
                    <input
                      className="form-input"
                      value={editData.name || ""}
                      onChange={(e) => handleEditChange("name", e.target.value)}
                      placeholder="Product name"
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Price *</label>
                  {modalMode === "view" ? (
                    <div className="form-value">₹{editData.price}</div>
                  ) : (
                    <input
                      type="number"
                      className="form-input"
                      value={editData.price || ""}
                      onChange={(e) => handleEditChange("price", parseFloat(e.target.value))}
                      placeholder="Price"
                      step="0.01"
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Old Price</label>
                  {modalMode === "view" ? (
                    <div className="form-value">{editData.old_price ? `₹${editData.old_price}` : "-"}</div>
                  ) : (
                    <input
                      type="number"
                      className="form-input"
                      value={editData.old_price || ""}
                      onChange={(e) => handleEditChange("old_price", parseFloat(e.target.value))}
                      placeholder="Old price (optional)"
                      step="0.01"
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Category *</label>
                  {modalMode === "view" ? (
                    <div className="form-value">{editData.category}</div>
                  ) : (
                    <input
                      className="form-input"
                      value={editData.category || ""}
                      onChange={(e) => handleEditChange("category", e.target.value)}
                      placeholder="Category"
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Brand *</label>
                  {modalMode === "view" ? (
                    <div className="form-value">{editData.brand}</div>
                  ) : (
                    <input
                      className="form-input"
                      value={editData.brand || ""}
                      onChange={(e) => handleEditChange("brand", e.target.value)}
                      placeholder="Brand"
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Stock Quantity</label>
                  {modalMode === "view" ? (
                    <div className="form-value">{editData.stock_quantity}</div>
                  ) : (
                    <input
                      type="number"
                      className="form-input"
                      value={editData.stock_quantity || 0}
                      onChange={(e) => handleEditChange("stock_quantity", parseInt(e.target.value))}
                      placeholder="Stock quantity"
                    />
                  )}
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Description</label>
                  {modalMode === "view" ? (
                    <div className="form-value">{editData.description}</div>
                  ) : (
                    <textarea
                      className="form-textarea"
                      value={editData.description || ""}
                      onChange={(e) => handleEditChange("description", e.target.value)}
                      placeholder="Product description"
                      rows="3"
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={editData.is_featured || false}
                      onChange={(e) => handleEditChange("is_featured", e.target.checked)}
                      disabled={modalMode === "view"}
                      className="checkbox-input"
                    />
                    <span className="checkbox-custom"></span>
                    Featured Product
                  </label>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  {modalMode === "view" ? (
                    <div className={`status-badge ${editData.status === 'active' ? 'success' : 'warning'}`}>
                      {editData.status}
                    </div>
                  ) : (
                    <select
                      className="form-select"
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
                <button onClick={handleSave} className="btn btn-primary">
                  {modalMode === "create" ? "Create Product" : "Update Product"}
                </button>
              )}
              <button onClick={closeModal} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------- DEFAULT MODAL FOR OTHER TABLES --------------------------- */}

      {modalMode && tableName !== "products" && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === "create"
                  ? getCreateModalTitle()
                  : modalMode === "edit"
                  ? `Edit ${tableName.replace(/_/g, ' ')}`
                  : `View ${tableName.replace(/_/g, ' ')}`}
              </h3>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>

            <div className="modal-body">
              {(columns.length > 0
                ? columns
                : ["name", "description", "prize", "prize_amount", "ticket_price", "frequency", "status"]
              ).map((col) => (
                <div key={col} className="form-group">
                  <label className="form-label">{col.replace(/_/g, ' ')}</label>

                  {modalMode === "view" || col === "id" ? (
                    <div className="form-value">{editData[col]}</div>
                  ) : (
                    <input
                      className="form-input"
                      value={editData[col] || ""}
                      onChange={(e) => handleEditChange(col, e.target.value)}
                      placeholder={`Enter ${col.replace(/_/g, ' ')}`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="modal-footer">
              {(modalMode === "create" || modalMode === "edit") && (
                <button onClick={handleSave} className="btn btn-primary">
                  {modalMode === "create" ? "Create" : "Update"}
                </button>
              )}
              <button onClick={closeModal} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Cashback Approval Modal */}
      {showCashbackModal && selectedUpload && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">💰 Approve Cashback</h3>
              <button onClick={() => setShowCashbackModal(false)} className="modal-close">×</button>
            </div>
            
            <div className="modal-body">
              <div className="info-grid">
                <div className="info-item">
                  <label>User ID:</label>
                  <span>{selectedUpload.user_id}</span>
                </div>
                <div className="info-item">
                  <label>Ticket Type:</label>
                  <span>{selectedUpload.ticket_type}</span>
                </div>
                <div className="info-item">
                  <label>Bill Amount:</label>
                  <span>₹{selectedUpload.bill_amount}</span>
                </div>
                <div className="info-item full-width">
                  <label>Description:</label>
                  <span>{selectedUpload.description}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Cashback Amount (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={cashbackAmount}
                  onChange={(e) => setCashbackAmount(e.target.value)}
                  placeholder="Enter cashback amount"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={approveCashback}
                className="btn btn-success"
              >
                Approve Cashback
              </button>
              <button 
                onClick={() => setShowCashbackModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Image Modal */}
      {showImageModal && selectedImageInfo && (
        <div className="modal-overlay">
          <div className="modal-content image-modal">
            <div className="modal-header">
              <h3 className="modal-title">📷 Bill Image - Upload #{selectedImageInfo.upload_id}</h3>
              <button onClick={() => setShowImageModal(false)} className="modal-close">×</button>
            </div>
            
            <div className="modal-body">
              <div className="info-grid">
                <div className="info-item">
                  <label>User ID:</label>
                  <span>{selectedImageInfo.user_id}</span>
                </div>
                <div className="info-item">
                  <label>Ticket Type:</label>
                  <span>{selectedImageInfo.ticket_type}</span>
                </div>
                <div className="info-item">
                  <label>Bill Amount:</label>
                  <span>₹{selectedImageInfo.bill_amount}</span>
                </div>
                <div className="info-item">
                  <label>File Status:</label>
                  <span className={`status-badge ${selectedImageInfo.file_exists ? 'success' : 'error'}`}>
                    {selectedImageInfo.file_exists ? '✅ Available' : '❌ Not Found'}
                  </span>
                </div>
              </div>

              <div className="image-display-area">
                {selectedImageInfo.file_exists ? (
                  <div className="image-container">
                    <img 
                      src={selectedImageInfo.image_url_with_token}
                      alt={`Bill upload ${selectedImageInfo.upload_id}`}
                      className="bill-image"
                      style={{maxWidth: '100%', maxHeight: '400px', borderRadius: '8px'}}
                      onError={(e) => {
                        e.target.src = selectedImageInfo.public_image_url;
                      }}
                    />
                    <div className="image-info">
                      <strong>Filename:</strong> {selectedImageInfo.filename}
                    </div>
                  </div>
                ) : (
                  <div className="image-error">
                    <div className="error-icon">❌</div>
                    <h4>Image file not found on server</h4>
                    <p>Expected filename: {selectedImageInfo.filename}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => setShowImageModal(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
              {selectedImageInfo.file_exists && (
                <>
                  <a 
                    href={selectedImageInfo.image_url_with_token}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-info"
                  >
                    Open in New Tab
                  </a>
                  <a 
                    href={selectedImageInfo.public_image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-warning"
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
        <div className="modal-overlay">
          <div className="modal-content winner-modal">
            <div className="modal-header">
              <h3 className="modal-title">🎯 Select Winner for: {selectedDraw.name}</h3>
              <button onClick={() => setShowWinnerModal(false)} className="modal-close">×</button>
            </div>
            
            <div className="modal-body">
              <div className="draw-info">
                <div className="info-card">
                  <div className="info-label">Prize Amount</div>
                  <div className="info-value">₹{selectedDraw.prize_amount || 0}</div>
                </div>
                <div className="info-card">
                  <div className="info-label">Total Participants</div>
                  <div className="info-value">{participants.length}</div>
                </div>
              </div>

              <div className="winner-actions">
                <button
                  onClick={selectRandomWinner}
                  className="btn btn-warning btn-lg"
                >
                  <span className="btn-icon">🎲</span>
                  Select Random Winner
                </button>
                <p className="action-hint">Randomly select a winner from all participants</p>
              </div>

              <div className="participants-section">
                <h4>Participants ({participants.length})</h4>
                
                {loadingParticipants ? (
                  <div className="loading-participants">Loading participants...</div>
                ) : participants.length === 0 ? (
                  <div className="empty-participants">
                    <div className="empty-icon">👥</div>
                    <p>No participants found for this draw.</p>
                  </div>
                ) : (
                  <div className="participants-table">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Ticket No.</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map((participant) => (
                          <tr key={participant.id}>
                            <td>{participant.participant_name}</td>
                            <td>{participant.email}</td>
                            <td>{participant.phone}</td>
                            <td>{participant.ticket_number}</td>
                            <td>
                              <button
                                onClick={() => selectManualWinner(participant)}
                                className="btn btn-sm btn-success"
                              >
                                Select as Winner
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => setShowWinnerModal(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Winners History Modal */}
      {showWinnersModal && (
        <div className="modal-overlay">
          <div className="modal-content winners-history-modal">
            <div className="modal-header">
              <h3 className="modal-title">🏆 Lucky Draw Winners History</h3>
              <button onClick={() => setShowWinnersModal(false)} className="modal-close">×</button>
            </div>
            
            <div className="modal-body">
              {winnersHistory.length === 0 ? (
                <div className="empty-winners">
                  <div className="empty-icon">🏆</div>
                  <h4>No winners history found</h4>
                  <p>There are no completed lucky draws with winners yet.</p>
                </div>
              ) : (
                <div className="winners-table">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Draw Name</th>
                        <th>Winner</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Ticket No.</th>
                        <th>Prize Amount</th>
                        <th>Won At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {winnersHistory.map((winner, index) => (
                        <tr key={index}>
                          <td>{winner.draw_name}</td>
                          <td>{winner.participant_name}</td>
                          <td>{winner.email}</td>
                          <td>{winner.phone}</td>
                          <td>{winner.ticket_number}</td>
                          <td>₹{winner.prize_amount}</td>
                          <td>{new Date(winner.winner_selected_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => setShowWinnersModal(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TableView;