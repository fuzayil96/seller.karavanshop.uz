import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Send, MessageCircle } from 'lucide-react';
import SellersStats from '../components/SellersStats';

const API_URL = import.meta.env.DEV ? 'http://localhost:3000/api' : '/api';

const AdminDashboard = ({ token, setToken }) => {
  const [data, setData] = useState({ users: [], settings: {}, categories: [] });
  const [regosUsers, setRegosUsers] = useState([]);
  const [regosGroups, setRegosGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  
  // Modal state
  const [editingUser, setEditingUser] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editSellerId, setEditSellerId] = useState('');
  const [sellerSearch, setSellerSearch] = useState('');
  
  const [messageModal, setMessageModal] = useState({ isOpen: false, targetId: null, targetName: '', text: '', sending: false });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'telegramId', direction: 'desc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredUsers = React.useMemo(() => {
    let users = [...data.users];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      users = users.filter(u => 
        String(u.telegramId).includes(q) ||
        (u.firstName || '').toLowerCase().includes(q) ||
        (u.lastName || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.phoneNumber || '').includes(q)
      );
    }
    users.sort((a, b) => {
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return users;
  }, [data.users, searchQuery, sortConfig]);
  
  const navigate = useNavigate();

  const fetchAdminData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [usersRes, settingsRes, regosUsersRes, regosGroupsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/users`, { headers }),
        axios.get(`${API_URL}/admin/settings`, { headers }),
        axios.get(`${API_URL}/admin/regos/users`, { headers }).catch(() => ({ data: { result: [] } })),
        axios.get(`${API_URL}/admin/regos/groups`, { headers }).catch(() => ({ data: { result: [] } }))
      ]);
      setData({
        users: usersRes.data,
        settings: settingsRes.data.settings,
        categories: settingsRes.data.categories || []
      });
      setRegosUsers(regosUsersRes.data?.result || []);
      setRegosGroups(regosGroupsRes.data?.result || []);
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 401) {
        setToken(null);
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else {
      fetchAdminData();
    }
  }, [token]);

  const handleLogout = () => {
    setToken(null);
    navigate('/login');
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditStatus(user.status || 'pending');
    setEditSellerId(user.sellerId || '');
    setSellerSearch('');
  };

  const saveUser = async () => {
    if (editStatus === 'approved' && !editSellerId) {
      alert("Tasdiqlangan holat uchun Regos Seller tanlash majburiy!");
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_URL}/admin/users/${editingUser.telegramId}`, {
        sellerId: editSellerId,
        status: editStatus
      }, { headers });
      setEditingUser(null);
      fetchAdminData();
    } catch (err) {
      alert("Xatolik yuz berdi");
    }
  };

  const handleClearAndBan = async () => {
    if (!window.confirm("Haqiqatan ham bu foydalanuvchini bloklab, sellerni olib tashlamoqchimisiz?")) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_URL}/admin/users/${editingUser.telegramId}`, {
        sellerId: '',
        status: 'banned'
      }, { headers });
      setEditingUser(null);
      fetchAdminData();
    } catch (err) {
      alert("Xatolik yuz berdi");
    }
  };

  const openMessageModal = (user) => {
    setMessageModal({
      isOpen: true,
      targetId: user.telegramId,
      targetName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || `User ${user.telegramId}`,
      text: '',
      sending: false
    });
  };

  const openMassMessageModal = () => {
    setMessageModal({
      isOpen: true,
      targetId: 'all',
      targetName: 'Barcha foydalanuvchilar',
      text: '',
      sending: false
    });
  };

  const sendMessage = async () => {
    if (!messageModal.text.trim()) return;
    setMessageModal(prev => ({ ...prev, sending: true }));
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_URL}/admin/message`, {
        telegramId: messageModal.targetId,
        message: messageModal.text
      }, { headers });
      alert("Xabar jo'natildi!");
      setMessageModal({ isOpen: false, targetId: null, targetName: '', text: '', sending: false });
    } catch (err) {
      alert("Xatolik yuz berdi");
      setMessageModal(prev => ({ ...prev, sending: false }));
    }
  };

  const getRegosSellerName = (sellerId) => {
    if (!sellerId) return 'Yo\'q';
    const ru = regosUsers.find(r => String(r.id) === String(sellerId));
    if (ru) {
      const name = ru.full_name || `${ru.first_name || ''} ${ru.last_name || ''}`.trim() || ru.login;
      return (
        <div>
          <div className="font-semibold text-emerald-50">{name}</div>
          <div className="text-xs text-emerald-400/70">ID: {sellerId}</div>
        </div>
      );
    }
    return <div className="font-semibold text-emerald-50">ID: {sellerId}</div>;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-emerald-400">Loading Admin Data...</div>;
  }

  return (
    <div className="min-h-screen bg-[#02130e] text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex justify-between items-center bg-[#072f23] p-6 rounded-2xl border border-[#0e4b39]">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-emerald-50">Admin Dashboard</h1>
            <div className="flex gap-2">
              <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg font-semibold transition ${activeTab === 'users' ? 'bg-emerald-600 text-white' : 'bg-[#041f17] text-emerald-300 hover:bg-[#065f46]'}`}>Foydalanuvchilar</button>
              <button onClick={() => setActiveTab('stats')} className={`px-4 py-2 rounded-lg font-semibold transition ${activeTab === 'stats' ? 'bg-emerald-600 text-white' : 'bg-[#041f17] text-emerald-300 hover:bg-[#065f46]'}`}>Sotuv Tahlili</button>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-red-500/20 hover:bg-red-500/40 text-red-300 px-4 py-2 rounded-lg transition-colors">
            Chiqish
          </button>
        </header>

        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#072f23] p-6 rounded-2xl border border-[#0e4b39]">
              <h3 className="text-lg font-semibold mb-4 text-emerald-300">Sozlamalar & Bonuslar</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-emerald-100/70 mb-1">Admin Telegram ID</label>
                  <input 
                    type="number" 
                    id="adminIdInput"
                    className="w-full bg-[#041f17] border border-emerald-500/30 rounded-lg p-2.5 text-emerald-50"
                    defaultValue={data.settings.adminNotificationTelegramId || ''} 
                  />
                </div>
                
                <div className="pt-4 border-t border-emerald-500/20">
                  <h4 className="text-sm font-semibold text-emerald-200 mb-3">Sotuvchi WebApp ko'rinishi</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="showLeaderboard"
                        defaultChecked={data.settings.ui?.showLeaderboard ?? true}
                        className="w-4 h-4 rounded bg-[#041f17] border-emerald-500/30 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-[#072f23]"
                      />
                      <span className="text-sm text-emerald-100/80">Reyting (Leaderboard) ni ko'rsatish</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="showChequeDetails"
                        defaultChecked={data.settings.ui?.showChequeDetails ?? true}
                        className="w-4 h-4 rounded bg-[#041f17] border-emerald-500/30 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-[#072f23]"
                      />
                      <span className="text-sm text-emerald-100/80">Chek ichidagi tovarlarni ko'rsatish</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="showLeaderboardSales"
                        defaultChecked={data.settings.ui?.showLeaderboardSales ?? true}
                        className="w-4 h-4 rounded bg-[#041f17] border-emerald-500/30 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-[#072f23]"
                      />
                      <span className="text-sm text-emerald-100/80">Leaderboardda savdo summasini ko'rsatish</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="allowPastDates"
                        defaultChecked={data.settings.ui?.allowPastDates ?? true}
                        className="w-4 h-4 rounded bg-[#041f17] border-emerald-500/30 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-[#072f23]"
                      />
                      <span className="text-sm text-emerald-100/80">Boshqa kunlar savdosini ko'rishga ruxsat</span>
                    </label>
                  </div>
                  
                  <div className="bg-[#041f17]/50 p-3 rounded-xl border border-emerald-500/10">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        id="showLeaderboardGroups"
                        defaultChecked={data.settings.ui?.showLeaderboardGroups ?? true}
                        className="w-4 h-4 rounded bg-[#041f17] border-emerald-500/30 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-[#072f23]"
                      />
                      <span className="text-sm text-emerald-100/80">Umumiy reytingda guruh nomini ko'rsatish</span>
                    </label>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-emerald-500/20">
                  <h4 className="text-sm font-semibold text-emerald-200 mb-3">User Group (Guruhlar) bo'yicha bonus foizlari</h4>
                  {regosGroups.map(group => {
                    const existingCat = data.categories.find(c => c.id == group.id);
                    return (
                      <div key={group.id} className="flex items-center justify-between mb-2">
                        <span className="text-sm text-emerald-100/70">{group.name}</span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            step="0.1"
                            data-group-id={group.id}
                            data-group-name={group.name}
                            className="w-20 bg-[#041f17] border border-emerald-500/30 rounded-lg p-1.5 text-emerald-50 text-right group-bonus-input"
                            defaultValue={existingCat ? existingCat.bonusPercentage : 0} 
                          />
                          <span className="text-emerald-300/50">%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button 
                  onClick={async () => {
                    const adminId = document.getElementById('adminIdInput').value;
                    const showLeaderboard = document.getElementById('showLeaderboard').checked;
                    const showChequeDetails = document.getElementById('showChequeDetails').checked;
                    const showLeaderboardSales = document.getElementById('showLeaderboardSales').checked;
                    const allowPastDates = document.getElementById('allowPastDates').checked;
                    const showLeaderboardGroups = document.getElementById('showLeaderboardGroups').checked;
                    
                    const categoryInputs = document.querySelectorAll('.group-bonus-input');
                    const newCategories = Array.from(categoryInputs).map(input => ({
                      id: input.getAttribute('data-group-id'),
                      name: input.getAttribute('data-group-name'),
                      bonusPercentage: parseFloat(input.value) || 0
                    }));
                    
                    try {
                      const headers = { Authorization: `Bearer ${token}` };
                      await axios.post(`${API_URL}/admin/settings`, {
                        adminNotificationTelegramId: adminId ? parseInt(adminId) : null,
                        ui: { showLeaderboard, showChequeDetails, showLeaderboardSales, allowPastDates, showLeaderboardGroups },
                        categories: newCategories
                      }, { headers });
                      fetchAdminData();
                      alert("Saqlandi!");
                    } catch (e) {
                      alert("Xatolik");
                    }
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 py-2 rounded-lg font-semibold mt-4">
                  Saqlash
                </button>
              </div>
            </div>
          </div>

          {/* Users Section */}
          <div className="lg:col-span-2">
            <div className="bg-[#072f23] p-6 rounded-2xl border border-[#0e4b39]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-emerald-300">Foydalanuvchilar</h3>
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Qidirish..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#041f17] border border-emerald-500/30 rounded-lg p-2 text-emerald-50 text-sm focus:outline-none"
                  />
                  <button onClick={openMassMessageModal} className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 px-4 py-2 rounded-lg border border-blue-500/30 text-sm transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    Ommaviy xabar
                  </button>
                  <button onClick={fetchAdminData} className="bg-[#041f17] hover:bg-[#065f46] px-4 py-2 rounded-lg border border-emerald-500/30 text-sm">
                    Yangilash
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-emerald-500/20">
                      <th className="p-3 text-sm text-emerald-100/70 font-semibold cursor-pointer select-none" onClick={() => handleSort('telegramId')}>User ID {sortConfig.key === 'telegramId' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                      <th className="p-3 text-sm text-emerald-100/70 font-semibold cursor-pointer select-none" onClick={() => handleSort('phoneNumber')}>Telefon {sortConfig.key === 'phoneNumber' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                      <th className="p-3 text-sm text-emerald-100/70 font-semibold cursor-pointer select-none" onClick={() => handleSort('firstName')}>Ism Familiya / Username {sortConfig.key === 'firstName' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                      <th className="p-3 text-sm text-emerald-100/70 font-semibold cursor-pointer select-none" onClick={() => handleSort('status')}>Holat {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                      <th className="p-3 text-sm text-emerald-100/70 font-semibold cursor-pointer select-none" onClick={() => handleSort('sellerId')}>Seller ID {sortConfig.key === 'sellerId' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                      <th className="p-3 text-sm text-emerald-100/70 font-semibold">Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAndFilteredUsers.map(u => (
                      <tr key={u.telegramId} className="border-b border-emerald-500/10 hover:bg-emerald-900/20">
                        <td className="p-3 text-sm">{u.telegramId}</td>
                        <td className="p-3 text-sm">{u.phoneNumber}</td>
                        <td className="p-3 text-sm">
                          <div className="font-semibold text-emerald-50">{u.firstName} {u.lastName}</div>
                          {u.username && <div className="text-xs text-emerald-400">@{u.username}</div>}
                        </td>
                        <td className="p-3 text-sm">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            u.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                            u.status === 'banned' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-3 text-sm">{getRegosSellerName(u.sellerId)}</td>
                        <td className="p-3 text-sm flex items-center gap-2">
                          <button onClick={() => openEditModal(u)} className="text-blue-400 hover:text-blue-300 px-3 py-1 bg-blue-500/20 rounded-lg transition-colors">Tahrirlash</button>
                          <button onClick={() => openMessageModal(u)} className="text-emerald-400 hover:text-emerald-300 p-1.5 bg-emerald-500/20 rounded-lg transition-colors" title="Xabar jo'natish">
                            <Send className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        )}

        {activeTab === 'stats' && (
          <SellersStats isDarkMode={true} />
        )}

      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-[#072f23] border border-[#0e4b39] p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-emerald-50 mb-4">Foydalanuvchini tahrirlash</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-emerald-100/70 mb-1">Foydalanuvchi ma'lumotlari</label>
                <div className="w-full bg-[#041f17] border border-emerald-500/30 rounded-lg p-2.5 text-emerald-50/80 text-sm">
                  <span className="font-semibold">{editingUser.firstName} {editingUser.lastName}</span>
                  {editingUser.username && <span className="text-emerald-400 ml-2">@{editingUser.username}</span>}
                </div>
              </div>
              <div>
                <label className="block text-sm text-emerald-100/70 mb-1">Telegram ID</label>
                <input type="text" disabled value={editingUser.telegramId} className="w-full bg-[#041f17] border border-emerald-500/30 rounded-lg p-2.5 text-emerald-50/50" />
              </div>
              <div>
                <label className="block text-sm text-emerald-100/70 mb-1">Holat</label>
                <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="w-full bg-[#041f17] border border-emerald-500/30 rounded-lg p-2.5 text-emerald-50 focus:outline-none">
                  <option value="pending">Kutilyapti (pending)</option>
                  <option value="approved">Tasdiqlangan (approved)</option>
                  <option value="banned">Bloklangan (banned)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-emerald-100/70 mb-1">Regos Seller (Sotuvchi)</label>
                <input
                  type="text"
                  placeholder="Seller qidirish..."
                  value={sellerSearch}
                  onChange={(e) => setSellerSearch(e.target.value)}
                  className="w-full bg-[#041f17] border border-emerald-500/30 rounded-lg p-2.5 text-emerald-50 mb-2 focus:outline-none text-sm"
                />
                <select size="5" value={editSellerId} onChange={e => setEditSellerId(e.target.value)} className="w-full bg-[#041f17] border border-emerald-500/30 rounded-lg p-2.5 text-emerald-50 focus:outline-none">
                  <option value="">-- Seller belgilanmagan --</option>
                  {regosUsers
                    .filter(u => u.active !== false)
                    .map(ru => ({ ...ru, displayName: ru.full_name || `${ru.first_name || ''} ${ru.last_name || ''}`.trim() || ru.login }))
                    .filter(ru => sellerSearch === '' || ru.displayName.toLowerCase().includes(sellerSearch.toLowerCase()) || String(ru.id).includes(sellerSearch))
                    .sort((a, b) => a.displayName.localeCompare(b.displayName))
                    .map(ru => (
                    <option key={ru.id} value={ru.id}>
                      {ru.displayName} (ID: {ru.id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-3 mt-6">
                <div className="flex gap-3">
                  <button onClick={() => setEditingUser(null)} className="flex-1 bg-[#041f17] hover:bg-emerald-900/50 text-emerald-300 py-2.5 rounded-lg border border-emerald-500/30 transition-colors">
                    Bekor qilish
                  </button>
                  <button onClick={saveUser} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-bold transition-colors">
                    Saqlash
                  </button>
                </div>
                <button onClick={handleClearAndBan} className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-400 py-2.5 rounded-lg border border-red-500/30 transition-colors font-semibold">
                  Ishdan bo'shatish (Tozalash va bloklash)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {messageModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-[#072f23] border border-[#0e4b39] p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-emerald-50 mb-1">Xabar jo'natish</h3>
            <p className="text-sm text-emerald-400 mb-4">{messageModal.targetName}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-emerald-100/70 mb-1">Xabar matni</label>
                <textarea 
                  value={messageModal.text} 
                  onChange={e => setMessageModal(prev => ({ ...prev, text: e.target.value }))}
                  className="w-full bg-[#041f17] border border-emerald-500/30 rounded-lg p-3 text-emerald-50 focus:outline-none min-h-[120px]"
                  placeholder="Xabar matnini kiriting..."
                />
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => !messageModal.sending && setMessageModal({ isOpen: false, targetId: null, targetName: '', text: '', sending: false })} 
                  className="flex-1 bg-[#041f17] hover:bg-emerald-900/50 text-emerald-300 py-2.5 rounded-lg border border-emerald-500/30 transition-colors"
                  disabled={messageModal.sending}
                >
                  Bekor qilish
                </button>
                <button 
                  onClick={sendMessage} 
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-bold transition-colors disabled:opacity-50"
                  disabled={messageModal.sending || !messageModal.text.trim()}
                >
                  <Send className="w-4 h-4" />
                  {messageModal.sending ? 'Yuborilmoqda...' : 'Yuborish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
