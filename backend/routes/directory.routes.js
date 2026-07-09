import express from 'express';

const router = express.Router();

// NOTE: /api/directory is a deprecated alias for /api/users.
// All logic lives in users.routes.js / directory.controller.js.
// These redirects preserve backwards compatibility for any existing clients
// while keeping controller code in a single place.
router.get('/', (req, res) => {
    const qs = new URLSearchParams(req.query).toString();
    res.redirect(301, `/api/users${qs ? '?' + qs : ''}`);
});

router.get('/:id', (req, res) => {
    res.redirect(301, `/api/users/${req.params.id}`);
});

export default router;
