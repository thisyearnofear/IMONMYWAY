'use server'

export async function fulfillCommitmentAction(
  commitmentId: string,
  userId: string,
  arrivalLocation: { lat: number; lng: number }
) {
  try {
    // On-chain fulfillment is handled client-side via the agent contract
    // This server action is a placeholder for any server-side post-processing
    return { success: true, message: 'Commitment fulfilled — agent will settle autonomously' }
  } catch {
    return { success: false, message: 'Failed to process fulfillment' }
  }
}
