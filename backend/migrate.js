import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, 'data.json');

console.log('🔄 Starting data.json migration...');

if (!fs.existsSync(DB_FILE)) {
    console.error('❌ data.json not found!');
    process.exit(1);
}

try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const data = JSON.parse(raw);
    
    if (!data.users || !Array.isArray(data.users)) {
        console.error('❌ users collection not found in data.json!');
        process.exit(1);
    }
    
    let migratedCount = 0;
    
    data.users = data.users.map(user => {
        let changed = false;
        
        // Hash plaintext passwords
        if (user.password && !user.passwordHash) {
            console.log(`🔐 Hashing password for user: ${user.name || user.email}`);
            user.passwordHash = bcrypt.hashSync(user.password, 10);
            delete user.password;
            changed = true;
        }
        
        // Normalize role strings
        if (user.role) {
            const originalRole = user.role;
            const r = user.role.toUpperCase();
            let newRole = user.role;
            
            if (r === 'UNDERGRADUATE' || r === 'STUDENT') {
                newRole = 'student';
            } else if (r === 'GRADUATE' || r === 'ALUMNI') {
                newRole = 'alumni';
            } else {
                newRole = user.role.toLowerCase();
            }
            
            if (originalRole !== newRole) {
                console.log(`👤 Normalizing role for ${user.name || user.email}: ${originalRole} -> ${newRole}`);
                user.role = newRole;
                changed = true;
            }
        }
        
        if (changed) migratedCount++;
        return user;
    });
    
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Migration complete! Updated ${migratedCount} users.`);
} catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
}
