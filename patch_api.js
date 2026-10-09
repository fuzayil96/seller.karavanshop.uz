const fs = require('fs');
const apiPath = 'backend/api.js';
let code = fs.readFileSync(apiPath, 'utf-8');

// 1. Update JWT signature to include role
code = code.replace(
  /const token = jwt\.sign\(\{\s*username:\s*admin\.username,\s*role:\s*'admin'\s*\}, JWT_SECRET\);/g,
  `const role = admin.role || 'admin';
    const token = jwt.sign({ username: admin.username, role: role }, JWT_SECRET);`
);

// 2. Add requireSuperAdmin middleware
const middlewareReplacement = 
`const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin' && decoded.role !== 'analytics') throw new Error();
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireSuperAdmin = (req, res, next) => {
  if (req.admin.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
`;

code = code.replace(
  /const verifyAdmin = \([\s\S]*?\}\s*catch\s*\(err\)\s*\{\s*res\.status\(401\)\.json\(\{ error: 'Invalid token' \}\);\s*\}\s*\};\n/g,
  middlewareReplacement
);

// 3. Protect specific routes with requireSuperAdmin instead of verifyAdmin
// Admin get settings
code = code.replace(
  /router\.get\('\/admin\/settings', verifyAdmin, \(req, res\) => \{/g,
  'router.get(\'/admin/settings\', verifyAdmin, requireSuperAdmin, (req, res) => {'
);

// Admin update settings
code = code.replace(
  /router\.post\('\/admin\/settings', verifyAdmin, \(req, res\) => \{/g,
  'router.post(\'/admin/settings\', verifyAdmin, requireSuperAdmin, (req, res) => {'
);

// Admin list users
code = code.replace(
  /router\.get\('\/admin\/users', verifyAdmin, \(req, res\) => \{/g,
  'router.get(\'/admin/users\', verifyAdmin, requireSuperAdmin, (req, res) => {'
);

// Admin approve/update user
code = code.replace(
  /router\.post\('\/admin\/users\/:telegramId', verifyAdmin, async \(req, res\) => \{/g,
  'router.post(\'/admin/users/:telegramId\', verifyAdmin, requireSuperAdmin, async (req, res) => {'
);

// Admin send message
code = code.replace(
  /router\.post\('\/admin\/message', verifyAdmin, async \(req, res\) => \{/g,
  'router.post(\'/admin/message\', verifyAdmin, requireSuperAdmin, async (req, res) => {'
);

fs.writeFileSync(apiPath, code);
console.log('Modified api.js');
