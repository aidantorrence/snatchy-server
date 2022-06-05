
   
import { Router } from 'express'
import listings from './listings'
import users from './users'


const router = Router()

router.use(listings)
router.use(users)


export default router