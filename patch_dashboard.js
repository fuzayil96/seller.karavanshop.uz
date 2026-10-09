const fs = require('fs');
const dashboardPath = 'frontend/src/pages/AdminDashboard.jsx';
let code = fs.readFileSync(dashboardPath, 'utf-8');

// 1. Add parseJwt utility at the top
if (!code.includes('parseJwt')) {
  code = code.replace(
    /const AdminDashboard = \(\{ token, setToken \}\) => \{/,
    `const parseJwt = (token) => {
  try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
};

const AdminDashboard = ({ token, setToken }) => {`
  );
}

// 2. Decode token and get role
if (!code.includes('const decoded = parseJwt(token);')) {
  code = code.replace(
    /const AdminDashboard = \(\{ token, setToken \}\) => \{\n/,
    `const AdminDashboard = ({ token, setToken }) => {
  const decoded = parseJwt(token);
  const role = decoded?.role || 'admin';
\n`
  );
}

// 3. Set initial active tab based on role
code = code.replace(
  /const \[activeTab, setActiveTab\] = useState\('users'\);/,
  "const [activeTab, setActiveTab] = useState(role === 'analytics' ? 'stats' : 'users');"
);

// 4. Update fetchAdminData to skip admin-only endpoints for analytics role
code = code.replace(
  /const fetchAdminData = async \(\) => \{\n\s*try \{\n\s*const headers = \{ Authorization: `Bearer \$\{token\}` \};\n\s*const \[usersRes, settingsRes, regosUsersRes, regosGroupsRes\] = await Promise\.all\(\[\n\s*axios\.get\(`\$\{API_URL\}\/admin\/users`, \{ headers \}\),\n\s*axios\.get\(`\$\{API_URL\}\/admin\/settings`, \{ headers \}\),\n\s*axios\.get\(`\$\{API_URL\}\/admin\/regos\/users`, \{ headers \}\)\.catch\(\(\) => \(\{ data: \{ result: \[\] \} \}\)\),\n\s*axios\.get\(`\$\{API_URL\}\/admin\/regos\/groups`, \{ headers \}\)\.catch\(\(\) => \(\{ data: \{ result: \[\] \} \}\)\)\n\s*\]\);\n\s*setData\(\{\n\s*users: usersRes\.data,\n\s*settings: settingsRes\.data\.settings,\n\s*categories: settingsRes\.data\.categories \|\| \[\]\n\s*\}\);\n\s*setRegosUsers\(regosUsersRes\.data\?\.result \|\| \[\]\);\n\s*setRegosGroups\(regosGroupsRes\.data\?\.result \|\| \[\]\);\n\s*setLoading\(false\);/,
  `const fetchAdminData = async () => {
    try {
      const headers = { Authorization: \`Bearer \${token}\` };
      
      let usersData = [];
      let settingsData = { settings: {}, categories: [] };
      let regosUsersData = [];
      let regosGroupsData = [];
      
      if (role !== 'analytics') {
        const [usersRes, settingsRes, regosUsersRes, regosGroupsRes] = await Promise.all([
          axios.get(\`\${API_URL}/admin/users\`, { headers }),
          axios.get(\`\${API_URL}/admin/settings\`, { headers }),
          axios.get(\`\${API_URL}/admin/regos/users\`, { headers }).catch(() => ({ data: { result: [] } })),
          axios.get(\`\${API_URL}/admin/regos/groups\`, { headers }).catch(() => ({ data: { result: [] } }))
        ]);
        usersData = usersRes.data;
        settingsData = settingsRes.data;
        regosUsersData = regosUsersRes.data?.result || [];
        regosGroupsData = regosGroupsRes.data?.result || [];
      } else {
        const [regosUsersRes, regosGroupsRes] = await Promise.all([
          axios.get(\`\${API_URL}/admin/regos/users\`, { headers }).catch(() => ({ data: { result: [] } })),
          axios.get(\`\${API_URL}/admin/regos/groups\`, { headers }).catch(() => ({ data: { result: [] } }))
        ]);
        regosUsersData = regosUsersRes.data?.result || [];
        regosGroupsData = regosGroupsRes.data?.result || [];
      }
      
      setData({
        users: usersData,
        settings: settingsData.settings || {},
        categories: settingsData.categories || []
      });
      setRegosUsers(regosUsersData);
      setRegosGroups(regosGroupsData);
      setLoading(false);`
);

// 5. Hide the 'Foydalanuvchilar' tab for analytics role
code = code.replace(
  /<button onClick=\{\(\) => setActiveTab\('users'\)\} className=\{`px-4 py-2 rounded-lg font-semibold transition \$\{activeTab === 'users' \? 'bg-emerald-600 text-white' : 'bg-\[#041f17\] text-emerald-300 hover:bg-\[#065f46\]'\}`\}>Foydalanuvchilar<\/button>/,
  `{role !== 'analytics' && (
                <button onClick={() => setActiveTab('users')} className={\`px-4 py-2 rounded-lg font-semibold transition \${activeTab === 'users' ? 'bg-emerald-600 text-white' : 'bg-[#041f17] text-emerald-300 hover:bg-[#065f46]'}\`}>Foydalanuvchilar</button>
              )}`
);

fs.writeFileSync(dashboardPath, code);
console.log('Modified AdminDashboard.jsx');
