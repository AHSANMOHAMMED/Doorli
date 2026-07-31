import { Router } from 'express';
import { getForums, createForum, getThreads, createThread, createPost, getPosts, deletePost, lockThread } from './controllers.js';
import { authenticateToken, requireAdmin } from './middleware/auth.js';

const router = Router();

// Forums
router.get('/forums', getForums);
router.post('/forums', authenticateToken, requireAdmin, createForum);

// Threads
router.get('/forums/:forumId/threads', getThreads);
router.post('/forums/:forumId/threads', authenticateToken, createThread);
router.post('/threads/:threadId/lock', authenticateToken, requireAdmin, lockThread);

// Posts
router.get('/threads/:threadId/posts', getPosts);
router.post('/threads/:threadId/posts', authenticateToken, createPost);
router.delete('/posts/:postId', authenticateToken, requireAdmin, deletePost);

export default router;
