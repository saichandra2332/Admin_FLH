// import React, { useEffect, useState } from "react";
// import { api } from "../api";
// import TableView from "./TableView";

// function AdminLayout({ onLogout }) {
//   const [tables, setTables] = useState([]);
//   const [selectedTable, setSelectedTable] = useState("");

//   useEffect(() => {
//     const fetchTables = async () => {
//       try {
//         const res = await api.get("/admin/tables");
//         setTables(res.data.tables || []);
//         if (res.data.tables && res.data.tables.length > 0) {
//           setSelectedTable(res.data.tables[0]);
//         }
//       } catch (err) {
//         console.error(err);
//       }
//     };
//     fetchTables();
//   }, []);

//   return (
//     <div style={{ display: "flex", height: "100vh" }}>
//       {/* Sidebar */}
//       <div
//         style={{
//           width: 220,
//           borderRight: "1px solid #ddd",
//           padding: 12,
//           boxSizing: "border-box",
//         }}
//       >
//         <h3>Admin Panel</h3>
//         <button onClick={onLogout} style={{ marginBottom: 16 }}>
//           Logout
//         </button>
//         <h4>Tables</h4>
//         <ul style={{ listStyle: "none", padding: 0 }}>
//           {tables.map((t) => (
//             <li key={t}>
//               <button
//                 onClick={() => setSelectedTable(t)}
//                 style={{
//                   width: "100%",
//                   textAlign: "left",
//                   padding: 6,
//                   marginBottom: 4,
//                   background: t === selectedTable ? "#e0e0ff" : "transparent",
//                   border: "none",
//                   cursor: "pointer",
//                 }}
//               >
//                 {t}
//               </button>
//             </li>
//           ))}
//         </ul>
//       </div>

//       {/* Main content */}
//       <div style={{ flex: 1, padding: 16 }}>
//         <TableView tableName={selectedTable} />
//       </div>
//     </div>
//   );
// }

// export default AdminLayout;
import React, { useEffect, useState } from "react";
import { api } from "../api";
import TableView from "./TableView";

