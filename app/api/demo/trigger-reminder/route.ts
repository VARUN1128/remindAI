import { NextRequest, NextResponse } from 'next/server';
import { ReminderService } from '@/lib/reminders/reminderService';
import { mockDb } from '@/lib/database/mockDb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === 'seed') {
      mockDb.seedDefaults();
      return NextResponse.json({ success: true, message: 'Mock database re-seeded successfully' });
    }

    // Force process all due reminders immediately
    const result = await ReminderService.processDueReminders();

    return NextResponse.json({
      success: true,
      message: 'Demo reminder trigger executed successfully',
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
