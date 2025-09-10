import { Router } from 'express';
import usersRoutes from './users';
import nftsRoutes from './nfts';
import actionsRoutes from './actions';
import perksRoutes from './perks';
import ipfsRoutes from './ipfs';
import demoRoutes from './demo';
import metadataRoutes from './metadata';

const router = Router();

// Mount routes
router.use('/users', usersRoutes);
router.use('/nfts', nftsRoutes);
router.use('/actions', actionsRoutes);
router.use('/perks', perksRoutes);
router.use('/ipfs', ipfsRoutes);
router.use('/demo', demoRoutes);
router.use('/metadata', metadataRoutes);

export default router;