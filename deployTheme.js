const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const FormData = require('form-data');

// Configuration
const apiUrl = process.env.GHOST_ADMIN_API_URL + '/ghost/api/admin';
const adminApiKey = process.env.GHOST_ADMIN_API_KEY;
const themePath = process.env.THEME_PATH;

// Generate JWT token
const [id, secret] = adminApiKey.split(':');
const token = jwt.sign({}, Buffer.from(secret, 'hex'), {
    keyid: id,
    algorithm: 'HS256',
    expiresIn: '5m',
    audience: `/admin/`
});

// Read the theme file
const themeFile = fs.readFileSync(themePath);

// Create a form-data payload
const form = new FormData();
form.append('file', themeFile, { filename: 'theme.zip' });

// Upload the theme
axios.post(`${apiUrl}/themes/upload`, form, {
    headers: {
        'Authorization': `Ghost ${token}`,
        ...form.getHeaders()
    }
}).then(response => {
    console.log('Theme uploaded successfully:', response.data);

    // Activate the theme
    const themeName = response.data.themes[0].name;
    return axios.put(`${apiUrl}/themes/${themeName}/activate`, {}, {
        headers: {
            'Authorization': `Ghost ${token}`
        }
    });
}).then(response => {
    console.log('Theme activated successfully:', response.data);
}).catch(error => {
    console.error('Error uploading or activating theme:', error.response.data);
});
