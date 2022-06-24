
   
import { Router } from 'express'
import listings from './listings'
import s from './stripe'
import users from './users'


const router = Router()

router.use(listings)
router.use(users)
router.use(s);

export default router