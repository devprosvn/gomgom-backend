import { Router } from 'express';
import usersRoutes from './users';
import nftsRoutes from './nfts';
import actionsRoutes from './actions';
import perksRoutes from './perks';

const router = Router();

// Mount routes
router.use('/users', usersRoutes);
router.use('/nfts', nftsRoutes);
router.use('/actions', actionsRoutes);
router.use('/perks', perksRoutes);

export default router;