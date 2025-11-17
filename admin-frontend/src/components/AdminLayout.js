import React, { useEffect, useState } from "react";
import { api } from "../api";
import TableView from "./TableView";

function AdminLayout({ onLogout }) {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");

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

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div
        style={{
          width: 220,
          borderRight: "1px solid #ddd",
          padding: 12,
          boxSizing: "border-box",
        }}
      >
        <h3>Admin Panel</h3>
        <button onClick={onLogout} style={{ marginBottom: 16 }}>
          Logout
        </button>
        <h4>Tables</h4>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {tables.map((t) => (
            <li key={t}>
              <button
                onClick={() => setSelectedTable(t)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: 6,
                  marginBottom: 4,
                  background: t === selectedTable ? "#e0e0ff" : "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {t}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: 16 }}>
        <TableView tableName={selectedTable} />
      </div>
    </div>
  );
}

export default AdminLayout;
