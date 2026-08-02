import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../../middleware/authenticateToken'

const router = Router()
const prisma = new PrismaClient()

router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { productId } = req.body
    const userId = (req as any).user!.id
    const product = await prisma.product.findUnique({ where: { id: productId }, include: { vendor: true } })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    const existing = await prisma.wishlist.findUnique({ where: { userId_productId: { userId, productId } } })
    if (existing) return res.status(200).json(existing)
    const wishlist = await prisma.wishlist.create({ data: { userId, productId, vendorId: product.vendorId } })
    res.status(201).json(wishlist)
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to wishlist' })
  }
})

router.delete('/:productId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id
    const productId = String(req.params.productId)
    await prisma.wishlist.delete({ where: { userId_productId: { userId, productId } } })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove from wishlist' })
  }
})

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const items = await prisma.wishlist.findMany({
      where: { userId: (req as any).user!.id },
      include: { product: { include: { vendor: { select: { id: true, businessName: true, logoUrl: true } } } } },
      orderBy: { createdAt: 'desc' }
    })
    res.json(items)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wishlist' })
  }
})

router.get('/check/:productId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const productId = String(req.params.productId)
    const item = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId: (req as any).user!.id, productId } }
    })
    res.json({ isWishlisted: !!item })
  } catch (error) {
    res.status(500).json({ error: 'Failed to check wishlist' })
  }
})

export default router
