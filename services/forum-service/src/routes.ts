import { Router } from 'express';
import { getForums, createForum, getThreads, createThread, createPost, getPosts } from './controllers.js';

const router = Router();

// Forums
router.get('/forums', getForums);
router.post('/forums', createForum);

// Threads
router.get('/forums/:forumId/threads', getThreads);
router.post('/forums/:forumId/threads', createThread);

// Posts
router.get('/threads/:threadId/posts', getPosts);
router.post('/threads/:threadId/posts', createPost);

export default router;
