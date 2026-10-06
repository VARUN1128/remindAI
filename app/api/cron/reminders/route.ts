import { NextRequest, NextResponse } from 'next/server';
import { ReminderService } from '@/lib/reminders/reminderService';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isDemo = process.env.DEMO_MODE === 'true';

    // Verify secret unless running in demo mode
    if (!isDemo && cronSecret && !cronSecret.includes('placeholder')) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
      }
    }

    const result = await ReminderService.processDueReminders();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: result,
    });
  } catch (error: any) {
    console.error('Cron scheduler error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Cron execution failed' },
      { status: 500 }
    );
  }
}