function AdminLayout({ onLogout }) {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalSchemes: 0,
    activeDraws: 0,
    totalParticipants: 0,
    pendingBillUploads: 0,
    totalWinners: 0,
    adminWalletBalance: 0,
    adminTotalRecharged: 0,
    adminTotalSpent: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletDetails, setWalletDetails] = useState(null);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [rechargeAmount, setRechargeAmount] = useState("");

  const tableGroups = {
    "User Management": ["users", "cart", "wishlist"],
    "Order Management": ["orders", "order_items"],
    "Financial": ["wallets", "wallet_transactions", "bill_uploads", "schemes", "admin_wallet", "admin_wallet_transactions"],
    "Lucky Draw": ["lucky_draw_master", "lucky_draw_tickets"],
    "Products": ["products"]
  };

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await api.get("/admin/tables");
        setTables(res.data.tables || []);
        if (res.data.tables && res.data.tables.length > 0) {
          setSelectedTable(res.data.tables[0]);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchTables();
  }, []);

  useEffect(() => {
    if (!selectedTable) {
      fetchDashboardData();
    }
  }, [selectedTable]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch data from multiple endpoints
      const [
        usersRes,
        ordersRes,
        productsRes,
        schemesRes,
        drawsRes,
        billUploadsRes,
        winnersRes,
        walletRes,
        activityRes
      ] = await Promise.allSettled([
        api.get("/admin/table/users?limit=1000"),
        api.get("/admin/table/orders?limit=1000"),
        api.get("/admin/table/products?limit=1000"), // FIXED: Use admin endpoint
        api.get("/admin/table/schemes?limit=1000"),
        api.get("/admin/table/lucky_draw_master?limit=1000"),
        api.get("/admin/table/bill_uploads?limit=1000"),
        api.get("/admin/lucky-draws/winners"),
        api.get("/admin/wallet/balance"),
        fetchRecentActivity()
      ]);

      // Process users data
      const totalUsers = usersRes.status === 'fulfilled' ? 
        (usersRes.value.data.rows || []).length : 0;

      // Process orders data and calculate revenue
      const orders = ordersRes.status === 'fulfilled' ? 
        (ordersRes.value.data.rows || []) : [];
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => {
        return sum + (parseFloat(order.total_amount) || 0);
      }, 0);

      // Process products data - FIXED: Use admin endpoint format
      const totalProducts = productsRes.status === 'fulfilled' ? 
        (productsRes.value.data.rows || []).length : 0;

      // Process schemes data
      const totalSchemes = schemesRes.status === 'fulfilled' ? 
        (schemesRes.value.data.rows || []).length : 0;

      // Process lucky draws data
      const draws = drawsRes.status === 'fulfilled' ? 
        (drawsRes.value.data.rows || []) : [];
      const activeDraws = draws.filter(draw => 
        draw.status === 'active' && !draw.winner_selected
      ).length;

      // Process participants data
      let totalParticipants = 0;
      if (drawsRes.status === 'fulfilled') {
        const participantsPromises = draws.map(draw => 
          api.get(`/admin/lucky-draws/${draw.id}/participants`)
            .then(res => res.data.participants?.length || 0)
            .catch(() => 0)
        );
        const participantsCounts = await Promise.all(participantsPromises);
        totalParticipants = participantsCounts.reduce((sum, count) => sum + count, 0);
      }

      // Process bill uploads data
      const billUploads = billUploadsRes.status === 'fulfilled' ? 
        (billUploadsRes.value.data.rows || []) : [];
      const pendingBillUploads = billUploads.filter(upload => 
        upload.status === 'under_review'
      ).length;

      // Process winners data
      const totalWinners = winnersRes.status === 'fulfilled' ? 
        (winnersRes.value.data.winners || []).length : 0;

      // Process wallet data
      const walletData = walletRes.status === 'fulfilled' ? 
        walletRes.value.data : {};
      const adminWalletBalance = walletData.available_balance || 0;
      const adminTotalRecharged = walletData.total_recharged || 0;
      const adminTotalSpent = walletData.total_spent || 0;

      setStats({
        totalUsers,
        totalOrders,
        totalRevenue,
        totalProducts,
        totalSchemes,
        activeDraws,
        totalParticipants,
        pendingBillUploads,
        totalWinners,
        adminWalletBalance,
        adminTotalRecharged,
        adminTotalSpent
      });

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent data from multiple tables to create activity feed
      const [recentUsers, recentOrders, recentBillUploads, recentDraws] = await Promise.allSettled([
        api.get("/admin/table/users?limit=5"),
        api.get("/admin/table/orders?limit=5"),
        api.get("/admin/table/bill_uploads?limit=5"),
        api.get("/admin/table/lucky_draw_master?limit=5")
      ]);

      const activities = [];

      // Process recent users
      if (recentUsers.status === 'fulfilled') {
        const users = recentUsers.value.data.rows || [];
        users.forEach(user => {
          activities.push({
            type: 'user',
            action: 'Registered',
            name: user.full_name || user.email,
            table: 'users',
            time: user.created_at,
            status: 'completed'
          });
        });
      }

      // Process recent orders
      if (recentOrders.status === 'fulfilled') {
        const orders = recentOrders.value.data.rows || [];
        orders.forEach(order => {
          activities.push({
            type: 'order',
            action: 'Placed order',
            name: `Order #${order.id}`,
            table: 'orders',
            time: order.created_at,
            status: order.status || 'pending'
          });
        });
      }

      // Process recent bill uploads
      if (recentBillUploads.status === 'fulfilled') {
        const uploads = recentBillUploads.value.data.rows || [];
        uploads.forEach(upload => {
          activities.push({
            type: 'bill',
            action: 'Uploaded bill',
            name: `Upload #${upload.id}`,
            table: 'bill_uploads',
            time: upload.created_at,
            status: upload.status || 'under_review'
          });
        });
      }

      // Process recent draws
      if (recentDraws.status === 'fulfilled') {
        const draws = recentDraws.value.data.rows || [];
        draws.forEach(draw => {
          if (draw.winner_selected) {
            activities.push({
              type: 'draw',
              action: 'Draw completed',
              name: draw.name,
              table: 'lucky_draw_master',
              time: draw.winner_selected_at,
              status: 'completed'
            });
          }
        });
      }

      // Sort by time and take latest 10
      const sortedActivities = activities
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 10);

      setRecentActivity(sortedActivities);

    } catch (err) {
      console.error("Error fetching recent activity:", err);
      setRecentActivity([]);
    }
  };

  const getTableDisplayName = (tableName) => {
    const names = {
      users: "Users",
      cart: "Shopping Cart",
      wishlist: "Wishlist",
      order_items: "Order Items",
      orders: "Orders",
      wallets: "Wallets",
      wallet_transactions: "Wallet Transactions",
      lucky_draw_tickets: "Lucky Draw Tickets",
      bill_uploads: "Bill Uploads",
      schemes: "Savings Schemes",
      lucky_draw_master: "Lucky Draws",
      products: "Products",
      admin_wallet: "Admin Wallet",
      admin_wallet_transactions: "Admin Transactions"
    };
    return names[tableName] || tableName;
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type) => {
    const icons = {
      user: '👤',
      order: '🛒',
      bill: '📄',
      draw: '🎯',
      scheme: '💰',
      product: '📦',
      wallet: '💳'
    };
    return icons[type] || '📊';
  };

  const handleRefreshDashboard = () => {
    fetchDashboardData();
  };

  const handleViewWallet = async () => {
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        api.get("/admin/wallet/balance"),
        api.get("/admin/wallet/transactions")
      ]);

      setWalletDetails(balanceRes.data);
      setWalletTransactions(transactionsRes.data.transactions || []);
      setShowWalletModal(true);
    } catch (err) {
      console.error("Error fetching wallet details:", err);
      alert("Failed to load wallet details");
    }
  };

  const handleRecharge = async () => {
    if (!rechargeAmount || rechargeAmount <= 0) {
      alert("Please enter a valid recharge amount");
      return;
    }

    try {
      const res = await api.post("/admin/wallet/create-recharge-order", {
        amount: parseFloat(rechargeAmount)
      });

      const options = {
        key: res.data.razorpay_key_id,
        amount: res.data.amount * 100, // Amount in paise
        currency: res.data.currency,
        name: "Admin Wallet Recharge",
        description: "Wallet recharge for admin account",
        order_id: res.data.order_id,
        handler: async function (response) {
          try {
            const verifyRes = await api.post("/admin/wallet/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            alert(`✅ Wallet recharged successfully! Amount: ₹${rechargeAmount}`);
            setRechargeAmount("");
            setShowWalletModal(false);
            fetchDashboardData(); // Refresh dashboard data
          } catch (err) {
            console.error("Payment verification failed:", err);
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: "Administrator",
          email: "admin@lotofhappysmiles.com",
        },
        theme: {
          color: "#3399cc"
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Error creating recharge order:", err);
      alert("Failed to create recharge order");
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <img 
            src="https://lotofhappysmiles.com/Images/Logos/mainlogo.png" 
            alt="Admin Logo" 
            className="sidebar-logo"
          />
          <div className="sidebar-title">Admin Panel</div>
        </div>

        <nav className="sidebar-nav">
          {/* Dashboard */}
          <div className="nav-section">
            <button 
              className={`nav-item ${!selectedTable ? 'active' : ''}`}
              onClick={() => setSelectedTable('')}
            >
              <span className="nav-icon">📊</span>
              Dashboard Overview
            </button>
          </div>

          {/* Table Groups */}
          {Object.entries(tableGroups).map(([groupName, groupTables]) => (
            <div key={groupName} className="nav-section">
              <div className="section-label">{groupName}</div>
              {groupTables
                .filter(table => tables.includes(table))
                .map(table => (
                  <button
                    key={table}
                    onClick={() => setSelectedTable(table)}
                    className={`nav-item ${table === selectedTable ? 'active' : ''}`}
                  >
                    <span className="nav-icon">
                      {table === 'users' ? '👥' :
                       table === 'products' ? '📦' :
                       table === 'orders' ? '🛒' :
                       table.includes('lucky') ? '🎯' :
                       table.includes('wallet') ? '💰' : 
                       table.includes('admin_wallet') ? '💳' : '📊'}
                    </span>
                    {getTableDisplayName(table)}
                  </button>
                ))
              }
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">A</div>
            <div className="user-info">
              <div className="user-name">Administrator</div>
              <div className="user-role">Super Admin</div>
            </div>
            <button className="logout-btn" onClick={onLogout} title="Logout">
              <span className="nav-icon">🚪</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="header-left">
            <h1>
              {selectedTable ? getTableDisplayName(selectedTable) : 'Dashboard Overview'}
            </h1>
            <p>
              {selectedTable ? 
                `Manage ${getTableDisplayName(selectedTable).toLowerCase()} and their data` : 
                'Monitor your platform performance and statistics'
              }
            </p>
          </div>
          
          <div className="header-actions">
            {!selectedTable && (
              <>
                <button 
                  onClick={handleViewWallet}
                  className="btn btn-warning"
                >
                  <span className="btn-icon">💳</span>
                  Admin Wallet: ₹{stats.adminWalletBalance.toLocaleString()}
                </button>
                <button 
                  onClick={handleRefreshDashboard}
                  className="btn btn-outline"
                  disabled={loading}
                >
                  {loading ? '🔄 Refreshing...' : '🔄 Refresh Data'}
                </button>
              </>
            )}
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Search..." 
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>
        </header>

        <div className="content-area">
          {!selectedTable ? (
            /* Dashboard View */
            <div className="dashboard-view">
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  Loading dashboard data...
                </div>
              ) : (
                <>
                  {/* Stats Overview */}
                  <div className="dashboard-overview">
                    <div className="stat-card">
                      <div className="stat-header">
                        <div className="stat-icon users">👥</div>
                      </div>
                      <div className="stat-value">{stats.totalUsers.toLocaleString()}</div>
                      <div className="stat-label">Total Users</div>
                      <div className="stat-change positive">
                        ↑ {Math.round((stats.totalUsers / Math.max(stats.totalUsers - 10, 1)) * 100 - 100)}% growth
                      </div>
                    </div>
                    
                    <div className="stat-card">
                      <div className="stat-header">
                        <div className="stat-icon orders">🛒</div>
                      </div>
                      <div className="stat-value">{stats.totalOrders.toLocaleString()}</div>
                      <div className="stat-label">Total Orders</div>
                      <div className="stat-change positive">
                        ↑ {Math.round((stats.totalOrders / Math.max(stats.totalOrders - 5, 1)) * 100 - 100)}% growth
                      </div>
                    </div>
                    
                    
                    
                    <div className="stat-card">
                      <div className="stat-header">
                        <div className="stat-icon products">📦</div>
                      </div>
                      <div className="stat-value">{stats.totalProducts}</div>
                      <div className="stat-label">Total Products</div>
                      <div className="stat-change positive">
                        ↑ {Math.round((stats.totalProducts / Math.max(stats.totalProducts - 2, 1)) * 100 - 100)}% growth
                      </div>
                    </div>

                    <div className="stat-card wallet-card">
                      <div className="stat-header">
                        <div className="stat-icon wallet">💳</div>
                        <button 
                          onClick={handleViewWallet}
                          className="wallet-action-btn"
                          title="Manage Wallet"
                        >
                          ⚙️
                        </button>
                      </div>
                      <div className="stat-value">₹{stats.adminWalletBalance.toLocaleString()}</div>
                      <div className="stat-label">Admin Wallet Balance</div>
                      <div className="wallet-details">
                        <div className="wallet-detail">
                          <span>Recharged:</span>
                          <span>₹{stats.adminTotalRecharged.toLocaleString()}</span>
                        </div>
                        <div className="wallet-detail">
                          <span>Spent:</span>
                          <span>₹{stats.adminTotalSpent.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-header">
                        <div className="stat-icon schemes">💎</div>
                      </div>
                      <div className="stat-value">{stats.totalSchemes}</div>
                      <div className="stat-label">Active Schemes</div>
                      <div className="stat-change positive">
                        ↑ {Math.round((stats.totalSchemes / Math.max(stats.totalSchemes - 1, 1)) * 100 - 100)}% active
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-header">
                        <div className="stat-icon pending">⏳</div>
                      </div>
                      <div className="stat-value">{stats.pendingBillUploads}</div>
                      <div className="stat-label">Pending Bills</div>
                      <div className="stat-change warning">
                        ⚠️ Needs review
                      </div>
                    </div>
                  </div>

                  {/* Lucky Draw Section */}
                  <div className="lucky-draw-section">
                    <div className="draw-card">
                      <h3>🎯 Lucky Draw Overview</h3>
                      <div className="draw-stats">
                        <div className="draw-stat">
                          <div className="draw-stat-value">{stats.activeDraws}</div>
                          <div className="draw-stat-label">Active Draws</div>
                        </div>
                        <div className="draw-stat">
                          <div className="draw-stat-value">{stats.totalParticipants}</div>
                          <div className="draw-stat-label">Total Participants</div>
                        </div>
                        <div className="draw-stat">
                          <div className="draw-stat-value">{stats.totalWinners}</div>
                          <div className="draw-stat-label">Total Winners</div>
                        </div>
                        <div className="draw-stat">
                          <div className="draw-stat-value">
                            {stats.activeDraws > 0 ? Math.round(stats.totalParticipants / stats.activeDraws) : 0}
                          </div>
                          <div className="draw-stat-label">Avg. per Draw</div>
                        </div>
                      </div>
                      <div className="draw-actions">
                        <button 
                          onClick={() => setSelectedTable('lucky_draw_master')}
                          className="btn btn-primary"
                        >
                          Manage Lucky Draws
                        </button>
                        <button 
                          onClick={() => setSelectedTable('lucky_draw_tickets')}
                          className="btn btn-outline"
                        >
                          View Participants
                        </button>
                      </div>
                    </div>

                    <div className="draw-card">
                      <h3>📊 Quick Actions</h3>
                      <div className="quick-actions">
                        <button 
                          onClick={() => setSelectedTable('bill_uploads')}
                          className="quick-action-btn"
                        >
                          <span className="action-icon">📄</span>
                          <span className="action-text">
                            Review Bills
                            {stats.pendingBillUploads > 0 && (
                              <span className="action-badge">{stats.pendingBillUploads}</span>
                            )}
                          </span>
                        </button>
                        <button 
                          onClick={() => setSelectedTable('products')}
                          className="quick-action-btn"
                        >
                          <span className="action-icon">📦</span>
                          <span className="action-text">Manage Products</span>
                        </button>
                        <button 
                          onClick={() => setSelectedTable('schemes')}
                          className="quick-action-btn"
                        >
                          <span className="action-icon">💎</span>
                          <span className="action-text">View Schemes</span>
                        </button>
                        <button 
                          onClick={() => setSelectedTable('users')}
                          className="quick-action-btn"
                        >
                          <span className="action-icon">👥</span>
                          <span className="action-text">User Management</span>
                        </button>
                        <button 
                          onClick={handleViewWallet}
                          className="quick-action-btn"
                        >
                          <span className="action-icon">💳</span>
                          <span className="action-text">Admin Wallet</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="table-section">
                    <div className="table-header">
                      <h3 className="table-title">Recent Activity</h3>
                      <div className="table-actions">
                        <button 
                          className="btn btn-outline"
                          onClick={fetchRecentActivity}
                        >
                          Refresh
                        </button>
                      </div>
                    </div>
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Activity</th>
                            <th>Type</th>
                            <th>Table</th>
                            <th>Time</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentActivity.length === 0 ? (
                            <tr>
                              <td colSpan="5" style={{textAlign: 'center', padding: '40px'}}>
                                <div className="empty-icon">📊</div>
                                <p>No recent activity found</p>
                              </td>
                            </tr>
                          ) : (
                            recentActivity.map((activity, index) => (
                              <tr key={index}>
                                <td>
                                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                    <span style={{fontSize: '16px'}}>
                                      {getActivityIcon(activity.type)}
                                    </span>
                                    <div>
                                      <div style={{fontWeight: '600'}}>{activity.name}</div>
                                      <div style={{fontSize: '12px', color: '#64748b'}}>
                                        {activity.action}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className="status-badge active">
                                    {activity.type}
                                  </span>
                                </td>
                                <td>{activity.table}</td>
                                <td>{formatTimeAgo(activity.time)}</td>
                                <td>
                                  <span className={`status-badge ${
                                    activity.status === 'completed' ? 'success' :
                                    activity.status === 'approved' ? 'success' :
                                    activity.status === 'under_review' ? 'warning' : 'active'
                                  }`}>
                                    {activity.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Table View */
            <TableView tableName={selectedTable} />
          )}
        </div>
      </main>

      {/* Admin Wallet Modal */}
      {showWalletModal && (
        <div className="modal-overlay">
          <div className="modal-content wallet-modal">
            <div className="modal-header">
              <h3 className="modal-title">💳 Admin Wallet Management</h3>
              <button onClick={() => setShowWalletModal(false)} className="modal-close">×</button>
            </div>
            
            <div className="modal-body">
              {walletDetails && (
                <div className="wallet-summary">
                  <div className="wallet-balance-card">
                    <div className="balance-label">Available Balance</div>
                    <div className="balance-amount">₹{walletDetails.available_balance?.toLocaleString() || '0'}</div>
                  </div>
                  
                  <div className="wallet-stats">
                    <div className="wallet-stat">
                      <div className="stat-label">Total Recharged</div>
                      <div className="stat-value">₹{walletDetails.total_recharged?.toLocaleString() || '0'}</div>
                    </div>
                    <div className="wallet-stat">
                      <div className="stat-label">Total Spent</div>
                      <div className="stat-value">₹{walletDetails.total_spent?.toLocaleString() || '0'}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="recharge-section">
                <h4>Recharge Wallet</h4>
                <div className="recharge-form">
                  <input
                    type="number"
                    className="form-input"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    placeholder="Enter amount in ₹"
                    min="1"
                  />
                  <button 
                    onClick={handleRecharge}
                    className="btn btn-primary"
                    disabled={!rechargeAmount || rechargeAmount <= 0}
                  >
                    Recharge via Razorpay
                  </button>
                </div>
              </div>

              <div className="transactions-section">
                <h4>Recent Transactions</h4>
                {walletTransactions.length === 0 ? (
                  <div className="empty-transactions">
                    <div className="empty-icon">💸</div>
                    <p>No transactions found</p>
                  </div>
                ) : (
                  <div className="transactions-table">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Description</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {walletTransactions.map((transaction) => (
                          <tr key={transaction.id}>
                            <td>{new Date(transaction.created_at).toLocaleDateString()}</td>
                            <td>
                              <span className={`transaction-type ${transaction.transaction_type}`}>
                                {transaction.transaction_type}
                              </span>
                            </td>
                            <td className={transaction.amount < 0 ? 'negative' : 'positive'}>
                              {transaction.amount < 0 ? '-' : '+'}₹{Math.abs(transaction.amount).toLocaleString()}
                            </td>
                            <td>{transaction.description}</td>
                            <td>
                              <span className={`status-badge ${transaction.status === 'completed' ? 'success' : 'warning'}`}>
                                {transaction.status}
                              </span>
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
                onClick={() => setShowWalletModal(false)}
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

export default AdminLayout;