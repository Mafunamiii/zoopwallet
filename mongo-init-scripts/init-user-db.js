// Switch to the 'admin' database to create a user with admin roles
db = db.getSiblingDB('admin');

// Create 'useradmin' user with roles if it doesn't exist
const userAdminExists = db.getUser('useradmin');
if (!userAdminExists) {
    db.createUser({
        user: 'useradmin',
        pwd: 'useradmin', // Replace with a secure password
        roles: [
            { role: 'root', db: 'admin' } // Root role gives full access
        ]
    });
}

// Switch to the 'users-db' database
db = db.getSiblingDB('users-db');

// Create a collection if it doesn't exist
db.createCollection('user');
