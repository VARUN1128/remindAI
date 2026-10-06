import { NextRequest, NextResponse } from 'next/server';
import { DbRepository } from '@/lib/database/repository';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const activeWindowDays = Number(req.nextUrl.searchParams.get('activeWindowDays')) || 30;
    const growthPeriod = (req.nextUrl.searchParams.get('growthPeriod') as 'daily' | 'weekly' | 'monthly') || 'daily';

    const [
      overview,
      userGrowth,
      reminderActivity,
      topUsers,
      topGroups,
      recentActivity,
      aiMetrics,
      reliability,
    ] = await Promise.all([
      DbRepository.getOwnerAnalytics(activeWindowDays),
      DbRepository.getUserGrowth(growthPeriod),
      DbRepository.getReminderActivity(growthPeriod),
      DbRepository.getTopUsers(5),
      DbRepository.getTopGroups(5),
      DbRepository.getRecentActivity(15),
      DbRepository.getAIIntentMetrics(),
      DbRepository.getSystemReliability(),
    ]);

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      overview,
      userGrowth,
      reminderActivity,
      topUsers,
      topGroups,
      recentActivity,
      aiMetrics,
      reliability,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
