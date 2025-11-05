/**
 * AI Feature Payment API - Process STT payments for Venice AI access
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/ai/payment
 * Process STT payment for 24-hour AI access
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAddress, paymentAmount, transactionHash } = body;

    if (!userAddress || !paymentAmount || !transactionHash) {
      return NextResponse.json({
        error: 'Missing required fields: userAddress, paymentAmount, transactionHash'
      }, { status: 400 });
    }

    // Validate payment amount (0.5 STT)
    if (parseFloat(paymentAmount) < 0.5) {
      return NextResponse.json({
        error: 'Insufficient payment amount. AI access requires 0.5 STT.'
      }, { status: 402 });
    }

    // TODO: Verify transaction on Somnia testnet
    // For now, we'll trust the frontend (in production, verify on-chain)

    // Grant 24-hour AI access
    const accessExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user in database
    try {
      const { dbService } = await import('@/lib/db-service');
      await dbService.updateUserAIAccess(userAddress, accessExpiresAt);

      console.log(`✅ Granted AI access to ${userAddress} until ${accessExpiresAt.toISOString()}`);

      return NextResponse.json({
        success: true,
        accessExpiresAt: accessExpiresAt.toISOString(),
        message: 'AI access granted for 24 hours'
      });
    } catch (dbError) {
      console.error('Database error updating AI access:', dbError);
      return NextResponse.json({
        error: 'Failed to update AI access'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('AI payment processing error:', error);
    return NextResponse.json({
      error: 'Payment processing failed'
    }, { status: 500 });
  }
}

/**
 * GET /api/ai/payment/status
 * Check AI access status for user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('userAddress');

    if (!userAddress) {
      return NextResponse.json({
        error: 'Missing userAddress parameter'
      }, { status: 400 });
    }

    // Check AI access status
    try {
      const { dbService } = await import('@/lib/db-service');
      const user = await dbService.getUserByWallet(userAddress);

      if (!user) {
        return NextResponse.json({
          hasAccess: false,
          message: 'User not found'
        });
      }

      const now = new Date();
      const hasAccess = user.aiAccessExpiresAt && user.aiAccessExpiresAt > now;

      return NextResponse.json({
        hasAccess,
        accessExpiresAt: user.aiAccessExpiresAt?.toISOString(),
        timeRemaining: hasAccess ?
          Math.floor((user.aiAccessExpiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60)) : // hours remaining
          0
      });
    } catch (dbError) {
      console.error('Database error checking AI access:', dbError);
      return NextResponse.json({
        error: 'Failed to check AI access status'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('AI access status check error:', error);
    return NextResponse.json({
      error: 'Status check failed'
    }, { status: 500 });
  }
}
